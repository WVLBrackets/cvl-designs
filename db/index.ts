/**
 * Lazy Neon + Drizzle client. Safe to import during `next build` before DATABASE_URL exists.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Create a Drizzle client for the current DATABASE_URL.
 */
function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }
  const sql = neon(url)
  return drizzle(sql, { schema })
}

let db: ReturnType<typeof createDb> | null = null

/**
 * Shared database client for quote persistence.
 */
export function getDb() {
  if (!db) {
    db = createDb()
  }
  return db
}
