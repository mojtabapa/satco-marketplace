'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { faNumber } from '@/lib/format'
import type { Factory, Product } from '@/lib/types'

interface Props {
  factory: Factory
  products: Product[]
}

/**
 * به جای window.print() این تابع را صدا بزن:
 * صبر می‌کند همهٔ عکس‌ها کامل لود شوند و بعد چاپ را شروع می‌کند.
 */
export async function printCatalog() {
  const imgs = Array.from(
    document.querySelectorAll<HTMLImageElement>('.catalog-pdf img')
  )
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
    )
  )
  window.print()
}

const PER_PAGE = 4 // هر صفحه دقیقاً حداکثر ۴ محصول

export function CatalogPdf({ factory, products }: Props) {
  // کاتالوگ مستقیم زیر body رندر می‌شود تا بقیهٔ سایت در چاپ دخالت نکند
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const pages: Product[][] = []
  for (let i = 0; i < products.length; i += PER_PAGE) {
    pages.push(products.slice(i, i + PER_PAGE))
  }

  const brandStyle = { '--brand': factory.brandColor || '#d9b45a' } as CSSProperties

  return createPortal(
    <div className="catalog-pdf">
      {pages.map((pageProducts, pageIdx) => (
        <div key={pageIdx} className="pdf-page" style={brandStyle}>
          {/* واترمارک */}
          <div className="pdf-watermark">
            <div className="pdf-watermark-text">SATCO</div>
            <div className="pdf-watermark-url">satco.ir</div>
          </div>

          {/* ---------- سربرگ ---------- */}
          <div className="pdf-header">
            <div className="pdf-brand">
              <div className="pdf-logo-ring">
                {factory.logoUrl ? (
                  <img
                    src={factory.logoUrl}
                    alt={factory.name}
                    className="pdf-logo"
                    loading="eager"
                    decoding="sync"
                  />
                ) : (
                  <div className="pdf-logo-placeholder">{factory.name.charAt(0)}</div>
                )}
              </div>
              <div className="pdf-brand-text">
                <h1>{factory.name}</h1>
                <div className="pdf-gold-line" />
                {factory.slogan && <p className="pdf-slogan">{factory.slogan}</p>}
              </div>
            </div>

            <div className="pdf-contact-box">
              <div className="pdf-contact-row">
                <span className="pdf-contact-label">تلفن</span>
                <span className="pdf-contact-value" dir="ltr">{factory.phone}</span>
              </div>
              <div className="pdf-contact-row">
                <span className="pdf-contact-label">شهر</span>
                <span className="pdf-contact-value">{factory.city}</span>
              </div>
            </div>
          </div>

          {/* ---------- عنوان صفحه ---------- */}
          <div className="pdf-page-title">
            <h2>
              <span className="pdf-diamond" />
              کاتالوگ محصولات
            </h2>
            <span>صفحه {faNumber(pageIdx + 1)} از {faNumber(pages.length)}</span>
          </div>

          {/* ---------- شبکهٔ ۲×۲ محصولات ---------- */}
          <div className="pdf-grid">
            {pageProducts.map((p) => {
              const extra = p.extraCodes ?? []
              return (
                <div key={p.id} className="pdf-product">
                  <div className="pdf-product-image">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="eager"
                        decoding="sync"
                      />
                    ) : (
                      <div style={{ background: p.color, width: '100%', height: '100%' }} />
                    )}
                    {p.isCash && <div className="pdf-cash">⚡ بار نقدی</div>}
                  </div>

                  <div className="pdf-product-body">
                    <h3>{p.name}</h3>
                    <div className="pdf-specs">
                      <div className="pdf-spec">
                        <span>کد</span>
                        <span dir="ltr">{p.code}</span>
                      </div>
                      {extra.map((e, i) => (
                        <div key={i} className="pdf-spec">
                          <span>{e.type}</span>
                          <span dir="ltr">{e.code}</span>
                        </div>
                      ))}
                      <div className="pdf-spec">
                        <span>ابعاد</span>
                        <span dir="ltr">{p.size}</span>
                      </div>
                      <div className="pdf-spec">
                        <span>درجه</span>
                        <span>{p.grade}</span>
                      </div>
                      <div className="pdf-spec">
                        <span>موجودی</span>
                        <span>{faNumber(p.stockM2)} م²</span>
                      </div>
                      {p.pricePerM2 && (
                        <div className="pdf-spec">
                          <span>قیمت</span>
                          <span>{faNumber(p.pricePerM2)} تومان</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ---------- پاورقی ---------- */}
          <div className="pdf-footer">
            <span className="pdf-footer-line" />
            <span className="pdf-footer-text">تهیه شده در سایت ساتکو — satco.ir</span>
            <span className="pdf-footer-line" />
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}