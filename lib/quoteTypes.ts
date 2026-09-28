/**
 * Shared quote types and labels for server and admin UI.
 */

import { emptyQuoteAnswers, parsePhotoList, type QuoteAnswers } from '@/lib/quoteForm'

export type QuoteStatus = 'new' | 'in_review' | 'quoted' | 'won' | 'lost'
export type QuoteSurface = 'local' | 'preview' | 'production'

export const quoteStatuses = ['new', 'in_review', 'quoted', 'won', 'lost'] as const

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  new: 'New',
  in_review: 'In review',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
}

export interface StudioQuoteRecord extends QuoteAnswers {
  id: string
  surface: QuoteSurface
  status: QuoteStatus
  adminNotes: string
  createdAt: string
  updatedAt: string
  firstName: string
  lastName: string
  email: string
  phone: string
  interests: string[]
  venuePhotos: string[]
  inspirationPhotos: string[]
}

/**
 * Fill missing answer keys on an older stored quote.
 *
 * @param record - Partial quote
 */
export function normalizeQuoteRecord(
  record: StudioQuoteRecord
): StudioQuoteRecord {
  const empty = emptyQuoteAnswers()
  return {
    ...empty,
    ...record,
    interests: Array.isArray(record.interests) ? record.interests : [],
    venuePhotos: parsePhotoList(record.venuePhotos),
    inspirationPhotos: parsePhotoList(record.inspirationPhotos),
  }
}
