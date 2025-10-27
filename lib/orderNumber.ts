/**
 * Order Number Generation Utility
 * Format: CVL-[ENV]-[STORE]-[YYYYMMDD]-[SEQUENCE]
 * Sequence is unique per environment (PROD/PREVIEW/DEV/LOCAL)
 */

import { getSheetsClient } from './googleSheets'
import { getSheetId } from './config'

/**
 * Get the current environment name
 */
function getEnvironment(): string {
  if (process.env.VERCEL_ENV === 'production') return 'PROD'
  if (process.env.VERCEL_ENV === 'preview') return 'PREVIEW'
  if (process.env.VERCEL) return 'DEV'
  return 'LOCAL'
}

/**
 * Generate a unique order number
 * @param storeSlug - The store slug (e.g., 'phenoms', 'hooks')
 * @returns Full order number (e.g., 'CVL-PROD-PHENOMS-20250127-000001')
 */
export async function generateOrderNumber(storeSlug: string): Promise<string> {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const storeUpper = (storeSlug || 'DEFAULT').toUpperCase()
  const env = getEnvironment()
  
  // Get the next sequence number
  const sequence = await getNextSequenceNumber(env)
  const sequenceStr = sequence.toString().padStart(6, '0')
  
  return `CVL-${env}-${storeUpper}-${dateStr}-${sequenceStr}`
}

/**
 * Get the short order number (last 6 digits only) for customer-facing display
 * @param fullOrderNumber - Full order number
 * @returns Last 6 digits (e.g., '000001')
 */
export function getShortOrderNumber(fullOrderNumber: string): string {
  const parts = fullOrderNumber.split('-')
  return parts[parts.length - 1] || '000000'
}

/**
 * Get the next sequence number from Google Sheets
 * Uses append operation with row count for atomic-like behavior
 * Each environment (PROD/PREVIEW/LOCAL) has its own sequence
 */
async function getNextSequenceNumber(environment: string): Promise<number> {
  try {
    console.log(`[OrderNumber] Generating sequence for environment: ${environment}`)
    
    // For local development, use timestamp-based sequences to avoid conflicts
    if (environment === 'LOCAL') {
      const localSequence = Date.now() % 1000000
      console.log(`[OrderNumber] LOCAL environment, using timestamp: ${localSequence}`)
      return localSequence
    }
    
    const sheets = await getSheetsClient()
    const configSheetId = getSheetId('config')
    const sheetName = 'OrderSequence'
    const timestamp = new Date().toISOString()
    
    console.log(`[OrderNumber] Using sheet: ${configSheetId}`)
    
    // First, ensure the sheet exists and has headers
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: configSheetId,
        range: `${sheetName}!A1:C1`,
      })
    } catch (error: any) {
      console.log('[OrderNumber] OrderSequence sheet not found, creating...')
      
      // Create the sheet with headers
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: configSheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        })
        
        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: configSheetId,
          range: `${sheetName}!A1:C1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Timestamp', 'Environment', 'Sequence']]
          }
        })
        
        console.log('[OrderNumber] ✓ OrderSequence sheet created')
      } catch (createError) {
        console.error('[OrderNumber] Failed to create sheet:', createError)
        throw createError
      }
    }
    
    // Append first - let Google Sheets assign the row number atomically
    // This eliminates race conditions since Google handles row assignment
    console.log(`[OrderNumber] Appending to OrderSequence sheet...`)
    
    let nextSequence: number
    
    try {
      const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId: configSheetId,
        range: `${sheetName}!A2:C2`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[timestamp, environment, 'PENDING']]  // Placeholder, will update
        }
      })
      
      // Extract the row number that Google Sheets assigned
      // updatedRange format: "OrderSequence!A5:C5" (row 5)
      const updatedRange = appendResult.data.updates?.updatedRange
      if (!updatedRange) {
        throw new Error('No updatedRange returned from append operation')
      }
      
      console.log(`[OrderNumber] Updated range: ${updatedRange}`)
      
      // Extract row number (e.g., "OrderSequence!A5:C5" → "5")
      const rowMatch = updatedRange.match(/!A(\d+):/)
      if (!rowMatch) {
        throw new Error(`Could not extract row number from range: ${updatedRange}`)
      }
      
      const rowNumber = parseInt(rowMatch[1], 10)
      // Sequence is row number minus 1 (for header row)
      nextSequence = rowNumber - 1
      
      console.log(`[OrderNumber] Assigned row ${rowNumber}, sequence: ${nextSequence}`)
      
      // Update the row with the actual sequence number
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: configSheetId,
          range: `${sheetName}!C${rowNumber}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[nextSequence]]
          }
        })
        console.log(`[OrderNumber] ✓ Sequence ${nextSequence} recorded`)
      } catch (updateError) {
        console.warn('[OrderNumber] Failed to update sequence in sheet (continuing anyway):', updateError)
        // Continue anyway - we have the sequence from the row number
      }
      
    } catch (appendError) {
      console.error('[OrderNumber] Failed to append to OrderSequence:', appendError)
      throw appendError
    }
    
    return nextSequence
    
  } catch (error) {
    console.error('[OrderNumber] ❌ Error generating sequence number:', error)
    console.error('[OrderNumber] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error
    })
    
    // Fallback to timestamp-based sequence if Google Sheets fails
    const fallbackSequence = Date.now() % 1000000
    console.log(`[OrderNumber] Using fallback sequence: ${fallbackSequence}`)
    return fallbackSequence
  }
}

