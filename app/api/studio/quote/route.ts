/**
 * Public studio quote request API
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveStudioQuote } from '@/lib/studioQuote'
import { fetchConfiguration } from '@/lib/googleSheets'
import { sendEmail } from '@/lib/email'
import { getRuntimeSurface } from '@/lib/config'
import { logEmailError, logError } from '@/lib/errorLogger'
import { checkRateLimit, getClientIP, QUOTE_RATE_LIMIT, getRateLimitHeaders } from '@/lib/rateLimit'
import {
  fieldKind,
  fieldOptions,
  mergeQuoteFormSettings,
  orderedQuoteDefs,
  parseChoiceList,
  parsePhotoList,
  validateQuoteSubmission,
} from '@/lib/quoteForm'
import type { QuoteFormSettings } from '@/lib/quoteForm'
import type { StudioQuoteRecord } from '@/lib/quoteTypes'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Human-readable value for email and admin.
 *
 * @param record - Saved quote
 * @param key - Field key
 */
function displayValue(record: StudioQuoteRecord, key: string, formLabel?: { kind: string; options?: { value: string; label: string }[] }): string {
  if (key === 'interests') {
    return (record.interests || []).join(', ')
  }
  if (key === 'venuePhotos' || key === 'inspirationPhotos' || formLabel?.kind === 'photos') {
    const list =
      key === 'venuePhotos'
        ? record.venuePhotos
        : key === 'inspirationPhotos'
          ? record.inspirationPhotos
          : parsePhotoList(record[key])
    return (list || []).join('\n')
  }
  if (formLabel?.kind === 'checkbox') {
    return parseChoiceList(record[key]).join(', ')
  }
  const raw = Array.isArray(record[key]) ? (record[key] as string[]).join(', ') : String(record[key] || '')
  if (!raw) return ''
  const option = formLabel?.options?.find((item) => item.value === raw)
  return option?.label || raw
}

/**
 * Build a simple HTML summary of a quote for Gmail.
 *
 * @param record - Saved quote
 * @param form - Live form settings
 */
function quoteEmailHtml(record: StudioQuoteRecord, form: QuoteFormSettings): string {
  const surface = record.surface
  const banner =
    surface === 'production'
      ? ''
      : `<div style="background:${surface === 'local' ? '#ea580c' : '#dc2626'};color:white;padding:10px;text-align:center;font-weight:bold;">${escapeHtml(surface.toUpperCase())} — TEST QUOTE</div>`

  const row = (label: string, value: string) =>
    value
      ? `<p style="margin:6px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\n/g, '<br/>')}</p>`
      : ''

  const body = orderedQuoteDefs(form)
    .map((def) => {
      if (def.key === 'firstName' || def.key === 'lastName') return ''
      const settings = form.fields[def.key]
      const kind = settings ? fieldKind(def, settings) : def.kind
      const options = settings ? fieldOptions(def, settings) : def.options
      return row(settings?.label || def.defaultLabel, displayValue(record, def.key, { kind, options }))
    })
    .join('')

  return `
    ${banner}
    <div style="font-family:Arial,sans-serif;padding:16px;color:#111">
      <h2 style="margin-top:0;">Studio quote request</h2>
      ${row('Quote ID', record.id)}
      ${row('Name', `${record.firstName} ${record.lastName}`)}
      ${body}
    </div>
  `
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(clientIP, QUOTE_RATE_LIMIT)
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, QUOTE_RATE_LIMIT)

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many quote requests. Please wait a minute before trying again.',
        retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
        },
      }
    )
  }

  try {
    const body = await request.json()
    const config = await fetchConfiguration().catch(() => ({} as Record<string, string>))
    const form = mergeQuoteFormSettings(config)
    const parsed = validateQuoteSubmission(body, form)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400, headers: rateLimitHeaders })
    }

    const record = await saveStudioQuote(parsed.data)
    const ownerEmail =
      (typeof config.ContactMeEmail === 'string' && config.ContactMeEmail.trim()) ||
      process.env.GMAIL_USER ||
      ''

    const subject = `[${getRuntimeSurface().toUpperCase()}] Studio quote ${record.id} from ${record.firstName} ${record.lastName}`
    const html = quoteEmailHtml(record, form)

    try {
      if (ownerEmail) {
        await sendEmail({ to: ownerEmail, subject, html })
      }
      if (record.email) {
        await sendEmail({
          to: record.email,
          subject: 'We received your quote request',
          html: `
          <div style="font-family:Arial,sans-serif;padding:16px;color:#111">
            <p>Hi ${escapeHtml(record.firstName || 'there')},</p>
            <p>Thanks for requesting a quote. Caryn will review the details and get back to you.</p>
            ${quoteEmailHtml(record, form)}
          </div>
        `,
        })
      }
    } catch (emailError) {
      console.error('[api/studio/quote] Email failed (quote was saved):', emailError)
      await logEmailError(ownerEmail || record.email, subject, emailError)
    }

    return NextResponse.json({ success: true, id: record.id }, { headers: rateLimitHeaders })
  } catch (error) {
    console.error('[api/studio/quote]', error)
    await logError('Studio quote submit', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit quote request',
      },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}
