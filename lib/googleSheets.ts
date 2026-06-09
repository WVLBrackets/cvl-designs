/**
 * Google Sheets integration utilities for CVL Designs
 */

import { google } from 'googleapis'
import { getGoogleSheetsConfig, getSheetId, getEnvironment } from './config'
import type { 
  Product, 
  Order, 
  SiteConfiguration, 
  ProductStatus, 
  DesignOption, 
  CustomizationOption,
  Category,
  SelectionMode 
} from './types'
/**
 * Fetch stores from Products sheet (tab: Stores)
 */
export async function fetchStores(): Promise<Array<Record<string, string>>> {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('products')
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A1:Z200",
    })
    const rows = response.data.values || []
    if (rows.length < 2) return []
    const headers = rows[0].map(h => String(h).trim())
    const data = rows.slice(1).map(r => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        obj[h] = String(r[i] ?? '').trim()
      })
      return obj
    })
    return data
  } catch (e) {
    console.error('Error fetching stores:', e)
    return []
  }
}

/**
 * Merge store overrides into global config
 */
export async function fetchMergedConfigForStore(storeSlug?: string): Promise<SiteConfiguration> {
  const base = await fetchConfiguration()
  if (!storeSlug) return base
  const stores = await fetchStores()
  const match = stores.find(s => s.slug && s.slug.toLowerCase() === storeSlug.toLowerCase())
  if (!match || match.slug.toLowerCase() === 'all') return base
  const merged: SiteConfiguration = { ...base }
  // Apply only known fields
  const map: Record<string, string> = {
    'Header Logo': 'Store_Header_Logo',
    'Header Store Subtitle': 'Header_Store_Subtitle',
    'Display Name': 'Store_Display_Name',
    'Primary Color': 'Store_Primary_Color',
    'Accent Color': 'Store_Accent_Color',
  }
  Object.entries(map).forEach(([from, to]) => {
    const val = match[from]
    if (val) (merged as any)[to] = val
  })
  ;(merged as any)['Store_Slug'] = match.slug
  return merged
}

/**
 * Get authenticated Google Sheets client
 */
export async function getSheetsClient() {
  const { serviceAccountEmail, privateKey } = getGoogleSheetsConfig()
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  
  return google.sheets({ version: 'v4', auth })
}

/** Products tab column indices (0-based; row 3 = headers, row 4+ = data) */
const PRODUCT_COL = {
  NAME: 0, // A
  DISPLAY_NAME: 1, // B
  STATUS: 2, // C
  STORE: 3, // D
  PRICE: 4, // E
  CATEGORY: 5, // F
  IMAGE: 6, // G
  SIZE_START: 7, // H
  SIZE_END: 16, // Q (10 size columns)
  SIZING_CHART: 17, // R
  DESIGN_REQUIRED: 18, // S
  DESIGN_SELECTION_MODE: 19, // T
  DESIGN_OPTIONS_START: 20, // U
  DESIGN_OPTIONS_COUNT: 12, // U–AD
  CUSTOMIZATION_REQUIRED: 30, // AE
  CUSTOMIZATION_SELECTION_MODE: 31, // AF
  CUSTOMIZATION_OPTIONS_START: 32, // AG
  CUSTOMIZATION_OPTIONS_COUNT: 12, // AG–AP
} as const

const DESIGN_OPTION_COUNT = 12
const CUSTOMIZATION_OPTION_COUNT = 12

/**
 * Parse a True/False cell from the Products sheet
 */
function parseBooleanCell(value: unknown): boolean {
  if (!value) return false
  return String(value).toLowerCase().trim() === 'true'
}

/**
 * Parse Single / Multi / None selection mode from a Products sheet cell
 */
function parseSelectionMode(value: unknown): SelectionMode {
  if (!value) return 'None'
  const str = String(value).trim()
  const normalized = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  if (normalized === 'Single' || normalized === 'Multi' || normalized === 'None') {
    return normalized
  }
  return 'None'
}

/**
 * Read size labels from Products header row (sheet row 3), columns H–Q
 */
function parseSizeLabelsFromHeader(headerRow: unknown[]): string[] {
  const labels: string[] = []
  for (let col = PRODUCT_COL.SIZE_START; col <= PRODUCT_COL.SIZE_END; col++) {
    const label = headerRow[col] ? String(headerRow[col]).trim() : ''
    labels.push(label)
  }
  return labels
}

/**
 * Build available sizes for a product row using header labels and size column cells
 */
function parseAvailableSizes(
  row: unknown[],
  sizeLabels: string[]
): { size: string; upcharge: number }[] {
  const availableSizes: { size: string; upcharge: number }[] = []
  sizeLabels.forEach((label, idx) => {
    if (!label) return
    const col = PRODUCT_COL.SIZE_START + idx
    const sizeData = parseSizeCell(row[col])
    if (sizeData?.available) {
      availableSizes.push({ size: label, upcharge: sizeData.upcharge })
    }
  })
  return availableSizes
}

/**
 * Collect checked option numbers from a contiguous checkbox column range
 */
function parseCheckedOptions(
  row: unknown[],
  startCol: number,
  count: number
): number[] {
  const options: number[] = []
  for (let i = 0; i < count; i++) {
    if (isCellChecked(row[startCol + i])) {
      options.push(i + 1)
    }
  }
  return options
}

/**
 * Helper to parse currency values from Google Sheets
 * Handles formats like "$25.00", "25.00", "$25", "25"
 */
function parseCurrency(value: any): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  
  // Convert to string and remove currency symbols, commas, and whitespace
  const cleaned = String(value).replace(/[$,\s]/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Helper to check if a cell value represents a checked checkbox
 */
function isCellChecked(value: any): boolean {
  if (!value) return false
  const str = String(value).toLowerCase().trim()
  return str === 'x' || str === 'true' || str === '1'
}

/**
 * Parse a size cell value to determine availability and upcharge
 * @param value - Cell value from spreadsheet
 * @returns { available: boolean, upcharge: number } or null if not available
 * 
 * Cell value interpretation:
 * - Empty/null: Not available
 * - "x" or "X": Available, no upcharge
 * - "0": Available, no upcharge  
 * - Any positive number (e.g., "2", "3.50"): Available with that $ upcharge
 */
function parseSizeCell(value: any): { available: boolean; upcharge: number } | null {
  if (!value) return null
  
  const str = String(value).trim()
  if (!str) return null
  
  // Check for "x" or "X" (available, no upcharge)
  if (str.toLowerCase() === 'x') {
    return { available: true, upcharge: 0 }
  }
  
  // Try to parse as a number
  const num = parseFloat(str)
  if (!isNaN(num)) {
    // Any number (including 0) means available
    return { available: true, upcharge: Math.max(0, num) }
  }
  
  // If it's "true" or "1", treat as available with no upcharge (legacy support)
  if (str.toLowerCase() === 'true' || str === '1') {
    return { available: true, upcharge: 0 }
  }
  
  return null
}

/**
 * Fetch configuration from Google Sheets
 */
export async function fetchConfiguration(): Promise<SiteConfiguration> {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('config')
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:B100', // Assuming Attribute in A, Value in B, starting from row 2
    })
    
    const rows = response.data.values || []
    const config: SiteConfiguration = {}
    
    rows.forEach(row => {
      const [attribute, value] = row
      if (attribute && value !== undefined) {
        config[attribute] = value
      }
    })
    
    return config
  } catch (error) {
    console.error('Error fetching configuration:', error)
    return {}
  }
}

/**
 * Fetch categories from Reference Data tab, Column M only
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('products')
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Reference Data'!M2:M100", // Categories in column M (scan broader range)
    })
    
    const rows = response.data.values || []
    const categories: Category[] = []
    
    rows.forEach((row, index) => {
      const categoryValue = row[0]
      if (categoryValue) {
        const value = String(categoryValue).trim()
        const displayName = value.charAt(0).toUpperCase() + value.slice(1)
        
        categories.push({
          id: value,
          name: displayName,
          displayOrder: index,
        })
      }
    })
    
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Fetch design options from Reference Data tab
 */
export async function fetchDesignOptions(): Promise<DesignOption[]> {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('products')
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Reference Data'!A3:F${2 + DESIGN_OPTION_COUNT}`, // Design options 1–12
    })
    
    const rows = response.data.values || []
    const options: DesignOption[] = []
    
    rows.forEach(row => {
      const [number, title, short, price, image] = row
      if (number && title) {
        options.push({
          number: Number(number),
          title: String(title),
          short: String(short || ''),
          price: parseCurrency(price),
          image: image ? String(image) : undefined,
        })
      }
    })
    
    return options
  } catch (error) {
    console.error('Error fetching design options:', error)
    return []
  }
}

/**
 * Fetch customization options from Reference Data tab
 */
export async function fetchCustomizationOptions(): Promise<CustomizationOption[]> {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('products')
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Reference Data'!G3:L${2 + CUSTOMIZATION_OPTION_COUNT}`, // Customization options 1–12
    })
    
    const rows = response.data.values || []
    const options: CustomizationOption[] = []
    
    rows.forEach(row => {
      const [number, title, short, price, image] = row
      if (number && title) {
        const titleLower = String(title).toLowerCase()
        let requiresInput: 'name' | 'number' | 'both' | 'none' = 'none'
        
        if (titleLower.includes('name') && titleLower.includes('number')) {
          requiresInput = 'both'
        } else if (titleLower.includes('name')) {
          requiresInput = 'name'
        } else if (titleLower.includes('number')) {
          requiresInput = 'number'
        }
        
        options.push({
          number: Number(number),
          title: String(title),
          short: String(short || ''),
          price: parseCurrency(price),
          image: image ? String(image) : undefined,
          requiresInput,
        })
      }
    })
    
    return options
  } catch (error) {
    console.error('Error fetching customization options:', error)
    return []
  }
}

/**
 * Fetch products from Google Sheets with environment-based filtering
 */
export async function fetchProducts(storeSlug?: string): Promise<Product[]> {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSheetId('products')
    
    // Row 3 = headers (size labels), row 4+ = product data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Products!A3:AP100',
    })
    
    const rows = response.data.values || []
    if (rows.length < 2) return []

    const headerRow = rows[0]
    const sizeLabels = parseSizeLabelsFromHeader(headerRow)
    const dataRows = rows.slice(1)
    const environment = getEnvironment()
    const products: Product[] = []
    
    dataRows.forEach(row => {
      if (!row[PRODUCT_COL.NAME]) return // Skip empty rows
      
      const name = String(row[PRODUCT_COL.NAME])
      const displayName = row[PRODUCT_COL.DISPLAY_NAME] ? String(row[PRODUCT_COL.DISPLAY_NAME]) : name
      const statusValue = row[PRODUCT_COL.STATUS] ? String(row[PRODUCT_COL.STATUS]) : 'Public'
      const storeCell = row[PRODUCT_COL.STORE] ? String(row[PRODUCT_COL.STORE]) : ''
      const status: ProductStatus = statusValue.toLowerCase() === 'draft' ? 'PREVIEW' : 'PROD'
      
      // Filter based on environment
      if (status === 'PREVIEW' && environment === 'production') {
        return
      }

      // Store filtering
      if (storeSlug) {
        const tokens = storeCell
          .split(/[,\n]/)
          .map(t => t.trim().toLowerCase())
          .filter(Boolean)
        const hasAll = tokens.includes('all')
        const allowed = hasAll || tokens.includes(storeSlug.toLowerCase())
        if (!allowed) return
      } else {
        // No store specified: show only 'all' products by default
        const tokens = storeCell
          .split(/[,\n]/)
          .map(t => t.trim().toLowerCase())
          .filter(Boolean)
        if (tokens.length > 0 && !tokens.includes('all')) return
      }
      
      const price = parseCurrency(row[PRODUCT_COL.PRICE])
      const category = row[PRODUCT_COL.CATEGORY] ? String(row[PRODUCT_COL.CATEGORY]) : 'uncategorized'
      const image = row[PRODUCT_COL.IMAGE] ? String(row[PRODUCT_COL.IMAGE]) : undefined
      
      const availableSizes = parseAvailableSizes(row, sizeLabels)
      
      const sizingChart = row[PRODUCT_COL.SIZING_CHART]
        ? String(row[PRODUCT_COL.SIZING_CHART]).trim()
        : undefined
      const designRequired = parseBooleanCell(row[PRODUCT_COL.DESIGN_REQUIRED])
      const designSelectionMode = parseSelectionMode(row[PRODUCT_COL.DESIGN_SELECTION_MODE])
      
      const availableDesignOptions = parseCheckedOptions(
        row,
        PRODUCT_COL.DESIGN_OPTIONS_START,
        PRODUCT_COL.DESIGN_OPTIONS_COUNT
      )
      
      const customizationRequired = parseBooleanCell(row[PRODUCT_COL.CUSTOMIZATION_REQUIRED])
      const customizationSelectionMode = parseSelectionMode(row[PRODUCT_COL.CUSTOMIZATION_SELECTION_MODE])
      
      const availableCustomizationOptions = parseCheckedOptions(
        row,
        PRODUCT_COL.CUSTOMIZATION_OPTIONS_START,
        PRODUCT_COL.CUSTOMIZATION_OPTIONS_COUNT
      )
      
      const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      products.push({
        id,
        name,
        displayName,
        category,
        price,
        status,
        image,
        availableSizes,
        sizingChart,
        availableDesignOptions,
        designRequired,
        designSelectionMode,
        availableCustomizationOptions,
        customizationRequired,
        customizationSelectionMode,
      })
    })
    
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

/**
 * Submit an order to Google Sheets
 */
export async function submitOrder(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[submitOrder] Starting order submission...')
    console.log('[submitOrder] Order environment:', order.environment)
    console.log('[submitOrder] VERCEL_ENV:', process.env.VERCEL_ENV || 'not set (local)')
    console.log('[submitOrder] Order items count:', order.items.length)
    
    const sheets = await getSheetsClient()
    console.log('[submitOrder] ✓ Google Sheets client initialized')
    
    const spreadsheetId = getSheetId('orders')
    console.log('[submitOrder] Target spreadsheet ID:', spreadsheetId)
    console.log('[submitOrder] Sheet mapping: production→PROD, preview→PREVIEW, other→DEV')
    
    // Prepare rows for each item (repeat rows for quantities > 1)
    console.log('[submitOrder] Preparing order rows...')
    const rows: any[] = []
    
    order.items.forEach((item) => {
      const designOptionsText = item.designOptions.length > 0
        ? item.designOptions.map(opt => opt.title).join(', ')
        : 'None'
      
      const customizationOptionsText = item.customizationOptions.length > 0
        ? item.customizationOptions.map(opt => opt.title).join(', ')
        : 'None'
      
      const customizationDetails = item.customizationOptions.length > 0
        ? item.customizationOptions
            .map(opt => {
              const parts = []
              if (opt.customName) parts.push(`Name: ${opt.customName}`)
              if (opt.customNumber) parts.push(`Number: ${opt.customNumber}`)
              return parts.length > 0 ? `${opt.title} (${parts.join(', ')})` : opt.title
            })
            .join(' | ')
        : 'N/A'
      
      // Repeat row for each quantity
      for (let q = 0; q < item.quantity; q++) {
        rows.push([
          (order as any).orderNumber || 'N/A', // Show order number on ALL rows
          order.orderDate,
          order.environment,
          order.storeSlug || '',
          order.contactInfo.email,
          order.contactInfo.parentFirstName,
          order.contactInfo.parentLastName,
          order.contactInfo.phoneNumber,
          item.productName,
          item.size,
          1, // Always 1 since we're repeating rows
          item.itemPrice,
          designOptionsText,
          item.designOptionsTotal,
          customizationOptionsText,
          customizationDetails,
          item.customizationOptionsTotal,
          item.totalPrice,
          order.totalAmount, // Show total on ALL rows
          (order as any).invoiceFilename || '', // Show invoice filename on ALL rows
        ])
      }
    })
    
    console.log('[submitOrder] Total rows to append:', rows.length)
    
    // Append rows with timeout
    console.log('[submitOrder] Appending rows to sheet...')
    try {
      const appendPromise = sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A2:T2',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Append timeout after 3s')), 3000)
      )
      
      await Promise.race([appendPromise, timeoutPromise])
      console.log('[submitOrder] ✓ Rows appended successfully')
    } catch (appendError: any) {
      console.log('[submitOrder] ⚠️ Append timeout, but data likely saved:', appendError?.message)
      // Continue anyway - the data is probably saved even if the API response is slow
    }
    
    return { success: true }
  } catch (error) {
    console.error('[submitOrder] ❌ Error submitting order:', error)
    console.error('[submitOrder] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[submitOrder] Error message:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('[submitOrder] Error stack:', error.stack)
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}
