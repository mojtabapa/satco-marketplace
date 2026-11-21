'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'
import { downloadTemplate, exportInventoryCsv, exportInventoryXlsx } from '@/lib/excel'
import { faDateTime, faNumber, faShortDate, toman } from '@/lib/format'
import type { AdStatus, RequestStatus, Product } from '@/lib/types'
import { BrandEditor } from '@/components/panel/brand-editor'
import { UploadWizard } from '@/components/panel/wizard/upload-wizard'
import { UploadHistory } from '@/components/panel/upload-history'
import { CatalogPdf } from '@/components/panel/catalog-pdf'
import { PriceGroupsEditor } from '@/components/panel/wizard/price-groups-editor'
import { ProductEditDialog } from '@/components/panel/product-edit-dialog'
import { DashboardView } from '@/components/panel/dashboard-view'
import '@/components/panel/catalog-styles.css'

const TABS = [
  ['dash', 'داشبورد'],
  ['inv', 'موجودی'],
  ['price', 'گروه‌های قیمتی'],
  ['upload', 'آپلود هوشمند'],
  ['hist', 'تاریخچه'],
  ['brand', 'برند من'],
  ['settings', 'تنظیمات'],
  ['req', 'درخواست‌ها'],
  ['ads', 'تبلیغات'],
  ['cat', 'کاتالوگ PDF'],
  ['ai', 'هوش مصنوعی'],
] as const
type Tab = (typeof TABS)[number][0]
const AD_LABEL: Record<AdStatus, string> = { pending: 'در انتظار بررسی', approved: 'در انتظار پرداخت', paid: 'پرداخت‌شده', rejected: 'ردشده' }
const REQ_LABEL: Record<RequestStatus, string> = { new: 'جدید', contacted: 'تماس گرفته شد', done: 'انجام شد', cancelled: 'رد شد / لغو شد' }
const box = 'rounded-xl border bg-card p-4'
const GRADES = ['درجه ۱', 'درجه ۲', 'درجه ۳', 'درجه ۴', 'درجه ۵', 'درجه ۶']

export function PanelView() {
  const s = useStore()
  const f = s.currentFactory
  const [tab, setTab] = useState<Tab>('dash')
  const [slot, setSlot] = useState(s.pricing[0]?.slotName ?? '')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [catGrade, setCatGrade] = useState('')
  const [catSize, setCatSize] = useState('')
  const [catCashOnly, setCatCashOnly] = useState(false)
  const [catMinStock, setCatMinStock] = useState('')

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  if (!f) {
    return (
      <div className={box}>
        <p>برای این حساب شرکتی ثبت نشده است.</p>
        <Link href="/login?register=1" className="text-primary underline">ثبت‌نام کارخانه یا شرکت</Link>
      </div>
    )
  }
  if (!f.approved) {
    return <div className={box}>درخواست همکاری «{f.name}» در انتظار تأیید مدیر ساتکو است. پس از تأیید، پنل فعال می‌شود.</div>
  }

  const mine = s.products.filter((p) => p.factoryId === f.id)
  const reqs = s.requests.filter((r) => r.factoryId === f.id)
  const ads = s.adSlots.filter((a) => a.factoryId === f.id)
  const price = s.pricing.find((p) => p.slotName === slot)?.pricePerDay ?? 0
  const days = start && end && end >= start ? Math.round((+new Date(end) - +new Date(start)) / 864e5) + 1 : 0

  const catalogProducts = useMemo(() => {
    const min = Number(catMinStock) || 0
    return mine.filter((p) => {
      if (catGrade && p.grade !== catGrade) return false
      if (catSize && p.size !== catSize) return false
      if (catCashOnly && !p.isCash) return false
      if (p.stockM2 < min) return false
      return true
    })
  }, [mine, catGrade, catSize, catCashOnly, catMinStock])

  const uniqueSizes = useMemo(() => {
    return [...new Set(mine.map((p) => p.size).filter(Boolean))].sort()
  }, [mine])

  function reserve() {
    if (!f) return
    if (!days) return toast.error('بازهٔ تاریخ معتبر نیست.')
    if (s.adSlots.some((a) => a.slotName === slot && a.status !== 'rejected' && start <= a.endDate && end >= a.startDate)) {
      return toast.error('این جایگاه در بازهٔ انتخابی رزرو شده است.')
    }
    s.reserveAd({ factoryId: f.id, slotName: slot, startDate: start, endDate: end, amount: days * price })
    toast.success('درخواست رزرو ثبت شد و پس از بررسی مدیر پیگیری می‌شود.')
  }

  function resetCatFilters() {
    setCatGrade('')
    setCatSize('')
    setCatCashOnly(false)
    setCatMinStock('')
  }

  function saveReply(requestId: string) {
    const text = (replyDrafts[requestId] ?? '').trim()
    if (!text) return toast.error('متن پاسخ خالی است.')
    s.setRequestReply(requestId, text)
    toast.success('پاسخ ذخیره شد.')
    setReplyDrafts((prev) => ({ ...prev, [requestId]: '' }))
  }

  return (
    <>
      <div className="hide-on-print">
        <h1 className="text-2xl font-black">پنل {f.name}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map(([k, l]) => (
            <Button key={k} size="sm" variant={tab === k ? 'default' : 'outline'} onClick={() => setTab(k)}>{l}</Button>
          ))}
        </div>

        {tab === 'dash' && (
          <div className="mt-4">
            <DashboardView factoryId={f.id} />
          </div>
        )}

        {tab === 'inv' && (
          <div className={`${box} mt-4 space-y-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>دانلود قالب اکسل</Button>
              <Button variant="outline" size="sm" onClick={() => exportInventoryXlsx(mine, f.name)}>خروجی Excel</Button>
              <Button variant="outline" size="sm" onClick={() => exportInventoryCsv(mine, f.name)}>خروجی CSV</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              برای تغییر موجودی یا قیمت، عدد را عوض کنید و بیرون از کادر کلیک کنید. برای ویرایش کامل (نام، ابعاد، درجه، کدهای فرعی) از دکمهٔ «ویرایش» استفاده کنید. برای آپلود فایل اکسل به تب «آپلود هوشمند» بروید.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-muted-foreground">
                    <th className="p-2 text-start">کد</th>
                    <th className="p-2 text-start">نام</th>
                    <th className="p-2 text-start">ابعاد</th>
                    <th className="p-2 text-start">درجه</th>
                    <th className="p-2 text-start">موجودی (م²)</th>
                    <th className="p-2 text-start">قیمت (تومان/م²)</th>
                    <th className="p-2 text-start">بار نقدی</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {mine.map((p) => {
                    const extra = p.extraCodes ?? []
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">
                          {p.code}
                          {extra.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {extra.map((e) => `${e.type}: ${e.code}`).join(' · ')}
                            </div>
                          )}
                        </td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.size}</td>
                        <td className="p-2">{p.grade}</td>
                        <td className="p-2">
                          <Input
                            key={`${p.id}-stock-${p.stockM2}`}
                            type="number"
                            min={0}
                            defaultValue={p.stockM2}
                            className="w-24"
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (!Number.isFinite(v) || v < 0) {
                                toast.error('موجودی باید عدد معتبر و حداقل صفر باشد.')
                                e.target.value = String(p.stockM2)
                                return
                              }
                              if (v !== p.stockM2) s.updateProduct(p.id, { stockM2: v })
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            key={`${p.id}-price-${p.pricePerM2 ?? 'none'}`}
                            type="number"
                            min={0}
                            placeholder="—"
                            defaultValue={p.pricePerM2 ?? ''}
                            className="w-32"
                            onBlur={(e) => {
                              const raw = e.target.value.trim()
                              const v = raw === '' ? null : Number(raw)
                              if (v !== null && (!Number.isFinite(v) || v < 0)) {
                                toast.error('قیمت باید عدد معتبر باشد.')
                                e.target.value = p.pricePerM2 === null ? '' : String(p.pricePerM2)
                                return
                              }
                              if (v !== p.pricePerM2) {
                                s.updateProduct(p.id, { pricePerM2: v })
                                toast.success(v === null ? 'قیمت پاک شد.' : 'قیمت ذخیره شد.')
                              }
                            }}
                          />
                          {p.priceManual && (
                            <div className="mt-1 text-[11px] text-muted-foreground">قیمت دستی</div>
                          )}
                        </td>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={p.isCash}
                            onChange={(e) => s.updateProduct(p.id, { isCash: e.target.checked })}
                          />
                        </td>
                        <td className="whitespace-nowrap p-2">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setEditingProduct(p)}>ویرایش</Button>
                            <Button size="sm" variant="outline" onClick={() => confirm('این محصول حذف شود؟') && s.deleteProduct(p.id)}>
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {mine.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">هنوز محصولی ثبت نشده است. از تب «آپلود هوشمند» فایل اکسل بارگذاری کنید.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'price' && (
          <div className="mt-4">
            <PriceGroupsEditor factoryId={f.id} />
          </div>
        )}

        {tab === 'upload' && (
          <div className="mt-4">
            <UploadWizard factoryId={f.id} />
          </div>
        )}

        {tab === 'hist' && (
          <div className={`${box} mt-4`}>
            <UploadHistory factoryId={f.id} />
          </div>
        )}

        {tab === 'brand' && (
          <div className="mt-4">
            <BrandEditor />
          </div>
        )}

        {tab === 'settings' && (
          <div className={`${box} mt-4 space-y-4`}>
            <h2 className="text-lg font-bold">تنظیمات کارخانه</h2>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <div className="font-semibold">تعطیلی موقت</div>
                <p className="text-sm text-muted-foreground">
                  وقتی تعطیل هستید، محصولات شما در بازار نمایش داده نمی‌شوند و خریداران می‌دانند فعلاً نمی‌توانید سفارش بگیرید.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.isPaused ?? false}
                  onChange={(e) => {
                    s.setFactoryPaused(f.id, e.target.checked)
                    toast.success(e.target.checked ? 'کارخانه تعطیل شد.' : 'کارخانه فعال شد.')
                  }}
                  className="size-5"
                />
                <span className="text-sm">{f.isPaused ? 'تعطیل' : 'فعال'}</span>
              </label>
            </div>
          </div>
        )}

        {tab === 'req' && (
          <div className={`${box} mt-4 space-y-4`}>
            {reqs.length === 0 ? <p className="text-muted-foreground">هنوز درخواستی ثبت نشده است.</p> : (
              <div className="space-y-3">
                {reqs.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">{s.products.find((p) => p.id === r.productId)?.name}</div>
                      <div className="text-sm text-muted-foreground">{faDateTime(r.createdAt)}</div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <div>{r.buyerName}</div>
                      <div dir="ltr" className="text-left">{r.buyerPhone}</div>
                      <div>{faNumber(r.quantityM2)} م²</div>
                    </div>
                    {r.note && <p className="text-sm text-muted-foreground">توضیحات خریدار: {r.note}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      <NativeSelect
                        value={r.status}
                        onChange={(e) => s.setRequestStatus(r.id, e.target.value as RequestStatus)}
                        className="max-w-xs"
                      >
                        {(Object.keys(REQ_LABEL) as RequestStatus[]).map((k) => <option key={k} value={k}>{REQ_LABEL[k]}</option>)}
                      </NativeSelect>
                    </div>
                    {r.reply ? (
                      <div className="rounded-md bg-muted/50 p-2 text-sm">
                        <div className="text-xs text-muted-foreground">پاسخ شما ({faDateTime(r.repliedAt ?? '')})</div>
                        <div>{r.reply}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1"
                          onClick={() => setReplyDrafts((prev) => ({ ...prev, [r.id]: r.reply ?? '' }))}
                        >
                          ویرایش پاسخ
                        </Button>
                      </div>
                    ) : null}
                    {(replyDrafts[r.id] !== undefined || !r.reply) && (
                      <div className="space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="پاسخ به خریدار (مثلاً: موجودی تموم شد، هفته آینده شارژ می‌شود)"
                          value={replyDrafts[r.id] ?? ''}
                          onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveReply(r.id)}>ذخیره پاسخ</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyDrafts((prev) => {
                              const copy = { ...prev }
                              delete copy[r.id]
                              return copy
                            })}
                          >
                            انصراف
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'ads' && (
          <div className="mt-4 space-y-4">
            <div className={`${box} grid gap-3 md:grid-cols-4`}>
              <NativeSelect value={slot} onChange={(e) => setSlot(e.target.value)}>{s.pricing.map((p) => <option key={p.slotName} value={p.slotName}>{p.label}</option>)}</NativeSelect>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              <Button onClick={reserve}>ثبت درخواست ({days ? toman(days * price) : '—'})</Button>
              <p className="text-xs text-muted-foreground md:col-span-4">پرداخت آنلاین هنوز به درگاه متصل نیست؛ پس از تأیید، مدیر پرداخت را دستی ثبت می‌کند.</p>
            </div>
            <div className={`${box} overflow-x-auto`}>
              <table className="w-full text-sm"><tbody>
                {ads.map((a) => (<tr key={a.id} className="border-t"><td className="p-2">{s.pricing.find((p) => p.slotName === a.slotName)?.label}</td><td className="p-2">{faShortDate(a.startDate)} تا {faShortDate(a.endDate)}</td><td className="p-2">{toman(a.amount)}</td><td className="p-2">{AD_LABEL[a.status]}</td></tr>))}
              </tbody></table>
            </div>
          </div>
        )}

        {tab === 'cat' && (
          <div className={`${box} mt-4 space-y-4`}>
            <div>
              <h3 className="font-bold">فیلتر کاتالوگ</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                قبل از چاپ، محصولات را فیلتر کنید. فقط محصولاتی که با این شرایط بخوانند در PDF می‌آیند.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs text-muted-foreground">درجه</label>
                <NativeSelect value={catGrade} onChange={(e) => setCatGrade(e.target.value)}>
                  <option value="">همه‌ی درجه‌ها</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </NativeSelect>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">ابعاد</label>
                <NativeSelect value={catSize} onChange={(e) => setCatSize(e.target.value)}>
                  <option value="">همه‌ی ابعاد</option>
                  {uniqueSizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </NativeSelect>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">حداقل موجودی (م²)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="۰"
                  value={catMinStock}
                  onChange={(e) => setCatMinStock(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={catCashOnly}
                    onChange={(e) => setCatCashOnly(e.target.checked)}
                    className="size-4"
                  />
                  فقط بار نقدی
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetCatFilters}>پاک کردن فیلترها</Button>
              <span className="text-sm text-muted-foreground">
                {faNumber(catalogProducts.length)} از {faNumber(mine.length)} محصول — {faNumber(Math.ceil(catalogProducts.length / 4))} صفحه
              </span>
            </div>

            <Button onClick={() => window.print()} disabled={catalogProducts.length === 0}>
              چاپ / ذخیره به‌صورت PDF
            </Button>
            <p className="text-xs text-muted-foreground">
              در پنجرهٔ چاپ: «Save as PDF» + «Background graphics» را تیک بزنید.
            </p>
          </div>
        )}

        {tab === 'ai' && (
          <div className={`${box} mt-4 space-y-2`}>
            <p>برای استفاده از شبیه‌ساز با کلید اختصاصی شرکت خود، «کد دسترسی هوش مصنوعی» را از مدیر ساتکو بگیرید و در صفحهٔ شبیه‌ساز وارد کنید.</p>
            <Link href="/visualizer" className="text-primary underline">رفتن به شبیه‌ساز</Link>
          </div>
        )}
      </div>

      <CatalogPdf factory={f} products={catalogProducts} />
      <ProductEditDialog product={editingProduct} onClose={() => setEditingProduct(null)} />
    </>
  )
}