/**
 * In-place homepage editor. Requires the shared admin cookie from /admin.
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchConfiguration } from '@/lib/googleSheets'
import { fetchGalleryItems, toPublicGalleryItems } from '@/lib/gallery'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import { mergeHomeContent } from '@/lib/homeContent'
import HomeAdminClient from '@/components/home/HomeAdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home Admin | CVL Designs',
  robots: { index: false, follow: false },
}

export default async function AdminHomePage() {
  const cookieStore = cookies()
  const authed = isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)
  if (!authed) {
    redirect('/admin')
  }

  const config = await fetchConfiguration().catch(() => ({}))
  const content = mergeHomeContent(config)
  const galleryItems = toPublicGalleryItems(await fetchGalleryItems(false).catch(() => []))

  return <HomeAdminClient initialContent={content} galleryItems={galleryItems} />
}

export const dynamic = 'force-dynamic'
