import { FactoryDetail } from '@/components/factory-detail'
import { SiteFooter } from '@/components/site-footer'

export default async function FactoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <FactoryDetail id={id} />
      </main>
      <SiteFooter />
    </>
  )
}
