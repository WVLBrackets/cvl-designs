'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'
import { defaultHomeContent } from '@/lib/homeContent'
import { headerNavSlots } from '@/lib/homeChrome'

interface SiteHeaderProps {
  content: HomeContent
  showAdminLink?: boolean
  /** Public look even inside Home Admin (no inline editors). */
  preview?: boolean
}

/**
 * Compact marketing header with an accessible mobile menu.
 */
export default function SiteHeader({
  content,
  showAdminLink,
  preview = false,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const admin = useHomeAdmin()
  const editing = Boolean(admin) && !preview
  const copy = content || defaultHomeContent()
  const [adminNav, setAdminNav] = useState(
    preview ? false : Boolean(showAdminLink) || Boolean(admin)
  )

  useEffect(() => {
    if (preview) {
      setAdminNav(false)
      return
    }
    if (showAdminLink || admin) {
      setAdminNav(true)
      return
    }
    if (showAdminLink === false) {
      setAdminNav(false)
      return
    }
    let cancelled = false
    fetch('/api/studio/admin/session')
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled) setAdminNav(Boolean(result.authenticated))
      })
      .catch(() => {
        if (!cancelled) setAdminNav(false)
      })
    return () => {
      cancelled = true
    }
  }, [admin, preview, showAdminLink])

  const nav = headerNavSlots(copy)

  const brand = (
    <>
      <span className="relative h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10">
        <Image
          src={copy.headerLogoSrc}
          alt=""
          fill
          sizes="40px"
          className="object-contain"
        />
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm font-semibold home-text sm:text-base">{copy.headerTitle}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 flex-shrink-0 fill-current home-text sm:h-9 sm:w-9"
          aria-hidden="true"
        >
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      </span>
    </>
  )

  return (
    <header className="home-bg border-b home-border">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
        {editing ? (
          <div className="flex min-w-0 items-center gap-2">{brand}</div>
        ) : (
          <Link
            href="/home"
            className="flex min-w-0 items-center gap-2 rounded-md hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            title="Home"
            aria-label={`${copy.headerTitle} — home`}
          >
            {brand}
          </Link>
        )}

        <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Primary">
          {nav.map((item) =>
            item.label.trim() ? (
              <Link
                key={item.labelField}
                href={item.href}
                className="text-sm font-medium home-text-muted hover:home-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 home-accent"
              >
                {item.label}
              </Link>
            ) : null
          )}
          {adminNav ? (
            <Link
              href="/admin"
              className="text-sm font-medium home-text-muted hover:home-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 home-accent"
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <button
          type="button"
          className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border home-border home-text lg:hidden"
          aria-expanded={open}
          aria-controls="home-mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden className="text-lg leading-none">
            {open ? '×' : '☰'}
          </span>
        </button>
      </div>

      {open ? (
        <nav
          id="home-mobile-nav"
          className="border-t home-border px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col">
            {nav.map((item) =>
              item.label.trim() ? (
                <li key={item.labelField}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center py-2 text-base font-medium home-text"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ) : null
            )}
            {adminNav ? (
              <li>
                <Link
                  href="/admin"
                  className="flex min-h-11 items-center py-2 text-base font-medium home-text"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
