import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/auth-card'
import { AdBanner } from '@/components/ad-banner'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'ورود و ثبت‌نام | ساتکو',
  description: 'ورود با شماره موبایل و کد یک‌بارمصرف به بازار کاشی و سرامیک ساتکو.',
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      {/* بک‌گراند ویدیو + گرادیانت */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* گرادیانت پایه (fallback) */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/20" />
        
        {/* ویدیو */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        
        {/* لایه‌ی تیره برای خوانایی متن */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
        
        {/* لوگوی بزرگ SATCO در پس‌زمینه */}
        <div className="absolute inset-0 grid place-items-center opacity-[0.03]">
          <span className="text-[40vw] font-black tracking-tighter">SATCO</span>
        </div>
      </div>

      {/* نوار بالا */}
      <header className="flex items-center justify-between px-4 pt-4">
        <Logo />
        <ThemeToggle />
      </header>

      {/* محتوا */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-black sm:text-3xl">بزرگترین بازار آنلاین کاشی ایران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            به سیستم جامع سادکو خوش آمدید
          </p>
        </div>

        <div className="w-full max-w-md">
          <AdBanner slotName="home_hero" />
        </div>

        <div className="w-full max-w-md">
          <Suspense>
            <AuthCard showLogo={false} />
          </Suspense>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-muted-foreground">
        ساتکو · بازار موجودی کاشی و سرامیک · نسخه ۱.۰
      </footer>
    </div>
  )
}