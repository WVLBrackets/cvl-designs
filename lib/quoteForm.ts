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
  if (value.startsWith('/images/quotes/venue/') || value.startsWith('/images/quotes/inspiration/') || value.startsWith('/images/quotes/extra/')) {
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
export type QuoteFieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'photos'
  | 'interests'
export type QuoteFieldGroup = 'contact' | 'event' | 'design' | 'balloons' | 'banners' | 'photos' | 'extra'

export const QUOTE_KIND_LABELS: Record<QuoteFieldKind, string> = {
  text: 'Free text',
  textarea: 'Long text',
  date: 'Date',
  datetime: 'Date and time',
  select: 'Drop down',
  radio: 'Single choice',
  checkbox: 'Checkboxes',
  photos: 'Photos',
  interests: 'Balloons / banners',
}

export const QUOTE_ADMIN_KINDS: QuoteFieldKind[] = [
  'text',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'date',
  'datetime',
  'photos',
]

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
  options?: QuoteFieldOption[]
  maxLength: number
  custom?: boolean
}

export interface QuoteFieldSettings {
  visible: boolean
  required: boolean
  when: QuoteWhen
  label: string
  help: string
  kind?: QuoteFieldKind
  options?: QuoteFieldOption[]
}

export interface QuoteFormSettings {
  title: string
  intro: string
  fields: Record<string, QuoteFieldSettings>
  fieldOrder: string[]
  customFields: QuoteFieldDef[]
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
  { key: 'firstName', group: 'contact', kind: 'text', defaultLabel: 'First name', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 50 },
  { key: 'lastName', group: 'contact', kind: 'text', defaultLabel: 'Last name', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 50 },
  { key: 'email', group: 'contact', kind: 'text', defaultLabel: 'Email', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 254 },
  { key: 'phone', group: 'contact', kind: 'text', defaultLabel: 'Phone', defaultHelp: '', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 20 },
  { key: 'interests', group: 'contact', kind: 'interests', defaultLabel: 'I am interested in', defaultHelp: 'Choose balloons, banners, or both. Extra questions will appear for what you pick.', defaultWhen: 'all', defaultVisible: true, defaultRequired: true, maxLength: 40 },
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
    fieldOrder: QUOTE_FIELD_DEFS.map((field) => field.key),
    customFields: [],
  }
}

const optionSchema = z.object({
  value: z.string().min(1).max(80),
  label: z.string().min(1).max(80),
})

const fieldSettingsSchema = z.object({
  visible: z.boolean(),
  required: z.boolean(),
  when: z.enum(['all', 'balloons', 'banners']),
  label: z.string().max(80),
  help: z.string().max(240),
  kind: z
    .enum(['text', 'textarea', 'date', 'datetime', 'select', 'radio', 'checkbox', 'photos', 'interests'])
    .optional(),
  options: z.array(optionSchema).max(30).optional(),
})

const customFieldSchema = z.object({
  key: z.string().regex(/^custom_[a-z0-9]{6,24}$/),
  group: z.enum(['contact', 'event', 'design', 'balloons', 'banners', 'photos', 'extra']).optional(),
  kind: z.enum(['text', 'textarea', 'date', 'datetime', 'select', 'radio', 'checkbox', 'photos']),
  defaultLabel: z.string().min(1).max(80),
  defaultHelp: z.string().max(240).optional(),
  defaultWhen: z.enum(['all', 'balloons', 'banners']).optional(),
  defaultVisible: z.boolean().optional(),
  defaultRequired: z.boolean().optional(),
  options: z.array(optionSchema).max(30).optional(),
  maxLength: z.number().int().min(1).max(8000).optional(),
})

const quoteFormPayloadSchema = z.object({
  title: z.string().min(1).max(80),
  intro: z.string().max(400),
  fields: z.record(fieldSettingsSchema),
  fieldOrder: z.array(z.string().max(40)).max(80).optional(),
  customFields: z.array(customFieldSchema).max(20).optional(),
})

/**
 * True when a key is an admin-created question stored in extra_answers JSON.
 *
 * @param key - Field key
 */
export function isCustomQuoteKey(key: string): boolean {
  return /^custom_[a-z0-9]{6,24}$/.test(key)
}

/**
 * New key for an admin-created question.
 */
export function createCustomQuoteKey(): string {
  const token = Math.random().toString(36).slice(2, 10)
  return `custom_${token}`
}

/**
 * Custom field answers for the extra_answers JSON column.
 *
 * @param answers - Validated quote answers
 */
export function extraAnswersPayload(answers: QuoteAnswers): Record<string, string | string[]> {
  const extra: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(answers)) {
    if (isCustomQuoteKey(key)) extra[key] = value
  }
  return extra
}

/**
 * Built-in plus admin-created field definitions.
 *
 * @param form - Merged form settings
 */
export function catalogQuoteDefs(form: QuoteFormSettings): QuoteFieldDef[] {
  return [...QUOTE_FIELD_DEFS, ...form.customFields]
}

/**
 * Field definitions in admin-chosen order.
 *
 * @param form - Merged form settings
 */
export function orderedQuoteDefs(form: QuoteFormSettings): QuoteFieldDef[] {
  const defs = catalogQuoteDefs(form)
  const byKey = new Map(defs.map((def) => [def.key, def]))
  const seen = new Set<string>()
  const ordered: QuoteFieldDef[] = []
  for (const key of form.fieldOrder || []) {
    const def = byKey.get(key)
    if (!def || seen.has(key)) continue
    seen.add(key)
    ordered.push(def)
  }
  for (const def of defs) {
    if (seen.has(def.key)) continue
    ordered.push(def)
  }
  return ordered
}

/**
 * Effective input type after admin overrides.
 *
 * @param def - Catalog field
 * @param settings - Stored settings
 */
export function fieldKind(def: QuoteFieldDef, settings: QuoteFieldSettings): QuoteFieldKind {
  if (def.kind === 'interests') return 'interests'
  if (settings.kind && QUOTE_ADMIN_KINDS.includes(settings.kind)) return settings.kind
  return def.kind
}

/**
 * Dropdown / choice options after admin edits.
 *
 * @param def - Catalog field
 * @param settings - Stored settings
 */
export function fieldOptions(def: QuoteFieldDef, settings: QuoteFieldSettings): QuoteFieldOption[] {
  if (settings.options && settings.options.length > 0) return settings.options
  return def.options || []
}

/**
 * Normalize a custom field from stored JSON.
 *
 * @param raw - Unknown custom field
 */
function normalizeCustomField(raw: QuoteFieldDef): QuoteFieldDef {
  const kind = QUOTE_ADMIN_KINDS.includes(raw.kind) ? raw.kind : 'text'
  return {
    key: raw.key,
    group: 'extra',
    kind,
    defaultLabel: raw.defaultLabel.slice(0, 80),
    defaultHelp: raw.defaultHelp || '',
    defaultWhen: raw.defaultWhen || 'all',
    defaultVisible: raw.defaultVisible !== false,
    defaultRequired: Boolean(raw.defaultRequired),
    options: raw.options || [],
    maxLength: raw.maxLength || (kind === 'photos' ? 8000 : kind === 'textarea' ? 2000 : 200),
    custom: true,
  }
}

/**
 * Merge stored Config JSON onto catalog defaults.
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
    return hydrateQuoteFormSettings(parsed)
  } catch {
    return defaults
  }
}

/**
 * Apply stored overrides onto catalog defaults without locking required fields.
 *
 * @param parsed - Partial stored settings
 */
function hydrateQuoteFormSettings(parsed: Partial<QuoteFormSettings>): QuoteFormSettings {
  const defaults = defaultQuoteFormSettings()
  const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim().slice(0, 80) : defaults.title
  const intro = typeof parsed.intro === 'string' ? parsed.intro.slice(0, 400) : defaults.intro
  const customFields = Array.isArray(parsed.customFields)
    ? parsed.customFields
        .filter((item) => item && isCustomQuoteKey(item.key))
        .slice(0, 20)
        .map((item) => normalizeCustomField(item))
    : []
  const stored = parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : {}
  const fields: Record<string, QuoteFieldSettings> = {}
  const allDefs = [...QUOTE_FIELD_DEFS, ...customFields]
  for (const def of allDefs) {
    const fallback = defaultFieldSettings(def)
    const row = stored[def.key]
    fields[def.key] = {
      visible: typeof row?.visible === 'boolean' ? row.visible : fallback.visible,
      required: typeof row?.required === 'boolean' ? row.required : fallback.required,
      when: row?.when === 'balloons' || row?.when === 'banners' || row?.when === 'all' ? row.when : fallback.when,
      label: typeof row?.label === 'string' && row.label.trim() ? row.label.trim().slice(0, 80) : fallback.label,
      help: typeof row?.help === 'string' ? row.help.slice(0, 240) : fallback.help,
      kind: row?.kind && QUOTE_ADMIN_KINDS.includes(row.kind) ? row.kind : def.kind,
      options: Array.isArray(row?.options) && row.options.length ? row.options : def.options,
    }
  }
  const known = new Set(allDefs.map((def) => def.key))
  const fieldOrder = [
    ...(Array.isArray(parsed.fieldOrder) ? parsed.fieldOrder.filter((key) => known.has(key)) : []),
    ...allDefs.map((def) => def.key),
  ].filter((key, index, list) => known.has(key) && list.indexOf(key) === index)
  return { title, intro, fields, fieldOrder, customFields }
}

/**
 * Validate admin save payload.
 *
 * @param body - Request JSON
 */
export function parseQuoteFormPayload(body: unknown): QuoteFormSettings {
  const parsed = quoteFormPayloadSchema.parse(body)
  return hydrateQuoteFormSettings({
    ...parsed,
    customFields: (parsed.customFields || []).map((item) => ({
      ...item,
      group: item.group || 'extra',
      defaultHelp: item.defaultHelp || '',
      defaultWhen: item.defaultWhen || 'all',
      defaultVisible: item.defaultVisible !== false,
      defaultRequired: Boolean(item.defaultRequired),
      maxLength: item.maxLength || 200,
    })),
  })
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
    answers[def.key] = def.kind === 'photos' || def.kind === 'interests' || def.kind === 'checkbox' ? [] : ''
  }
  return answers
}

/**
 * Parse checkbox / multi-value answers.
 *
 * @param value - Incoming JSON
 */
export function parseChoiceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  const raw = String(value || '').trim()
  if (!raw) return []
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      return []
    }
  }
  return raw.split(',').map((part) => part.trim()).filter(Boolean)
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
  const defs = orderedQuoteDefs(form)

  const interestRaw = raw.interests
  const interests = Array.isArray(interestRaw)
    ? interestRaw.map((item) => String(item)).filter((item) => item === 'balloons' || item === 'banners')
    : []
  answers.interests = interests

  for (const def of defs) {
    if (def.key === 'interests') continue
    const settings = form.fields[def.key] || defaultFieldSettings(def)
    const shown = isQuoteFieldShown(def, settings, interests)
    const incoming = raw[def.key]
    const kind = fieldKind(def, settings)
    const options = fieldOptions(def, settings)
    const allowed = new Set(options.map((item) => item.value))

    if (kind === 'photos') {
      const list = parsePhotoList(incoming).filter(isAllowedQuotePhotoUrl)
      answers[def.key] = list
      if (shown && isQuoteFieldRequired(settings, interests) && list.length === 0) {
        return { success: false, error: `${settings.label} is required` }
      }
      continue
    }

    if (kind === 'checkbox') {
      const list = parseChoiceList(incoming).filter((item) => allowed.size === 0 || allowed.has(item))
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
    if ((kind === 'select' || kind === 'radio') && value && allowed.size && !allowed.has(value)) {
      value = ''
    }
    if (!shown) {
      answers[def.key] = ''
      continue
    }
    answers[def.key] = value
    if (isQuoteFieldRequired(settings, interests) && !value.trim()) {
      return { success: false, error: `${settings.label} is required` }
    }
  }

  if (
    form.fields.interests &&
    isQuoteFieldRequired(form.fields.interests, interests) &&
    interests.length === 0
  ) {
    return { success: false, error: 'Please choose balloons, banners, or both' }
  }

  const email = String(answers.email || '')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Invalid email format' }
  }
  const phone = String(answers.phone || '')
  if (phone && usPhoneDigits(phone).length !== 10) {
    return { success: false, error: 'Invalid phone number format' }
  }

  return { success: true, data: answers }
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

