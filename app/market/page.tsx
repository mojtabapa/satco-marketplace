import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MarketView } from '@/components/market/market-view'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'بازار موجودی | ساتکو',
  description: 'جستجوی موجودی لحظه‌ای کاشی و سرامیک بر اساس ابعاد، درجه، کارخانه و بار نقدی.',
}

export default function MarketPage() {
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-black">بازار موجودی</h1>
        <p className="mt-2 text-muted-foreground">موجودی به‌روز کارخانه‌ها و بازرگانی‌های تأییدشده</p>
        <Suspense>
          <MarketView />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}
