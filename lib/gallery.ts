/**
 * Studio gallery stored in the Config spreadsheet (Gallery + Gallery Categories tabs).
 * Price is persisted for later ordering but omitted from public fetch helpers.
 */

import { getSheetsClient } from './googleSheets'
import { getSheetId, getEnvironment, getSheetEnvironmentLabel, isVisibleOnCurrentSurface } from './config'
import { listOrphanedGalleryBlobs, markGalleryBlobRecoveryDone } from './galleryImage'
import type { GalleryCategory, GalleryItem, PublicGalleryItem } from './types'
import { parseHeroVideoPlay } from './galleryMedia'

const CATEGORIES_TAB = 'Gallery Categories'
const ITEMS_TAB = 'Gallery'

const DEFAULT_CATEGORIES: GalleryCategory[] = [
  { slug: 'balloons', name: 'Balloons', sortOrder: 1, active: true },
  { slug: 'banners', name: 'Banners', sortOrder: 2, active: true },
]

/**
 * Build a quoted A1 range so tab names with spaces work in the Sheets API.
 *
 * @param title - Tab name
 * @param a1 - Cell or range inside the tab, e.g. `A2:H`
 */
function sheetRange(title: string, a1: string): string {
  const escaped = title.replace(/'/g, "''")
  return `'${escaped}'!${a1}`
}

/**
 * @param value - Sheet cell
 * @returns Whether the cell looks like a checked / true value
 */
function isTruthyCell(value: unknown): boolean {
  if (!value) return false
  const str = String(value).toLowerCase().trim()
  return str === 'true' || str === 'x' || str === 'yes' || str === '1'
}

/**
 * Create a sheet tab with headers when it does not exist yet.
 *
 * @param title - Tab name
 * @param headers - Header row
 */
/**
 * Create a sheet tab with headers when it does not exist yet.
 *
 * @param title - Tab name
 * @param headers - Header row
 */
async function ensureTab(title: string, headers: string[]): Promise<void> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  })
  const exists = (meta.data.sheets || []).some(
    (sheet) => sheet.properties?.title === title
  )

  if (!exists) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title } } }],
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.toLowerCase().includes('already exists')) {
        throw error
      }
    }
  }

  const headerRow = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange(title, 'A1:K1'),
  })
  const current = (headerRow.data.values?.[0] || []).map((cell) => String(cell || '').trim())
  const missing = headers.some((header, index) => current[index] !== header)
  if (!missing && current.length >= headers.length) return

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange(title, 'A1'),
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  })
}

/**
 * Ensure gallery tabs exist and seed default categories when the category tab is empty.
 */
async function ensureGalleryTabs(): Promise<void> {
  await ensureTab(CATEGORIES_TAB, ['slug', 'name', 'sortOrder', 'active', 'environment'])
  await ensureTab(ITEMS_TAB, [
    'id',
    'categorySlug',
    'imageUrl',
    'caption',
    'featured',
    'status',
    'price',
    'createdAt',
    'environment',
    'homeHero',
    'heroVideoPlay',
  ])

  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange(CATEGORIES_TAB, 'A2:A10'),
  })
  if ((existing.data.values || []).length > 0) return

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetRange(CATEGORIES_TAB, 'A2'),
    valueInputOption: 'RAW',
    requestBody: {
      values: DEFAULT_CATEGORIES.map((c) => [c.slug, c.name, c.sortOrder, 'TRUE', 'All']),
    },
  })
}

/**
 * Load gallery categories from the Config sheet.
 *
 * @returns Active categories, or the built-in balloons/banners list on failure
 */
export async function fetchGalleryCategories(): Promise<GalleryCategory[]> {
  try {
    await ensureGalleryTabs()
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('config')
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange(CATEGORIES_TAB, 'A1:E50'),
    })
    const rows = response.data.values || []
    if (rows.length < 2) return DEFAULT_CATEGORIES

    const categories: GalleryCategory[] = rows.slice(1).flatMap((row) => {
      const slug = String(row[0] || '').trim().toLowerCase()
      if (!slug) return []
      if (!isVisibleOnCurrentSurface(row[4])) return []
      return [
        {
          slug,
          name: String(row[1] || slug).trim(),
          sortOrder: Number(row[2]) || 0,
          active: row[3] === undefined || row[3] === '' ? true : isTruthyCell(row[3]),
          environment: String(row[4] || 'All').trim() || 'All',
        },
      ]
    })

    const active = categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder)
    return active.length > 0 ? active : DEFAULT_CATEGORIES
  } catch (error) {
    console.error('[gallery] Failed to fetch categories:', error)
    return DEFAULT_CATEGORIES
  }
}

/**
 * Parse one Gallery tab data row.
 *
 * @param row - Sheet row
 */
function parseGalleryRow(row: unknown[]): GalleryItem | null {
  const id = String(row[0] || '').trim()
  const imageUrl = String(row[2] || '').trim()
  if (!id || !imageUrl) return null

  const statusRaw = String(row[5] || 'Public').trim().toLowerCase()
  const status: GalleryItem['status'] = statusRaw === 'draft' ? 'Draft' : 'Public'

  return {
    id,
    categorySlug: String(row[1] || '').trim().toLowerCase(),
    imageUrl,
    caption: String(row[3] || '').trim(),
    featured: isTruthyCell(row[4]),
    homeHero: isTruthyCell(row[9]),
    heroVideoPlay: parseHeroVideoPlay(row[10]),
    status,
    price: Number(String(row[6] || '0').replace(/[$,]/g, '')) || 0,
    createdAt: String(row[7] || '').trim(),
    environment: String(row[8] || 'All').trim() || 'All',
  }
}

const REEDY_HOCO_ID = 'g-reedy-hoco-2026'
const REEDY_HOCO_IMAGE = '/images/home/reedy-hoco-2026.jpg'

/**
 * Add the Reedy HOCO banner to the gallery once, marked for both heroes.
 *
 * @param existing - Gallery rows already loaded
 */
async function ensureReedyHocoGalleryItem(existing: GalleryItem[]): Promise<GalleryItem[]> {
  const found = existing.some(
    (item) => item.id === REEDY_HOCO_ID || item.imageUrl.includes('reedy-hoco-2026')
  )
  if (found) return existing

  const created = await restoreGalleryItem({
    id: REEDY_HOCO_ID,
    categorySlug: 'banners',
    imageUrl: REEDY_HOCO_IMAGE,
    caption: 'Reedy HOCO 2026',
    featured: true,
    homeHero: true,
    heroVideoPlay: 'delay',
    status: 'Public',
    price: 0,
    createdAt: new Date().toISOString(),
    environment: 'All',
  })
  return [created, ...existing]
}

/**
 * Rename a gallery category. Slug stays the same so existing photos keep their filter.
 *
 * @param slug - Category slug
 * @param name - Display name shown on chips and gallery cards
 */
export async function updateGalleryCategoryName(
  slug: string,
  name: string
): Promise<GalleryCategory | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  await ensureGalleryTabs()
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange(CATEGORIES_TAB, 'A2:E50'),
  })
  const rows = response.data.values || []
  const index = rows.findIndex((row) => String(row[0] || '').trim().toLowerCase() === slug)
  if (index < 0) return null

  const rowNumber = index + 2
  const existing = rows[index]
  const nextName = trimmed.slice(0, 40)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange(CATEGORIES_TAB, `B${rowNumber}`),
    valueInputOption: 'RAW',
    requestBody: { values: [[nextName]] },
  })

  return {
    slug,
    name: nextName,
    sortOrder: Number(existing[2]) || 0,
    active: existing[3] === undefined || existing[3] === '' ? true : isTruthyCell(existing[3]),
    environment: String(existing[4] || 'All').trim() || 'All',
  }
}

/**
 * Re-add Gallery tab rows for photos that still exist in Blob but disappeared from the sheet.
 * Runs once; a sentinel blob prevents this from undoing later deletes.
 *
 * @param existing - Rows already in the Gallery tab
 */
async function recoverMissingGalleryItems(existing: GalleryItem[]): Promise<GalleryItem[]> {
  const orphans = await listOrphanedGalleryBlobs(existing.map((item) => item.imageUrl))
  if (orphans === null) return []

  const restored: GalleryItem[] = []
  for (let index = 0; index < orphans.length; index++) {
    const orphan = orphans[index]
    const suffix = orphan.url.replace(/[^a-zA-Z0-9]/g, '').slice(-12) || String(index)
    restored.push(
      await restoreGalleryItem({
        id: `g-rec-${suffix}`,
        categorySlug: 'balloons',
        imageUrl: orphan.url,
        caption: orphan.caption,
        featured: false,
        homeHero: false,
        heroVideoPlay: 'delay',
        status: 'Public',
        price: 0,
        createdAt: orphan.createdAt,
        environment: getSheetEnvironmentLabel(),
      })
    )
  }
  await markGalleryBlobRecoveryDone()
  return restored
}

/**
 * Load gallery items. Drafts are hidden in production unless includeDrafts is set (admin).
 *
 * @param includeDrafts - When true, return Draft rows as well
 */
export async function fetchGalleryItems(includeDrafts = false): Promise<GalleryItem[]> {
  try {
    await ensureGalleryTabs()
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('config')
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange(ITEMS_TAB, 'A2:K'),
    })
    const rows = response.data.values || []
    const environment = getEnvironment()

    const allItems = rows
      .map(parseGalleryRow)
      .filter((item): item is GalleryItem => Boolean(item))

    let combined = allItems
    if (includeDrafts) {
      const recovered = await recoverMissingGalleryItems(allItems).catch((error) => {
        console.error('[gallery] Blob recovery failed:', error)
        return [] as GalleryItem[]
      })
      combined = recovered.length > 0 ? [...recovered, ...allItems] : allItems
      combined = await ensureReedyHocoGalleryItem(combined).catch((error) => {
        console.error('[gallery] Reedy HOCO seed failed:', error)
        return combined
      })
    }

    return combined
      .filter((item) => isVisibleOnCurrentSurface(item.environment))
      .filter((item) => {
        if (includeDrafts) return true
        if (item.status === 'Draft' && environment === 'production') return false
        if (item.status === 'Draft') return false
        return true
      })
      .reverse()
  } catch (error) {
    console.error('[gallery] Failed to fetch items:', error)
    return []
  }
}

/**
 * Public gallery view: no price field.
 *
 * @param items - Full gallery items
 */
export function toPublicGalleryItems(items: GalleryItem[]): PublicGalleryItem[] {
  return items
    .filter((item) => item.status === 'Public')
    .map(({ id, categorySlug, imageUrl, caption, featured, homeHero, heroVideoPlay }) => ({
      id,
      categorySlug,
      imageUrl,
      caption,
      featured,
      homeHero,
      heroVideoPlay,
    }))
}

export interface CreateGalleryItemInput {
  categorySlug: string
  imageUrl: string
  caption: string
  featured: boolean
  homeHero?: boolean
  heroVideoPlay?: 'delay' | 'full'
  status: 'Public' | 'Draft'
  price: number
}

/**
 * Append a gallery item to the Config spreadsheet.
 *
 * @param input - New item fields
 */
export async function createGalleryItem(input: CreateGalleryItemInput): Promise<GalleryItem> {
  await ensureGalleryTabs()
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const id = `g-${Date.now().toString(36)}`
  const environment = getSheetEnvironmentLabel()
  const createdAt = new Date().toISOString()

  const heroVideoPlay = parseHeroVideoPlay(input.heroVideoPlay)

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetRange(ITEMS_TAB, 'A2'),
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        input.categorySlug,
        input.imageUrl,
        input.caption,
        input.featured ? 'TRUE' : 'FALSE',
        input.status,
        input.price || 0,
        createdAt,
        environment,
        input.homeHero ? 'TRUE' : 'FALSE',
        heroVideoPlay,
      ]],
    },
  })

  return {
    id,
    categorySlug: input.categorySlug,
    imageUrl: input.imageUrl,
    caption: input.caption,
    featured: input.featured,
    homeHero: Boolean(input.homeHero),
    heroVideoPlay,
    status: input.status,
    price: input.price || 0,
    createdAt,
    environment,
  }
}

export interface UpdateGalleryItemInput {
  id: string
  categorySlug: string
  caption: string
  featured: boolean
  homeHero: boolean
  heroVideoPlay?: 'delay' | 'full'
  status: 'Public' | 'Draft'
  price: number
}

/**
 * Update caption, category, featured flag, visibility, and internal price for an existing gallery row.
 * Image URL and createdAt stay as stored.
 *
 * @param input - Fields to write onto the matching Gallery tab row
 * @returns The updated item, or null when the id is not in the sheet
 */
export async function updateGalleryItem(input: UpdateGalleryItemInput): Promise<GalleryItem | null> {
  await ensureGalleryTabs()
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
      range: sheetRange(ITEMS_TAB, 'A2:K'),
  })
  const rows = response.data.values || []
  const index = rows.findIndex((row) => String(row[0] || '').trim() === input.id)
  if (index < 0) return null

  const existing = parseGalleryRow(rows[index])
  if (!existing) return null

  const next: GalleryItem = {
    ...existing,
    categorySlug: input.categorySlug,
    caption: input.caption,
    featured: input.featured,
    homeHero: input.homeHero,
    heroVideoPlay:
      input.heroVideoPlay !== undefined
        ? parseHeroVideoPlay(input.heroVideoPlay)
        : existing.heroVideoPlay,
    status: input.status,
    price: input.price || 0,
  }
  const rowNumber = index + 2

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange(ITEMS_TAB, `A${rowNumber}:K${rowNumber}`),
    valueInputOption: 'RAW',
    requestBody: {
      values: [galleryItemToRow(next)],
    },
  })

  return next
}

/**
 * Convert a gallery item to a Gallery tab row.
 *
 * @param item - Item to persist
 */
function galleryItemToRow(item: GalleryItem): (string | number)[] {
  return [
    item.id,
    item.categorySlug,
    item.imageUrl,
    item.caption,
    item.featured ? 'TRUE' : 'FALSE',
    item.status,
    item.price || 0,
    item.createdAt,
    item.environment || getSheetEnvironmentLabel(),
    item.homeHero ? 'TRUE' : 'FALSE',
    item.heroVideoPlay === 'full' ? 'full' : 'delay',
  ]
}

/**
 * Look up the numeric sheet id for the Gallery tab.
 */
async function getGalleryTabSheetId(): Promise<number> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  })
  const tab = meta.data.sheets?.find((sheet) => sheet.properties?.title === ITEMS_TAB)
  const sheetId = tab?.properties?.sheetId
  if (sheetId === undefined || sheetId === null) {
    throw new Error('Gallery tab was not found')
  }
  return sheetId
}

/**
 * Remove a gallery row by id.
 *
 * @param id - Gallery item id
 * @returns The deleted item, or null when the id is not in the sheet
 */
export async function deleteGalleryItem(id: string): Promise<GalleryItem | null> {
  await ensureGalleryTabs()
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
      range: sheetRange(ITEMS_TAB, 'A2:K'),
  })
  const rows = response.data.values || []
  const index = rows.findIndex((row) => String(row[0] || '').trim() === id)
  if (index < 0) return null

  const existing = parseGalleryRow(rows[index])
  if (!existing) return null

  const sheetId = await getGalleryTabSheetId()
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: index + 1,
              endIndex: index + 2,
            },
          },
        },
      ],
    },
  })

  return existing
}

/**
 * Write a previously deleted gallery item back onto the Gallery tab.
 *
 * @param item - Full item snapshot from before delete
 */
export async function restoreGalleryItem(item: GalleryItem): Promise<GalleryItem> {
  await ensureGalleryTabs()
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
      range: sheetRange(ITEMS_TAB, 'A2:K'),
  })
  const rows = response.data.values || []
  const exists = rows.some((row) => String(row[0] || '').trim() === item.id)
  if (exists) return item

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetRange(ITEMS_TAB, 'A2'),
    valueInputOption: 'RAW',
    requestBody: { values: [galleryItemToRow(item)] },
  })

  return item
}
