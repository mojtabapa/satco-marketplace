'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store'
import { faNumber, faShortDate, toman } from '@/lib/format'
import type { AdStatus } from '@/lib/types'

const TABS = [
  ['dash', 'خلاصه'],
  ['fac', 'کارخانه‌ها'],
  ['ads', 'رزروها'],
  ['price', 'تعرفه'],
  ['rep', 'گزارش'],
  ['ai', 'هوش مصنوعی'],
] as const
type Tab = (typeof TABS)[number][0]
const AD_LABEL: Record<AdStatus, string> = { pending: 'در انتظار بررسی', approved: 'در انتظار پرداخت', paid: 'پرداخت‌شده', rejected: 'ردشده' }
const box = 'rounded-xl border bg-card p-4 overflow-x-auto'

export function AdminView() {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('dash')
  const [pw, setPw] = useState('')
  const [keys, setKeys] = useState<Record<string, { last4: string; code: string }>>({})
  const [draft, setDraft] = useState<Record<string, string>>({})

  const revenue = s.adSlots.filter((a) => a.status === 'paid').reduce((n, a) => n + a.amount, 0)
  const label = (slot: string) => s.pricing.find((p) => p.slotName === slot)?.label ?? slot
  const fname = (id: string) => s.factories.find((f) => f.id === id)?.name ?? id

  async function loadKeys() {
    const res = await fetch('/api/admin/ai-keys', { headers: { 'x-admin-password': pw } })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error ?? 'خطا')
    setKeys(json)
  }

  async function saveKey(factoryId: string) {
    const apiKey = draft[factoryId]?.trim()
    if (!apiKey) return
    const res = await fetch('/api/admin/ai-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ factoryId, apiKey }),
    })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error ?? 'خطا')
    setDraft({ ...draft, [factoryId]: '' })
    toast.success('کلید ذخیره شد.')
    loadKeys()
  }

  return (
    <div>
      <h1 className="text-2xl font-black">مدیریت کل ساتکو</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map(([k, l]) => (
          <Button key={k} size="sm" variant={tab === k ? 'default' : 'outline'} onClick={() => setTab(k)}>{l}</Button>
        ))}
      </div>

      {tab === 'dash' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['کارخانه و شرکت', s.factories.length],
            ['در انتظار تأیید', s.factories.filter((f) => !f.approved && !f.rejected).length],
            ['محصول', s.products.length],
            ['درآمد تبلیغات', toman(revenue)],
          ].map(([t, v]) => (
            <div key={String(t)} className="rounded-xl border bg-card p-4"><div className="text-2xl font-black text-primary">{typeof v === 'number' ? faNumber(v) : v}</div>{t}</div>
          ))}
        </div>
      )}

      {tab === 'fac' && (
        <div className={`${box} mt-4`}>
          <table className="w-full text-sm"><tbody>
            {s.factories.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-2">{f.name}<br /><span className="text-xs text-muted-foreground">{f.city} · {f.phone}</span></td>
                <td className="p-2">{f.approved ? 'تأییدشده' : f.rejected ? 'ردشده' : 'در انتظار'}</td>
                <td className="p-2 space-x-2 space-x-reverse">
                  {!f.approved && <Button size="sm" onClick={() => { s.updateFactory(f.id, { rejected: false }); s.setFactoryApproval(f.id, true) }}>تأیید</Button>}
                  {!f.rejected && <Button size="sm" variant="outline" onClick={() => { s.setFactoryApproval(f.id, false); s.updateFactory(f.id, { rejected: true }) }}>رد / تعلیق</Button>}
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {tab === 'ads' && (
        <div className={`${box} mt-4`}>
          <table className="w-full text-sm"><tbody>
            {s.adSlots.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{fname(a.factoryId)}<br /><span className="text-xs text-muted-foreground">{label(a.slotName)}</span></td>
                <td className="p-2">{faShortDate(a.startDate)} تا {faShortDate(a.endDate)}</td>
                <td className="p-2">{toman(a.amount)}</td><td className="p-2">{AD_LABEL[a.status]}</td>
                <td className="p-2 space-x-2 space-x-reverse">
                  {a.status === 'pending' && <><Button size="sm" onClick={() => s.setAdStatus(a.id, 'approved')}>تأیید</Button><Button size="sm" variant="outline" onClick={() => s.setAdStatus(a.id, 'rejected')}>رد</Button></>}
                  {a.status === 'approved' && <Button size="sm" onClick={() => s.setAdStatus(a.id, 'paid')}>ثبت پرداخت دستی</Button>}
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}

      {tab === 'price' && (
        <div className={`${box} mt-4`}>
          <table className="w-full text-sm"><tbody>
            {s.pricing.map((p) => (
              <tr key={p.slotName} className="border-t"><td className="p-2">{p.label}<br /><span className="text-xs text-muted-foreground">{p.description}</span></td>
                <td className="p-2"><Input type="number" min={0} defaultValue={p.pricePerDay} className="w-40" onBlur={(e) => { const v = Number(e.target.value); if (v >= 0) s.setPrice(p.slotName, v) }} /></td><td className="p-2">تومان در روز</td></tr>
            ))}
          </tbody></table>
        </div>
      )}

      {tab === 'rep' && (
        <div className={`${box} mt-4`}>
          <table className="w-full text-sm">
            <thead><tr><th className="p-2 text-start">جایگاه</th><th className="p-2 text-start">نمایش</th><th className="p-2 text-start">کلیک</th><th className="p-2 text-start">نرخ کلیک</th><th className="p-2 text-start">درآمد</th></tr></thead>
            <tbody>
              {s.pricing.map((p) => {
                const imp = s.events.filter((e) => e.slotName === p.slotName && e.type === 'imp').length
                const clk = s.events.filter((e) => e.slotName === p.slotName && e.type === 'clk').length
                const rev = s.adSlots.filter((a) => a.slotName === p.slotName && a.status === 'paid').reduce((n, a) => n + a.amount, 0)
                return <tr key={p.slotName} className="border-t"><td className="p-2">{p.label}</td><td className="p-2">{faNumber(imp)}</td><td className="p-2">{faNumber(clk)}</td><td className="p-2">{imp ? `${faNumber(Math.round((clk / imp) * 1000) / 10)}٪` : '—'}</td><td className="p-2">{toman(rev)}</td></tr>
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ai' && (
        <div className={`${box} mt-4 space-y-3`}>
          <div className="flex flex-wrap gap-2">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="رمز مدیر (ADMIN_PASSWORD در فایل .env.local)" className="max-w-sm" dir="ltr" />
            <Button onClick={loadKeys}>اتصال</Button>
          </div>
          <table className="w-full text-sm"><tbody>
            {s.factories.filter((f) => f.approved).map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-2">{f.name}</td>
                <td className="p-2">{keys[f.id] ? <>کلید …{keys[f.id].last4}<br />کد دسترسی: <b dir="ltr">{keys[f.id].code}</b></> : 'کلید ثبت نشده'}</td>
                <td className="p-2"><Input type="password" dir="ltr" placeholder="Gemini API Key" value={draft[f.id] ?? ''} onChange={(e) => setDraft({ ...draft, [f.id]: e.target.value })} /></td>
                <td className="p-2"><Button size="sm" onClick={() => saveKey(f.id)}>ذخیره</Button></td>
              </tr>
            ))}
          </tbody></table>
          <p className="text-xs text-muted-foreground">کلیدها فقط روی سرور ذخیره می‌شوند. کد دسترسی را به همان کارخانه بدهید تا در شبیه‌ساز وارد کند.</p>
        </div>
      )}
    </div>
  )
}
