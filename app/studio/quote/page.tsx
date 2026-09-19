/**
 * Studio quote request form
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import { STUDIO_ROUTE, getStudioHomeContent } from '@/lib/studio'
import StudioPublicHeader from '@/components/studio/StudioPublicHeader'
import StudioQuoteForm from '@/components/studio/StudioQuoteForm'
import type { Metadata } from 'next'
import type { SiteConfiguration } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Request a Quote | CVL Designs',
  description: 'Request a quote for custom balloon arches, banners, and event decor.',
}

export default async function StudioQuotePage() {
  let config: SiteConfiguration = {}
  try {
    config = await fetchConfiguration()
  } catch (error) {
    console.error('Error fetching studio quote configuration:', error)
  }

  const getCfgStr = (key: string) =>
    typeof config[key] === 'string' ? (config[key] as string).trim() : ''

  const studio = getStudioHomeContent(config)
  const headerLogo = getCfgStr('Header_Logo')
  const headerLogoSrc = headerLogo
    ? headerLogo.startsWith('/') || headerLogo.startsWith('http')
      ? headerLogo
      : `/images/brand/${headerLogo}`
    : '/images/brand/VL Design Logo.png'
  const businessName = studio.headerText
  const formTitle = getCfgStr('Design_Studio_Quote_Title') || 'Request a Quote'

  return (
    <main className="min-h-screen w-full max-w-full bg-gradient-to-b from-gray-50 to-gray-100 overflow-x-clip">
      <StudioPublicHeader
        businessName={businessName}
        logoSrc={headerLogoSrc}
        secondaryHref={STUDIO_ROUTE}
        secondaryLabel="Gallery"
      />

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-8">
        <StudioQuoteForm title={formTitle} />
      </div>

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
