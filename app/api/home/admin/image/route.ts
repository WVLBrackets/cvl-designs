/**
 * Upload a homepage image for the in-place admin editor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { storeHomeImage } from '@/lib/homeImage'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  const ip = getClientIP(request)
  const rate = checkRateLimit(`home-admin-image:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 })
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many uploads. Try again shortly.' }, { status: 429 })
  }

  try {
    const form = await request.formData()
    const file = form.get('image')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Please choose an image' }, { status: 400 })
    }
    const url = await storeHomeImage(file)
    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('[api/home/admin/image]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    )
  }
}
