/**
 * Team store picker — apparel storefront entry.
 */

import { fetchStores, fetchConfiguration } from '@/lib/googleSheets'
import SiteFooter from '@/components/home/SiteFooter'
import SiteHeader from '@/components/home/SiteHeader'
import TeamStoreGrid, { type TeamStoreCard } from '@/components/home/TeamStoreGrid'
import { mergeHomeContent } from '@/lib/homeContent'
import HomeBrandShell from '@/components/home/HomeBrandShell'
import { hasAdminSession } from '@/lib/adminSession'
import { resolveBrandImageSrc } from '@/lib/studio'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team Stores | CVL Designs',
  description: 'Choose your team store to view custom apparel and place orders.',
}

export default async function TeamStoresPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  let stores: Array<Record<string, string>> = []
  let config: Record<string, string | number | boolean> = {}
  let loadError: string | null = null

  try {
    const [fetchedStores, fetchedConfig] = await Promise.all([
      fetchStores(),
      fetchConfiguration(),
    ])
    stores = fetchedStores as Array<Record<string, string>>
    config = fetchedConfig
  } catch (error) {
    console.error('Error fetching team stores:', error)
    loadError = error instanceof Error ? error.message : 'Unknown error'
  }

  const content = mergeHomeContent(config)
  const getCfgStr = (key: string) =>
    typeof config[key] === 'string' ? (config[key] as string).trim() : ''

  const homePageTitle = getCfgStr('Home_Page_Title') || 'Select Your Team Store'
  const homePageInstruction =
    getCfgStr('Home_Page_Instruction') ||
    'Choose your team to view custom apparel and place orders'

  const cards: TeamStoreCard[] = stores.map((store) => {
    const slug = store.slug || ''
    const displayName = store['Display Name'] || store.DisplayName || slug
    const headerLogo = store['Header Logo'] || ''
    return {
      slug,
      displayName,
      logoSrc: resolveBrandImageSrc(headerLogo, '/images/brand/VL Design Logo.png'),
      primaryColor: store['Primary Color'] || '#3b82f6',
      accentColor: store['Accent Color'] || '#1e40af',
    }
  })

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Configuration Error</h1>
          <p className="mb-4 text-gray-700">Unable to load store configuration. Please check:</p>
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
            <li>Google Sheets environment variables are set</li>
            <li>Service account has access to sheets</li>
            <li>Sheet IDs are correct</li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">Error: {loadError}</p>
        </div>
      </main>
    )
  }

  return (
    <HomeBrandShell content={content}>
      <SiteHeader content={content} showAdminLink={hasAdminSession()} />
      <main>
        <TeamStoreGrid
          stores={cards}
          errorMessage={searchParams.error}
          title={homePageTitle}
          instruction={homePageInstruction}
        />
      </main>
      <SiteFooter content={content} />
    </HomeBrandShell>
  )
}

export const revalidate = 300
