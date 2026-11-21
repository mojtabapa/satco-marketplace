'use client'

import { useRouter } from 'next/navigation'
import { Search, Wand2 } from 'lucide-react'
import Link from 'next/link'
import type { FormEvent } from 'react'
import { Button, buttonVariants } from '../ui/button'
import { SIZES } from '@/lib/mock-data'

export function HomeHero() {
  const router = useRouter()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    const q = String(data.get('q') ?? '').trim()
    const size = String(data.get('size') ?? '')
    if (q) params.set('q', q)
    if (size) params.set('size', size)
    router.push(`/market${params.size ? `?${params}` : ''}`)
  }

  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="/images/hero.png"
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover opacity-40 dark:opacity-30"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 pb-24 pt-20 sm:pt-28">
        <p className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          موجودی لحظه‌ای کارخانه‌ها، بدون تماس تلفنی
        </p>
        <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight sm:text-6xl">
          بازار آنلاین موجودی <span className="text-primary">کاشی و سرامیک</span> ایران
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          کارخانه‌ها و بازرگانی‌ها موجودی انبار را با یک فایل اکسل به‌روز می‌کنند؛ شما بر اساس ابعاد، درجه و بار نقدی
          جستجو کرده و مستقیم درخواست خرید ثبت می‌کنید.
        </p>

        <form
          onSubmit={onSubmit}
          role="search"
          className="flex w-full max-w-2xl flex-col gap-2 rounded-xl border border-border bg-card/90 p-2 shadow-lg backdrop-blur sm:flex-row"
        >
          <label htmlFor="hero-q" className="sr-only">
            جستجوی محصول
          </label>
          <div className="flex flex-1 items-center gap-2 px-2">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              id="hero-q"
              name="q"
              placeholder="نام طرح، کد محصول یا کارخانه…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <label htmlFor="hero-size" className="sr-only">
            ابعاد
          </label>
          <select
            id="hero-size"
            name="size"
            defaultValue=""
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">همه‌ی ابعاد</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" className="h-10 px-6">
            جستجو
          </Button>
        </form>

        <Link href="/visualizer" className={buttonVariants({ variant: 'link' })}>
          <Wand2 aria-hidden="true" />
          کاشی را قبل از خرید در اتاق خودتان ببینید
        </Link>
      </div>
    </section>
  )
}
