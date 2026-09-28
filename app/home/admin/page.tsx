/**
 * Old homepage admin URL. Send editors to /admin/home.
 */

import { redirect } from 'next/navigation'

export default function LegacyHomeAdminPage() {
  redirect('/admin/home')
}
