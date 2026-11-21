'use client'

import { useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { Input } from '@/components/ui/input'
import { useStore, useVisibleProducts } from '@/lib/store'

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('خواندن فایل ممکن نبود.'))
    r.readAsDataURL(blob)
  })

export function VisualizerView() {
  const { session } = useStore()
  const products = useVisibleProducts().filter((p) => p.imageUrl)
  const params = useSearchParams()
  const [productId, setProductId] = useState(params.get('product') ?? products[0]?.id ?? '')
  const [room, setRoom] = useState<string | null>(null)
  const [surface, setSurface] = useState('floor')
  const [code, setCode] = useState(() => (typeof window === 'undefined' ? '' : localStorage.getItem('satco-ai-code') ?? ''))
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const product = products.find((p) => p.id === productId)

  async function onRoom(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setRoom(await toDataUrl(file))
  }

  async function run() {
    if (!room || !product?.imageUrl) return toast.error('تصویر اتاق و یک کاشی را انتخاب کنید.')
    setBusy(true)
    setResult(null)
    try {
      const tileImage = await toDataUrl(await (await fetch(product.imageUrl)).blob())
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.factoryId && code.trim()) {
        headers['x-factory-id'] = session.factoryId
        headers['x-access-code'] = code.trim()
        localStorage.setItem('satco-ai-code', code.trim())
      }
      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ roomImage: room, tileImage, tileName: product.name, tileSize: product.size, surface }),
      })
      const json = (await res.json()) as { image?: string; error?: string }
      if (!res.ok || !json.image) throw new Error(json.error ?? 'خطای ناشناخته')
      setResult(json.image)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در تولید تصویر')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="text-sm font-medium">کاشی</label>
        <NativeSelect value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.size}</option>
          ))}
        </NativeSelect>
        <label className="text-sm font-medium">تصویر اتاق</label>
        <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={onRoom} />
        <label className="text-sm font-medium">سطح موردنظر</label>
        <NativeSelect value={surface} onChange={(e) => setSurface(e.target.value)}>
          <option value="floor">کف</option>
          <option value="wall">دیوار</option>
          <option value="both">کف و دیوار</option>
        </NativeSelect>
        {session?.factoryId && (
          <>
            <label className="text-sm font-medium">کد دسترسی هوش مصنوعی کارخانه (از مدیر ساتکو)</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" />
          </>
        )}
        <Button onClick={run} disabled={busy} className="w-full">{busy ? 'در حال ساخت تصویر…' : 'شبیه‌سازی کن'}</Button>
      </div>
      <div className="grid min-h-64 place-items-center rounded-xl border bg-muted/30 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {result ? <img src={result} alt="نتیجهٔ شبیه‌سازی" className="rounded-lg" /> : room ? <img src={room} alt="اتاق" className="rounded-lg opacity-70" /> : <p className="text-sm text-muted-foreground">پیش‌نمایش اینجا نمایش داده می‌شود.</p>}
      </div>
    </div>
  )
}
