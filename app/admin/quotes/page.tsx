/**
 * Admin list of studio quote requests.
 */

import { redirect } from 'next/navigation'
import { fetchConfiguration } from '@/lib/googleSheets'
import { hasAdminSession } from '@/lib/adminSession'
import { mergeHomeContent } from '@/lib/homeContent'
import { listStudioQuotes } from '@/lib/studioQuote'
import AdminEditorShell from '@/components/home/AdminEditorShell'
import QuotesAdminClient from '@/components/studio/QuotesAdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quotes Admin | CVL Designs',
  robots: { index: false, follow: false },
}

export default async function AdminQuotesPage() {
  if (!hasAdminSession()) {
    redirect('/admin')
  }

  const config = await fetchConfiguration().catch(() => ({}))
  const content = mergeHomeContent(config)
  let items = [] as Awaited<ReturnType<typeof listStudioQuotes>>
  let loadError = ''
  try {
    items = await listStudioQuotes()
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load quotes'
  }

  return (
    <AdminEditorShell
      initialContent={content}
      showHomeSave={false}
      notice="Quote requests from the studio form."
    >
      <main id="main-content">
        {loadError ? (
          <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-red-600 sm:px-6" role="alert">
            {loadError}
          </p>
        ) : (
          <QuotesAdminClient initialItems={items} />
        )}
      </main>
    </AdminEditorShell>
  )
}

export const dynamic = 'force-dynamic'
