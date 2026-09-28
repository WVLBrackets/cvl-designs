/**
 * Legacy /about URL — About now lives on the homepage.
 */

import { redirect } from 'next/navigation'

export default function AboutRedirect() {
  redirect('/home#about')
}
