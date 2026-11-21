import { ProductDetail } from '@/components/product-detail'
import { SiteFooter } from '@/components/site-footer'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <ProductDetail id={id} />
      </main>
      <SiteFooter />
    </>
  )
}
