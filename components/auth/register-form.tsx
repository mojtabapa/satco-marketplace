'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { isValidIranMobile, normalizeDigits } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { CompanyType } from '@/lib/types'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const router = useRouter()
  const { registerCompany } = useStore()
  const [type, setType] = useState<CompanyType>('factory')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const get = (k: string) => String(data.get(k) ?? '').trim()
    const phone = normalizeDigits(get('phone'))
    const name = get('name')
    const registrationNumber = normalizeDigits(get('registrationNumber'))

    if (name.length < 3) return setError('نام برند را کامل وارد کنید.')
    if (!/^\d{4,12}$/.test(registrationNumber)) return setError('شماره ثبت باید ۴ تا ۱۲ رقم باشد.')
    if (!isValidIranMobile(phone)) return setError('شماره موبایل معتبر نیست.')
    if (get('address').length < 5) return setError('آدرس را وارد کنید.')

    registerCompany({
      phone,
      type,
      name: name.slice(0, 80),
      registrationNumber,
      city: get('city').slice(0, 40),
      address: get('address').slice(0, 200),
      description: get('description').slice(0, 600),
    })
    toast.success('درخواست ثبت‌نام ارسال شد', { description: 'پس از تأیید مدیر، محصولات شما در بازار نمایش داده می‌شود.' })
    router.push('/panel')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div role="radiogroup" aria-label="نوع فعالیت" className="grid grid-cols-2 gap-2">
        {(['factory', 'trader'] as CompanyType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
              type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
            )}
          >
            {t === 'factory' ? 'کارخانه' : 'شرکت بازرگانی'}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">نام برند</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="registrationNumber">شماره ثبت</Label>
          <Input id="registrationNumber" name="registrationNumber" inputMode="numeric" dir="ltr" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-phone">شماره تماس</Label>
          <Input id="reg-phone" name="phone" type="tel" dir="ltr" placeholder="09123456789" required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">شهر</Label>
          <Input id="city" name="city" />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="address">آدرس</Label>
          <Input id="address" name="address" required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">توضیحات</Label>
        <Textarea id="description" name="description" rows={3} placeholder="محصولات، ظرفیت تولید، سابقه..." />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">ارسال درخواست ثبت‌نام</Button>
    </form>
  )
}