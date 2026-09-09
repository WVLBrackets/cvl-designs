/**
 * Studio gallery stored in the Config spreadsheet (Gallery + Gallery Categories tabs).
 * Price is persisted for later ordering but omitted from public fetch helpers.
 */

import { getSheetsClient } from './googleSheets'
import { getSheetId, getEnvironment } from './config'
import type { GalleryCategory, GalleryItem, PublicGalleryItem } from './types'

const CATEGORIES_TAB = 'Gallery Categories'
const ITEMS_TAB = 'Gallery'

const DEFAULT_CATEGORIES: GalleryCategory[] = [
  { slug: 'balloons', name: 'Balloons', sortOrder: 1, active: true },
  { slug: 'banners', name: 'Banners', sortOrder: 2, active: true },
]

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
async function ensureTab(title: string, headers: string[]): Promise<void> {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')

  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A1:A1`,
    })
  } catch {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    })
  }
}

/**
 * Ensure gallery tabs exist and seed default categories when the category tab is empty.
 */
async function ensureGalleryTabs(): Promise<void> {
  await ensureTab(CATEGORIES_TAB, ['slug', 'name', 'sortOrder', 'active'])
  await ensureTab(ITEMS_TAB, [
    'id',
    'categorySlug',
    'imageUrl',
    'caption',
    'featured',
    'status',
    'price',
    'createdAt',
  ])

  const sheets = await getSheetsClient()
  const spreadsheetId = getSheetId('config')
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${CATEGORIES_TAB}!A2:A10`,
  })
  if ((existing.data.values || []).length > 0) return

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${CATEGORIES_TAB}!A2`,
    valueInputOption: 'RAW',
    requestBody: {
      values: DEFAULT_CATEGORIES.map((c) => [c.slug, c.name, c.sortOrder, 'TRUE']),
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
      range: `${CATEGORIES_TAB}!A1:D50`,
    })
    const rows = response.data.values || []
    if (rows.length < 2) return DEFAULT_CATEGORIES

    const categories: GalleryCategory[] = rows.slice(1).flatMap((row) => {
      const slug = String(row[0] || '').trim().toLowerCase()
      if (!slug) return []
      return [
        {
          slug,
          name: String(row[1] || slug).trim(),
          sortOrder: Number(row[2]) || 0,
          active: row[3] === undefined || row[3] === '' ? true : isTruthyCell(row[3]),
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
    status,
    price: Number(String(row[6] || '0').replace(/[$,]/g, '')) || 0,
    createdAt: String(row[7] || '').trim(),
  }
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
      range: `${ITEMS_TAB}!A2:H200`,
    })
    const rows = response.data.values || []
    const environment = getEnvironment()

    return rows
      .map(parseGalleryRow)
      .filter((item): item is GalleryItem => Boolean(item))
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
    .map(({ id, categorySlug, imageUrl, caption, featured }) => ({
      id,
      categorySlug,
      imageUrl,
      caption,
      featured,
    }))
}

export interface CreateGalleryItemInput {
  categorySlug: string
  imageUrl: string
  caption: string
  featured: boolean
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
  const createdAt = new Date().toISOString()

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${ITEMS_TAB}!A2`,
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
      ]],
    },
  })

  return {
    id,
    categorySlug: input.categorySlug,
    imageUrl: input.imageUrl,
    caption: input.caption,
    featured: input.featured,
    status: input.status,
    price: input.price || 0,
    createdAt,
  }
}

export interface UpdateGalleryItemInput {
  id: string
  categorySlug: string
  caption: string
  featured: boolean
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
    range: `${ITEMS_TAB}!A2:H200`,
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
    status: input.status,
    price: input.price || 0,
  }
  const rowNumber = index + 2

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${ITEMS_TAB}!A${rowNumber}:H${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        next.id,
        next.categorySlug,
        next.imageUrl,
        next.caption,
        next.featured ? 'TRUE' : 'FALSE',
        next.status,
        next.price || 0,
        next.createdAt,
      ]],
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
    range: `${ITEMS_TAB}!A2:H200`,
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
    range: `${ITEMS_TAB}!A2:H200`,
  })
  const rows = response.data.values || []
  const exists = rows.some((row) => String(row[0] || '').trim() === item.id)
  if (exists) return item

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${ITEMS_TAB}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: [galleryItemToRow(item)] },
  })

  return item
}
