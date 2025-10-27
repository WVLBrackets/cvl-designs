/**
 * Home Page - Store Selector
 */

import { fetchStores, fetchConfiguration } from '@/lib/googleSheets'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const [stores, config] = await Promise.all([
    fetchStores(),
    fetchConfiguration(),
  ])

  const getCfgStr = (key: string) => (typeof config[key] === 'string' ? (config[key] as string).trim() : '')
  const headerTitle = getCfgStr('Header_Title')
  const headerSubtitle = getCfgStr('Header_Subtitle')
  const headerLogo = getCfgStr('Header_Logo')
  const homePageTitle = getCfgStr('Home_Page_Title') || 'Select Your Team Store'
  const homePageInstruction = getCfgStr('Home_Page_Instruction') || 'Choose your team to view custom apparel and place orders'
  const headerLogoSrc = headerLogo
    ? (headerLogo.startsWith('/') || headerLogo.startsWith('http')
        ? headerLogo
        : `/images/brand/${headerLogo}`)
    : '/images/brand/VL Design Logo.png'
  const logoSizePx = Number(config.Logo_Size || 80)
  const businessName = (config.BusinessName as string) || 'CVL Designs'

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0" style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}>
                <Image
                  src={headerLogoSrc}
                  alt={`${businessName} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center sm:text-left">
                {headerTitle ? (<h1 className="text-3xl font-bold text-gray-900">{headerTitle}</h1>) : null}
                {headerSubtitle ? (<p className="text-gray-600">{headerSubtitle}</p>) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Store Selector */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">{homePageTitle}</h2>
          <p className="text-gray-600 mb-8 text-center">{homePageInstruction}</p>
          
          <div className="space-y-3">
            {stores.map((store) => {
              const slug = store.slug || ''
              const displayName = store['Display Name'] || store.DisplayName || slug
              const primaryColor = store['Primary Color'] || '#3b82f6'
              const accentColor = store['Accent Color'] || '#ffffff'
              
              if (!slug || slug.toLowerCase() === 'all') return null
              
              return (
                <Link
                  key={slug}
                  href={`/?store=${slug}`}
                  className="block w-full px-6 py-4 border-2 rounded-lg transition-all text-center font-semibold hover:opacity-90"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: accentColor,
                    color: accentColor,
                  }}
                >
                  {displayName}
                </Link>
              )
            })}
          </div>

          {stores.length === 0 && (
            <p className="text-center text-gray-500 py-8">No stores available at this time.</p>
          )}
        </div>
      </div>

      {/* Footer */}
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

