'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Banknote, Box, Phone } from 'lucide-react'
import { FactoryAvatar } from './factory-card'
import { ProductCard } from './product-card'
import { RequestDialog } from './request-dialog'
import { Badge } from './ui/badge'
import { Button, buttonVariants } from './ui/button'
import { faDateTime, faNumber } from '@/lib/format'
import { useStore, useVisibleProducts } from '@/lib/store'
import type { Product } from '@/lib/types'

export function ProductDetail({ id }: { id: string }) {
  const { factories } = useStore()
  const products = useVisibleProducts()
  const [selected, setSelected] = useState<Product | null>(null)
  const product = products.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold">محصول پیدا نشد</h1>
        <Link href="/market" className={buttonVariants({ variant: 'link' })}>
          بازگشت به بازار
        </Link>
      </div>
    )
  }

  const factory = factories.find((f) => f.id === product.factoryId)
  const related = products.filter((p) => p.id !== product.id && (p.size === product.size || p.factoryId === product.factoryId)).slice(0, 4)

  const specs = [
    { label: 'کد طرح', value: product.code, ltr: true },
    { label: 'ابعاد (سانتی‌متر)', value: product.size, ltr: true },
    { label: 'درجه', value: product.grade },
    { label: 'آخرین به‌روزرسانی', value: faDateTime(product.updatedAt) },
  ]

  return (
    <div className="flex flex-col gap-12">
      <Link href="/market" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4" aria-hidden="true" />
        بازار موجودی
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl || '/placeholder.svg'} alt={`نمای کاشی ${product.name}`} className="aspect-square size-full object-cover" />
          ) : (
            <div className="aspect-square" style={{ backgroundColor: product.color }} />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap gap-2">
              {product.isCash && (
                <Badge className="gap-1 bg-success text-success-foreground">
                  <Banknote aria-hidden="true" />
                  بار نقدی
                </Badge>
              )}
              <Badge variant="outline">{product.grade}</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-black">{product.name}</h1>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">موجودی لحظه‌ای</p>
            <p className="mt-1 text-4xl font-black text-primary">
              {faNumber(product.stockM2)} <span className="text-base font-medium text-muted-foreground">متر مربع</span>
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {specs.map((s) => (
              <div key={s.label} className="rounded-lg border border-border p-3">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-semibold" dir={s.ltr ? 'ltr' : undefined}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setSelected(product)}>
              درخواست خرید
            </Button>
            <Link href={`/visualizer?product=${product.id}`} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <Box />
              امتحان در اتاق من
            </Link>
          </div>

          {factory && (
            <Link
              href={`/factories/${factory.id}`}
              className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
            >
              <FactoryAvatar factory={factory} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{factory.name}</p>
                <p className="text-sm text-muted-foreground">{factory.city}</p>
              </div>
              <span className="flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
                <Phone className="size-4" aria-hidden="true" />
                {factory.phone}
              </span>
            </Link>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">محصولات مشابه</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} factory={factories.find((f) => f.id === p.factoryId)} onRequest={setSelected} />
            ))}
          </div>
        </section>
      )}

      <RequestDialog product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
