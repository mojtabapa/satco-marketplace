'use client'

import Link from 'next/link'
import { Building2, Factory as FactoryIcon, MapPin, Sparkles } from 'lucide-react'
import { Badge } from './ui/badge'
import { faNumber } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Factory } from '@/lib/types'
import { cn } from '@/lib/utils'

export function FactoryAvatar({ factory, className }: { factory: Factory; className?: string }) {
  const Icon = factory.type === 'factory' ? FactoryIcon : Building2
  if (factory.logoUrl) {
    return <img src={factory.logoUrl || '/placeholder.svg'} alt={`لوگوی ${factory.name}`} className={cn('size-12 rounded-lg object-cover', className)} />
  }
  return (
    <span className={cn('grid size-12 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary', className)}>
      <Icon className="size-1/2" aria-hidden="true" />
    </span>
  )
}

export function FactoryCard({ factory, spotlight }: { factory: Factory; spotlight?: boolean }) {
  const { products } = useStore()
  const own = products.filter((p) => p.factoryId === factory.id)
  const total = own.reduce((s, p) => s + p.stockM2, 0)

  return (
    <Link
      href={`/factories/${factory.id}`}
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50',
        spotlight && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="flex items-start gap-3">
        <FactoryAvatar factory={factory} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold">{factory.name}</h3>
            {spotlight && (
              <Badge className="gap-1">
                <Sparkles aria-hidden="true" />
                منتخب
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {factory.city} · {factory.type === 'factory' ? 'کارخانه' : 'بازرگانی'}
          </p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{factory.description}</p>
      <div className="mt-auto flex gap-3 border-t border-border pt-3 text-sm">
        <span>
          <span className="font-bold">{faNumber(own.length)}</span> <span className="text-muted-foreground">محصول</span>
        </span>
        <span>
          <span className="font-bold">{faNumber(total)}</span> <span className="text-muted-foreground">متر مربع</span>
        </span>
      </div>
    </Link>
  )
}
