'use client'

import Link from 'next/link'
import { Banknote, Sparkles } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { faNumber } from '@/lib/format'
import type { Factory, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  factory?: Factory
  featured?: boolean
  onRequest?: (product: Product) => void
}

export function ProductCard({ product, factory, featured, onRequest }: ProductCardProps) {
  const lowStock = product.stockM2 < 300
  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40',
        featured && 'border-primary/50 ring-1 ring-primary/30',
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl || '/placeholder.svg'}
            alt={`نمای کاشی ${product.name}`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full" style={{ backgroundColor: product.color }} />
        )}
        <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1.5">
          {featured && (
            <Badge className="gap-1">
              <Sparkles aria-hidden="true" />
              ویژه
            </Badge>
          )}
          {product.isCash && (
            <Badge variant="secondary" className="gap-1 bg-success text-success-foreground">
              <Banknote aria-hidden="true" />
              بار نقدی
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-bold">
            <Link href={`/products/${product.id}`} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
          {factory && (
            <Link href={`/factories/${factory.id}`} className="truncate text-sm text-muted-foreground hover:text-primary">
              {factory.name}
            </Link>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-muted/60 px-2 py-1.5">
            <dt className="text-muted-foreground">ابعاد</dt>
            <dd className="font-semibold" dir="ltr">{product.size}</dd>
          </div>
          <div className="rounded-md bg-muted/60 px-2 py-1.5">
            <dt className="text-muted-foreground">درجه</dt>
            <dd className="font-semibold">{product.grade}</dd>
          </div>
          <div className="rounded-md bg-muted/60 px-2 py-1.5">
            <dt className="text-muted-foreground">کد</dt>
            <dd className="truncate font-mono font-semibold" dir="ltr">{product.code}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">موجودی</p>
            <p className={cn('text-lg font-black', lowStock ? 'text-warning' : 'text-foreground')}>
              {faNumber(product.stockM2)} <span className="text-xs font-medium text-muted-foreground">متر مربع</span>
            </p>
          </div>
          {onRequest && (
            <Button size="sm" onClick={() => onRequest(product)}>
              درخواست خرید
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
