/**
 * Lightweight admin session probe for the public header Admin link.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'

export async function GET() {
  const authed = isValidStudioAdminCookie(cookies().get(STUDIO_ADMIN_COOKIE)?.value)
  return NextResponse.json({ authenticated: authed })
}
