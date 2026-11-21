import { Box, FileSpreadsheet, Megaphone, Wand2 } from 'lucide-react'

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: 'به‌روزرسانی با اکسل',
    body: 'کارخانه فایل موجودی را آپلود می‌کند؛ کدهای موجود به‌روز و کدهای جدید ساخته می‌شوند، با گزارش دقیق ردیف‌های خطادار.',
  },
  {
    icon: Wand2,
    title: 'شبیه‌ساز هوش مصنوعی',
    body: 'عکس اتاق را آپلود کنید و کاشی دلخواه را روی کف یا دیوار ببینید — قبل از اینکه حتی یک متر بخرید.',
  },
  {
    icon: Box,
    title: 'پیش‌نمایش سه‌بعدی',
    body: 'هر کاشی را در یک اتاق سه‌بعدی تعاملی بچرخانید و الگوی چیدمان را در ابعاد واقعی ببینید.',
  },
  {
    icon: Megaphone,
    title: 'جایگاه تبلیغاتی',
    body: 'برند خود را در بالای بازار و صفحه‌ی اصلی نمایش دهید و آمار نمایش و کلیک را لحظه‌ای ببینید.',
  },
]

export function HomeFeatures() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-balance text-3xl font-black">یک پلتفرم برای کل زنجیره‌ی فروش کاشی</h2>
          <p className="mt-3 text-muted-foreground">از انبار کارخانه تا تصمیم خرید مشتری نهایی.</p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
