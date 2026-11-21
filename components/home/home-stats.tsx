'use client'

import { faNumber } from '@/lib/format'
import { useStore, useVisibleProducts } from '@/lib/store'

export function HomeStats() {
  const { factories } = useStore()
  const products = useVisibleProducts()
  const approved = factories.filter((f) => f.approved)
  const total = products.reduce((s, p) => s + p.stockM2, 0)
  const cash = products.filter((p) => p.isCash).length

  const stats = [
    { label: 'متر مربع موجودی فعال', value: faNumber(total) },
    { label: 'کارخانه و بازرگانی تأییدشده', value: faNumber(approved.length) },
    { label: 'کد محصول در بازار', value: faNumber(products.length) },
    { label: 'محصول با بار نقدی', value: faNumber(cash) },
  ]

  return (
    <section aria-label="آمار بازار" className="mx-auto max-w-7xl px-4 py-16">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 bg-card p-6">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="text-3xl font-black text-primary">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
