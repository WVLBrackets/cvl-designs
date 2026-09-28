/**
 * Studio gallery admin — password gated. Not linked from the public studio page.
 */

import { redirect } from 'next/navigation'
import { fetchConfiguration } from '@/lib/googleSheets'
import { fetchGalleryCategories, fetchGalleryItems, toPublicGalleryItems } from '@/lib/gallery'
import { hasAdminSession } from '@/lib/adminSession'
import { mergeHomeContent } from '@/lib/homeContent'
import StudioSiteAdminClient from '@/components/studio/StudioSiteAdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Studio Admin | CVL Designs',
  robots: { index: false, follow: false },
}

export default async function StudioAdminPage() {
  if (!hasAdminSession()) {
    redirect('/admin')
  }

  const config = await fetchConfiguration().catch(() => ({}))
  const content = mergeHomeContent(config)
  const [categories, items] = await Promise.all([
    fetchGalleryCategories(),
    fetchGalleryItems(true),
  ])

  return (
    <StudioSiteAdminClient
      initialContent={content}
      categories={categories}
      publicItems={toPublicGalleryItems(items)}
      adminItems={items}
    />
  )
}

export const dynamic = 'force-dynamic'
