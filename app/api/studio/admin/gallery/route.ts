/**
 * Authenticated studio gallery admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import {
  createGalleryItem,
  fetchGalleryCategories,
  fetchGalleryItems,
} from '@/lib/gallery'
import { storeGalleryImage } from '@/lib/galleryImage'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function GET() {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  const [categories, items] = await Promise.all([
    fetchGalleryCategories(),
    fetchGalleryItems(true),
  ])
  return NextResponse.json({ success: true, categories, items })
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const form = await request.formData()
    const file = form.get('image')
    const caption = String(form.get('caption') || '').trim()
    const categorySlug = String(form.get('categorySlug') || '').trim().toLowerCase()
    const featured = String(form.get('featured') || '') === 'true'
    const status = String(form.get('status') || 'Public') === 'Draft' ? 'Draft' : 'Public'
    const price = Number(form.get('price') || 0) || 0

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Please choose an image' }, { status: 400 })
    }
    if (!caption) {
      return NextResponse.json({ success: false, error: 'Caption is required' }, { status: 400 })
    }
    if (!categorySlug) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 })
    }

    const imageUrl = await storeGalleryImage(file)
    const item = await createGalleryItem({
      categorySlug,
      imageUrl,
      caption,
      featured,
      status,
      price,
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('[api/studio/admin/gallery]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save gallery item',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30
