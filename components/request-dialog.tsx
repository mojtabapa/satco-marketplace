'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { faNumber, isValidIranMobile, normalizeDigits } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'

export function RequestDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addRequest, session, factories } = useStore()
  const [error, setError] = useState<string | null>(null)
  const factory = factories.find((f) => f.id === product?.factoryId)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!product) return
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const phone = normalizeDigits(String(data.get('phone') ?? '').trim())
    const qty = Number(normalizeDigits(String(data.get('qty') ?? '')))
    const note = String(data.get('note') ?? '').trim().slice(0, 500)

    if (name.length < 2) return setError('نام را وارد کنید.')
    if (!isValidIranMobile(phone)) return setError('شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).')
    if (!Number.isInteger(qty) || qty <= 0) return setError('متراژ باید عدد صحیح مثبت باشد.')
    if (qty > product.stockM2) return setError(`حداکثر موجودی ${faNumber(product.stockM2)} متر مربع است.`)

    addRequest({ productId: product.id, factoryId: product.factoryId, buyerName: name, buyerPhone: phone, quantityM2: qty, note })
    toast.success('درخواست شما ثبت شد', { description: `${factory?.name ?? 'فروشنده'} به‌زودی با شما تماس می‌گیرد.` })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>درخواست خرید</DialogTitle>
          <DialogDescription>
            {product?.name} — {factory?.name}
          </DialogDescription>
        </DialogHeader>
        <form id="request-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="req-name">نام و نام خانوادگی / فروشگاه</Label>
            <Input id="req-name" name="name" required autoComplete="name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-phone">شماره موبایل</Label>
            <Input
              id="req-phone"
              name="phone"
              inputMode="tel"
              dir="ltr"
              className="text-left"
              defaultValue={session?.phone ?? ''}
              placeholder="09123456789"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-qty">متراژ مورد نیاز (متر مربع)</Label>
            <Input id="req-qty" name="qty" inputMode="numeric" dir="ltr" className="text-left" required />
            {product && (
              <p className="text-xs text-muted-foreground">موجودی فعلی: {faNumber(product.stockM2)} متر مربع</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-note">توضیحات (اختیاری)</Label>
            <Textarea id="req-note" name="note" rows={3} maxLength={500} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button type="submit" form="request-form">
            ثبت درخواست
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
