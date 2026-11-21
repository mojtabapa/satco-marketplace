import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from 'next-themes'
import { StoreProvider } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import './globals.css'

const vazirmatn = localFont({
  src: './fonts/Vazirmatn.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'ساتکو | بازار آنلاین موجودی کاشی و سرامیک',
  description:
    'ساتکو، مرجع موجودی لحظه‌ای کارخانه‌ها و بازرگانی‌های کاشی و سرامیک ایران. جستجو بر اساس ابعاد، درجه و بار نقدی، ثبت درخواست خرید و شبیه‌سازی کاشی‌کاری با هوش مصنوعی.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'ساتکو',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f4ee' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1b19' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <body className="min-h-dvh font-sans pb-16 md:pb-0">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <StoreProvider>
            <SiteHeader />
            {children}
            <BottomNav />
            <Toaster position="top-center" dir="rtl" richColors />
          </StoreProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}