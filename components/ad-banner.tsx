'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { useActiveAd, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function AdBanner({ slotName, className }: { slotName: string; className?: string }) {
  const active = useActiveAd(slotName)
  const { logAdEvent, products } = useStore()
  const logged = useRef<string | null>(null)

  const adId = active?.ad.id
  useEffect(() => {
    if (adId && logged.current !== adId) {
      logged.current = adId
      logAdEvent('imp', slotName)
    }
  }, [adId, slotName, logAdEvent])

  if (!active?.factory) return null
  const { factory } = active
  const sample = products.find((p) => p.factoryId === factory.id)

  return (
    <Link
      href={`/factories/${factory.id}`}
      onClick={() => logAdEvent('clk', slotName)}
      className={cn(
        'group relative flex items-center gap-4 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-l from-primary/15 via-card to-card p-4 transition-colors hover:border-primary/60 sm:p-5',
        className,
      )}
    >
      {sample?.imageUrl && (
        <img
          src={sample.imageUrl || '/placeholder.svg'}
          alt=""
          className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-border sm:size-20"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
          <Megaphone className="size-3.5" aria-hidden="true" />
          آگهی ویژه
        </p>
        <p className="truncate text-base font-bold sm:text-lg">{factory.name}</p>
        <p className="line-clamp-1 text-sm text-muted-foreground">{factory.description}</p>
      </div>
      <ArrowLeft className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-x-1" aria-hidden="true" />
    </Link>
  )
}
