/**
 * Authenticated studio quotes admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import { listStudioQuotes, quoteAdminPatchSchema, updateStudioQuote } from '@/lib/studioQuote'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function GET() {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const items = await listStudioQuotes()
    return NextResponse.json({ success: true, items })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load quotes',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const body = await request.json()
    const parsed = quoteAdminPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid update' },
        { status: 400 }
      )
    }
    if (!parsed.data.status && parsed.data.adminNotes === undefined) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 })
    }

    const item = await updateStudioQuote(parsed.data.id, {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
    })
    if (!item) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, item })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update quote',
      },
      { status: 500 }
    )
  }
}
