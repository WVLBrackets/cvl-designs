/**
 * Server helper for the shared studio/homepage admin cookie.
 */

import { cookies } from 'next/headers'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'

/**
 * Whether the current request has a valid admin session cookie.
 */
export function hasAdminSession(): boolean {
  return isValidStudioAdminCookie(cookies().get(STUDIO_ADMIN_COOKIE)?.value)
}
