/**
 * Public studio quote request API
 */

import { NextRequest, NextResponse } from 'next/server'
import { studioQuoteSchema, saveStudioQuote } from '@/lib/studioQuote'
import { fetchConfiguration } from '@/lib/googleSheets'
import { sendEmail } from '@/lib/email'
import { getSheetEnvironmentLabel } from '@/lib/config'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build a simple HTML summary of a quote for Gmail.
 *
 * @param record - Saved quote
 */
function quoteEmailHtml(record: Awaited<ReturnType<typeof saveStudioQuote>>): string {
  const env = record.environment
  const banner =
    env === 'Production'
      ? ''
      : `<div style="background:#ea580c;color:white;padding:10px;text-align:center;font-weight:bold;">${escapeHtml(env)} — TEST QUOTE</div>`

  const row = (label: string, value: string) =>
    `<p style="margin:6px 0;"><strong>${label}:</strong> ${escapeHtml(value || '—')}</p>`

  return `
    ${banner}
    <div style="font-family:Arial,sans-serif;padding:16px;color:#111">
      <h2 style="margin-top:0;">Studio quote request</h2>
      ${row('Name', `${record.firstName} ${record.lastName}`)}
      ${row('Email', record.email)}
      ${row('Phone', record.phone)}
      ${row('Event date', record.eventDate)}
      ${row('Occasion', record.occasion)}
      ${row('Location', record.location)}
      ${row('Interested in', record.interests.join(', ') || '—')}
      ${row('Details', record.details)}
      ${row('Quote ID', record.id)}
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = studioQuoteSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid quote request'
      return NextResponse.json({ success: false, error: message }, { status: 400 })
    }

    const record = await saveStudioQuote(parsed.data)
    const config = await fetchConfiguration().catch(() => ({} as Record<string, string>))
    const ownerEmail =
      (typeof config.ContactMeEmail === 'string' && config.ContactMeEmail.trim()) ||
      process.env.GMAIL_USER ||
      ''

    const subject = `[${getSheetEnvironmentLabel()}] Studio quote from ${record.firstName} ${record.lastName}`
    const html = quoteEmailHtml(record)

    try {
      if (ownerEmail) {
        await sendEmail({ to: ownerEmail, subject, html })
      }
      await sendEmail({
        to: record.email,
        subject: 'We received your quote request',
        html: `
          <div style="font-family:Arial,sans-serif;padding:16px;color:#111">
            <p>Hi ${record.firstName},</p>
            <p>Thanks for requesting a quote. Caryn will review the details and get back to you.</p>
            ${quoteEmailHtml(record)}
          </div>
        `,
      })
    } catch (emailError) {
      console.error('[api/studio/quote] Email failed (quote was saved):', emailError)
    }

    return NextResponse.json({ success: true, id: record.id })
  } catch (error) {
    console.error('[api/studio/quote]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit quote request',
      },
      { status: 500 }
    )
  }
}
