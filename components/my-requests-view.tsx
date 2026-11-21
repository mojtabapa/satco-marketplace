'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { faDateTime, faNumber } from '@/lib/format'
import { Button } from '@/components/ui/button'
import type { RequestStatus } from '@/lib/types'

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'جدید',
  contacted: 'تماس گرفته شد',
  done: 'انجام شد',
  cancelled: 'رد شد / لغو شد',
}

const STATUS_STYLE: Record<RequestStatus, string> = {
  new: 'bg-primary/10 text-primary',
  contacted: 'bg-blue-500/10 text-blue-600',
  done: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
}

export function MyRequestsView() {
  const s = useStore()
  const [tab, setTab] = useState<'open' | 'all'>('open')

  const myPhone = s.session?.phone ?? ''
  const mine = s.requests.filter((r) => r.buyerPhone === myPhone)

  const openReqs = mine.filter((r) => r.status !== 'done' && r.status !== 'cancelled')
  const shown = tab === 'open' ? openReqs : mine

  const productName = (id: string) => s.products.find((p) => p.id === id)?.name ?? '—'
  const factoryName = (id: string) => s.factories.find((f) => f.id === id)?.name ?? '—'

  if (mine.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">هنوز درخواستی ثبت نکرده‌اید.</p>
        <Link href="/market" className="mt-3 inline-block text-primary underline">مشاهده‌ی بازار</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'open' ? 'default' : 'outline'} onClick={() => setTab('open')}>
          در جریان ({faNumber(openReqs.length)})
        </Button>
        <Button size="sm" variant={tab === 'all' ? 'default' : 'outline'} onClick={() => setTab('all')}>
          همه ({faNumber(mine.length)})
        </Button>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">درخواست در جریانی ندارید.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{productName(r.productId)}</div>
                  <div className="text-sm text-muted-foreground">{factoryName(r.factoryId)}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>

              <div className="grid gap-1 text-sm sm:grid-cols-3">
                <div>متراژ: {faNumber(r.quantityM2)} م²</div>
                <div>تاریخ: {faDateTime(r.createdAt)}</div>
              </div>

              {r.note && (
                <p className="text-sm text-muted-foreground">توضیحات شما: {r.note}</p>
              )}

              {r.reply ? (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                  <div className="text-xs text-muted-foreground mb-1">
                    پاسخ کارخانه — {faDateTime(r.repliedAt ?? '')}
                  </div>
                  <div>{r.reply}</div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">هنوز پاسخی از کارخانه دریافت نشده است.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}