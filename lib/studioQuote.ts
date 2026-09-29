/**
 * Studio quote requests — validation and Neon persistence.
 */

import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '@/db'
import { quotes, type QuoteRow, type QuoteStatus } from '@/db/schema'
import { ensureQuoteTables } from '@/db/ensure'
import { generateQuoteId } from '@/lib/quoteNumber'
import {
  assertHostedQuotesDatabase,
  listMemoryQuotes,
  saveMemoryQuote,
  shouldUseMemoryQuotes,
  updateMemoryQuote,
} from '@/lib/quoteMemory'
import {
  emptyQuoteAnswers,
  extraAnswersPayload,
  isCustomQuoteKey,
  parseChoiceList,
  parsePhotoList,
  type QuoteAnswers,
} from '@/lib/quoteForm'
import { normalizeQuoteRecord, type StudioQuoteRecord } from '@/lib/quoteTypes'
import { sanitizeString } from './validation'

export type { StudioQuoteRecord } from '@/lib/quoteTypes'
export { quoteStatuses, QUOTE_STATUS_LABELS } from '@/lib/quoteTypes'

export type StudioQuoteInput = QuoteAnswers

export const quoteStatusSchema = z.enum(['new', 'in_review', 'quoted', 'won', 'lost'])

export const quoteAdminPatchSchema = z.object({
  id: z.string().min(1).max(80),
  status: quoteStatusSchema.optional(),
  adminNotes: z.string().max(4000).transform(sanitizeString).optional(),
})

/**
 * Split stored interests back into the public form values.
 *
 * @param value - Comma-separated interests column
 */
function parseInterests(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part === 'balloons' || part === 'banners')
}

/**
 * String cell from a quote row.
 *
 * @param row - Database row
 * @param key - Drizzle field
 */
function cell(row: QuoteRow, key: keyof QuoteRow): string {
  const value = row[key]
  if (value instanceof Date) return value.toISOString()
  return String(value ?? '')
}

/**
 * Map a database row to the API record shape.
 *
 * @param row - Quotes table row
 */
export function toStudioQuoteRecord(row: QuoteRow): StudioQuoteRecord {
  const empty = emptyQuoteAnswers()
  return normalizeQuoteRecord({
    ...empty,
    id: row.id,
    surface: row.surface,
    firstName: cell(row, 'firstName'),
    lastName: cell(row, 'lastName'),
    email: cell(row, 'email'),
    phone: cell(row, 'phone'),
    eventDate: cell(row, 'eventDate'),
    occasion: cell(row, 'occasion'),
    location: cell(row, 'location'),
    interests: parseInterests(cell(row, 'interests')),
    details: cell(row, 'details'),
    needByDate: cell(row, 'needByDate'),
    occasionOther: cell(row, 'occasionOther'),
    venueType: cell(row, 'venueType'),
    guestCount: cell(row, 'guestCount'),
    budgetRange: cell(row, 'budgetRange'),
    theme: cell(row, 'theme'),
    colorScheme: cell(row, 'colorScheme'),
    wantDraft: cell(row, 'wantDraft'),
    balloonStyle: cell(row, 'balloonStyle'),
    balloonIndoorOutdoor: cell(row, 'balloonIndoorOutdoor'),
    balloonQuantity: cell(row, 'balloonQuantity'),
    balloonNotes: cell(row, 'balloonNotes'),
    bannerWording: cell(row, 'bannerWording'),
    bannerFontStyle: cell(row, 'bannerFontStyle'),
    bannerDesigns: cell(row, 'bannerDesigns'),
    bannerSize: cell(row, 'bannerSize'),
    bannerQuantity: cell(row, 'bannerQuantity'),
    bannerHangMethod: cell(row, 'bannerHangMethod'),
    venuePhotos: parsePhotoList(cell(row, 'venuePhotos')),
    inspirationPhotos: parsePhotoList(cell(row, 'inspirationPhotos')),
    socialPosting: cell(row, 'socialPosting'),
    howHeard: cell(row, 'howHeard'),
    status: row.status,
    adminNotes: cell(row, 'adminNotes'),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...parseStoredExtraAnswers(cell(row, 'extraAnswers')),
  })
}

/**
 * Parse extra_answers JSON from Postgres.
 *
 * @param raw - Column text
 */
function parseStoredExtraAnswers(raw: string): Record<string, string | string[]> {
  try {
    const parsed = JSON.parse(raw || '{}') as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const extra: Record<string, string | string[]> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!isCustomQuoteKey(key)) continue
      extra[key] = Array.isArray(value) ? parseChoiceList(value) : String(value || '')
    }
    return extra
  } catch {
    return {}
  }
}

/**
 * Build insert/update column values from validated answers.
 *
 * @param input - Quote answers
 */
export function quoteAnswerColumns(input: QuoteAnswers) {
  const str = (key: string) => {
    const value = input[key]
    if (Array.isArray(value)) return JSON.stringify(value)
    return String(value || '')
  }
  const photos = (key: string) => JSON.stringify(parsePhotoList(input[key]))
  const interests = Array.isArray(input.interests)
    ? input.interests.filter((item) => item === 'balloons' || item === 'banners')
    : []
  return {
    firstName: str('firstName'),
    lastName: str('lastName'),
    email: str('email'),
    phone: str('phone'),
    eventDate: str('eventDate'),
    occasion: str('occasion'),
    location: str('location'),
    interests: interests.join(', '),
    details: str('details'),
    needByDate: str('needByDate'),
    occasionOther: str('occasionOther'),
    venueType: str('venueType'),
    guestCount: str('guestCount'),
    budgetRange: str('budgetRange'),
    theme: str('theme'),
    colorScheme: str('colorScheme'),
    wantDraft: str('wantDraft'),
    balloonStyle: str('balloonStyle'),
    balloonIndoorOutdoor: str('balloonIndoorOutdoor'),
    balloonQuantity: str('balloonQuantity'),
    balloonNotes: str('balloonNotes'),
    bannerWording: str('bannerWording'),
    bannerFontStyle: str('bannerFontStyle'),
    bannerDesigns: str('bannerDesigns'),
    bannerSize: str('bannerSize'),
    bannerQuantity: str('bannerQuantity'),
    bannerHangMethod: str('bannerHangMethod'),
    venuePhotos: photos('venuePhotos'),
    inspirationPhotos: photos('inspirationPhotos'),
    socialPosting: str('socialPosting'),
    howHeard: str('howHeard'),
    extraAnswers: JSON.stringify(extraAnswersPayload(input)),
  }
}

/**
 * Insert a new quote request.
 *
 * @param input - Validated quote fields
 */
export async function saveStudioQuote(input: StudioQuoteInput): Promise<StudioQuoteRecord> {
  assertHostedQuotesDatabase()
  if (shouldUseMemoryQuotes()) {
    console.warn('[quotes] DATABASE_URL is not set; storing this quote in local .data/quotes.json')
    return saveMemoryQuote(input)
  }
  await ensureQuoteTables()
  const { id, surface } = await generateQuoteId()
  const db = getDb()
  const [row] = await db
    .insert(quotes)
    .values({
      id,
      surface,
      ...quoteAnswerColumns(input),
      status: 'new',
      adminNotes: '',
    })
    .returning()

  if (!row) {
    throw new Error('Quote was not saved')
  }
  return toStudioQuoteRecord(row)
}

/**
 * List quotes newest first for admin.
 */
export async function listStudioQuotes(): Promise<StudioQuoteRecord[]> {
  assertHostedQuotesDatabase()
  if (shouldUseMemoryQuotes()) {
    return listMemoryQuotes()
  }
  await ensureQuoteTables()
  const db = getDb()
  const rows = await db.select().from(quotes).orderBy(desc(quotes.createdAt))
  return rows.map(toStudioQuoteRecord)
}

/**
 * Update quote status and/or internal notes.
 *
 * @param id - Quote number
 * @param patch - Fields to change
 */
export async function updateStudioQuote(
  id: string,
  patch: { status?: QuoteStatus; adminNotes?: string }
): Promise<StudioQuoteRecord | null> {
  assertHostedQuotesDatabase()
  if (shouldUseMemoryQuotes()) {
    return updateMemoryQuote(id, patch)
  }
  await ensureQuoteTables()
  const db = getDb()
  const updates: Partial<typeof quotes.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (patch.status) updates.status = patch.status
  if (patch.adminNotes !== undefined) updates.adminNotes = patch.adminNotes

  const [row] = await db.update(quotes).set(updates).where(eq(quotes.id, id)).returning()
  return row ? toStudioQuoteRecord(row) : null
}
