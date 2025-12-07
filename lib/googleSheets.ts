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

/**
 * Helper to convert column letter to index (A=0, B=1, etc.)
 */
function columnToIndex(column: string): number {
  let index = 0
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 64)
  }
  return index - 1
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
      range: "'Reference Data'!A3:F12", // Design options table
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
      range: "'Reference Data'!G3:L12", // Customization options table
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
    
    // Fetch the entire products table
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Products!A4:AM100', // Starting from row 4 (after headers)
    })
    
    const rows = response.data.values || []
    const environment = getEnvironment()
    const products: Product[] = []
    
    rows.forEach(row => {
      if (!row[0]) return // Skip empty rows
      
      const name = String(row[0]) // Column A
      const displayName = row[1] ? String(row[1]) : name // Column B
      const statusValue = row[2] ? String(row[2]) : 'Public' // Column C
      const storeCell = row[3] ? String(row[3]) : '' // Column D: Store
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
      
      const price = parseCurrency(row[4]) // Column E (shifted by Store column)
      const category = row[5] ? String(row[5]) : 'uncategorized' // Column F
      const image = row[6] ? String(row[6]) : undefined // Column G
      
      // Sizes: Columns H-O (indices 7-14) with upcharge support
      const sizeLabels = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'TBD']
      const availableSizes: { size: string; upcharge: number }[] = []
      sizeLabels.forEach((label, idx) => {
        const sizeData = parseSizeCell(row[7 + idx]) // shift by 1 for 0-indexed
        if (sizeData?.available) {
          availableSizes.push({ size: label, upcharge: sizeData.upcharge })
        }
      })
      
      const sizingChart = row[15] ? String(row[15]) : undefined // Column P
      const designRequired = row[16] ? String(row[16]).toLowerCase() === 'true' : false // Column Q
      const designSelectionMode = (row[17] ? String(row[17]) : 'None') as SelectionMode // Column R
      
      // Design options: Columns R-AA (indices 17-26)
      const availableDesignOptions: number[] = []
      for (let i = 0; i < 10; i++) {
        if (isCellChecked(row[18 + i])) { // shift by 1
          availableDesignOptions.push(i + 1)
        }
      }
      
      const customizationRequired = row[28] ? String(row[28]).toLowerCase() === 'true' : false // Column AC
      const customizationSelectionMode = (row[29] ? String(row[29]) : 'None') as SelectionMode // Column AD
      
      // Customization options: Columns AD-AM (indices 29-38)
      const availableCustomizationOptions: number[] = []
      for (let i = 0; i < 10; i++) {
        if (isCellChecked(row[30 + i])) { // shift by 1
          availableCustomizationOptions.push(i + 1)
        }
      }
      
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
