'use client'

import type { ReactNode } from 'react'
import ShowToggle from '@/components/home/ShowToggle'
import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'

interface HomeSectionProps {
  id: string
  labelledBy?: string
  visible: boolean
  visibleField: keyof HomeContent
  className?: string
  children: ReactNode
}

/**
 * Homepage section with a stable anchor and an admin show/hide control.
 */
export default function HomeSection({
  id,
  labelledBy,
  visible,
  visibleField,
  className = '',
  children,
}: HomeSectionProps) {
  const admin = useHomeAdmin()
  if (!admin && !visible) return null

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-24 ${className}`}
    >
      {admin ? (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <ShowToggle
            label="Show this section"
            checked={visible}
            onChange={(checked) => patchHomeField(admin.setContent, visibleField, checked)}
          />
        </div>
      ) : null}
      <div className={admin && !visible ? 'opacity-50' : undefined}>{children}</div>
    </section>
  )
}
