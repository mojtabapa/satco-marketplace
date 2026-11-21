'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useReady, useStore } from '@/lib/store'
import type { Role } from '@/lib/types'

export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session } = useStore()
  const ready = useReady()
  const router = useRouter()
  const ok = !!session && roles.includes(session.role)

  useEffect(() => {
    if (ready && !ok) router.replace('/login')
  }, [ready, ok, router])

  if (!ready || !ok) return <p className="py-20 text-center text-muted-foreground">در حال بررسی دسترسی…</p>
  return <>{children}</>
}
