import type { ReactNode } from 'react'
import SiteFooter from '@/components/home/SiteFooter'
import SiteHeader from '@/components/home/SiteHeader'
import HomeBrandShell from '@/components/home/HomeBrandShell'
import type { HomeContent } from '@/lib/homeContent'

interface MarketingChromeProps {
  content: HomeContent
  showAdminLink?: boolean
  children: ReactNode
}

/**
 * Shared public chrome: brand colors, header, and footer used by Home and Studio.
 */
export default function MarketingChrome({
  content,
  showAdminLink = false,
  children,
}: MarketingChromeProps) {
  return (
    <HomeBrandShell content={content}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader content={content} showAdminLink={showAdminLink} />
      {children}
      <SiteFooter content={content} />
    </HomeBrandShell>
  )
}
