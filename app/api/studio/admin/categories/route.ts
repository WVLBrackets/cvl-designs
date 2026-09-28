/**
 * Rename studio gallery category labels.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import { updateGalleryCategoryName } from '@/lib/gallery'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function PATCH(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const body = await request.json()
    const slug = String(body.slug || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    if (!slug || !name) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 })
    }
    const category = await updateGalleryCategoryName(slug, name)
    if (!category) {
      return NextResponse.json({ success: false, error: 'That category was not found' }, { status: 404 })
    }
    revalidatePath('/studio')
    revalidatePath('/studio/admin')
    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('[api/studio/admin/categories]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rename category',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
