/**
 * Studio admin login
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  STUDIO_ADMIN_COOKIE,
  getStudioAdminToken,
  isValidStudioAdminPassword,
} from '@/lib/studioAdminAuth'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const rate = checkRateLimit(`studio-admin:${ip}`, { maxRequests: 8, windowMs: 60 * 1000 })
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Try again shortly.' }, { status: 429 })
  }

  if (!process.env.STUDIO_ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: 'STUDIO_ADMIN_PASSWORD is not configured' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''
  if (!isValidStudioAdminPassword(password)) {
    return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
  }

  const token = getStudioAdminToken()
  const response = NextResponse.json({ success: true })
  response.cookies.set(STUDIO_ADMIN_COOKIE, token as string, {
    httpOnly: true,
    secure: Boolean(process.env.VERCEL),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
