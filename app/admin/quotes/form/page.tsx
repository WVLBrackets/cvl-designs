/**
 * Admin: show/hide/require quote form questions.
 */

import { redirect } from 'next/navigation'
import { fetchConfiguration } from '@/lib/googleSheets'
import { hasAdminSession } from '@/lib/adminSession'
import { mergeHomeContent } from '@/lib/homeContent'
import { mergeQuoteFormSettings } from '@/lib/quoteForm'
import AdminEditorShell from '@/components/home/AdminEditorShell'
import QuoteFormAdminClient from '@/components/studio/QuoteFormAdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quote Form Admin | CVL Designs',
  robots: { index: false, follow: false },
}

export default async function AdminQuoteFormPage() {
  if (!hasAdminSession()) {
    redirect('/admin')
  }

  const config = await fetchConfiguration().catch(() => ({}))
  const content = mergeHomeContent(config)
  const settings = mergeQuoteFormSettings(config)

  return (
    <AdminEditorShell
      initialContent={content}
      showHomeSave={false}
      notice="Edit the public quote questions. Save with the button at the bottom."
    >
      <main id="main-content">
        <QuoteFormAdminClient initialSettings={settings} />
      </main>
    </AdminEditorShell>
  )
}

export const dynamic = 'force-dynamic'
