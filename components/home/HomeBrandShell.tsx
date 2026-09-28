'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { HomeContent } from '@/lib/homeContent'

interface HomeBrandShellProps {
  content: HomeContent
  children: ReactNode
  className?: string
}

/**
 * Apply homepage color tokens as CSS variables for public and admin views.
 */
export default function HomeBrandShell({ content, children, className = '' }: HomeBrandShellProps) {
  const style = {
    '--home-bg': content.colorBackground,
    '--home-bg-2': content.colorBackground2,
    '--home-accent': content.colorAccent,
    '--home-text': content.colorText,
  } as CSSProperties

  return (
    <div className={`home-brand min-h-screen ${className}`} style={style}>
      {children}
    </div>
  )
}
