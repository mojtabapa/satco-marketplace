'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ADMIN_PHONE,
  adPricing as initialPricing,
  initialAdSlots,
  initialEvents,
  initialFactories,
  initialProducts,
  initialRequests,
  initialStockHistory,
  initialUploadLogs,
  TILE_TEXTURES,
} from './mock-data'
import { detectPrice, resolveProductPrice } from './excel'
import { uid } from './format'
import type {
  AdEvent,
  AdPricing,
  AdSlot,
  AdStatus,
  ColumnMapping,
  CompanyType,
  ExcelRow,
  Factory,
  GradeMapping,
  MissingAction,
  PriceGroup,
  ProcessResult,
  Product,
  PurchaseRequest,
  RequestStatus,
  Role,
  RowError,
  Session,
  StockPoint,
  UploadLog,
} from './types'

interface RegisterInput {
  phone: string
  type: CompanyType
  name: string
  registrationNumber: string
  city: string
  address: string
  description: string
}

interface ApplyOptions {
  missingAction?: MissingAction
}

interface StoreValue {
  session: Session | null
  factories: Factory[]
  products: Product[]
  uploadLogs: UploadLog[]
  requests: PurchaseRequest[]
  adSlots: AdSlot[]
  pricing: AdPricing[]
  events: AdEvent[]
  stockHistory: StockPoint[]
  columnMappings: ColumnMapping[]
  gradeMappings: GradeMapping[]
  priceGroups: PriceGroup[]
  currentFactory: Factory | null
  login: (phone: string, role: Role) => Session
  registerCompany: (input: RegisterInput) => void
  logout: () => void
  setFactoryApproval: (factoryId: string, approved: boolean) => void
  setFactoryPaused: (factoryId: string, paused: boolean) => void
  updateFactory: (factoryId: string, patch: Partial<Factory>) => void
  updateProduct: (productId: string, patch: Partial<Product>) => void
  deleteProduct: (productId: string) => void
  saveColumnMapping: (mapping: ColumnMapping) => void
  saveGradeMapping: (mapping: GradeMapping) => void
  savePriceGroup: (group: PriceGroup) => void
  deletePriceGroup: (id: string) => void
  applyInventoryRows: (
    factoryId: string,
    filename: string,
    rows: ExcelRow[],
    errors: RowError[],
    options?: ApplyOptions,
  ) => ProcessResult
  addRequest: (input: Omit<PurchaseRequest, 'id' | 'createdAt' | 'status'>) => void
  setRequestStatus: (requestId: string, status: RequestStatus) => void
  setRequestReply: (requestId: string, reply: string) => void
  reserveAd: (input: Omit<AdSlot, 'id' | 'status'>) => void
  setAdStatus: (adId: string, status: AdStatus) => void
  setPrice: (slotName: string, pricePerDay: number) => void
  logAdEvent: (type: AdEvent['type'], slotName: string) => void
}

const STORAGE_KEY = 'satco-state-v2'
const COOKIE_NAME = 'satco-session'
const STOCK_POINT_MERGE_MS = 10 * 60 * 1000
const StoreContext = createContext<StoreValue | null>(null)
const ReadyContext = createContext(false)
export const useReady = () => useContext(ReadyContext)

function setSessionCookie(session: Session | null) {
  if (typeof document === 'undefined') return
  if (session) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
  }
}

function pushStockPoint(hist: StockPoint[], factoryId: string, date: string, total: number): StockPoint[] {
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i].factoryId === factoryId) {
      const age = new Date(date).getTime() - new Date(hist[i].date).getTime()
      if (age >= 0 && age < STOCK_POINT_MERGE_MS) {
        const copy = [...hist]
        copy[i] = { factoryId, date, total }
        return copy
      }
      break
    }
  }
  return [...hist, { factoryId, date, total }]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [factories, setFactories] = useState(initialFactories)
  const [products, setProducts] = useState(initialProducts)
  const [uploadLogs, setUploadLogs] = useState(initialUploadLogs)
  const [requests, setRequests] = useState(initialRequests)
  const [adSlots, setAdSlots] = useState(initialAdSlots)
  const [pricing, setPricing] = useState(initialPricing)
  const [events, setEvents] = useState(initialEvents)
  const [stockHistory, setStockHistory] = useState(initialStockHistory)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [gradeMappings, setGradeMappings] = useState<GradeMapping[]>([])
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved) {
        if (saved.session) setSession(saved.session)
        if (saved.factories) setFactories(saved.factories)
        if (saved.products) setProducts(saved.products)
        if (saved.uploadLogs) setUploadLogs(saved.uploadLogs)
        if (saved.requests) setRequests(saved.requests)
        if (saved.adSlots) setAdSlots(saved.adSlots)
        if (saved.pricing) setPricing(saved.pricing)
        if (saved.events) setEvents(saved.events)
        if (saved.stockHistory) setStockHistory(saved.stockHistory)
        if (saved.columnMappings) setColumnMappings(saved.columnMappings)
        if (saved.gradeMappings) setGradeMappings(saved.gradeMappings)
        if (saved.priceGroups) setPriceGroups(saved.priceGroups)
      }
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        session, factories, products, uploadLogs, requests, adSlots, pricing, events, stockHistory,
        columnMappings, gradeMappings, priceGroups,
      }))
    } catch {}
  }, [ready, session, factories, products, uploadLogs, requests, adSlots, pricing, events, stockHistory, columnMappings, gradeMappings, priceGroups])

  const canEdit = useCallback(
    (factoryId: string) => {
      if (!session) return false
      if (session.role === 'admin') return true
      return (session.role === 'factory' || session.role === 'trader') && session.factoryId === factoryId
    },
    [session],
  )

  const login = useCallback(
    (phone: string, role: Role): Session => {
      let next: Session
      if (phone === ADMIN_PHONE) {
        next = { phone, role: 'admin' }
      } else if (role === 'factory' || role === 'trader') {
        const owned = factories.find((f) => f.phone === phone)
        const fallback = factories.find((f) => f.type === role && f.approved)
        const factory = owned ?? fallback
        next = { phone, role: factory?.type ?? role, factoryId: factory?.id }
      } else {
        next = { phone, role: 'buyer' }
      }
      setSession(next)
      setSessionCookie(next)
      return next
    },
    [factories],
  )

  const registerCompany = useCallback((input: RegisterInput) => {
    const id = uid('f')
    const factory: Factory = {
      id,
      userId: uid('u'),
      name: input.name,
      type: input.type,
      approved: false,
      registrationNumber: input.registrationNumber,
      logoUrl: null,
      slogan: '',
      brandColor: '#d9b45a',
      phone: input.phone,
      address: input.address,
      city: input.city,
      description: input.description,
      createdAt: new Date().toISOString(),
    }
    setFactories((prev) => [factory, ...prev])
    const next = { phone: input.phone, role: input.type, factoryId: id } as Session
    setSession(next)
    setSessionCookie(next)
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    setSessionCookie(null)
  }, [])

  const setFactoryApproval = useCallback((factoryId: string, approved: boolean) => {
    setFactories((prev) =>
      prev.map((f) => (f.id === factoryId ? { ...f, approved, rejected: !approved } : f)),
    )
  }, [])

  const setFactoryPaused = useCallback((factoryId: string, paused: boolean) => {
    setFactories((prev) => prev.map((f) => (f.id === factoryId ? { ...f, isPaused: paused } : f)))
  }, [])

  const updateFactory = useCallback((factoryId: string, patch: Partial<Factory>) => {
    setFactories((prev) => prev.map((f) => (f.id === factoryId ? { ...f, ...patch } : f)))
  }, [])

  const updateProduct = useCallback(
    (productId: string, patch: Partial<Product>) => {
      const target = products.find((p) => p.id === productId)
      if (!target) return
      if (!canEdit(target.factoryId)) return

      if (patch.pricePerM2 !== undefined && patch.pricePerM2 !== null) {
        if (!Number.isFinite(patch.pricePerM2) || patch.pricePerM2 < 0) return
      }
      if (patch.stockM2 !== undefined && (!Number.isFinite(patch.stockM2) || patch.stockM2 < 0)) return

      const now = new Date().toISOString()
      const finalPatch: Partial<Product> = { ...patch }
      if (patch.pricePerM2 !== undefined && patch.priceManual === undefined) {
        finalPatch.priceManual = patch.pricePerM2 !== null
      }

      const nextProducts = products.map((p) =>
        p.id === productId ? { ...p, ...finalPatch, updatedAt: now } : p,
      )
      setProducts(nextProducts)

      if (patch.stockM2 !== undefined && patch.stockM2 !== target.stockM2) {
        const total = nextProducts
          .filter((p) => p.factoryId === target.factoryId)
          .reduce((s, p) => s + p.stockM2, 0)
        setStockHistory((hist) => pushStockPoint(hist, target.factoryId, now, total))
      }
    },
    [products, canEdit],
  )

  const deleteProduct = useCallback(
    (productId: string) => {
      const target = products.find((p) => p.id === productId)
      if (!target || !canEdit(target.factoryId)) return
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    },
    [products, canEdit],
  )

  const saveColumnMapping = useCallback((mapping: ColumnMapping) => {
    setColumnMappings((prev) => {
      const filtered = prev.filter((m) => m.factoryId !== mapping.factoryId)
      return [...filtered, mapping]
    })
  }, [])

  const saveGradeMapping = useCallback((mapping: GradeMapping) => {
    setGradeMappings((prev) => {
      const filtered = prev.filter((m) => m.factoryId !== mapping.factoryId)
      return [...filtered, mapping]
    })
  }, [])

  const savePriceGroup = useCallback((group: PriceGroup) => {
    setPriceGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id)
      if (exists) return prev.map((g) => (g.id === group.id ? group : g))
      return [...prev, group]
    })
  }, [])

  const deletePriceGroup = useCallback((id: string) => {
    setPriceGroups((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const applyInventoryRows = useCallback(
    (
      factoryId: string,
      filename: string,
      rows: ExcelRow[],
      errors: RowError[],
      options?: ApplyOptions,
    ): ProcessResult => {
      if (!canEdit(factoryId)) {
        return { updated: 0, created: 0, failed: rows.length, errors }
      }

      const now = new Date().toISOString()
      let updated = 0
      let created = 0
      const prev = products
      const byCode = new Map(prev.filter((p) => p.factoryId === factoryId).map((p) => [p.code, p]))
      const changes = new Map<string, Product>()
      const additions: Product[] = []
      const factoryPriceGroups = priceGroups.filter((g) => g.factoryId === factoryId)

      rows.forEach((row, i) => {
        const existing = byCode.get(row.code)

        let pricePerM2 = resolveProductPrice(existing, row)
        if (pricePerM2 === null) {
          pricePerM2 = detectPrice(
            { size: row.size, grade: row.grade, isCash: row.isCash },
            factoryPriceGroups,
          )
        }

        if (existing) {
          updated++
          changes.set(existing.id, {
            ...existing,
            name: row.name || existing.name,
            size: row.size || existing.size,
            grade: row.grade || existing.grade,
            stockM2: row.stockM2,
            isCash: row.isCash,
            pricePerM2,
            priceManual: row.priceSource === 'excel' ? false : existing.priceManual,
            extraCodes: row.extraCodes,
            updatedAt: now,
          })
        } else {
          created++
          const tex = TILE_TEXTURES[(prev.length + i) % TILE_TEXTURES.length]
          additions.push({
            id: uid('p'),
            factoryId,
            code: row.code,
            extraCodes: row.extraCodes,
            name: row.name || row.code,
            size: row.size || '60×60',
            grade: row.grade || 'درجه ۱',
            stockM2: row.stockM2,
            isCash: row.isCash,
            pricePerM2,
            imageUrl: tex.url,
            color: tex.color,
            updatedAt: now,
          })
        }
      })

      let missingAction: MissingAction = options?.missingAction ?? 'keep'
      if (rows.length === 0) missingAction = 'keep'
      const fileCodes = new Set(rows.map((r) => r.code))
      const errorCodes = new Set(errors.map((e) => e.code))
      const missingIds = new Set(
        prev
          .filter((p) => p.factoryId === factoryId && !fileCodes.has(p.code) && !errorCodes.has(p.code))
          .map((p) => p.id),
      )

      let nextProducts = prev.map((p) => changes.get(p.id) ?? p)
      let removed = 0
      let zeroed = 0
      if (missingAction === 'delete') {
        removed = missingIds.size
        nextProducts = nextProducts.filter((p) => !missingIds.has(p.id))
      } else if (missingAction === 'zero') {
        nextProducts = nextProducts.map((p) => {
          if (!missingIds.has(p.id) || p.stockM2 === 0) return p
          zeroed++
          return { ...p, stockM2: 0, updatedAt: now }
        })
      }
      nextProducts = [...nextProducts, ...additions]
      setProducts(nextProducts)

      const total = nextProducts.filter((p) => p.factoryId === factoryId).reduce((s, p) => s + p.stockM2, 0)
      setStockHistory((hist) => pushStockPoint(hist, factoryId, now, total))
      setUploadLogs((logs) => [
        {
          id: uid('ul'),
          factoryId,
          filename,
          rowsUpdated: updated,
          rowsCreated: created,
          rowsFailed: errors.length,
          rowsRemoved: removed,
          rowsZeroed: zeroed,
          createdAt: now,
        },
        ...logs,
      ])

      return { updated, created, failed: errors.length, removed, zeroed, errors }
    },
    [products, priceGroups, canEdit],
  )

  const addRequest = useCallback((input: Omit<PurchaseRequest, 'id' | 'createdAt' | 'status'>) => {
    setRequests((prev) => [{ ...input, id: uid('r'), createdAt: new Date().toISOString(), status: 'new' }, ...prev])
  }, [])

  const setRequestStatus = useCallback((requestId: string, status: RequestStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)))
  }, [])

  const setRequestReply = useCallback((requestId: string, reply: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, reply: reply.trim(), repliedAt: new Date().toISOString() }
          : r,
      ),
    )
  }, [])

  const reserveAd = useCallback((input: Omit<AdSlot, 'id' | 'status'>) => {
    setAdSlots((prev) => [{ ...input, id: uid('ad'), status: 'pending' }, ...prev])
  }, [])

  const setAdStatus = useCallback((adId: string, status: AdStatus) => {
    setAdSlots((prev) => prev.map((a) => (a.id === adId ? { ...a, status } : a)))
  }, [])

  const setPrice = useCallback((slotName: string, pricePerDay: number) => {
    setPricing((prev) => prev.map((p) => (p.slotName === slotName ? { ...p, pricePerDay } : p)))
  }, [])

  const logAdEvent = useCallback((type: AdEvent['type'], slotName: string) => {
    setEvents((prev) => [{ id: uid('ev'), type, slotName, createdAt: new Date().toISOString() }, ...prev].slice(0, 500))
  }, [])

  const currentFactory = useMemo(
    () => factories.find((f) => f.id === session?.factoryId) ?? null,
    [factories, session],
  )

  const value = useMemo<StoreValue>(
    () => ({
      session, factories, products, uploadLogs, requests, adSlots, pricing, events, stockHistory,
      columnMappings, gradeMappings, priceGroups, currentFactory,
      login, registerCompany, logout, setFactoryApproval, setFactoryPaused, updateFactory, updateProduct, deleteProduct,
      saveColumnMapping, saveGradeMapping, savePriceGroup, deletePriceGroup,
      applyInventoryRows, addRequest, setRequestStatus, setRequestReply, reserveAd, setAdStatus, setPrice, logAdEvent,
    }),
    [session, factories, products, uploadLogs, requests, adSlots, pricing, events, stockHistory,
     columnMappings, gradeMappings, priceGroups, currentFactory,
     login, registerCompany, logout, setFactoryApproval, setFactoryPaused, updateFactory, updateProduct, deleteProduct,
     saveColumnMapping, saveGradeMapping, savePriceGroup, deletePriceGroup,
     applyInventoryRows, addRequest, setRequestStatus, setRequestReply, reserveAd, setAdStatus, setPrice, logAdEvent],
  )

  return (
    <StoreContext.Provider value={value}>
      <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useVisibleProducts() {
  const { products, factories } = useStore()
  return useMemo(() => {
    const approved = new Set(
      factories.filter((f) => f.approved && !f.isPaused).map((f) => f.id)
    )
    return products.filter((p) => approved.has(p.factoryId))
  }, [products, factories])
}

export function useActiveAd(slotName: string) {
  const { adSlots, factories } = useStore()
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const ad = adSlots.find(
      (a) => a.slotName === slotName && a.status === 'paid' && a.startDate <= today && a.endDate >= today,
    )
    return ad ? { ad, factory: factories.find((f) => f.id === ad.factoryId) ?? null } : null
  }, [adSlots, factories, slotName])
}