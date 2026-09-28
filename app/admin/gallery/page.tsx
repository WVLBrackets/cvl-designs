/**
 * Gallery admin shortcut from the /admin hub.
 */

import { redirect } from 'next/navigation'

export default function AdminGalleryPage() {
  redirect('/studio/admin')
}
