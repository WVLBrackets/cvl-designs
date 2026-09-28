/**
 * Authenticated studio gallery admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import {
  createGalleryItem,
  deleteGalleryItem,
  fetchGalleryCategories,
  fetchGalleryItems,
  restoreGalleryItem,
  updateGalleryItem,
} from '@/lib/gallery'
import { storeGalleryImage } from '@/lib/galleryImage'
import { isAllowedStoredGalleryUrl, parseHeroVideoPlay } from '@/lib/galleryMedia'

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
    const contentType = request.headers.get('content-type') || ''
    let caption = ''
    let categorySlug = ''
    let featured = false
    let homeHero = false
    let status: 'Public' | 'Draft' = 'Public'
    let price = 0
    let heroVideoPlay: 'delay' | 'full' = 'delay'
    let imageUrl = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      caption = String(body.caption || '').trim()
      categorySlug = String(body.categorySlug || '').trim().toLowerCase()
      featured = Boolean(body.studioHero || body.featured)
      homeHero = Boolean(body.homeHero)
      status = String(body.status || 'Public') === 'Draft' ? 'Draft' : 'Public'
      price = Number(body.price || 0) || 0
      heroVideoPlay = parseHeroVideoPlay(body.heroVideoPlay)
      imageUrl = String(body.imageUrl || '').trim()
      if (!isAllowedStoredGalleryUrl(imageUrl)) {
        return NextResponse.json({ success: false, error: 'Invalid media URL' }, { status: 400 })
      }
    } else {
      const form = await request.formData()
      caption = String(form.get('caption') || '').trim()
      categorySlug = String(form.get('categorySlug') || '').trim().toLowerCase()
      featured = String(form.get('studioHero') || form.get('featured') || '') === 'true'
      homeHero = String(form.get('homeHero') || '') === 'true'
      status = String(form.get('status') || 'Public') === 'Draft' ? 'Draft' : 'Public'
      price = Number(form.get('price') || 0) || 0
      heroVideoPlay = parseHeroVideoPlay(form.get('heroVideoPlay'))
      const file = form.get('image')
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { success: false, error: 'Please choose a photo or video' },
          { status: 400 }
        )
      }
      imageUrl = await storeGalleryImage(file)
    }

    if (!caption) {
      return NextResponse.json({ success: false, error: 'Caption is required' }, { status: 400 })
    }
    if (!categorySlug) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 })
    }
    const item = await createGalleryItem({
      categorySlug,
      imageUrl,
      caption,
      featured,
      homeHero,
      heroVideoPlay,
      status,
      price,
    })
    revalidatePath('/home')
    revalidatePath('/studio')
    revalidatePath('/admin/home')
    revalidatePath('/studio/admin')

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

export async function PATCH(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const body = await request.json()
    const id = String(body.id || '').trim()
    const caption = String(body.caption || '').trim()
    const categorySlug = String(body.categorySlug || '').trim().toLowerCase()
    const featured = body.studioHero !== undefined ? Boolean(body.studioHero) : Boolean(body.featured)
    const homeHero = Boolean(body.homeHero)
    const heroVideoPlay = parseHeroVideoPlay(body.heroVideoPlay)
    const status = String(body.status || 'Public') === 'Draft' ? 'Draft' : 'Public'
    const price = Number(body.price || 0) || 0

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing gallery item' }, { status: 400 })
    }
    if (!caption) {
      return NextResponse.json({ success: false, error: 'Caption is required' }, { status: 400 })
    }
    if (!categorySlug) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 })
    }

    const item = await updateGalleryItem({
      id,
      categorySlug,
      caption,
      featured,
      homeHero,
      heroVideoPlay,
      status,
      price,
    })
    if (!item) {
      return NextResponse.json({ success: false, error: 'That photo was not found' }, { status: 404 })
    }
    revalidatePath('/home')
    revalidatePath('/studio')
    revalidatePath('/admin/home')
    revalidatePath('/studio/admin')

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('[api/studio/admin/gallery]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update gallery item',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const id = String(request.nextUrl.searchParams.get('id') || '').trim()
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing gallery item' }, { status: 400 })
    }

    const item = await deleteGalleryItem(id)
    if (!item) {
      return NextResponse.json({ success: false, error: 'That photo was not found' }, { status: 404 })
    }

    revalidatePath('/home')
    revalidatePath('/studio')
    revalidatePath('/admin/home')
    revalidatePath('/studio/admin')

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('[api/studio/admin/gallery]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete gallery item',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  try {
    const body = await request.json()
    const id = String(body.id || '').trim()
    const imageUrl = String(body.imageUrl || '').trim()
    const caption = String(body.caption || '').trim()
    const categorySlug = String(body.categorySlug || '').trim().toLowerCase()
    if (!id || !imageUrl || !caption || !categorySlug) {
      return NextResponse.json({ success: false, error: 'That photo cannot be restored' }, { status: 400 })
    }

    const item = await restoreGalleryItem({
      id,
      imageUrl,
      caption,
      categorySlug,
      featured: body.studioHero !== undefined ? Boolean(body.studioHero) : Boolean(body.featured),
      homeHero: Boolean(body.homeHero),
      heroVideoPlay: parseHeroVideoPlay(body.heroVideoPlay),
      status: String(body.status || 'Public') === 'Draft' ? 'Draft' : 'Public',
      price: Number(body.price || 0) || 0,
      createdAt: String(body.createdAt || ''),
    })
    revalidatePath('/home')
    revalidatePath('/studio')
    revalidatePath('/admin/home')
    revalidatePath('/studio/admin')

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('[api/studio/admin/gallery]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore gallery item',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30
