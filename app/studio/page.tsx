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
import Image from 'next/image'
import Link from 'next/link'
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
  const headerTitle = getCfgStr('Header_Title')
  const headerSubtitle = getCfgStr('Header_Subtitle')
  const headerLogo = getCfgStr('Header_Logo')
  const headerLogoSrc = headerLogo
    ? headerLogo.startsWith('/') || headerLogo.startsWith('http')
      ? headerLogo
      : `/images/brand/${headerLogo}`
    : '/images/brand/VL Design Logo.png'
  const logoSizePx = Number(config.Logo_Size || 80)
  const businessName = (config.BusinessName as string) || 'CVL Designs'

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="sm:hidden flex flex-col items-center gap-3 text-center">
            {headerTitle ? <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1> : null}
            <div className="relative flex-shrink-0" style={{ width: '80px', height: '80px' }}>
              <Image src={headerLogoSrc} alt={`${businessName} Logo`} fill className="object-contain" />
            </div>
            {headerSubtitle ? <p className="text-sm text-gray-600 italic">{headerSubtitle}</p> : null}
            <Link href="/home" className="text-sm text-blue-600 underline">
              Team stores
            </Link>
          </div>
          <div className="hidden sm:flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0" style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}>
                <Image src={headerLogoSrc} alt={`${businessName} Logo`} fill className="object-contain" />
              </div>
              <div>
                {headerTitle ? <h1 className="text-3xl font-bold text-gray-900">{headerTitle}</h1> : null}
                {headerSubtitle ? <p className="text-gray-600">{headerSubtitle}</p> : null}
              </div>
            </div>
            <Link href="/home" className="text-sm text-blue-600 hover:text-blue-800 underline">
              Team stores
            </Link>
          </div>
        </div>
      </header>

      <StudioGalleryClient
        title={studio.title || DEFAULT_STUDIO_TITLE}
        tagline={studio.tagline}
        categories={categories}
        items={toPublicGalleryItems(items)}
      />

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            {config.Footer || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </footer>
    </main>
  )
}

export const revalidate = 60
