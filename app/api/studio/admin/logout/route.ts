/**
 * Studio admin logout
 */

import { NextResponse } from 'next/server'
import { STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(STUDIO_ADMIN_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return response
}
