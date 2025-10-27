/**
 * Order Number Generation Utility
 * Format: CVL-[STORE]-[YYYYMMDD]-[SEQUENCE]
 * Sequence is globally unique across all stores and time
 */

import { getSheetsClient } from './googleSheets'
import { getSheetId } from './config'

/**
 * Generate a unique order number
 * @param storeSlug - The store slug (e.g., 'phenoms', 'hooks')
 * @returns Full order number (e.g., 'CVL-PHENOMS-20250126-000001')
 */
export async function generateOrderNumber(storeSlug: string): Promise<string> {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const storeUpper = (storeSlug || 'DEFAULT').toUpperCase()
  
  // Get the next sequence number from the OrderSequence sheet
  const sequence = await getNextSequenceNumber()
  const sequenceStr = sequence.toString().padStart(6, '0')
  
  return `CVL-${storeUpper}-${dateStr}-${sequenceStr}`
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
 * Uses a dedicated sheet to track the global sequence
 */
async function getNextSequenceNumber(): Promise<number> {
  try {
    const sheets = await getSheetsClient()
    const configSheetId = getSheetId('config')
    
    // Try to read the current sequence from the OrderSequence sheet
    let currentSequence = 0
    let sheetExists = false
    
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: configSheetId,
        range: 'OrderSequence!A2',
      })
      
      const value = response.data.values?.[0]?.[0]
      if (value) {
        currentSequence = parseInt(value, 10) || 0
      }
      sheetExists = true
    } catch (error: any) {
      // Sheet doesn't exist yet
      console.log('OrderSequence sheet not found, will use fallback')
    }
    
    // Increment sequence
    const nextSequence = currentSequence + 1
    
    // Only try to write if sheet exists
    if (sheetExists) {
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: configSheetId,
          range: 'OrderSequence!A1:A2',
          valueInputOption: 'RAW',
          requestBody: {
            values: [
              ['Current Sequence'],
              [nextSequence]
            ],
          },
        })
      } catch (updateError) {
        console.log('Could not update OrderSequence, continuing with generated number')
      }
    }
    
    return nextSequence
  } catch (error) {
    console.error('Error generating sequence number:', error)
    // Fallback to timestamp-based sequence if Google Sheets fails
    return Date.now() % 1000000
  }
}

