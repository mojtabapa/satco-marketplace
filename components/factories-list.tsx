'use client'

import { useState } from 'react'
import { FactoryCard } from './factory-card'
import { AdBanner } from './ad-banner'
import { useActiveAd, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'factory', label: 'کارخانه' },
  { value: 'trader', label: 'بازرگانی' },
] as const

export function FactoriesList() {
  const { factories } = useStore()
  const spotlight = useActiveAd('factory_spotlight')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all')
  const list = factories
    .filter((f) => f.approved && (filter === 'all' || f.type === filter))
    .sort((a, b) => Number(b.id === spotlight?.ad.factoryId) - Number(a.id === spotlight?.ad.factoryId))

  return (
    <div className="mt-8 flex flex-col gap-6">
      <AdBanner slotName="factory_spotlight" />
      <div role="group" aria-label="نوع فروشنده" className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border border-border px-4 py-1.5 text-sm transition-colors',
              filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((f) => (
          <FactoryCard key={f.id} factory={f} spotlight={f.id === spotlight?.ad.factoryId} />
        ))}
      </div>
    </div>
  )
}
