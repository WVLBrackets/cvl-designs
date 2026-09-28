/**
 * Daily quote numbers: CVL-{SURFACE}-Q-{YYYYMMDD}-{seq}
 */

import { sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { quoteDailyCounters } from '@/db/schema'
import { getRuntimeSurface, type RuntimeSurface } from '@/lib/config'

/**
 * Map the runtime surface to the quote-number token.
 *
 * @param surface - local, preview, or production
 */
export function quoteSurfaceToken(surface: RuntimeSurface): string {
  if (surface === 'production') return 'PROD'
  if (surface === 'preview') return 'PREVIEW'
  return 'LOCAL'
}

/**
 * Allocate the next quote id for today on this surface.
 */
export async function generateQuoteId(): Promise<{ id: string; surface: RuntimeSurface; day: string }> {
  const surface = getRuntimeSurface()
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const db = getDb()

  const [row] = await db
    .insert(quoteDailyCounters)
    .values({ surface, day, last: 1 })
    .onConflictDoUpdate({
      target: [quoteDailyCounters.surface, quoteDailyCounters.day],
      set: { last: sql`${quoteDailyCounters.last} + 1` },
    })
    .returning({ last: quoteDailyCounters.last })

  const sequence = row?.last ?? 1
  const id = `CVL-${quoteSurfaceToken(surface)}-Q-${day}-${sequence.toString().padStart(3, '0')}`
  return { id, surface, day }
}
