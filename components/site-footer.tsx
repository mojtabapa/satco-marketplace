import { Logo } from './logo'

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="text-sm text-muted-foreground">ساتکو — سامانه‌ی تبادل موجودی کاشی و سرامیک · نسخه‌ی نمایشی</p>
      </div>
    </footer>
  )
}
