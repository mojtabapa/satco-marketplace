'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'
import { UNITS, UNIT_LABEL } from '@/lib/product-options'
import type { ColumnMapping, ColumnMappingItem, ColumnRole, Grade, StockUnit } from '@/lib/types'

const ROLES: { value: ColumnRole; label: string }[] = [
  { value: 'code', label: 'کد اصلی' },
  { value: 'name', label: 'نام طرح' },
  { value: 'size', label: 'ابعاد' },
  { value: 'grade', label: 'درجه' },
  { value: 'stock', label: 'موجودی / متراژ' },
  { value: 'unit', label: 'واحد موجودی (متر مربع / متر طول / عدد)' },
  { value: 'price', label: 'قیمت (تومان به‌ازای هر واحد)' },
  { value: 'cash', label: 'بار نقدی (بله/خیر)' },
  { value: 'type', label: 'نوع محصول (کاشی، پرسلان، ...)' },
  { value: 'surface', label: 'سطح (مات، براق، ...)' },
  { value: 'clay', label: 'نوع خاک (سفید / قرمز)' },
  { value: 'effect', label: 'افکت (دارد / ندارد)' },
  { value: 'effectName', label: 'نام افکت (کاروین، ریاکتیو، ...)' },
  { value: 'extra', label: 'کد فرعی (پله، زیرپله، ...)' },
  { value: 'ignore', label: 'نادیده بگیر' },
]

const GRADES: Grade[] = ['درجه ۱', 'درجه ۲', 'درجه ۳', 'درجه ۴', 'درجه ۵', 'درجه ۶']

/** از روی اسم ستون حدس می‌زنه نقشش چیه (کاربر می‌تونه عوضش کنه) */
function guessRole(header: string, used: Set<ColumnRole>): ColumnRole {
  const t = header.replace(/[\u200c\s]/g, '')
  if (!t) return 'ignore'
  const pick = (role: ColumnRole): ColumnRole => {
    if (used.has(role)) return 'ignore'
    used.add(role)
    return role
  }
  if (t.includes('نامافکت')) return pick('effectName')
  if (t.includes('افکت')) return pick('effect')
  if (t.includes('فرعی') || t.includes('پله')) return 'extra'
  if (t.includes('واحد')) return pick('unit')
  if (t.includes('نوعمحصول') || t.includes('جنس') || t.includes('متریال')) return pick('type')
  if (t.includes('خاک') || t.includes('بدنه')) return pick('clay')
  if (t.includes('سطح') || t.includes('رویه')) return pick('surface')
  if (t.includes('نقدی')) return pick('cash')
  if (t.includes('قیمت') || t === 'فی') return pick('price')
  if (t.includes('کد')) return pick('code')
  if (t.includes('نام')) return pick('name')
  if (t.includes('ابعاد') || t.includes('سایز')) return pick('size')
  if (t.includes('درجه') || t.includes('کیفیت')) return pick('grade')
  if (t.includes('موجودی') || t.includes('متراژ') || t.includes('مقدار')) return pick('stock')
  return 'ignore'
}

interface Props {
  factoryId: string
  headers: string[]
  sampleRows: string[][]
  onDone: () => void
}

export function ColumnMapper({ factoryId, headers, sampleRows, onDone }: Props) {
  const { columnMappings, saveColumnMapping, gradeMappings, saveGradeMapping } = useStore()
  const existing = columnMappings.find((m) => m.factoryId === factoryId)

  const [headerRow, setHeaderRow] = useState(existing?.headerRow ?? 1)
  const [defaultUnit, setDefaultUnit] = useState<StockUnit>(existing?.defaultUnit ?? 'm2')
  const [mapping, setMapping] = useState<ColumnMappingItem[]>(() => {
    // ستون‌هایی که قبلاً تنظیم شدن و اسمشون عوض نشده همون‌طور می‌مونن؛ بقیه حدس زده می‌شن
    const used = new Set<ColumnRole>()
    const kept: (ColumnMappingItem | null)[] = headers.map((h, i) => {
      const prev = existing?.columns.find((c) => c.columnIndex === i)
      if (prev && prev.header === h) {
        if (prev.role !== 'ignore' && prev.role !== 'extra') used.add(prev.role)
        return prev
      }
      return null
    })
    return headers.map(
      (h, i) => kept[i] ?? { columnIndex: i, header: h, role: guessRole(h, used) },
    )
  })
  const [gradeMap, setGradeMap] = useState<Record<string, Grade>>(() => {
    const prevGrades = gradeMappings.find((m) => m.factoryId === factoryId)
    if (prevGrades) {
      return Object.fromEntries(prevGrades.items.map((i) => [i.source, i.target]))
    }
    return {}
  })

  function updateRole(idx: number, role: ColumnRole) {
    setMapping((prev) =>
      prev.map((m) => (m.columnIndex === idx ? { ...m, role } : m)),
    )
  }

  function updateExtraType(idx: number, extraType: string) {
    setMapping((prev) =>
      prev.map((m) => (m.columnIndex === idx ? { ...m, extraType } : m)),
    )
  }

  function save() {
    // اعتبارسنجی
    const codeCol = mapping.find((m) => m.role === 'code')
    const stockCol = mapping.find((m) => m.role === 'stock')
    if (!codeCol) return toast.error('ستون «کد اصلی» را انتخاب کنید.')
    if (!stockCol) return toast.error('ستون «موجودی / متراژ» را انتخاب کنید.')

    // هر نقش (به‌جز کد فرعی و نادیده بگیر) فقط یک بار
    const seen = new Set<ColumnRole>()
    for (const m of mapping) {
      if (m.role === 'ignore' || m.role === 'extra') continue
      if (seen.has(m.role)) {
        const label = ROLES.find((r) => r.value === m.role)?.label ?? m.role
        return toast.error(`نقش «${label}» برای بیش از یک ستون انتخاب شده است.`)
      }
      seen.add(m.role)
    }

    const cm: ColumnMapping = {
      factoryId,
      headerRow,
      columns: mapping,
      defaultUnit,
      updatedAt: new Date().toISOString(),
    }
    saveColumnMapping(cm)

    // ذخیره‌ی نگاشت درجات
    const gm = {
      factoryId,
      items: Object.entries(gradeMap).map(([source, target]) => ({ source, target })),
      updatedAt: new Date().toISOString(),
    }
    saveGradeMapping(gm)

    toast.success('نگاشت ستون‌ها ذخیره شد.')
    onDone()
  }

  const hasUnitColumn = mapping.some((m) => m.role === 'unit')

  // پیدا کردن ستون «درجه» برای نمونه‌گیری
  const gradeColIdx = mapping.find((m) => m.role === 'grade')?.columnIndex
  const gradeSamples = gradeColIdx !== undefined
    ? [...new Set(sampleRows.map((r) => r[gradeColIdx]).filter(Boolean))].slice(0, 20)
    : []

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <h3 className="font-bold">نگاشت ستون‌های اکسل</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          مشخص کنید هر ستون اکسل شما مربوط به کدام فیلد ساتکو است. نقش ستون‌ها از روی اسمشان حدس زده شده؛ اگر اشتباه بود تغییر دهید.
          بعد از ذخیره، هر بار آپلود اکسل خودکار پردازش می‌شود.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Label>شماره سطر عنوان در اکسل</Label>
        <Input
          type="number"
          min={1}
          value={headerRow}
          onChange={(e) => setHeaderRow(Number(e.target.value))}
          className="mt-2 max-w-xs"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          معمولاً سطر ۱. اگه بالای جدول عنوان یا لوگو دارید، شماره سطر جدول را وارد کنید.
        </p>
      </div>

      <div className="space-y-3">
        {mapping.map((m) => (
          <div key={m.columnIndex} className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <div className="text-xs text-muted-foreground">ستون {String.fromCharCode(65 + m.columnIndex)}</div>
              <div className="font-semibold">{m.header || '(بی‌نام)'}</div>
              <div className="text-xs text-muted-foreground">
                نمونه: {sampleRows[0]?.[m.columnIndex] ?? '—'}
              </div>
            </div>
            <div className="sm:col-span-1">
              <NativeSelect value={m.role} onChange={(e) => updateRole(m.columnIndex, e.target.value as ColumnRole)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </NativeSelect>
            </div>
            <div className="sm:col-span-1">
              {m.role === 'extra' && (
                <Input
                  placeholder="نوع (مثلاً پله، زیرپله)"
                  value={m.extraType ?? ''}
                  onChange={(e) => updateExtraType(m.columnIndex, e.target.value)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {!hasUnitColumn && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-bold">واحد موجودی</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            اکسل شما ستون «واحد» ندارد. موجودی همه‌ی ردیف‌ها با کدام واحد ثبت شود؟
          </p>
          <div className="mt-3 max-w-xs">
            <NativeSelect value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value as StockUnit)}>
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
            </NativeSelect>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            اگر بعضی طرح‌ها متر مربع و بعضی متر طول یا عدد هستند، یک ستون «واحد» به اکسل اضافه کنید و نقشش را «واحد موجودی» بگذارید.
          </p>
        </div>
      )}

      {gradeSamples.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-bold">نگاشت درجات</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            درجات کارخانه‌ی خود را به درجات استاندارد ساتکو نگاشت کنید. (اختیاری)
          </p>
          <div className="mt-3 space-y-2">
            {gradeSamples.map((g) => (
              <div key={g} className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted/60 px-3 py-2 text-sm font-mono">{g}</div>
                <NativeSelect
                  value={gradeMap[g] ?? ''}
                  onChange={(e) => setGradeMap({ ...gradeMap, [g]: e.target.value as Grade })}
                >
                  <option value="">— بدون تغییر —</option>
                  {GRADES.map((gr) => <option key={gr} value={gr}>{gr}</option>)}
                </NativeSelect>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={save}>ذخیره و ادامه</Button>
        <Button variant="outline" onClick={onDone}>انصراف</Button>
      </div>
    </div>
  )
}