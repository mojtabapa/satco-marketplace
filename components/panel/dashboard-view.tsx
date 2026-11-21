'use client'

import { useMemo } from 'react'
import { Package, Boxes, ClipboardList, Megaphone, Eye, MousePointerClick, TrendingUp, Wallet } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { useStore } from '@/lib/store'
import { faNumber, faShortDate, toman } from '@/lib/format'
import type { RequestStatus } from '@/lib/types'

interface Props {
  factoryId: string
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'جدید',
  contacted: 'تماس گرفته شد',
  done: 'انجام شد',
  cancelled: 'لغو شد',
}

const box = 'rounded-xl border bg-card p-4'

export function DashboardView({ factoryId }: Props) {
  const s = useStore()

  const mine = s.products.filter((p) => p.factoryId === factoryId)
  const myReqs = s.requests.filter((r) => r.factoryId === factoryId)
  const myAds = s.adSlots.filter((a) => a.factoryId === factoryId)
  const myUploads = s.uploadLogs.filter((u) => u.factoryId === factoryId)
  const myStockHistory = s.stockHistory.filter((h) => h.factoryId === factoryId)

  // آمار تبلیغات: فقط رویدادهای جایگاه‌هایی که این کارخانه رزرو کرده
  const mySlots = useMemo(() => new Set(myAds.map((a) => a.slotName)), [myAds])
  const myEvents = useMemo(
    () => s.events.filter((e) => mySlots.has(e.slotName)),
    [s.events, mySlots],
  )

  const totalImpressions = myEvents.filter((e) => e.type === 'imp').length
  const totalClicks = myEvents.filter((e) => e.type === 'clk').length
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  const totalStock = mine.reduce((sum, p) => sum + p.stockM2, 0)
  const newRequests = myReqs.filter((r) => r.status === 'new').length
  const revenue = myAds
    .filter((a) => a.status === 'paid')
    .reduce((sum, a) => sum + a.amount, 0)

  // نمودار موجودی: آخرین ۱۲ نقطه
  const stockData = useMemo(() => {
    return myStockHistory.slice(-12).map((h) => ({
      date: faShortDate(h.date),
      total: h.total,
    }))
  }, [myStockHistory])

  // نمودار درخواست‌ها به تفکیک وضعیت
  const requestData = useMemo(() => {
    const counts: Record<RequestStatus, number> = {
      new: 0, contacted: 0, done: 0, cancelled: 0,
    }
    myReqs.forEach((r) => { counts[r.status]++ })
    return (Object.keys(counts) as RequestStatus[]).map((k) => ({
      status: STATUS_LABEL[k],
      count: counts[k],
    }))
  }, [myReqs])

  // نمودار تبلیغات به تفکیک جایگاه
  const adData = useMemo(() => {
    const bySlot: Record<string, { imp: number; clk: number }> = {}
    myAds.forEach((a) => {
      if (!bySlot[a.slotName]) bySlot[a.slotName] = { imp: 0, clk: 0 }
    })
    myEvents.forEach((e) => {
      if (!bySlot[e.slotName]) bySlot[e.slotName] = { imp: 0, clk: 0 }
      if (e.type === 'imp') bySlot[e.slotName].imp++
      else bySlot[e.slotName].clk++
    })
    return Object.entries(bySlot).map(([slotName, v]) => ({
      slot: s.pricing.find((p) => p.slotName === slotName)?.label ?? slotName,
      imp: v.imp,
      clk: v.clk,
    }))
  }, [myAds, myEvents, s.pricing])

  const recentUploads = myUploads.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* کارت‌های خلاصه */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="size-5" />}
          label="تعداد محصولات"
          value={faNumber(mine.length)}
        />
        <StatCard
          icon={<Boxes className="size-5" />}
          label="مجموع موجودی (م²)"
          value={faNumber(totalStock)}
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="درخواست‌های جدید"
          value={faNumber(newRequests)}
          accent
        />
        <StatCard
          icon={<Megaphone className="size-5" />}
          label="درآمد تبلیغات"
          value={toman(revenue)}
        />
      </div>

      {/* کارت‌های آمار تبلیغات */}
      <div>
        <h2 className="mb-2 text-lg font-bold">آمار تبلیغات</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Eye className="size-5" />}
            label="کل نمایش"
            value={faNumber(totalImpressions)}
          />
          <StatCard
            icon={<MousePointerClick className="size-5" />}
            label="کل کلیک"
            value={faNumber(totalClicks)}
          />
          <StatCard
            icon={<TrendingUp className="size-5" />}
            label="نرخ کلیک (CTR)"
            value={`${faNumber(Math.round(ctr * 10) / 10)}٪`}
            accent
          />
          <StatCard
            icon={<Wallet className="size-5" />}
            label="تعداد رزرو"
            value={faNumber(myAds.length)}
          />
        </div>
      </div>

      {/* نمودار موجودی */}
      <div className={box}>
        <h3 className="mb-3 font-bold">روند موجودی</h3>
        {stockData.length < 2 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            برای نمایش نمودار، حداقل دو بار موجودی را تغییر دهید.
          </p>
        ) : (
          <ChartContainer
            config={{
              total: { label: 'موجودی (م²)', color: 'var(--chart-1)' },
            }}
            className="h-64 w-full"
          >
            <AreaChart data={stockData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillStock" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={60} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={2}
                fill="url(#fillStock)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      {/* نمودار درخواست‌ها */}
      <div className={box}>
        <h3 className="mb-3 font-bold">وضعیت درخواست‌ها</h3>
        {myReqs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            هنوز درخواستی ثبت نشده است.
          </p>
        ) : (
          <ChartContainer
            config={{
              count: { label: 'تعداد', color: 'var(--chart-2)' },
            }}
            className="h-56 w-full"
          >
            <BarChart data={requestData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>

      {/* نمودار تبلیغات */}
      <div className={box}>
        <h3 className="mb-3 font-bold">نمایش و کلیک تبلیغات</h3>
        {adData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            هنوز تبلیغی رزرو نکرده‌اید.
          </p>
        ) : (
          <ChartContainer
            config={{
              imp: { label: 'نمایش', color: 'var(--chart-1)' },
              clk: { label: 'کلیک', color: 'var(--chart-2)' },
            }}
            className="h-56 w-full"
          >
            <BarChart data={adData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="slot" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="imp" fill="var(--color-imp)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="clk" fill="var(--color-clk)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>

      {/* لیست تبلیغات */}
      <div className={box}>
        <h3 className="mb-3 font-bold">تبلیغات من</h3>
        {myAds.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز تبلیغی رزرو نکرده‌اید.</p>
        ) : (
          <ul className="divide-y">
            {myAds.map((a) => {
              const slot = s.pricing.find((p) => p.slotName === a.slotName)
              const imp = myEvents.filter((e) => e.slotName === a.slotName && e.type === 'imp').length
              const clk = myEvents.filter((e) => e.slotName === a.slotName && e.type === 'clk').length
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="font-medium">{slot?.label ?? a.slotName}</span>
                  <span className="text-xs text-muted-foreground">
                    {faShortDate(a.startDate)} تا {faShortDate(a.endDate)}
                  </span>
                  <span className="text-xs">
                    👁️ {faNumber(imp)} · 🖱️ {faNumber(clk)}
                  </span>
                  <span className="text-xs font-medium">{toman(a.amount)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* آخرین آپلودها */}
      <div className={box}>
        <h3 className="mb-3 font-bold">آخرین آپلودها</h3>
        {recentUploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز فایلی آپلود نشده است.</p>
        ) : (
          <ul className="divide-y">
            {recentUploads.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium">{u.filename}</span>
                <span className="text-xs text-muted-foreground">{faShortDate(u.createdAt)}</span>
                <span className="text-xs">
                  {faNumber(u.rowsUpdated)} آپدیت · {faNumber(u.rowsCreated)} جدید
                  {u.rowsFailed > 0 && ` · ${faNumber(u.rowsFailed)} خطا`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`${box} flex items-center gap-3`}>
      <div
        className={`grid size-10 place-items-center rounded-lg ${
          accent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-black">{value}</div>
      </div>
    </div>
  )
}