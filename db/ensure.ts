/**
 * Create quote tables if they do not exist yet (Neon / Postgres).
 */

import { sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { QUOTE_FIELD_DEFS, quoteDbColumn } from '@/lib/quoteForm'

let ensured = false

const EXTRA_COLUMNS = QUOTE_FIELD_DEFS
  .map((field) => quoteDbColumn(field.key))
  .filter((column) => !['first_name', 'last_name', 'email', 'phone', 'event_date', 'occasion', 'location', 'interests', 'details'].includes(column))

/**
 * Idempotent DDL so the first quote can succeed before `drizzle-kit push`.
 */
export async function ensureQuoteTables(): Promise<void> {
  if (ensured) return
  const db = getDb()
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE quote_status AS ENUM ('new', 'in_review', 'quoted', 'won', 'lost');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE quote_surface AS ENUM ('local', 'preview', 'production');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id text PRIMARY KEY,
      surface quote_surface NOT NULL,
      first_name text NOT NULL,
      last_name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL,
      event_date text NOT NULL DEFAULT '',
      occasion text NOT NULL DEFAULT '',
      location text NOT NULL DEFAULT '',
      interests text NOT NULL DEFAULT '',
      details text NOT NULL DEFAULT '',
      status quote_status NOT NULL DEFAULT 'new',
      admin_notes text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  for (const column of EXTRA_COLUMNS) {
    await db.execute(sql.raw(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS ${column} text NOT NULL DEFAULT ''`))
  }
  await db.execute(sql.raw(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS extra_answers text NOT NULL DEFAULT '{}'`))
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS quote_daily_counters (
      surface text NOT NULL,
      day text NOT NULL,
      last integer NOT NULL,
      PRIMARY KEY (surface, day)
    )
  `)
  ensured = true
}
