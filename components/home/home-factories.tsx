'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FactoryCard } from '../factory-card'
import { useActiveAd, useStore } from '@/lib/store'

export function HomeFactories() {
  const { factories } = useStore()
  const spotlight = useActiveAd('factory_spotlight')
  const approved = factories.filter((f) => f.approved)
  const ordered = spotlight?.factory
    ? [spotlight.factory, ...approved.filter((f) => f.id !== spotlight.factory?.id)]
    : approved

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-black">کارخانه‌های منتخب</h2>
        <Link href="/factories" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          همه‌ی کارخانه‌ها
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.slice(0, 6).map((f) => (
          <FactoryCard key={f.id} factory={f} spotlight={f.id === spotlight?.factory?.id} />
        ))}
      </div>
    </section>
  )
}
