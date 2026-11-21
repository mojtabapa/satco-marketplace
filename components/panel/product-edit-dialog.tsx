'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import type { Product, ExtraCode } from '@/lib/types'

const GRADES = ['درجه ۱', 'درجه ۲', 'درجه ۳', 'درجه ۴', 'درجه ۵', 'درجه ۶']

interface Props {
  product: Product | null
  onClose: () => void
}

interface Draft {
  name: string
  size: string
  grade: string
  stockM2: string
  pricePerM2: string
  isCash: boolean
  extraCodes: ExtraCode[]
}

function draftFromProduct(p: Product): Draft {
  return {
    name: p.name,
    size: p.size,
    grade: p.grade,
    stockM2: String(p.stockM2),
    pricePerM2: p.pricePerM2 === null ? '' : String(p.pricePerM2),
    isCash: p.isCash,
    extraCodes: p.extraCodes ?? [],
  }
}

export function ProductEditDialog({ product, onClose }: Props) {
  const { updateProduct } = useStore()
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    setDraft(product ? draftFromProduct(product) : null)
  }, [product])

  if (!product || !draft) return null

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  function updateExtra(index: number, patch: Partial<ExtraCode>) {
    setDraft((d) => {
      if (!d) return d
      const copy = [...d.extraCodes]
      copy[index] = { ...copy[index], ...patch }
      return { ...d, extraCodes: copy }
    })
  }

  function addExtra() {
    setDraft((d) => (d ? { ...d, extraCodes: [...d.extraCodes, { code: '', type: '' }] } : d))
  }

  function removeExtra(index: number) {
    setDraft((d) => (d ? { ...d, extraCodes: d.extraCodes.filter((_, i) => i !== index) } : d))
  }

  function save() {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) return toast.error('نام طرح نمی‌تواند خالی باشد.')

    const stockM2 = Number(draft.stockM2)
    if (!Number.isFinite(stockM2) || stockM2 < 0) {
      return toast.error('موجودی باید عدد معتبر و حداقل صفر باشد.')
    }

    const priceRaw = draft.pricePerM2.trim()
    const pricePerM2 = priceRaw === '' ? null : Number(priceRaw)
    if (pricePerM2 !== null && (!Number.isFinite(pricePerM2) || pricePerM2 < 0)) {
      return toast.error('قیمت باید عدد معتبر باشد.')
    }

    const size = draft.size.trim().replace(/[x*X]/g, '×')
    const extraCodes = draft.extraCodes
      .map((e) => ({ code: e.code.trim(), type: e.type.trim() }))
      .filter((e) => e.code && e.type)

    updateProduct(product.id, {
      name,
      size,
      grade: draft.grade,
      stockM2,
      pricePerM2,
      isCash: draft.isCash,
      extraCodes,
    })
    toast.success('تغییرات ذخیره شد.')
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش محصول {product.code}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>نام طرح</Label>
            <Input value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div>
            <Label>ابعاد</Label>
            <Input value={draft.size} dir="ltr" onChange={(e) => set('size', e.target.value)} placeholder="۶۰×۶۰" />
          </div>

          <div>
            <Label>درجه</Label>
            <NativeSelect value={draft.grade} onChange={(e) => set('grade', e.target.value)}>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              {!GRADES.includes(draft.grade) && <option value={draft.grade}>{draft.grade}</option>}
            </NativeSelect>
          </div>

          <div>
            <Label>موجودی (متر مربع)</Label>
            <Input
              type="number"
              min={0}
              value={draft.stockM2}
              onChange={(e) => set('stockM2', e.target.value)}
            />
          </div>

          <div>
            <Label>قیمت (تومان/م²)</Label>
            <Input
              type="number"
              min={0}
              placeholder="خالی = بدون قیمت"
              value={draft.pricePerM2}
              onChange={(e) => set('pricePerM2', e.target.value)}
            />
            {product.priceManual && (
              <p className="mt-1 text-xs text-muted-foreground">این قیمت دستی ثبت شده است.</p>
            )}
          </div>

          <div className="flex items-end sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isCash}
                onChange={(e) => set('isCash', e.target.checked)}
                className="size-4"
              />
              بار نقدی
            </label>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>کدهای فرعی (پله، زیرپله، ...)</Label>
              <Button size="sm" variant="outline" onClick={addExtra}>+ افزودن</Button>
            </div>
            {draft.extraCodes.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">کد فرعی ثبت نشده است.</p>
            )}
            <div className="mt-2 space-y-2">
              {draft.extraCodes.map((e, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="نوع (مثلاً پله)"
                    value={e.type}
                    onChange={(ev) => updateExtra(i, { type: ev.target.value })}
                  />
                  <Input
                    placeholder="کد"
                    value={e.code}
                    dir="ltr"
                    onChange={(ev) => updateExtra(i, { code: ev.target.value })}
                  />
                  <Button size="sm" variant="outline" onClick={() => removeExtra(i)}>حذف</Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button onClick={save}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}