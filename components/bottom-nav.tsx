'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Store, Factory, LayoutDashboard } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'خانه', icon: Home },
  { href: '/market', label: 'بازار', icon: Store },
  { href: '/factories', label: 'کارخانه‌ها', icon: Factory },
  { href: '/panel', label: 'پنل من', icon: LayoutDashboard, requiresAuth: true },
  { href: '/admin', label: 'مدیریت', icon: LayoutDashboard, requiresAdmin: true },
]

export function BottomNav() {
  const pathname = usePathname()
  const { session } = useStore()

  if (!session || pathname === '/login') return null

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requiresAdmin) return session.role === 'admin'
    if (item.requiresAuth) return session.role === 'factory' || session.role === 'trader'
    return true
  })

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center justify-around px-2 py-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('size-5', isActive && 'scale-110')} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}