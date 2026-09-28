/**
 * Brand homepage — celebrations and team stores front door.
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import { fetchGalleryItems, toPublicGalleryItems } from '@/lib/gallery'
import AboutBand from '@/components/home/AboutBand'
import FinalCta from '@/components/home/FinalCta'
import HomeHero from '@/components/home/HomeHero'
import Offerings from '@/components/home/Offerings'
import PathsGrid from '@/components/home/PathsGrid'
import RecentWork from '@/components/home/RecentWork'
import MarketingChrome from '@/components/home/MarketingChrome'
import { mergeHomeContent } from '@/lib/homeContent'
import { hasAdminSession } from '@/lib/adminSession'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CVL Designs | Balloons, Banners & Team Stores',
  description:
    'Handmade balloon designs, painted banners, and custom team apparel by Caryn Vander Laan Designs.',
}

export default async function HomePage() {
  let content = mergeHomeContent({})
  let galleryItems: ReturnType<typeof toPublicGalleryItems> = []

  try {
    const config = await fetchConfiguration()
    content = mergeHomeContent(config)
  } catch (error) {
    console.error('Error fetching homepage configuration:', error)
  }

  try {
    galleryItems = toPublicGalleryItems(await fetchGalleryItems(false))
  } catch (error) {
    console.error('Error fetching homepage gallery:', error)
  }

  return (
    <MarketingChrome content={content} showAdminLink={hasAdminSession()}>
      <main id="main-content">
        <HomeHero content={content} galleryItems={galleryItems} />
        <PathsGrid content={content} />
        <Offerings content={content} />
        <RecentWork items={galleryItems} content={content} />
        <AboutBand content={content} />
        <FinalCta content={content} />
      </main>
    </MarketingChrome>
  )
}

export const revalidate = 60
