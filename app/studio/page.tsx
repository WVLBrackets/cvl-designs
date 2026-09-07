/**
 * CVL Balloons and Banners Design Studio
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import {
  DEFAULT_STUDIO_TITLE,
  getStudioHomeContent,
} from '@/lib/studio'
import FallbackImage from '@/components/FallbackImage'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { SiteConfiguration } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Balloons and Banners | CVL Designs',
  description: 'Design custom balloon arches, banners, and more with CVL Designs.',
}

export default async function StudioPage() {
  let config: SiteConfiguration = {}

  try {
    config = await fetchConfiguration()
  } catch (error) {
    console.error('Error fetching studio configuration:', error)
  }

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
            {headerTitle ? (
              <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
            ) : null}
            <div className="relative flex-shrink-0" style={{ width: '80px', height: '80px' }}>
              <Image
                src={headerLogoSrc}
                alt={`${businessName} Logo`}
                fill
                className="object-contain"
              />
            </div>
            {headerSubtitle ? (
              <p className="text-sm text-gray-600 italic">{headerSubtitle}</p>
            ) : null}
          </div>

          <div className="hidden sm:flex flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-4">
              <div
                className="relative flex-shrink-0"
                style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
              >
                <Image
                  src={headerLogoSrc}
                  alt={`${businessName} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center sm:text-left">
                {headerTitle ? (
                  <h1 className="text-3xl font-bold text-gray-900">{headerTitle}</h1>
                ) : null}
                {headerSubtitle ? <p className="text-gray-600">{headerSubtitle}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Link
            href="/home"
            className="inline-block text-sm text-blue-600 hover:text-blue-800 underline mb-6"
          >
            ← Back to storefronts
          </Link>

          <div className="relative w-40 h-40 mx-auto mb-6">
            <FallbackImage
              src={studio.imageSrc}
              fallbackSrc={studio.fallbackImageSrc}
              alt={studio.title}
            />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {studio.title || DEFAULT_STUDIO_TITLE}
          </h2>
          <p className="text-gray-600">
            Welcome to the CVL Balloons and Banners Design Studio.
          </p>
        </div>
      </div>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            {config.Footer || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </footer>
    </main>
  )
}

export const revalidate = 300
