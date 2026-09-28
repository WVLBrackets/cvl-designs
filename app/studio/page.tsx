/**
 * CVL Balloons and Banners Design Studio — public gallery
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import {
  fetchGalleryCategories,
  fetchGalleryItems,
  toPublicGalleryItems,
} from '@/lib/gallery'
import { mergeHomeContent } from '@/lib/homeContent'
import { hasAdminSession } from '@/lib/adminSession'
import StudioGalleryClient from '@/components/studio/StudioGalleryClient'
import MarketingChrome from '@/components/home/MarketingChrome'
import type { Metadata } from 'next'
import type { SiteConfiguration } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Balloons and Banners | CVL Designs',
  description: 'Gallery of custom balloon arches, banners, and event decor by CVL Designs.',
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  let config: SiteConfiguration = {}

  try {
    config = await fetchConfiguration()
  } catch (error) {
    console.error('Error fetching studio configuration:', error)
  }

  const [categories, items] = await Promise.all([
    fetchGalleryCategories(),
    fetchGalleryItems(false),
  ])

  const content = mergeHomeContent(config)

  return (
    <MarketingChrome content={content} showAdminLink={hasAdminSession()}>
      <main id="main-content">
        <StudioGalleryClient
          key={searchParams.category || 'all'}
          content={content}
          categories={categories}
          items={toPublicGalleryItems(items)}
          initialCategory={searchParams.category}
        />
      </main>
    </MarketingChrome>
  )
}

export const revalidate = 60
