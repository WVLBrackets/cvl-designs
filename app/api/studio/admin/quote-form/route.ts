/**
 * Save quote form field settings (show/hide, required, balloons vs banners).
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { upsertConfigValue } from '@/lib/googleSheets'
import { parseQuoteFormPayload, QUOTE_FORM_CONFIG_KEY } from '@/lib/quoteForm'

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies()
  if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
    return unauthorized()
  }

  const ip = getClientIP(request)
  const rate = checkRateLimit(`quote-form-save:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 })
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many saves. Try again shortly.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const settings = parseQuoteFormPayload(body)
    await upsertConfigValue(QUOTE_FORM_CONFIG_KEY, JSON.stringify(settings))
    revalidatePath('/studio/quote')
    revalidatePath('/admin/quotes/form')
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: 'Some quote form fields are invalid.' }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save' },
      { status: 500 }
    )
  }
}
