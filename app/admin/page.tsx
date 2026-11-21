import type { Metadata } from 'next'
import { RoleGuard } from '@/components/role-guard'
import { AdminView } from '@/components/admin/admin-view'

export const metadata: Metadata = { title: 'مدیریت کل | ساتکو' }

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <RoleGuard roles={['admin']}>
        <AdminView />
      </RoleGuard>
    </main>
  )
}
