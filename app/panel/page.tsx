import type { Metadata } from 'next'
import { RoleGuard } from '@/components/role-guard'
import { PanelView } from '@/components/panel/panel-view'

export const metadata: Metadata = { title: 'پنل کارخانه | ساتکو' }

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <RoleGuard roles={['factory', 'trader']}>
        <PanelView />
      </RoleGuard>
    </main>
  )
}
