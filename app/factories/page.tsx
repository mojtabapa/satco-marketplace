import type { Metadata } from 'next'
import { FactoriesList } from '@/components/factories-list'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'کارخانه‌ها و بازرگانی‌ها | ساتکو',
  description: 'فهرست کارخانه‌ها و بازرگانی‌های کاشی و سرامیک تأییدشده در ساتکو.',
}

export default function FactoriesPage() {
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-black">کارخانه‌ها و بازرگانی‌ها</h1>
        <p className="mt-2 text-muted-foreground">فروشندگان تأییدشده توسط مدیریت ساتکو</p>
        <FactoriesList />
      </main>
      <SiteFooter />
    </>
  )
}
