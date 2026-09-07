/**
 * Public gallery JSON for the studio page.
 */

import { NextResponse } from 'next/server'
import { fetchGalleryCategories, fetchGalleryItems, toPublicGalleryItems } from '@/lib/gallery'

export async function GET() {
  try {
    const [categories, items] = await Promise.all([
      fetchGalleryCategories(),
      fetchGalleryItems(false),
    ])
    return NextResponse.json({
      success: true,
      categories,
      items: toPublicGalleryItems(items),
    })
  } catch (error) {
    console.error('[api/studio/gallery]', error)
    return NextResponse.json({ success: false, error: 'Failed to load gallery' }, { status: 500 })
  }
}

export const revalidate = 60
