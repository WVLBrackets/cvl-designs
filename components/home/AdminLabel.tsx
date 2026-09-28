'use client'

import type { ReactNode } from 'react'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'

interface AdminLabelProps {
  label: string
  children: ReactNode
  className?: string
}

/**
 * Yellow vocabulary chip on hover/focus so admins can recall element names.
 */
export default function AdminLabel({ label, children, className = '' }: AdminLabelProps) {
  const admin = useHomeAdmin()
  if (!admin) return <>{children}</>

  return (
    <div className={`relative group/label ${className}`}>
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden whitespace-nowrap rounded bg-yellow-300 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow-sm group-hover/label:block group-focus-within/label:block">
        {label}
      </span>
      {children}
    </div>
  )
}
