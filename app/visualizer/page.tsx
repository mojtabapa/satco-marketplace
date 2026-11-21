import type { Metadata } from 'next'
import { Suspense } from 'react'
import { VisualizerView } from '@/components/visualizer-view'

export const metadata: Metadata = { title: 'شبیه‌ساز کاشی‌کاری | ساتکو' }

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">شبیه‌ساز کاشی‌کاری</h1>
      <p className="mt-2 text-muted-foreground">تصویر اتاق و کاشی را بدهید تا کاشی‌کاری با هوش مصنوعی شبیه‌سازی شود.</p>
      <Suspense>
        <VisualizerView />
      </Suspense>
    </main>
  )
}
