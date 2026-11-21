'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, Smartphone } from 'lucide-react'
import { Logo } from '../logo'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { NativeSelect } from '../ui/native-select'
import { RegisterForm } from './register-form'
import { isValidIranMobile, normalizeDigits } from '@/lib/format'
import { ADMIN_PHONE } from '@/lib/mock-data'
import { useStore } from '@/lib/store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const DEMO_OTP = '12345'

const ROLES: { value: Role; label: string }[] = [
  { value: 'buyer', label: 'خریدار (پیمانکار، فروشگاه، مصرف‌کننده)' },
  { value: 'factory', label: 'کارخانه' },
  { value: 'trader', label: 'شرکت بازرگانی' },
  { value: 'admin', label: 'مدیر کل' },
]

type Mode = 'login' | 'register'

interface AuthCardProps {
  className?: string
  showLogo?: boolean
}

export function AuthCard({ className, showLogo = true }: AuthCardProps = {}) {
  const params = useSearchParams()
  const [mode, setMode] = useState<Mode>(params.get('register') ? 'register' : 'login')

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur-sm sm:p-6',
        className,
      )}
    >
      {showLogo && (
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h1 className="text-lg font-bold">
            {mode === 'login' ? 'ورود به ساتکو' : 'ثبت‌نام کارخانه / بازرگانی'}
          </h1>
        </div>
      )}

      <div
        role="tablist"
        aria-label="نوع ورود"
        className={cn('grid grid-cols-2 gap-1 rounded-lg bg-muted p-1', showLogo ? 'mt-4' : '')}
      >
        {(['login', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md py-2 text-sm font-medium transition-colors',
              mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'login' ? 'ورود' : 'ثبت‌نام فروشنده'}
          </button>
        ))}
      </div>

      <div className="mt-4">{mode === 'login' ? <LoginFlow /> : <RegisterForm />}</div>
    </div>
  )
}

function LoginFlow() {
  const router = useRouter()
  const { login } = useStore()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('buyer')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  function sendOtp(e: FormEvent) {
    e.preventDefault()
    const normalized = normalizeDigits(phone.trim())
    if (!isValidIranMobile(normalized)) return setError('شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).')
    setPhone(normalized)
    setError(null)
    setStep('otp')
    toast.info('کد تأیید (نسخه‌ی دمو)', { description: `کد: ${DEMO_OTP}` })
  }

  function verifyOtp(e: FormEvent) {
    e.preventDefault()
    if (normalizeDigits(code.trim()) !== DEMO_OTP) return setError('کد واردشده صحیح نیست.')
    const session = login(phone, role)
    toast.success('خوش آمدید')
    router.push(session.role === 'admin' ? '/admin' : session.role === 'buyer' ? '/market' : '/panel')
  }

  if (step === 'otp') {
    return (
      <form onSubmit={verifyOtp} className="flex flex-col gap-3" noValidate>
        <p className="text-sm text-muted-foreground">
          کد ۵ رقمی ارسال‌شده به <span dir="ltr" className="font-semibold text-foreground">{phone}</span> را وارد کنید.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp">کد تأیید</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={5}
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-11 ps-9 text-center text-lg tracking-[0.5em]"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">نسخه‌ی دمو: کد همیشه {DEMO_OTP} است.</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg">تأیید و ورود</Button>
        <Button type="button" variant="ghost" onClick={() => { setStep('phone'); setCode(''); setError(null) }}>
          <ArrowRight />
          ویرایش شماره
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={sendOtp} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">شماره موبایل</Label>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="09123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 ps-9"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">نقش (فقط در نسخه‌ی دمو)</Label>
        <NativeSelect id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </NativeSelect>
        <p className="text-xs leading-relaxed text-muted-foreground">
          در نسخه‌ی واقعی نقش از جدول profiles خوانده می‌شود. شماره‌ی {ADMIN_PHONE} همیشه مدیر است.
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">دریافت کد تأیید</Button>
    </form>
  )
}