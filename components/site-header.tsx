'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, X, ClipboardList } from 'lucide-react'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'
import { buttonVariants, Button } from './ui/button'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/market', label: 'بازار موجودی' },
  { href: '/factories', label: 'کارخانه‌ها' },
  { href: '/visualizer', label: 'شبیه‌ساز کاشی‌کاری' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { session, logout } = useStore()
  const [open, setOpen] = useState(false)

  if (pathname.startsWith('/panel/catalog')) return null

  const dashboardHref = session?.role === 'admin' ? '/admin' : session && session.role !== 'buyer' ? '/panel' : null
  const isBuyer = session?.role === 'buyer'

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  pathname.startsWith(item.href) && 'text-primary',
                )}
              >
                {item.label}
              </Link>
            ))}
            {isBuyer && (
              <Link
                href="/my-requests"
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  pathname.startsWith('/my-requests') && 'text-primary',
                )}
              >
                <ClipboardList className="size-4" />
                درخواست‌های من
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden sm:inline-flex')}>
                  {session.role === 'admin' ? <ShieldCheck /> : <LayoutDashboard />}
                  {session.role === 'admin' ? 'مدیریت' : 'پنل من'}
                </Link>
              )}
              {isBuyer && (
                <Link href="/my-requests" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden sm:inline-flex')}>
                  <ClipboardList />
                  درخواست‌های من
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout()
                  router.push('/')
                }}
              >
                <LogOut />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              <LogIn />
              ورود / ثبت‌نام
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={open ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav aria-label="ناوبری موبایل" className="border-t border-border px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {[
              ...NAV,
              ...(dashboardHref ? [{ href: dashboardHref, label: session?.role === 'admin' ? 'مدیریت' : 'پنل من' }] : []),
              ...(isBuyer ? [{ href: '/my-requests', label: 'درخواست‌های من' }] : []),
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}