/**
 * CVL Balloons and Banners Design Studio — public gallery
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import {
  fetchGalleryCategories,
  fetchGalleryItems,
  toPublicGalleryItems,
} from '@/lib/gallery'
import { DEFAULT_STUDIO_TITLE, getStudioHomeContent } from '@/lib/studio'
import StudioGalleryClient from '@/components/studio/StudioGalleryClient'
import StudioPublicHeader from '@/components/studio/StudioPublicHeader'
import type { Metadata } from 'next'
import type { SiteConfiguration } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Balloons and Banners | CVL Designs',
  description: 'Gallery of custom balloon arches, banners, and event decor by CVL Designs.',
}

export default async function StudioPage() {
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

  const getCfgStr = (key: string) =>
    typeof config[key] === 'string' ? (config[key] as string).trim() : ''

  const studio = getStudioHomeContent(config)
  const headerLogo = getCfgStr('Header_Logo')
  const headerLogoSrc = headerLogo
    ? headerLogo.startsWith('/') || headerLogo.startsWith('http')
      ? headerLogo
      : `/images/brand/${headerLogo}`
    : '/images/brand/VL Design Logo.png'
  const businessName = (config.BusinessName as string) || 'CVL Designs'

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-x-hidden max-w-full">
      <StudioPublicHeader businessName={businessName} logoSrc={headerLogoSrc} />

      <StudioGalleryClient
        title={studio.title || DEFAULT_STUDIO_TITLE}
        tagline={studio.tagline}
        categories={categories}
        items={toPublicGalleryItems(items)}
      />

      <footer className="bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
          <p className="text-center text-gray-500 text-sm break-words">
            {config.Footer || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </footer>
    </main>
  )
}

export const revalidate = 60
