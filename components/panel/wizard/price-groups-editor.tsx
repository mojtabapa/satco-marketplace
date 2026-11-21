'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, X, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useStore } from '@/lib/store'
import { GRADES, SIZES } from '@/lib/mock-data'
import { faNumber } from '@/lib/format'
import type { Grade, PriceGroup } from '@/lib/types'

interface Props {
  factoryId: string
}

interface Draft {
  name: string
  price: string
  size: string
  grade: string
  cashOnly: boolean
}

const EMPTY_DRAFT: Draft = { name: '', price: '', size: '', grade: '', cashOnly: false }

function draftFromGroup(g: PriceGroup): Draft {
  return {
    name: g.name,
    price: String(g.pricePerM2),
    size: g.size ?? '',
    grade: g.grade ?? '',
    cashOnly: !!g.cashOnly,
  }
}

function groupSignature(g: Pick<PriceGroup, 'size' | 'grade' | 'cashOnly'>): string {
  return `${g.size ?? '*'}|${g.grade ?? '*'}|${g.cashOnly ? '1' : '0'}`
}

export function PriceGroupsEditor({ factoryId }: Props) {
  const { priceGroups, products, savePriceGroup, deletePriceGroup } = useStore()
  const mine = useMemo(
    () => priceGroups.filter((g) => g.factoryId === factoryId),
    [priceGroups, factoryId],
  )

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState<string | null>(null)

  const conflicts = useMemo(() => {
    const bySig = new Map<string, PriceGroup[]>()
    for (const g of mine) {
      const sig = groupSignature(g)
      const arr = bySig.get(sig) ?? []
      arr.push(g)
      bySig.set(sig, arr)
    }
    return [...bySig.values()].filter((arr) => arr.length > 1)
  }, [mine])

  const matchCount = useMemo(() => {
    const counts = new Map<string, number>()
    for (const g of mine) {
      const c = products.filter(
        (p) =>
          p.factoryId === factoryId &&
          (!g.size || p.size === g.size) &&
          (!g.grade || p.grade === (g.grade as Grade)) &&
          (!g.cashOnly || p.isCash),
      ).length
      counts.set(g.id, c)
    }
    return counts
  }, [mine, products, factoryId])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function resetForm() {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
  }

  function startEdit(g: PriceGroup) {
    setEditingId(g.id)
    setDraft(draftFromGroup(g))
  }

  function validate(): number | null {
    if (!draft.name.trim()) {
      toast.error('نام گروه را وارد کنید.')
      return null
    }
    const p = Number(draft.price.replace(/[,،]/g, ''))
    if (!p || p <= 0) {
      toast.error('قیمت معتبر وارد کنید.')
      return null
    }
    if (!draft.size && !draft.grade) {
      toast.error('حداقل ابعاد یا درجه را انتخاب کنید.')
      return null
    }
    const sig = groupSignature({
      size: draft.size || undefined,
      grade: draft.grade || undefined,
      cashOnly: draft.cashOnly || undefined,
    })
    const clash = mine.find(
      (g) => g.id !== editingId && groupSignature(g) === sig,
    )
    if (clash) {
      toast.error(`گروهی با همین شرایط قبلاً تعریف شده: «${clash.name}»`)
      return null
    }
    return p
  }

  function submit() {
    const price = validate()
    if (price === null) return

    const group: PriceGroup = {
      id: editingId ?? `pg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      factoryId,
      name: draft.name.trim(),
      pricePerM2: price,
      size: draft.size || undefined,
      grade: (draft.grade || undefined) as Grade | undefined,
      cashOnly: draft.cashOnly || undefined,
    }
    savePriceGroup(group)
    toast.success(editingId ? 'گروه قیمتی به‌روزرسانی شد.' : 'گروه قیمتی اضافه شد.')
    resetForm()
  }

  function handleDelete(g: PriceGroup) {
    if (!confirm(`گروه «${g.name}» حذف شود؟`)) return
    deletePriceGroup(g.id)
    if (editingId === g.id) resetForm()
    toast.success('گروه حذف شد.')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <h3 className="font-bold">گروه‌های قیمتی</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          چون قیمت در اکسل شما نیست، اینجا برای هر ترکیب «ابعاد + درجه» قیمت تعیین کنید.
          هنگام آپلود اکسل، سایت خودکار قیمت هر محصول را از این گروه‌ها تشخیص می‌دهد.
          قاعده‌ی تشخیص: خاص‌ترین گروه (که بیشترین شرط را دارد) اولویت دارد.
        </p>
      </div>

      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 text-amber-600" />
          <div>
            <div className="font-semibold">تداخل در گروه‌ها</div>
            <p className="text-muted-foreground">
              چند گروه با شرایط یکسان تعریف شده‌اند؛ هنگام تشخیص قیمت اولین مورد اعمال می‌شود.
              لطفاً گروه‌های تکراری را حذف یا اصلاح کنید.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold">
            {editingId ? 'ویرایش گروه' : 'افزودن گروه جدید'}
          </h4>
          {editingId && (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              <X className="size-4" />
              انصراف از ویرایش
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>نام گروه</Label>
            <Input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="مثلاً: پرمیوم، اقتصادی"
            />
          </div>
          <div>
            <Label>قیمت (تومان/متر مربع)</Label>
            <Input
              inputMode="numeric"
              value={draft.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="۳۸۰۰۰۰"
              dir="ltr"
            />
          </div>
          <div>
            <Label>ابعاد (اختیاری)</Label>
            <NativeSelect value={draft.size} onChange={(e) => set('size', e.target.value)}>
              <option value="">— هر ابعادی —</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label>درجه (اختیاری)</Label>
            <NativeSelect value={draft.grade} onChange={(e) => set('grade', e.target.value)}>
              <option value="">— هر درجه‌ای —</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.cashOnly}
                onChange={(e) => set('cashOnly', e.target.checked)}
                className="size-4"
              />
              فقط بار نقدی
            </label>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={submit}>
            {editingId ? <Check className="size-4" /> : <Plus className="size-4" />}
            {editingId ? 'ذخیره‌ی تغییرات' : 'افزودن گروه'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        {mine.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">هنوز گروهی تعریف نشده است.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-start text-muted-foreground">
                <th className="p-3 text-start">نام</th>
                <th className="p-3 text-start">قیمت</th>
                <th className="p-3 text-start">شرایط</th>
                <th className="p-3 text-start">محصولات منطبق</th>
                <th className="p-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {mine.map((g) => (
                <tr key={g.id} className={editingId === g.id ? 'border-b bg-primary/5' : 'border-b'}>
                  <td className="p-3 font-semibold">{g.name}</td>
                  <td className="p-3 whitespace-nowrap">{faNumber(g.pricePerM2)} تومان</td>
                  <td className="p-3 text-muted-foreground">
                    {g.size && <>ابعاد: {g.size} </>}
                    {g.grade && <>· {g.grade} </>}
                    {g.cashOnly && <>· فقط نقدی</>}
                    {!g.size && !g.grade && 'همه'}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {faNumber(matchCount.get(g.id) ?? 0)} مورد
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(g)}
                        aria-label="ویرایش"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(g)}
                        aria-label="حذف"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}