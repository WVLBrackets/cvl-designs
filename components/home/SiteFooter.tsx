'use client'

import Link from 'next/link'
import { footerNavSlots } from '@/lib/homeChrome'
import type { HomeContent } from '@/lib/homeContent'

interface SiteFooterProps {
  content: HomeContent
}

/**
 * Compact marketing footer with homepage content.
 */
export default function SiteFooter({ content }: SiteFooterProps) {
  const year = new Date().getFullYear()
  const copy = content.footerText.trim() || `© ${year} ${content.headerTitle}. All rights reserved.`
  const links = footerNavSlots(content)

  return (
    <footer className="scroll-mt-20 border-t home-border home-bg-2">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm home-text-muted" aria-label="Footer">
          {links.map((item) =>
            item.label.trim() ? (
              <Link
                key={item.labelField}
                href={item.href}
                className="min-h-11 inline-flex items-center hover:opacity-80"
              >
                {item.label}
              </Link>
            ) : null
          )}
        </nav>
        <p className="text-sm home-text-muted" suppressHydrationWarning>
          {copy}
        </p>
      </div>
    </footer>
  )
}
