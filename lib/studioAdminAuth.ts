/**
 * Studio admin cookie authentication.
 * Cookie value is an HMAC of a static subject using STUDIO_ADMIN_PASSWORD.
 */

import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'cvl_studio_admin'
const COOKIE_SUBJECT = 'cvl-studio-admin-v1'

/**
 * @returns HMAC token for the configured admin password, or null if unset
 */
export function getStudioAdminToken(): string | null {
  const password = process.env.STUDIO_ADMIN_PASSWORD
  if (!password) return null
  return createHmac('sha256', password).update(COOKIE_SUBJECT).digest('hex')
}

/**
 * Compare a presented cookie to the expected admin token.
 *
 * @param cookieValue - Raw cookie string
 * @returns Whether the cookie is a valid admin session
 */
export function isValidStudioAdminCookie(cookieValue: string | undefined): boolean {
  const expected = getStudioAdminToken()
  if (!expected || !cookieValue) return false
  const presented = Buffer.from(cookieValue)
  const target = Buffer.from(expected)
  if (presented.length !== target.length) return false
  return timingSafeEqual(presented, target)
}

/**
 * Check a submitted password against STUDIO_ADMIN_PASSWORD.
 *
 * @param password - Plain-text password from the login form
 */
export function isValidStudioAdminPassword(password: string): boolean {
  const expected = process.env.STUDIO_ADMIN_PASSWORD
  if (!expected) return false
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export const STUDIO_ADMIN_COOKIE = COOKIE_NAME
