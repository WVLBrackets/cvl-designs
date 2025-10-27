/**
 * API Route for fetching site configuration
 */

import { NextResponse } from 'next/server'
import { fetchConfiguration } from '@/lib/googleSheets'

export async function GET() {
  try {
    const config = await fetchConfiguration()
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error fetching configuration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// Revalidate config every 10 minutes
export const revalidate = 600

