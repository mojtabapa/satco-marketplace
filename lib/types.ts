export type Role = 'buyer' | 'factory' | 'trader' | 'admin'
export type CompanyType = 'factory' | 'trader'
export type Grade = 'درجه ۱' | 'درجه ۲' | 'درجه ۳' | 'درجه ۴' | 'درجه ۵' | 'درجه ۶'

export interface Factory {
  id: string
  userId: string
  name: string
  type: CompanyType
  approved: boolean
  rejected?: boolean
  isPaused?: boolean
  registrationNumber: string
  logoUrl: string | null
  slogan: string
  brandColor: string
  phone: string
  address: string
  city: string
  description: string
  createdAt: string
}

export interface ExtraCode {
  code: string
  type: string
}

export interface Product {
  id: string
  factoryId: string
  code: string
  extraCodes: ExtraCode[]
  name: string
  size: string
  grade: string
  stockM2: number
  isCash: boolean
  pricePerM2: number | null
  priceManual?: boolean
  imageUrl: string | null
  color: string
  updatedAt: string
}

export interface UploadLog {
  id: string
  factoryId: string
  filename: string
  rowsUpdated: number
  rowsCreated: number
  rowsFailed: number
  rowsRemoved?: number
  rowsZeroed?: number
  createdAt: string
}

export type RequestStatus = 'new' | 'contacted' | 'done' | 'cancelled'

export interface PurchaseRequest {
  id: string
  productId: string
  factoryId: string
  buyerPhone: string
  buyerName: string
  quantityM2: number
  note: string
  createdAt: string
  status: RequestStatus
  reply?: string
  repliedAt?: string
}

export type AdStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface AdSlot {
  id: string
  factoryId: string
  slotName: string
  startDate: string
  endDate: string
  amount: number
  status: AdStatus
}

export interface AdPricing {
  slotName: string
  label: string
  description: string
  pricePerDay: number
}

export interface AdEvent {
  id: string
  type: 'imp' | 'clk'
  slotName: string
  createdAt: string
}

export interface StockPoint {
  factoryId: string
  date: string
  total: number
}

export interface Session {
  phone: string
  role: Role
  factoryId?: string
}

export interface ExcelRow {
  rowNumber: number
  code: string
  extraCodes: ExtraCode[]
  name: string
  size: string
  grade: string
  stockM2: number
  isCash: boolean
  pricePerM2: number | null
  priceSource?: 'excel' | 'group' | 'none'
}

export interface RowError {
  rowNumber: number
  code: string
  message: string
}

export interface RowWarning {
  rowNumber: number
  code: string
  message: string
}

export type MissingAction = 'keep' | 'zero' | 'delete'

export interface ProcessResult {
  updated: number
  created: number
  failed: number
  removed?: number
  zeroed?: number
  errors: RowError[]
}

export type ColumnRole =
  | 'code'
  | 'name'
  | 'size'
  | 'grade'
  | 'stock'
  | 'cash'
  | 'price'
  | 'extra'
  | 'ignore'

export interface ColumnMappingItem {
  columnIndex: number
  header: string
  role: ColumnRole
  extraType?: string
}

export interface ColumnMapping {
  factoryId: string
  headerRow: number
  columns: ColumnMappingItem[]
  updatedAt: string
}

export interface GradeMappingItem {
  source: string
  target: Grade
}

export interface GradeMapping {
  factoryId: string
  items: GradeMappingItem[]
  updatedAt: string
}

export interface PriceGroup {
  id: string
  factoryId: string
  name: string
  pricePerM2: number
  size?: string
  grade?: string
  cashOnly?: boolean
}