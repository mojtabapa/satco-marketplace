'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { AdBanner } from '../ad-banner'
import { ProductCard } from '../product-card'
import { RequestDialog } from '../request-dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { NativeSelect } from '../ui/native-select'
import { GRADES, SIZES } from '@/lib/mock-data'
import { faNumber, toman } from '@/lib/format'
import { useActiveAd, useStore, useVisibleProducts } from '@/lib/store'
import type { Product } from '@/lib/types'

type Sort = 'stock-desc' | 'stock-asc' | 'recent' | 'price-asc' | 'price-desc'

export function MarketView() {
  const params = useSearchParams()
  const { factories } = useStore()
  const products = useVisibleProducts()
  const featured = useActiveAd('market_featured')

  const [q, setQ] = useState(params.get('q') ?? '')
  const [size, setSize] = useState(params.get('size') ?? '')
  const [grade, setGrade] = useState('')
  const [factoryId, setFactoryId] = useState(params.get('factory') ?? '')
  const [cashOnly, setCashOnly] = useState(false)
  const [minStock, setMinStock] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<Sort>('stock-desc')
  const [selected, setSelected] = useState<Product | null>(null)

  const factoryMap = useMemo(() => new Map(factories.map((f) => [f.id, f])), [factories])
  const approvedFactories = factories.filter((f) => f.approved)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    const min = Number(minStock) || 0
    const minP = Number(minPrice) || 0
    const maxP = Number(maxPrice) || 0
    const hasPriceFilter = minP > 0 || maxP > 0

    const list = products.filter((p) => {
      if (size && p.size !== size) return false
      if (grade && p.grade !== grade) return false
      if (factoryId && p.factoryId !== factoryId) return false
      if (cashOnly && !p.isCash) return false
      if (p.stockM2 < min) return false

      // فیلتر قیمت
      if (hasPriceFilter) {
        if (p.pricePerM2 === null) return false
        if (minP > 0 && p.pricePerM2 < minP) return false
        if (maxP > 0 && p.pricePerM2 > maxP) return false
      }

      if (term) {
        const hay = `${p.name} ${p.code} ${factoryMap.get(p.factoryId)?.name ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })

    list.sort((a, b) => {
      const af = a.factoryId === featured?.ad.factoryId ? 1 : 0
      const bf = b.factoryId === featured?.ad.factoryId ? 1 : 0
      if (af !== bf) return bf - af
      if (sort === 'stock-asc') return a.stockM2 - b.stockM2
      if (sort === 'recent') return b.updatedAt.localeCompare(a.updatedAt)
      if (sort === 'price-asc') {
        const ap = a.pricePerM2 ?? Infinity
        const bp = b.pricePerM2 ?? Infinity
        return ap - bp
      }
      if (sort === 'price-desc') {
        const ap = a.pricePerM2 ?? -Infinity
        const bp = b.pricePerM2 ?? -Infinity
        return bp - ap
      }
      return b.stockM2 - a.stockM2
    })
    return list
  }, [products, q, size, grade, factoryId, cashOnly, minStock, minPrice, maxPrice, sort, factoryMap, featured])

  const hasFilters = q || size || grade || factoryId || cashOnly || minStock || minPrice || maxPrice
  const total = results.reduce((s, p) => s + p.stockM2, 0)

  function reset() {
    setQ('')
    setSize('')
    setGrade('')
    setFactoryId('')
    setCashOnly(false)
    setMinStock('')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <AdBanner slotName="market_top" />

      <section aria-label="فیلترها" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
          فیلتر و جستجو
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="جستجو"
              placeholder="نام، کد یا کارخانه"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 ps-8"
            />
          </div>
          <NativeSelect aria-label="ابعاد" value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">همه‌ی ابعاد</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="درجه" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">همه‌ی درجه‌ها</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="کارخانه" value={factoryId} onChange={(e) => setFactoryId(e.target.value)}>
            <option value="">همه‌ی فروشندگان</option>
            {approvedFactories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </NativeSelect>
          <Input
            aria-label="حداقل موجودی (متر مربع)"
            placeholder="حداقل متراژ"
            inputMode="numeric"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value.replace(/\D/g, ''))}
            className="h-9"
          />
        </div>

        {/* فیلتر قیمت */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Input
              aria-label="حداقل قیمت (تومان بر متر مربع)"
              placeholder="حداقل قیمت (تومان/م²)"
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
              className="h-9"
            />
          </div>
          <div className="lg:col-span-2">
            <Input
              aria-label="حداکثر قیمت (تومان بر متر مربع)"
              placeholder="حداکثر قیمت (تومان/م²)"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
              className="h-9"
            />
          </div>
          {(minPrice || maxPrice) && (
            <div className="flex items-center text-xs text-muted-foreground lg:col-span-2">
              {minPrice && maxPrice
                ? `${toman(Number(minPrice))} تا ${toman(Number(maxPrice))}`
                : minPrice
                ? `از ${toman(Number(minPrice))}`
                : `تا ${toman(Number(maxPrice))}`}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={cashOnly}
              onChange={(e) => setCashOnly(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            فقط بار نقدی
          </label>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X />
                پاک کردن فیلترها
              </Button>
            )}
            <NativeSelect aria-label="مرتب‌سازی" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-52">
              <option value="stock-desc">بیشترین موجودی</option>
              <option value="stock-asc">کمترین موجودی</option>
              <option value="price-asc">ارزان‌ترین قیمت</option>
              <option value="price-desc">گران‌ترین قیمت</option>
              <option value="recent">آخرین به‌روزرسانی</option>
            </NativeSelect>
          </div>
        </div>
      </section>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {faNumber(results.length)} محصول · مجموع {faNumber(total)} متر مربع
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          محصولی با این فیلترها پیدا نشد.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              factory={factoryMap.get(p.factoryId)}
              featured={p.factoryId === featured?.ad.factoryId}
              onRequest={setSelected}
            />
          ))}
        </div>
      )}

      <RequestDialog product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}