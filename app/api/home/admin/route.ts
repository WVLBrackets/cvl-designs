/**
 * Save homepage content JSON for the current Preview/Production surface.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { upsertConfigValue } from '@/lib/googleSheets'
import {
  HOME_CONTENT_CONFIG_KEY,
  parseHomeContentPayload,
} from '@/lib/homeContent'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  const ip = getClientIP(request)
  const rate = checkRateLimit(`home-admin-save:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 })
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many saves. Try again shortly.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const content = parseHomeContentPayload(body)
    await upsertConfigValue(HOME_CONTENT_CONFIG_KEY, JSON.stringify(content))
    revalidatePath('/home')
    revalidatePath('/team-stores')
    revalidatePath('/studio')
    revalidatePath('/studio/quote')
    revalidatePath('/admin')
    revalidatePath('/admin/home')
    revalidatePath('/studio/admin')
    return NextResponse.json({ success: true, content })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Some homepage fields are too long or invalid.' },
        { status: 400 }
      )
    }
    console.error('[api/home/admin]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save' },
      { status: 500 }
    )
  }
}
