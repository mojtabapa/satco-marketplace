import { HomeHero } from '@/components/home/home-hero'
import { HomeStats } from '@/components/home/home-stats'
import { HomeFeatures } from '@/components/home/home-features'
import { HomeFactories } from '@/components/home/home-factories'
import { HomeCta } from '@/components/home/home-cta'
import { SiteFooter } from '@/components/site-footer'
import { AdBanner } from '@/components/ad-banner'

export default function HomePage() {
  return (
    <>
      <main>
        <HomeHero />
        <div className="mx-auto max-w-7xl px-4">
          <AdBanner slotName="home_hero" className="-mt-8 relative z-10" />
        </div>
        <HomeStats />
        <HomeFeatures />
        <HomeFactories />
        <HomeCta />
      </main>
      <SiteFooter />
    </>
  )
}
