/**
 * Studio quote requests — validation and Config spreadsheet persistence.
 */

import { z } from 'zod'
import { getSheetsClient } from './googleSheets'
import { getSheetId, getSheetEnvironmentLabel } from './config'
import { sanitizeString } from './validation'

const QUOTES_TAB = 'Studio Quotes'

const phoneRegex = /^[\d\s()+-]{10,20}$/

export const studioQuoteSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).transform(sanitizeString),
  lastName: z.string().min(1, 'Last name is required').max(50).transform(sanitizeString),
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254)
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
  phone: z
    .string()
    .min(10, 'Phone number is too short')
    .max(20)
    .regex(phoneRegex, 'Invalid phone number format')
    .transform((val) => val.trim()),
  eventDate: z.string().max(40).transform(sanitizeString).optional().default(''),
  occasion: z.string().max(80).transform(sanitizeString).optional().default(''),
  location: z.string().max(120).transform(sanitizeString).optional().default(''),
  interests: z.array(z.enum(['balloons', 'banners'])).optional().default([]),
  details: z
    .string()
    .min(1, 'Please describe what you would like')
    .max(2000)
    .transform(sanitizeString),
})

export type StudioQuoteInput = z.infer<typeof studioQuoteSchema>

export interface StudioQuoteRecord extends StudioQuoteInput {
  id: string
  submittedAt: string
  environment: string
}

/**
 * Build a quoted A1 range so tab names with spaces work in the Sheets API.
 *
 * @param title - Tab name
 * @param a1 - Cell or range inside the tab
 */
function sheetRange(title: string, a1: string): string {
  const escaped = title.replace(/'/g, "''")
  return `'${escaped}'!${a1}`
}

/**
 * Create the Studio Quotes tab with headers when it does not exist yet.
 */
async function ensureQuotesTab(): Promise<void> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const headers = [
    'id',
    'submittedAt',
    'environment',
    'firstName',
    'lastName',
    'email',
    'phone',
    'eventDate',
    'occasion',
    'location',
    'interests',
    'details',
    'status',
  ]

  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange(QUOTES_TAB, 'A1:A1'),
    })
  } catch {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: QUOTES_TAB } } }],
      },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRange(QUOTES_TAB, 'A1'),
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    })
  }
}

/**
 * Append a quote request to the Config spreadsheet Studio Quotes tab.
 *
 * @param input - Validated quote fields
 */
export async function saveStudioQuote(input: StudioQuoteInput): Promise<StudioQuoteRecord> {
  await ensureQuotesTab()
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const record: StudioQuoteRecord = {
    ...input,
    id: `q-${Date.now().toString(36)}`,
    submittedAt: new Date().toISOString(),
    environment: getSheetEnvironmentLabel(),
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetRange(QUOTES_TAB, 'A2'),
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        record.id,
        record.submittedAt,
        record.environment,
        record.firstName,
        record.lastName,
        record.email,
        record.phone,
        record.eventDate,
        record.occasion,
        record.location,
        record.interests.join(', '),
        record.details,
        'New',
      ]],
    },
  })

  return record
}
