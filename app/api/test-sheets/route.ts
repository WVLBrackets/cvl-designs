/**
 * Test Google Sheets Connection
 */

import { NextResponse } from 'next/server'
import { fetchConfiguration, fetchStores } from '@/lib/googleSheets'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envVarsPresent: {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_CONFIG_ID: !!process.env.GOOGLE_SHEET_CONFIG_ID,
      GOOGLE_SHEET_PRODUCTS_ID: !!process.env.GOOGLE_SHEET_PRODUCTS_ID,
      GOOGLE_SHEET_ORDERS_DEV_ID: !!process.env.GOOGLE_SHEET_ORDERS_DEV_ID,
      GOOGLE_SHEET_ORDERS_PROD_ID: !!process.env.GOOGLE_SHEET_ORDERS_PROD_ID,
    },
  }

  // Test config fetch
  try {
    const config = await fetchConfiguration()
    results.configTest = {
      success: true,
      keysFound: Object.keys(config).length,
      sampleKeys: Object.keys(config).slice(0, 5),
    }
  } catch (error: any) {
    results.configTest = {
      success: false,
      error: error.message,
      stack: error.stack,
    }
  }

  // Test stores fetch
  try {
    const stores = await fetchStores()
    results.storesTest = {
      success: true,
      storesFound: stores.length,
      storeNames: stores.map(s => s.slug || s['Display Name'] || 'unnamed'),
    }
  } catch (error: any) {
    results.storesTest = {
      success: false,
      error: error.message,
      stack: error.stack,
    }
  }

  return NextResponse.json(results, { status: 200 })
}

