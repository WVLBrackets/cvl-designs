/**
 * Studio gallery admin — password gated. Not linked from the public studio page.
 */

import { cookies } from 'next/headers'
import { fetchConfiguration } from '@/lib/googleSheets'
import { fetchGalleryCategories, fetchGalleryItems } from '@/lib/gallery'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import StudioAdminClient, { StudioAdminLogin } from '@/components/studio/StudioAdminClient'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { SiteConfiguration } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Studio Admin | CVL Designs',
  robots: { index: false, follow: false },
}

export default async function StudioAdminPage() {
  const cookieStore = cookies()
  const authed = isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)
  const config: SiteConfiguration = await fetchConfiguration().catch(() => ({}))
  const businessName = (config.BusinessName as string) || 'CVL Designs'

  let dashboard = null
  if (authed) {
    const [categories, items] = await Promise.all([
      fetchGalleryCategories(),
      fetchGalleryItems(true),
    ])
    dashboard = <StudioAdminClient categories={categories} items={items} />
  }

  return (
    <main className="min-h-screen w-full max-w-full bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-3 overflow-x-clip">
      <div className="max-w-4xl mx-auto mb-4 min-w-0">
        <Link href="/studio" className="text-sm text-blue-600 underline">
          ← Public studio
        </Link>
      </div>
      {authed ? dashboard : <StudioAdminLogin />}
      <p className="text-center text-xs text-gray-400 mt-10">
        {`© ${new Date().getFullYear()} ${businessName}`}
      </p>
    </main>
  )
}

export const dynamic = 'force-dynamic'
