/**
 * API Route for fetching products
 */

import { NextResponse } from 'next/server'
import { fetchProducts } from '@/lib/googleSheets'

export async function GET() {
  try {
    const products = await fetchProducts()
    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Revalidate products every 5 minutes
export const revalidate = 300

