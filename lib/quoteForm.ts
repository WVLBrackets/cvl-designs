/**
 * Quote form field catalog and Config-sheet settings (show/hide, required, balloons vs banners).
 */

import { z } from 'zod'
import { formatUsPhone, sanitizeString, usPhoneDigits } from '@/lib/validation'
import type { SiteConfiguration } from '@/lib/types'

export const QUOTE_FORM_CONFIG_KEY = 'Quote_Form'

export const QUOTE_PHOTO_MAX = 5
export const QUOTE_PHOTO_MAX_BYTES = 4.5 * 1024 * 1024

/**
 * Allow Blob URLs or local quote image paths after upload.
 *
 * @param url - Stored photo URL
 */
export function isAllowedQuotePhotoUrl(url: string): boolean {
  const value = url.trim()
  if (!value || value.length > 2000 || value.includes('..')) return false
  if (value.startsWith('/images/quotes/venue/') || value.startsWith('/images/quotes/inspiration/')) {
    return true
  }
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') return false
    return (
      parsed.hostname.endsWith('.blob.vercel-storage.com') ||
      parsed.hostname === 'blob.vercel-storage.com'
    )
  } catch {
    return false
  }
}

export type QuoteWhen = 'all' | 'balloons' | 'banners'
export type QuoteFieldKind = 'text' | 'textarea' | 'date' | 'select' | 'radio' | 'photos' | 'interests'
export type QuoteFieldGroup = 'contact' | 'event' | 'design' | 'balloons' | 'banners' | 'photos' | 'extra'

export interface QuoteFieldOption {
  value: string
  label: string
}

export interface QuoteFieldDef {
  key: string
  group: QuoteFieldGroup
  kind: QuoteFieldKind
  defaultLabel: string
  defaultHelp: string
  defaultWhen: QuoteWhen
  defaultVisible: boolean
  defaultRequired: boolean
  locked?: boolean
  options?: QuoteFieldOption[]
  maxLength: number
}

export interface QuoteFieldSettings {
  visible: boolean
  required: boolean
  when: QuoteWhen
  label: string
  help: string
}

export interface QuoteFormSettings {
  title: string
  intro: string
  fields: Record<string, QuoteFieldSettings>
}

export const QUOTE_FIELD_GROUPS: Array<{ id: QuoteFieldGroup; label: string }> = [
  { id: 'contact', label: 'Contact' },
  { id: 'event', label: 'Event' },
  { id: 'design', label: 'Design' },
  { id: 'balloons', label: 'Balloons only' },
  { id: 'banners', label: 'Banners only' },
  { id: 'photos', label: 'Photos' },
  { id: 'extra', label: 'Extra' },
]

const OCCASIONS: QuoteFieldOption[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'wedding', label: 'Wedding / shower' },
  { value: 'team', label: 'Team / school' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
]

/**
 * All quote questions. Hidden extras still have a DB column so we can turn them on later.
 */
export const QUOTE_FIELD_DEFS: QuoteFieldDef[] = [
  { key: 'firstName', group: 'contact', kind: 'text', defaultLabel: 'First name', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, locked: true, maxLength: 50 },
  { key: 'lastName', group: 'contact', kind: 'text', defaultLabel: 'Last name', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, locked: true, maxLength: 50 },
  { key: 'email', group: 'contact', kind: 'text', defaultLabel: 'Email', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, locked: true, maxLength: 254 },
  { key: 'phone', group: 'contact', kind: 'text', defaultLabel: 'Phone', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, locked: true, maxLength: 20 },
  { key: 'interests', group: 'contact', kind: 'interests', defaultLabel: 'I am interested in', defaultHelp: 'Choose balloons, banners, or both. Extra questions will appear for what you pick.', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, locked: true, maxLength: 40 },
  { key: 'eventDate', group: 'event', kind: 'date', defaultLabel: 'Event date', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 40 },
  { key: 'needByDate', group: 'event', kind: 'date', defaultLabel: 'Need it by', defaultHelp: 'If this is sooner than the event, tell us the last day that still works.', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, maxLength: 40 },
  { key: 'occasion', group: 'event', kind: 'select', defaultLabel: 'Occasion', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, options: OCCASIONS, maxLength: 80 },
  { key: 'occasionOther', group: 'event', kind: 'text', defaultLabel: 'Occasion (other)', defaultHelp: 'If you chose Other, tell us what the event is.', defaultWhen: 'all', defaultVisible: false, defaultRequired: false, maxLength: 80 },
  { key: 'location', group: 'event', kind: 'text', defaultLabel: 'Location / venue', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, maxLength: 120 },
  { key: 'venueType', group: 'event', kind: 'select', defaultLabel: 'Indoor or outdoor', defaultHelp: '', defaultWhen: 'all', defaultVisible: false, defaultRequired: false, options: [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'both', label: 'Both' },
  ], maxLength: 40 },
  { key: 'guestCount', group: 'event', kind: 'text', defaultLabel: 'About how many guests', defaultHelp: '', defaultWhen: 'all', defaultVisible: false, defaultRequired: false, maxLength: 40 },
  { key: 'budgetRange', group: 'event', kind: 'text', defaultLabel: 'Budget range', defaultHelp: 'Optional. Helps us suggest the right scale.', defaultWhen: 'all', defaultVisible: false, defaultRequired: false, maxLength: 80 },
  { key: 'theme', group: 'design', kind: 'text', defaultLabel: 'Theme', defaultHelp: 'School colors, birthday theme, team name, etc.', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, maxLength: 120 },
  { key: 'colorScheme', group: 'design', kind: 'text', defaultLabel: 'Colors', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, maxLength: 120 },
  { key: 'wantDraft', group: 'design', kind: 'radio', defaultLabel: 'Want a sketch first?', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, options: [
    { value: 'yes', label: 'Yes, email a sketch before we make it' },
    { value: 'no', label: 'No, just send the quote' },
  ], maxLength: 20 },
  { key: 'details', group: 'design', kind: 'textarea', defaultLabel: 'Anything else we should know?', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 2000 },
  { key: 'balloonStyle', group: 'balloons', kind: 'select', defaultLabel: 'Balloon style', defaultHelp: '', defaultWhen: 'balloons', defaultVisible: true, defaultRequired: false, options: [
    { value: 'arch', label: 'Arch' },
    { value: 'garland', label: 'Garland' },
    { value: 'columns', label: 'Columns' },
    { value: 'clusters', label: 'Clusters / bouquets' },
    { value: 'install', label: 'Full install / other' },
  ], maxLength: 40 },
  { key: 'balloonIndoorOutdoor', group: 'balloons', kind: 'select', defaultLabel: 'Balloon setting', defaultHelp: '', defaultWhen: 'balloons', defaultVisible: false, defaultRequired: false, options: [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'both', label: 'Both' },
  ], maxLength: 40 },
  { key: 'balloonQuantity', group: 'balloons', kind: 'text', defaultLabel: 'Balloon quantity or scale', defaultHelp: 'e.g. small entry, full backdrop', defaultWhen: 'balloons', defaultVisible: false, defaultRequired: false, maxLength: 80 },
  { key: 'balloonNotes', group: 'balloons', kind: 'textarea', defaultLabel: 'Balloon notes', defaultHelp: '', defaultWhen: 'balloons', defaultVisible: false, defaultRequired: false, maxLength: 1000 },
  { key: 'bannerWording', group: 'banners', kind: 'textarea', defaultLabel: 'Banner wording', defaultHelp: 'Type it exactly as it should appear, including punctuation.', defaultWhen: 'banners', defaultVisible: true, defaultRequired: true, maxLength: 400 },
  { key: 'bannerFontStyle', group: 'banners', kind: 'text', defaultLabel: 'Banner lettering style', defaultHelp: 'e.g. bold block, cursive, bubble', defaultWhen: 'banners', defaultVisible: true, defaultRequired: false, maxLength: 120 },
  { key: 'bannerDesigns', group: 'banners', kind: 'text', defaultLabel: 'Banner designs / motifs', defaultHelp: 'e.g. balloons, mascot, cake', defaultWhen: 'banners', defaultVisible: true, defaultRequired: false, maxLength: 200 },
  { key: 'bannerSize', group: 'banners', kind: 'text', defaultLabel: 'Banner size', defaultHelp: 'About how wide and tall, or “not sure.”', defaultWhen: 'banners', defaultVisible: true, defaultRequired: true, maxLength: 80 },
  { key: 'bannerQuantity', group: 'banners', kind: 'text', defaultLabel: 'How many banners', defaultHelp: '', defaultWhen: 'banners', defaultVisible: false, defaultRequired: false, maxLength: 40 },
  { key: 'bannerHangMethod', group: 'banners', kind: 'select', defaultLabel: 'How it will hang', defaultHelp: '', defaultWhen: 'banners', defaultVisible: false, defaultRequired: false, options: [
    { value: 'none', label: 'Not sure / none needed' },
    { value: 'command', label: 'Command strips' },
    { value: 'pins', label: 'Pins' },
    { value: 'grommets', label: 'Grommets' },
    { value: 'install', label: 'Please install' },
  ], maxLength: 40 },
  { key: 'venuePhotos', group: 'photos', kind: 'photos', defaultLabel: 'Venue photos', defaultHelp: 'Optional. Walls, ceiling, or where the piece will go.', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, maxLength: 8000 },
  { key: 'inspirationPhotos', group: 'photos', kind: 'photos', defaultLabel: 'Inspiration photos', defaultHelp: 'Optional. Colors, other work, or a screenshot of an idea.', defaultWhen: 'all', defaultVisible: true, defaultRequired: false, maxLength: 8000 },
  { key: 'socialPosting', group: 'extra', kind: 'select', defaultLabel: 'Share on social before the event?', defaultHelp: '', defaultWhen: 'all', defaultVisible: false, defaultRequired: false, options: [
    { value: 'before', label: 'Yes, before the event' },
    { value: 'after', label: 'After the event only' },
    { value: 'no', label: 'Please do not share' },
  ], maxLength: 40 },
  { key: 'howHeard', group: 'extra', kind: 'text', defaultLabel: 'How did you hear about us?', defaultHelp: '', defaultWhen: 'all', defaultVisible: false, defaultRequired: false, maxLength: 120 },
]

export const QUOTE_ANSWER_KEYS = QUOTE_FIELD_DEFS.map((field) => field.key)

export const QUOTE_PHOTO_KEYS = ['venuePhotos', 'inspirationPhotos'] as const

/**
 * Default settings for one catalog field.
 *
 * @param def - Catalog definition
 */
export function defaultFieldSettings(def: QuoteFieldDef): QuoteFieldSettings {
  return {
    visible: def.defaultVisible,
    required: def.defaultRequired,
    when: def.defaultWhen,
    label: def.defaultLabel,
    help: def.defaultHelp,
  }
}

/**
 * Built-in form copy and field flags.
 */
export function defaultQuoteFormSettings(): QuoteFormSettings {
  const fields: Record<string, QuoteFieldSettings> = {}
  for (const def of QUOTE_FIELD_DEFS) {
    fields[def.key] = defaultFieldSettings(def)
  }
  return {
    title: 'Request a Quote',
    intro: 'Tell us about your event and what you have in mind. We will follow up with a quote.',
    fields,
  }
}

const fieldSettingsSchema = z.object({
  visible: z.boolean(),
  required: z.boolean(),
  when: z.enum(['all', 'balloons', 'banners']),
  label: z.string().max(80),
  help: z.string().max(240),
})

const quoteFormPayloadSchema = z.object({
  title: z.string().min(1).max(80),
  intro: z.string().max(400),
  fields: z.record(fieldSettingsSchema),
})

/**
 * Merge stored Config JSON onto catalog defaults. Locked fields stay required and always shown.
 *
 * @param config - Site configuration map
 */
export function mergeQuoteFormSettings(config: SiteConfiguration): QuoteFormSettings {
  const defaults = defaultQuoteFormSettings()
  const raw = typeof config[QUOTE_FORM_CONFIG_KEY] === 'string' ? String(config[QUOTE_FORM_CONFIG_KEY]) : ''
  if (!raw.trim()) {
    const sheetTitle = typeof config.Design_Studio_Quote_Title === 'string' ? config.Design_Studio_Quote_Title.trim() : ''
    if (sheetTitle) defaults.title = sheetTitle
    return defaults
  }
  try {
    const parsed = JSON.parse(raw) as Partial<QuoteFormSettings>
    const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim().slice(0, 80) : defaults.title
    const intro = typeof parsed.intro === 'string' ? parsed.intro.slice(0, 400) : defaults.intro
    const stored = parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : {}
    const fields: Record<string, QuoteFieldSettings> = {}
    for (const def of QUOTE_FIELD_DEFS) {
      const fallback = defaults.fields[def.key]
      const row = stored[def.key]
      const merged: QuoteFieldSettings = {
        visible: typeof row?.visible === 'boolean' ? row.visible : fallback.visible,
        required: typeof row?.required === 'boolean' ? row.required : fallback.required,
        when: row?.when === 'balloons' || row?.when === 'banners' || row?.when === 'all' ? row.when : fallback.when,
        label: typeof row?.label === 'string' && row.label.trim() ? row.label.trim().slice(0, 80) : fallback.label,
        help: typeof row?.help === 'string' ? row.help.slice(0, 240) : fallback.help,
      }
      if (def.locked) {
        merged.visible = true
        merged.required = true
        merged.when = 'all'
      }
      fields[def.key] = merged
    }
    return { title, intro, fields }
  } catch {
    return defaults
  }
}

/**
 * Validate admin save payload and re-apply locked field rules.
 *
 * @param body - Request JSON
 */
export function parseQuoteFormPayload(body: unknown): QuoteFormSettings {
  const parsed = quoteFormPayloadSchema.parse(body)
  const defaults = defaultQuoteFormSettings()
  const fields: Record<string, QuoteFieldSettings> = {}
  for (const def of QUOTE_FIELD_DEFS) {
    const fallback = defaults.fields[def.key]
    const row = parsed.fields[def.key] || fallback
    const merged: QuoteFieldSettings = {
      visible: row.visible,
      required: row.required,
      when: row.when,
      label: row.label.trim() || fallback.label,
      help: row.help,
    }
    if (def.locked) {
      merged.visible = true
      merged.required = true
      merged.when = 'all'
    }
    fields[def.key] = merged
  }
  return {
    title: parsed.title.trim() || defaults.title,
    intro: parsed.intro.trim(),
    fields,
  }
}

/**
 * Whether a field should appear for the current balloons/banners selection.
 *
 * @param when - Field condition
 * @param interests - Selected offerings
 */
export function fieldAppliesToInterests(when: QuoteWhen, interests: string[]): boolean {
  if (when === 'all') return true
  return interests.includes(when)
}

/**
 * Public form should render this field.
 *
 * @param def - Catalog field
 * @param settings - Merged settings
 * @param interests - Current checkboxes
 */
export function isQuoteFieldShown(
  def: QuoteFieldDef,
  settings: QuoteFieldSettings,
  interests: string[]
): boolean {
  if (!settings.visible) return false
  return fieldAppliesToInterests(settings.when, interests)
}

/**
 * Required only if shown for this request.
 *
 * @param settings - Merged settings
 * @param interests - Current checkboxes
 */
export function isQuoteFieldRequired(settings: QuoteFieldSettings, interests: string[]): boolean {
  if (!settings.visible || !settings.required) return false
  return fieldAppliesToInterests(settings.when, interests)
}

/**
 * Map a camelCase field key to a Postgres column name.
 *
 * @param key - Form field key
 */
export function quoteDbColumn(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export type QuoteAnswers = Record<string, string | string[]>

/**
 * Empty answers for every catalog field.
 */
export function emptyQuoteAnswers(): QuoteAnswers {
  const answers: QuoteAnswers = {}
  for (const def of QUOTE_FIELD_DEFS) {
    answers[def.key] = def.kind === 'photos' || def.kind === 'interests' ? [] : ''
  }
  return answers
}

/**
 * Parse a stored photo-column JSON list.
 *
 * @param value - Database text
 */
export function parsePhotoList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, QUOTE_PHOTO_MAX)
  }
  const raw = String(value || '').trim()
  if (!raw) return []
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, QUOTE_PHOTO_MAX)
      }
    } catch {
      return []
    }
  }
  return raw.split(',').map((part) => part.trim()).filter(Boolean).slice(0, QUOTE_PHOTO_MAX)
}

/**
 * Validate a public quote submission against the live form settings.
 *
 * @param body - Request JSON
 * @param form - Merged form settings
 */
export function validateQuoteSubmission(
  body: unknown,
  form: QuoteFormSettings
): { success: true; data: QuoteAnswers } | { success: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid quote request' }
  }
  const raw = body as Record<string, unknown>
  const answers = emptyQuoteAnswers()

  const interestRaw = raw.interests
  const interests = Array.isArray(interestRaw)
    ? interestRaw.map((item) => String(item)).filter((item) => item === 'balloons' || item === 'banners')
    : []
  answers.interests = interests

  for (const def of QUOTE_FIELD_DEFS) {
    if (def.key === 'interests') continue
    const settings = form.fields[def.key]
    const shown = isQuoteFieldShown(def, settings, interests)
    const incoming = raw[def.key]

    if (def.kind === 'photos') {
      const list = parsePhotoList(incoming).filter(isAllowedQuotePhotoUrl)
      answers[def.key] = list
      if (shown && isQuoteFieldRequired(settings, interests) && list.length === 0) {
        return { success: false, error: `${settings.label} is required` }
      }
      continue
    }

    let value = typeof incoming === 'string' ? incoming : ''
    if (def.key === 'email') value = value.toLowerCase().trim()
    else if (def.key === 'phone') value = formatUsPhone(value)
    else value = sanitizeString(value).slice(0, def.maxLength)
    if (!shown) {
      answers[def.key] = ''
      continue
    }
    answers[def.key] = value
    if (isQuoteFieldRequired(settings, interests) && !value.trim()) {
      return { success: false, error: `${settings.label} is required` }
    }
  }

  if (isQuoteFieldRequired(form.fields.interests, interests) && interests.length === 0) {
    return { success: false, error: 'Please choose balloons, banners, or both' }
  }

  const email = String(answers.email || '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Invalid email format' }
  }
  if (usPhoneDigits(String(answers.phone || '')).length !== 10) {
    return { success: false, error: 'Invalid phone number format' }
  }

  return { success: true, data: answers }
}
