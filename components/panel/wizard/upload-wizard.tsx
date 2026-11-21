'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store'
import { parseInventoryFile, resolveProductPrice, type ParsedSheet } from '@/lib/excel'
import { faNumber } from '@/lib/format'
import type { ColumnMapping, GradeMapping, MissingAction, Product } from '@/lib/types'
import { ColumnMapper } from './column-mapper'
import { PriceGroupsEditor } from './price-groups-editor'
import { UploadHistory } from '../upload-history'

type Step = 'upload' | 'map' | 'confirm' | 'result'

interface Props {
  factoryId: string
}

interface ChangeRow {
  code: string
  name: string
  kind: 'new' | 'changed'
  stockBefore: number | null
  stockAfter: number
  priceBefore: number | null
  priceAfter: number | null
}

interface PreviewData {
  parsed: ParsedSheet
  created: number
  updated: number
  unchanged: number
  missing: Product[]
  changes: ChangeRow[]
}

interface ResultData {
  updated: number
  created: number
  failed: number
  removed: number
  zeroed: number
  errors: { rowNumber: number; code: string; message: string }[]
}

function buildPreview(parsed: ParsedSheet, factoryProducts: Product[]): PreviewData {
  const byCode = new Map(factoryProducts.map((p) => [p.code, p]))
  const fileCodes = new Set(parsed.rows.map((r) => r.code))
  const errorCodes = new Set(parsed.errors.map((e) => e.code))
  const changes: ChangeRow[] = []
  let created = 0
  let updated = 0
  let unchanged = 0

  for (const row of parsed.rows) {
    const existing = byCode.get(row.code)
    if (!existing) {
      created++
      changes.push({
        code: row.code,
        name: row.name || row.code,
        kind: 'new',
        stockBefore: null,
        stockAfter: row.stockM2,
        priceBefore: null,
        priceAfter: row.pricePerM2,
      })
      continue
    }
    const priceAfter = resolveProductPrice(existing, row)
    const same =
      existing.stockM2 === row.stockM2 &&
      existing.pricePerM2 === priceAfter &&
      existing.isCash === row.isCash &&
      (!row.size || existing.size === row.size) &&
      (!row.grade || existing.grade === row.grade) &&
      (!row.name || existing.name === row.name)
    if (same) {
      unchanged++
    } else {
      updated++
      changes.push({
        code: row.code,
        name: existing.name,
        kind: 'changed',
        stockBefore: existing.stockM2,
        stockAfter: row.stockM2,
        priceBefore: existing.pricePerM2,
        priceAfter,
      })
    }
  }

  const missing = factoryProducts.filter((p) => !fileCodes.has(p.code) && !errorCodes.has(p.code))
  return { parsed, created, updated, unchanged, missing, changes }
}

const fmtPrice = (n: number | null) => (n === null ? '—' : faNumber(n))

export function UploadWizard({ factoryId }: Props) {
  const {
    columnMappings,
    gradeMappings,
    priceGroups,
    products,
    applyInventoryRows,
  } = useStore()
  const existingMapping = columnMappings.find((m) => m.factoryId === factoryId)
  const existingGradeMapping = gradeMappings.find((m) => m.factoryId === factoryId)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<string[][]>([])
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [missingAction, setMissingAction] = useState<MissingAction>('keep')
  const [result, setResult] = useState<ResultData | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingPreview, setPendingPreview] = useState(false)

  // بعد از ذخیره‌ی نگاشت، خودکار پیش‌نمایش ساخته می‌شه
  useEffect(() => {
    if (!pendingPreview || !file || !existingMapping) return
    setPendingPreview(false)
    void runPreview(file, existingMapping, existingGradeMapping)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPreview, file, existingMapping, existingGradeMapping])

  async function loadForMapping(f: File) {
    try {
      const XLSX = await import('xlsx')
      const buffer = await f.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
      const hdrs = matrix[0]?.map((c) => String(c ?? '').trim()) ?? []
      setHeaders(hdrs)
      setSampleRows(matrix.slice(1, 6).map((r) => r.map((c) => String(c ?? '').trim())))
      setStep('map')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خواندن فایل ممکن نبود.')
    }
  }

  async function runPreview(f: File, mapping: ColumnMapping, gradeMapping?: GradeMapping) {
    setBusy(true)
    try {
      // اگه نگاشت درجه ذخیره نشده، درجه‌ها همون‌طور که تو اکسل هستن می‌مونن (متوقف نمی‌شیم)
      const grades: GradeMapping = gradeMapping ?? { factoryId, items: [], updatedAt: '' }
      // فقط گروه‌های قیمتی همین کارخانه
      const factoryGroups = priceGroups.filter((g) => g.factoryId === factoryId)
      const parsed = await parseInventoryFile(f, mapping, grades, factoryGroups)
      setPreview(buildPreview(parsed, products.filter((p) => p.factoryId === factoryId)))
      setMissingAction('keep')
      setStep('confirm')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'پردازش فایل ممکن نبود.')
    } finally {
      setBusy(false)
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setFile(f)
    setResult(null)
    if (existingMapping) {
      // نگاشت قبلاً ذخیره شده: دیگه نگاشت نمی‌خواد، مستقیم پیش‌نمایش
      await runPreview(f, existingMapping, existingGradeMapping)
    } else {
      await loadForMapping(f)
    }
  }

  function apply() {
    if (!preview || !file) return
    if (
      missingAction === 'delete' &&
      preview.missing.length > 0 &&
      !window.confirm(`${faNumber(preview.missing.length)} محصول که تو اکسل نیستن برای همیشه حذف می‌شن. مطمئنی؟`)
    ) {
      return
    }
    const res = applyInventoryRows(factoryId, file.name, preview.parsed.rows, preview.parsed.errors, {
      missingAction,
    })
    setResult({
      updated: res.updated,
      created: res.created,
      failed: res.failed,
      removed: res.removed ?? 0,
      zeroed: res.zeroed ?? 0,
      errors: preview.parsed.errors,
    })
    toast.success(`${faNumber(res.updated)} آپدیت، ${faNumber(res.created)} جدید، ${faNumber(res.failed)} خطا`)
    setStep('result')
  }

  function reset() {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setResult(null)
    setMissingAction('keep')
  }

  // ───────── مرحله نگاشت ستون‌ها ─────────
  if (step === 'map' && headers.length > 0) {
    return (
      <ColumnMapper
        factoryId={factoryId}
        headers={headers}
        sampleRows={sampleRows}
        onDone={() => {
          setStep('upload')
          if (file) setPendingPreview(true)
        }}
      />
    )
  }

  // ───────── مرحله پیش‌نمایش و تأیید ─────────
  if (step === 'confirm' && preview) {
    const { parsed } = preview
    const shownChanges = preview.changes.slice(0, 12)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-bold">پیش‌نمایش تغییرات (هنوز ذخیره نشده)</h3>
          <p className="mt-1 text-sm text-muted-foreground">{file?.name}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <li className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">جدید</div>
              <div className="text-lg font-bold">{faNumber(preview.created)}</div>
            </li>
            <li className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">تغییر می‌کنن</div>
              <div className="text-lg font-bold">{faNumber(preview.updated)}</div>
            </li>
            <li className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">بدون تغییر</div>
              <div className="text-lg font-bold">{faNumber(preview.unchanged)}</div>
            </li>
            <li className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">ردیف خطادار</div>
              <div className={`text-lg font-bold ${parsed.errors.length > 0 ? 'text-destructive' : ''}`}>
                {faNumber(parsed.errors.length)}
              </div>
            </li>
          </ul>
        </div>

        {shownChanges.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold">نمونه‌ی تغییرات</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="p-2 text-start font-medium">کد</th>
                    <th className="p-2 text-start font-medium">وضعیت</th>
                    <th className="p-2 text-start font-medium">موجودی</th>
                    <th className="p-2 text-start font-medium">قیمت</th>
                  </tr>
                </thead>
                <tbody>
                  {shownChanges.map((c) => (
                    <tr key={c.code} className="border-t">
                      <td className="p-2 font-mono text-xs">{c.code}</td>
                      <td className="p-2">{c.kind === 'new' ? '➕ جدید' : '✏️ تغییر'}</td>
                      <td className="p-2">
                        {c.stockBefore === null ? '' : `${faNumber(c.stockBefore)} ← `}
                        {faNumber(c.stockAfter)}
                      </td>
                      <td className="p-2">
                        {c.kind === 'new' ? '' : `${fmtPrice(c.priceBefore)} ← `}
                        {fmtPrice(c.priceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.changes.length > shownChanges.length && (
              <p className="mt-2 text-xs text-muted-foreground">
                و {faNumber(preview.changes.length - shownChanges.length)} مورد دیگر…
              </p>
            )}
          </div>
        )}

        {preview.missing.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <h3 className="font-bold">
              {faNumber(preview.missing.length)} محصول تو این اکسل نیستن
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">با این محصولات چی کار کنیم؟</p>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="missing"
                  checked={missingAction === 'keep'}
                  onChange={() => setMissingAction('keep')}
                />
                دست نزن (همون‌طور که هستن بمونن)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="missing"
                  checked={missingAction === 'zero'}
                  onChange={() => setMissingAction('zero')}
                />
                موجودی‌شون صفر بشه (محصول می‌مونه)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="missing"
                  checked={missingAction === 'delete'}
                  onChange={() => setMissingAction('delete')}
                />
                از سایت حذف بشن
              </label>
            </div>
            <ul className="mt-3 max-h-24 overflow-y-auto text-xs text-muted-foreground">
              {preview.missing.slice(0, 10).map((p) => (
                <li key={p.id}>
                  {p.code} — {p.name}
                </li>
              ))}
              {preview.missing.length > 10 && <li>و {faNumber(preview.missing.length - 10)} مورد دیگر…</li>}
            </ul>
          </div>
        )}

        {parsed.warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <h3 className="font-bold">هشدار قیمت‌گذاری ({faNumber(parsed.warnings.length)})</h3>
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {parsed.warnings.map((w, i) => (
                <li key={i}>
                  سطر {faNumber(w.rowNumber)} ({w.code}): {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsed.errors.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold">خطاها (این ردیف‌ها ثبت نمی‌شن)</h3>
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {parsed.errors.map((e, i) => (
                <li key={i} className="text-destructive">
                  سطر {faNumber(e.rowNumber)} ({e.code}): {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={apply} disabled={parsed.rows.length === 0}>
            تأیید و اعمال تغییرات
          </Button>
          <Button variant="outline" onClick={reset}>
            انصراف
          </Button>
          <Button variant="ghost" onClick={() => file && loadForMapping(file)}>
            ستون‌ها اشتباه شناخته شدن؟ ویرایش نگاشت
          </Button>
        </div>
      </div>
    )
  }

  // ───────── نتیجه نهایی ─────────
  if (step === 'result' && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-bold">نتیجه‌ی پردازش</h3>
          <ul className="mt-3 space-y-1 text-sm">
            <li>✅ {faNumber(result.updated)} محصول به‌روزرسانی شد</li>
            <li>➕ {faNumber(result.created)} محصول جدید اضافه شد</li>
            {result.zeroed > 0 && <li>0️⃣ موجودی {faNumber(result.zeroed)} محصول صفر شد</li>}
            {result.removed > 0 && <li>🗑️ {faNumber(result.removed)} محصول حذف شد</li>}
            {result.failed > 0 && <li className="text-destructive">⚠️ {faNumber(result.failed)} ردیف خطا داشت</li>}
          </ul>
        </div>
        {result.errors.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold">خطاها</h3>
            <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto text-sm">
              {result.errors.map((e, i) => (
                <li key={i} className="text-destructive">
                  سطر {e.rowNumber} ({e.code}): {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={reset}>آپلود فایل جدید</Button>
      </div>
    )
  }

  // ───────── مرحله آپلود ─────────
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <h3 className="font-bold">آپلود موجودی روزانه</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          فایل اکسل خود را انتخاب کنید. اگر قبلاً نگاشت ستون‌ها را انجام داده‌اید، فایل مستقیم خوانده می‌شود و
          قبل از ذخیره، پیش‌نمایش تغییرات را می‌بینید.
        </p>
      </div>

      {!existingMapping && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm">
            ⚠️ هنوز ستون‌های اکسل خود را تعریف نکرده‌اید. ابتدا فایل نمونه را آپلود کنید تا سایت ستون‌ها را بشناسد.
            این کار فقط یک بار لازم است.
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50">
          <FileSpreadsheet className="size-6 text-muted-foreground" />
          <div className="text-center">
            <div className="font-semibold">
              {busy ? 'در حال خواندن فایل...' : file ? file.name : 'فایل اکسل خود را انتخاب کنید'}
            </div>
            <div className="text-xs text-muted-foreground">.xlsx / .xls / .csv</div>
          </div>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" disabled={busy} />
        </label>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <PriceGroupsEditor factoryId={factoryId} />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <UploadHistory factoryId={factoryId} />
      </div>
    </div>
  )
}