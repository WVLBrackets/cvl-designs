/**
 * File-backed quote store when DATABASE_URL is not set (local and Preview/QA).
 */

import fs from 'fs'
import path from 'path'
import { getRuntimeSurface } from '@/lib/config'
import { quoteSurfaceToken } from '@/lib/quoteNumber'
import { emptyQuoteAnswers, parsePhotoList, type QuoteAnswers } from '@/lib/quoteForm'
import { normalizeQuoteRecord, type QuoteStatus, type StudioQuoteRecord } from '@/lib/quoteTypes'

interface QuoteFile {
  counters: Record<string, number>
  quotes: StudioQuoteRecord[]
}

const dataFile = process.env.VERCEL
  ? path.join('/tmp', 'cvl-quotes.json')
  : path.join(process.cwd(), '.data', 'quotes.json')

/**
 * Whether this process should keep quotes in a JSON file instead of Neon.
 */
export function shouldUseMemoryQuotes(): boolean {
  return !process.env.DATABASE_URL
}

/**
 * Read the local quotes file, or an empty store.
 */
function readFile(): QuoteFile {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8')
    const parsed = JSON.parse(raw) as QuoteFile
    return {
      counters: parsed.counters || {},
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes.map((item) => normalizeQuoteRecord(item)) : [],
    }
  } catch {
    return { counters: {}, quotes: [] }
  }
}

/**
 * Write the local quotes file.
 *
 * @param data - Counters and quote rows
 */
function writeFile(data: QuoteFile): void {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true })
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8')
}

/**
 * Insert a quote into the local file store.
 *
 * @param input - Validated form fields
 */
export function saveMemoryQuote(input: QuoteAnswers): StudioQuoteRecord {
  const data = readFile()
  const surface = getRuntimeSurface()
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const key = `${surface}:${day}`
  const last = (data.counters[key] || 0) + 1
  data.counters[key] = last
  const now = new Date().toISOString()
  const empty = emptyQuoteAnswers()
  const interests = Array.isArray(input.interests)
    ? input.interests.filter((item) => item === 'balloons' || item === 'banners')
    : []
  const record = normalizeQuoteRecord({
    ...empty,
    ...input,
    id: `CVL-${quoteSurfaceToken(surface)}-Q-${day}-${last.toString().padStart(3, '0')}`,
    surface,
    interests,
    venuePhotos: parsePhotoList(input.venuePhotos),
    inspirationPhotos: parsePhotoList(input.inspirationPhotos),
    status: 'new',
    adminNotes: '',
    createdAt: now,
    updatedAt: now,
    firstName: String(input.firstName || ''),
    lastName: String(input.lastName || ''),
    email: String(input.email || ''),
    phone: String(input.phone || ''),
  })
  data.quotes.unshift(record)
  writeFile(data)
  return record
}

/**
 * Local quotes, newest first.
 */
export function listMemoryQuotes(): StudioQuoteRecord[] {
  return [...readFile().quotes]
}

/**
 * Update a file-backed quote.
 *
 * @param id - Quote number
 * @param patch - Status and/or notes
 */
export function updateMemoryQuote(
  id: string,
  patch: { status?: QuoteStatus; adminNotes?: string }
): StudioQuoteRecord | null {
  const data = readFile()
  const index = data.quotes.findIndex((item) => item.id === id)
  if (index < 0) return null
  const current = data.quotes[index]
  const updated: StudioQuoteRecord = {
    ...current,
    status: patch.status || current.status,
    adminNotes: patch.adminNotes !== undefined ? patch.adminNotes : current.adminNotes,
    updatedAt: new Date().toISOString(),
  }
  data.quotes[index] = updated
  writeFile(data)
  return updated
}
