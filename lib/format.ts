const numberFormatter = new Intl.NumberFormat('fa-IR')
const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const shortDateFormatter = new Intl.DateTimeFormat('fa-IR', {
  month: 'short',
  day: 'numeric',
})

export const faNumber = (value: number) => numberFormatter.format(value)
export const faDate = (iso: string) => dateFormatter.format(new Date(iso))
export const faDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso))
export const faShortDate = (iso: string) => shortDateFormatter.format(new Date(iso))
export const toman = (value: number) => `${numberFormatter.format(value)} تومان`

const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
}

export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(normalizeDigits(phone.trim()))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}
