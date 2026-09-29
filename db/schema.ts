/**
 * Postgres schema for studio quote requests.
 */

import { integer, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

export const quoteStatusEnum = pgEnum('quote_status', [
  'new',
  'in_review',
  'quoted',
  'won',
  'lost',
])

export const quoteSurfaceEnum = pgEnum('quote_surface', ['local', 'preview', 'production'])

export const quotes = pgTable('quotes', {
  id: text('id').primaryKey(),
  surface: quoteSurfaceEnum('surface').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  eventDate: text('event_date').notNull().default(''),
  occasion: text('occasion').notNull().default(''),
  location: text('location').notNull().default(''),
  interests: text('interests').notNull().default(''),
  details: text('details').notNull().default(''),
  needByDate: text('need_by_date').notNull().default(''),
  occasionOther: text('occasion_other').notNull().default(''),
  venueType: text('venue_type').notNull().default(''),
  guestCount: text('guest_count').notNull().default(''),
  budgetRange: text('budget_range').notNull().default(''),
  theme: text('theme').notNull().default(''),
  colorScheme: text('color_scheme').notNull().default(''),
  wantDraft: text('want_draft').notNull().default(''),
  balloonStyle: text('balloon_style').notNull().default(''),
  balloonIndoorOutdoor: text('balloon_indoor_outdoor').notNull().default(''),
  balloonQuantity: text('balloon_quantity').notNull().default(''),
  balloonNotes: text('balloon_notes').notNull().default(''),
  bannerWording: text('banner_wording').notNull().default(''),
  bannerFontStyle: text('banner_font_style').notNull().default(''),
  bannerDesigns: text('banner_designs').notNull().default(''),
  bannerSize: text('banner_size').notNull().default(''),
  bannerQuantity: text('banner_quantity').notNull().default(''),
  bannerHangMethod: text('banner_hang_method').notNull().default(''),
  venuePhotos: text('venue_photos').notNull().default(''),
  inspirationPhotos: text('inspiration_photos').notNull().default(''),
  socialPosting: text('social_posting').notNull().default(''),
  howHeard: text('how_heard').notNull().default(''),
  extraAnswers: text('extra_answers').notNull().default('{}'),
  status: quoteStatusEnum('status').notNull().default('new'),
  adminNotes: text('admin_notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const quoteDailyCounters = pgTable(
  'quote_daily_counters',
  {
    surface: text('surface').notNull(),
    day: text('day').notNull(),
    last: integer('last').notNull(),
  },
  (table) => [primaryKey({ columns: [table.surface, table.day] })]
)

export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number]
export type QuoteSurface = (typeof quoteSurfaceEnum.enumValues)[number]
export type QuoteRow = typeof quotes.$inferSelect
