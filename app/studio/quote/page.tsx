/**
 * Studio quote request form
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import { mergeHomeContent } from '@/lib/homeContent'
import { hasAdminSession } from '@/lib/adminSession'
import { mergeQuoteFormSettings } from '@/lib/quoteForm'
import MarketingChrome from '@/components/home/MarketingChrome'
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

  const content = mergeHomeContent(config)
  const form = mergeQuoteFormSettings(config)

  return (
    <MarketingChrome content={content} showAdminLink={hasAdminSession()}>
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <StudioQuoteForm form={form} />
      </main>
    </MarketingChrome>
  )
}

export const revalidate = 60
