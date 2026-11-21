import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RoleGuard } from '@/components/role-guard'
import { MyRequestsView } from '@/components/my-requests-view'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = { title: 'درخواست‌های من | ساتکو' }

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-black">درخواست‌های من</h1>
        <p className="mt-1 text-sm text-muted-foreground">درخواست‌های خرید شما و پاسخ کارخانه‌ها</p>
        <div className="mt-6">
          <RoleGuard roles={['buyer']}>
            <Suspense>
              <MyRequestsView />
            </Suspense>
          </RoleGuard>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}