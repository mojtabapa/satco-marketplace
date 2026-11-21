import * as XLSX from 'xlsx'
import { normalizeDigits } from './format'
import type {
  ColumnMapping,
  ExcelRow,
  ExtraCode,
  GradeMapping,
  PriceGroup,
  Product,
  RowError,
  RowWarning,
} from './types'

export const TEMPLATE_HEADERS = [
  'کد طرح',
  'نام طرح',
  'ابعاد',
  'درجه',
  'موجودی (متر مربع)',
  'بار نقدی (بله/خیر)',
] as const

const clean = (value: unknown) => normalizeDigits(String(value ?? '').trim())

function parseCash(value: string): boolean {
  const v = value.toLowerCase()
  if (['بله', 'آره', 'yes', 'y', 'true', '1', 'نقدی', 'دارد'].includes(v)) return true
  return false
}

export interface ParsedSheet {
  rows: ExcelRow[]
  errors: RowError[]
  warnings: RowWarning[]
  totalRows: number
  headers: string[]
}

/**
 * فقط سطر عنوان رو می‌خونه (برای مرحله ۲ Wizard)
 */
export async function readExcelHeaders(file: File, headerRow: number): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('فایل هیچ برگه‌ای ندارد.')

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
  if (matrix.length < headerRow) throw new Error('سطر عنوان پیدا نشد.')

  return matrix[headerRow - 1].map((c) => clean(c))
}

/** ۶۰×۱۲۰ و ۱۲۰×۶۰ و 60x120 همه یکی حساب می‌شن */
const sizeKey = (s: string) =>
  s
    .replace(/[x*X×]/g, '×')
    .split('×')
    .map((x) => x.trim())
    .filter(Boolean)
    .sort()
    .join('×')

export interface PriceMatch {
  price: number | null
  group: PriceGroup | null
  /** گروه‌هایی که هم‌امتیاز بودن ولی قیمتشون فرق داره */
  conflicts: PriceGroup[]
}

/**
 * تشخیص قیمت: هر گروه فقط شرط‌هایی رو چک می‌کنه که پر کرده (ابعاد، درجه، بار نقدی).
 * گروهی که شرط بیشتری داره و همه‌ی شرط‌هاش برقراره برنده‌ست.
 * اگه چند گروه هم‌امتیاز بودن و قیمتشون فرق داره، اولی اعمال می‌شه و تداخل گزارش می‌شه.
 */
export function detectPriceDetailed(
  product: { size: string; grade: string; isCash: boolean },
  priceGroups: PriceGroup[],
): PriceMatch {
  let best: PriceGroup[] = []
  let bestScore = -1

  for (const g of priceGroups) {
    let score = 0
    if (g.size) {
      if (sizeKey(g.size) !== sizeKey(product.size)) continue
      score++
    }
    if (g.grade) {
      if (g.grade !== product.grade) continue
      score++
    }
    if (g.cashOnly) {
      if (!product.isCash) continue
      score++
    }
    if (score > bestScore) {
      best = [g]
      bestScore = score
    } else if (score === bestScore) {
      best.push(g)
    }
  }

  if (best.length === 0) return { price: null, group: null, conflicts: [] }
  const first = best[0]
  const conflicts = best.slice(1).filter((g) => g.pricePerM2 !== first.pricePerM2)
  return { price: first.pricePerM2, group: first, conflicts }
}

/**
 * نسخه‌ی ساده (سازگار با کدهای قبلی)
 */
export function detectPrice(
  product: { size: string; grade: string; isCash: boolean },
  priceGroups: PriceGroup[],
): number | null {
  return detectPriceDetailed(product, priceGroups).price
}

/**
 * قیمت نهایی محصول بعد از آپلود اکسل:
 * - قیمت صریح تو اکسل همیشه برنده‌ست
 * - اگه قیمت دستی ثبت شده، اکسل بدون قیمت اون رو تغییر نمی‌ده
 * - اگه چیزی پیدا نشد، قیمت قبلی پاک نمی‌شه
 */
export function resolveProductPrice(existing: Product | undefined, row: ExcelRow): number | null {
  if (row.priceSource === 'excel') return row.pricePerM2
  if (existing?.priceManual) return existing.pricePerM2
  return row.pricePerM2 ?? existing?.pricePerM2 ?? null
}

/**
 * پارس اکسل بر اساس نگاشت ستون‌های ذخیره‌شده + نگاشت درجات + گروه‌های قیمتی
 * (priceGroups باید فقط گروه‌های همین کارخانه باشه)
 */
export async function parseInventoryFile(
  file: File,
  mapping: ColumnMapping,
  gradeMapping: GradeMapping,
  priceGroups: PriceGroup[],
): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('فایل هیچ برگه‌ای ندارد.')

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
  if (matrix.length < mapping.headerRow + 1) {
    throw new Error('فایل خالی است یا سطر عنوان پیدا نشد.')
  }

  const headers = matrix[mapping.headerRow - 1].map((c) => clean(c))
  const rows: ExcelRow[] = []
  const errors: RowError[] = []
  const warnings: RowWarning[] = []
  const seenCodes = new Set<string>()

  // نگاشت درجه: source → target
  const gradeMap = new Map(gradeMapping.items.map((i) => [i.source, i.target]))

  // پیدا کردن نقش‌ها
  const col = (role: string) => mapping.columns.find((c) => c.role === role)?.columnIndex
  const extraCols = mapping.columns.filter((c) => c.role === 'extra')

  matrix.slice(mapping.headerRow).forEach((raw, i) => {
    const rowNumber = i + mapping.headerRow + 1
    const get = (colIdx: number | undefined) => (colIdx === undefined ? '' : clean(raw[colIdx]))

    const codeIdx = col('code')
    const stockIdx = col('stock')
    const cashIdx = col('cash')
    const priceIdx = col('price')

    const code = get(codeIdx).toUpperCase()
    const stockRaw = get(stockIdx).replace(/,/g, '').replace(/٬/g, '')
    const stock = Number(stockRaw)
    const isCash = cashIdx !== undefined ? parseCash(get(cashIdx)) : false

    // کدهای فرعی
    const extraCodes: ExtraCode[] = []
    for (const ec of extraCols) {
      const val = get(ec.columnIndex).toUpperCase()
      if (val) extraCodes.push({ code: val, type: ec.extraType ?? 'فرعی' })
    }

    // نگاشت درجه
    const rawGrade = get(col('grade'))
    const grade = gradeMap.get(rawGrade) ?? rawGrade

    if (!code) return void errors.push({ rowNumber, code: '—', message: 'کد طرح خالی است' })
    if (seenCodes.has(code)) return void errors.push({ rowNumber, code, message: 'کد طرح در فایل تکراری است' })
    if (stockIdx === undefined) return void errors.push({ rowNumber, code, message: 'ستون موجودی تعریف نشده' })
    if (stockRaw === '' || Number.isNaN(stock)) return void errors.push({ rowNumber, code, message: 'موجودی عدد معتبر نیست' })
    if (stock < 0) return void errors.push({ rowNumber, code, message: 'موجودی نمی‌تواند منفی باشد' })

    const size = get(col('size')).replace(/[x*X]/g, '×')

    // قیمت: اگه تو اکسل بود، استفاده کن. وگرنه از گروه‌های قیمتی تشخیص بده
    let pricePerM2: number | null = null
    let priceSource: ExcelRow['priceSource'] = 'none'
    if (priceIdx !== undefined) {
      const priceRaw = get(priceIdx).replace(/,/g, '').replace(/٬/g, '')
      const priceNum = Number(priceRaw)
      if (!Number.isNaN(priceNum) && priceNum > 0) {
        pricePerM2 = priceNum
        priceSource = 'excel'
      }
    }
    if (pricePerM2 === null) {
      const match = detectPriceDetailed({ size, grade, isCash }, priceGroups)
      pricePerM2 = match.price
      if (match.price !== null) priceSource = 'group'
      if (match.group && match.conflicts.length > 0) {
        const names = [match.group, ...match.conflicts].map((g) => `«${g.name}»`).join('، ')
        warnings.push({
          rowNumber,
          code,
          message: `چند گروه قیمتی با قیمت‌های متفاوت روی این طرح می‌خورن (${names}). گروه «${match.group.name}» اعمال شد.`,
        })
      }
    }

    seenCodes.add(code)
    rows.push({
      rowNumber,
      code,
      extraCodes,
      name: get(col('name')),
      size,
      grade,
      stockM2: Math.round(stock * 100) / 100,
      isCash,
      pricePerM2,
      priceSource,
    })
  })

  return { rows, errors, warnings, totalRows: matrix.length - mapping.headerRow, headers }
}

export function downloadTemplate() {
  const sample = [
    [...TEMPLATE_HEADERS],
    ['AR-1001', 'کالاکاتا گلد', '60×120', 'درجه ۱', 1850, 'بله'],
    ['AR-2001', 'طرح جدید نمونه', '60×60', 'درجه ۲', 500, 'خیر'],
  ]
  const sheet = XLSX.utils.aoa_to_sheet(sample)
  sheet['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }]
  const workbook = XLSX.utils.book_new()
  workbook.Workbook = { Views: [{ RTL: true }] }
  XLSX.utils.book_append_sheet(workbook, sheet, 'موجودی')
  XLSX.writeFile(workbook, 'satco-inventory-template.xlsx')
}

export function exportInventoryCsv(products: Product[], factoryName: string) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const lines = [
    [...TEMPLATE_HEADERS, 'قیمت (تومان/م²)', 'کدهای فرعی'].map(escape).join(','),
    ...products.map((p) =>
      [
        p.code,
        p.name,
        p.size,
        p.grade,
        p.stockM2,
        p.isCash ? 'بله' : 'خیر',
        p.pricePerM2 ?? '—',
        p.extraCodes.map((e) => `${e.type}:${e.code}`).join('|'),
      ]
        .map(escape)
        .join(','),
    ),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${factoryName}-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** خروجی اکسل واقعی (.xlsx) از موجودی */
export function exportInventoryXlsx(products: Product[], factoryName: string) {
  const data = [
    [...TEMPLATE_HEADERS, 'قیمت (تومان/م²)', 'کدهای فرعی'],
    ...products.map((p) => [
      p.code,
      p.name,
      p.size,
      p.grade,
      p.stockM2,
      p.isCash ? 'بله' : 'خیر',
      p.pricePerM2 ?? '',
      p.extraCodes.map((e) => `${e.type}:${e.code}`).join('|'),
    ]),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 24 }]
  const workbook = XLSX.utils.book_new()
  workbook.Workbook = { Views: [{ RTL: true }] }
  XLSX.utils.book_append_sheet(workbook, sheet, 'موجودی')
  XLSX.writeFile(workbook, `${factoryName}-inventory-${new Date().toISOString().slice(0, 10)}.xlsx`)
}