/**
 * Public upload for quote venue and inspiration photos.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { QUOTE_PHOTO_FOLDERS, storeQuoteImage, type QuotePhotoFolder } from '@/lib/quoteImage'

const QUOTE_PHOTO_RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 1000 }

/**
 * @param value - Form folder field
 */
function parseFolder(value: FormDataEntryValue | null): QuotePhotoFolder | null {
  const folder = String(value || '')
  return QUOTE_PHOTO_FOLDERS.includes(folder as QuotePhotoFolder)
    ? (folder as QuotePhotoFolder)
    : null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIP(request)
  const rate = checkRateLimit(`quote-blob:${ip}`, QUOTE_PHOTO_RATE_LIMIT)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 })
  }

  try {
    const form = await request.formData()
    const folder = parseFolder(form.get('folder'))
    if (!folder) {
      return NextResponse.json({ error: 'Invalid photo folder' }, { status: 400 })
    }
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Please choose a photo' }, { status: 400 })
    }
    const url = await storeQuoteImage(file, folder)
    return NextResponse.json({ success: true, url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not upload that photo.' },
      { status: 400 }
    )
  }
}
