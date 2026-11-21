'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Phone, FileText } from 'lucide-react'
import { FactoryAvatar } from './factory-card'
import { ProductCard } from './product-card'
import { RequestDialog } from './request-dialog'
import { buttonVariants } from './ui/button'
import { Badge } from './ui/badge'
import { faNumber } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'

export function FactoryDetail({ id }: { id: string }) {
  const { factories, products } = useStore()
  const [selected, setSelected] = useState<Product | null>(null)
  const factory = factories.find((f) => f.id === id && f.approved)

  if (!factory) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold">فروشنده پیدا نشد</h1>
        <Link href="/factories" className={buttonVariants({ variant: 'link' })}>
          بازگشت به فهرست
        </Link>
      </div>
    )
  }

  const own = products.filter((p) => p.factoryId === factory.id)
  const total = own.reduce((s, p) => s + p.stockM2, 0)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <FactoryAvatar factory={factory} className="size-16" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{factory.name}</h1>
              <Badge variant="outline">{factory.type === 'factory' ? 'کارخانه' : 'بازرگانی'}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{factory.description}</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {factory.address}
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="size-4" aria-hidden="true" />
                <a href={`tel:${factory.phone}`} dir="ltr" className="hover:text-primary">
                  {factory.phone}
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <FileText className="size-4" aria-hidden="true" />
                شماره ثبت {factory.registrationNumber}
              </li>
            </ul>
          </div>
        </div>
        <dl className="flex gap-6 md:text-left">
          <div>
            <dt className="text-xs text-muted-foreground">کد محصول</dt>
            <dd className="text-2xl font-black text-primary">{faNumber(own.length)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">کل موجودی (m²)</dt>
            <dd className="text-2xl font-black text-primary">{faNumber(total)}</dd>
          </div>
        </dl>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-bold">موجودی انبار</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {own.map((p) => (
            <ProductCard key={p.id} product={p} onRequest={setSelected} />
          ))}
        </div>
      </section>
      <RequestDialog product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
