/**
 * Shared admin entry: password, then gallery vs homepage.
 */

import { fetchConfiguration } from '@/lib/googleSheets'
import { hasAdminSession } from '@/lib/adminSession'
import { mergeHomeContent } from '@/lib/homeContent'
import { StudioAdminLogin } from '@/components/studio/StudioAdminClient'
import AdminHub from '@/components/admin/AdminHub'
import AdminEditorShell from '@/components/home/AdminEditorShell'
import MarketingChrome from '@/components/home/MarketingChrome'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | CVL Designs',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const authed = hasAdminSession()
  const config = await fetchConfiguration().catch(() => ({}))
  const content = mergeHomeContent(config)

  if (!authed) {
    return (
      <MarketingChrome content={content} showAdminLink={false}>
        <main id="main-content" className="px-4 py-16">
          <StudioAdminLogin
            title="Admin"
            description="Sign in with the gallery admin password to edit the homepage or gallery, or review quotes."
          />
        </main>
      </MarketingChrome>
    )
  }

  return (
    <AdminEditorShell
      initialContent={content}
      notice="Choose a page to edit. Header, Footer and colors are on Home Admin."
    >
      <main id="main-content">
        <AdminHub />
      </main>
    </AdminEditorShell>
  )
}

export const dynamic = 'force-dynamic'
