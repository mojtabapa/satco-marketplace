'use client'

import { useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'

export function BrandEditor() {
  const { currentFactory, updateFactory } = useStore()
  const f = currentFactory

  const [slogan, setSlogan] = useState(f?.slogan ?? '')
  const [brandColor, setBrandColor] = useState(f?.brandColor ?? '#d9b45a')
  const [logoPreview, setLogoPreview] = useState<string | null>(f?.logoUrl ?? null)

  if (!f) return null

  function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      toast.error('حجم لوگو باید کمتر از ۵۰۰ کیلوبایت باشد.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setLogoPreview(dataUrl)
      updateFactory(f.id, { logoUrl: dataUrl })
      toast.success('لوگو ذخیره شد.')
    }
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    setLogoPreview(null)
    updateFactory(f.id, { logoUrl: null })
    toast.success('لوگو حذف شد.')
  }

  function save() {
    updateFactory(f.id, { slogan, brandColor })
    toast.success('برند به‌روزرسانی شد.')
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h3 className="font-bold">برند من</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          این اطلاعات در PDF کاتالوگ شما استفاده می‌شود.
        </p>
      </div>

      {/* لوگو */}
      <div className="space-y-2">
        <Label>لوگوی کارخانه</Label>
        <div className="flex items-center gap-3">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="لوگو"
                className="size-20 rounded-lg border bg-white object-contain p-1"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-white"
                aria-label="حذف لوگو"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <div className="grid size-20 place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground">
              <Upload className="size-6" />
            </div>
          )}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onLogo}
              className="max-w-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              PNG / JPG / WebP / SVG — حداکثر ۵۰۰ کیلوبایت
            </p>
          </div>
        </div>
      </div>

      {/* شعار */}
      <div className="space-y-2">
        <Label htmlFor="slogan">شعار کارخانه</Label>
        <Textarea
          id="slogan"
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          rows={2}
          maxLength={100}
          placeholder="مثلاً: کیفیت در هر متر، هنر در هر خانه"
        />
        <p className="text-xs text-muted-foreground">
          {slogan.length} / ۱۰۰ کاراکتر — در بالای PDF کاتالوگ نمایش داده می‌شود.
        </p>
      </div>

      {/* رنگ برند */}
      <div className="space-y-2">
        <Label htmlFor="brandColor">رنگ برند</Label>
        <div className="flex items-center gap-2">
          <input
            id="brandColor"
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-md border"
          />
          <span className="text-sm text-muted-foreground" dir="ltr">{brandColor}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          این رنگ در سربرگ و جزئیات PDF استفاده می‌شود.
        </p>
      </div>

      <Button onClick={save}>ذخیره‌ی برند</Button>
    </div>
  )
}