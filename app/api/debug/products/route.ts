/**
 * Staging/preview-only diagnostic route for product catalog troubleshooting.
 * Blocked on Vercel production deployments.
 */

import { NextResponse } from 'next/server'
import { diagnoseProductCatalog } from '@/lib/googleSheets'

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available on production' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const storeSlug = searchParams.get('store') || undefined
  const draftOnly = searchParams.get('draft') === '1'

  try {
    const diagnostics = await diagnoseProductCatalog(storeSlug)

    const rows = draftOnly
      ? diagnostics.rows.filter(r => r.statusResolved === 'PREVIEW')
      : diagnostics.rows

    return NextResponse.json({
      ...diagnostics,
      rows,
      hint: diagnostics.orphanedProducts.length > 0
        ? 'Products in orphanedProducts are fetched but hidden in the UI because column F category does not exactly match Reference Data column M.'
        : undefined,
    })
  } catch (error) {
    console.error('[debug/products]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Diagnostics failed',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
