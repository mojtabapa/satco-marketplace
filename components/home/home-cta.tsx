import Link from 'next/link'
import { buttonVariants } from '../ui/button'
import { cn } from '@/lib/utils'

export function HomeCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20">
      <div className="flex flex-col items-start gap-6 rounded-2xl border border-primary/30 bg-primary/10 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-balance text-2xl font-black sm:text-3xl">کارخانه یا بازرگانی کاشی دارید؟</h2>
          <p className="mt-2 text-muted-foreground">
            ثبت‌نام کنید، پس از تأیید مدیریت موجودی خود را با اکسل بارگذاری کنید و درخواست خرید مستقیم بگیرید.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/login?register=1" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-6')}>
            ثبت‌نام فروشنده
          </Link>
          <Link href="/market" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-6')}>
            مشاهده‌ی بازار
          </Link>
        </div>
      </div>
    </section>
  )
}
