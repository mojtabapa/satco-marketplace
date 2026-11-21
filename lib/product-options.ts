import type { StockUnit } from './types'

/** نوع محصول */
export const PRODUCT_TYPES = ['سرامیک', 'کاشی', 'پرسلان', 'پرسلان پولیش', 'پرسلان تمام‌بدنه'] as const

/** سطح */
export const SURFACES = ['مات', 'براق', 'نیمه‌براق', 'نانو پولیش'] as const

/** نوع خاک */
export const CLAYS = ['خاک سفید', 'خاک قرمز'] as const

/** واحد موجودی */
export const UNITS: StockUnit[] = ['m2', 'm', 'pcs']
export const UNIT_LABEL: Record<StockUnit, string> = { m2: 'متر مربع', m: 'متر طول', pcs: 'عدد' }
export const UNIT_SHORT: Record<StockUnit, string> = { m2: 'م²', m: 'متر', pcs: 'عدد' }

/** فاصله، نیم‌فاصله و ی/ک عربی رو یکی می‌کنه تا «نیمه براق» و «نیمه‌براق» یکی حساب بشن */
const squash = (s: string) =>
  s
    .replace(/[\u200c\s]/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .toLowerCase()

/** اگه مقدار با یکی از گزینه‌ها بخونه همون گزینه استاندارد رو برمی‌گردونه، وگرنه متن خود کارخانه */
export function matchOption(value: string, options: readonly string[]): string {
  const v = squash(value)
  if (!v) return ''
  return options.find((o) => squash(o) === v) ?? value.trim()
}

/** تشخیص واحد موجودی از متن اکسل (null = نامشخص) */
export function parseUnit(value: string): StockUnit | null {
  const v = squash(value)
  if (!v) return null
  if (v.includes('مربع') || ['م²', 'م2', 'm2', 'm²', 'متر۲', 'متر2'].includes(v)) return 'm2'
  if (v.includes('طول') || ['متر', 'm', 'مترخطی', 'خطی'].includes(v)) return 'm'
  if (['عدد', 'تعداد', 'تکه', 'تک', 'pcs', 'piece', 'pc'].includes(v)) return 'pcs'
  return null
}

/** دارد / ندارد (undefined = خالی یا نامشخص) */
export function parseHas(value: string): boolean | undefined {
  const v = squash(value)
  if (!v) return undefined
  if (['ندارد', 'خیر', 'نه', 'no', 'n', 'false', '0', 'نیست'].includes(v)) return false
  if (['دارد', 'بله', 'آره', 'yes', 'y', 'true', '1', 'هست'].includes(v)) return true
  return undefined
}