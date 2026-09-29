'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'
import { defaultHomeContent } from '@/lib/homeContent'
import { headerNavSlots, navHrefIsActive, type ChromeLinkSlot } from '@/lib/homeChrome'

interface SiteHeaderProps {
  content: HomeContent
  showAdminLink?: boolean
  /** Public look even inside Home Admin (no inline editors). */
  preview?: boolean
}

const brandLinkClass =
  'inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** Shared header-icon height. Width follows each image’s aspect ratio. */
const HEADER_ICON_CLASS = 'h-14 w-auto object-contain object-left sm:h-16'

/**
 * Classes for a primary nav link, including the current-page callout.
 *
 * @param active - Whether this destination is the current view
 */
function navClass(active: boolean): string {
  return active
    ? 'rounded-full px-3 py-1 text-sm font-semibold text-white home-accent-bg'
    : 'rounded-full px-3 py-1 text-sm font-medium home-text-muted'
}

/**
 * Header nav that reads the query string for studio category matching.
 */
function HeaderNavLinks({
  nav,
  adminNav,
  pathname,
  onNavigate,
}: {
  nav: ChromeLinkSlot[]
  adminNav: boolean
  pathname: string
  onNavigate?: () => void
}) {
  const searchParams = useSearchParams()
  const search = searchParams?.toString() || ''
  const [hash, setHash] = useState('')

  useEffect(() => {
    /**
     * Keep hash-based nav (About) in sync when the user jumps on the homepage.
     */
    function updateHash() {
      setHash(window.location.hash)
    }
    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [pathname, search])

  return (
    <>
      {nav.map((item) =>
        item.label.trim() ? (
          <Link
            key={item.labelField}
            href={item.href}
            className={navClass(navHrefIsActive(item.href, pathname, search, hash))}
            aria-current={navHrefIsActive(item.href, pathname, search, hash) ? 'page' : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        ) : null
      )}
      {adminNav ? (
        <Link href="/admin" className="rounded-full px-3 py-1 text-sm font-medium home-text-muted" onClick={onNavigate}>
          Admin
        </Link>
      ) : null}
    </>
  )
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
  const pathname = usePathname() || '/'
  const onHome = pathname === '/home'
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

  const icon1 = (
    <Image
      src={copy.headerLogoSrc}
      alt=""
      width={64}
      height={64}
      className={HEADER_ICON_CLASS}
    />
  )

  const icon2 = copy.showHeaderIcon2 ? (
    <Image
      src={copy.headerLogo2Src}
      alt=""
      width={214}
      height={64}
      className={HEADER_ICON_CLASS}
    />
  ) : null

  const title = (
    <span className="truncate text-sm font-semibold home-text sm:text-base">{copy.headerTitle}</span>
  )

  const house = copy.showHeaderHouse ? (
    <svg viewBox="0 0 24 24" className="h-8 w-8 flex-shrink-0 fill-current home-text sm:h-9 sm:w-9" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  ) : null

  const brandItems = (
    <>
      {editing ? (
        icon1
      ) : (
        <Link href="/home" className={brandLinkClass} aria-label="Home">
          {icon1}
        </Link>
      )}
      {icon2
        ? editing
          ? icon2
          : (
            <Link href="/home" className={brandLinkClass} aria-label="Home">
              {icon2}
            </Link>
          )
        : null}
      {editing ? (
        title
      ) : (
        <Link
          href="/home"
          className={`${brandLinkClass} min-w-0`}
          aria-label={`${copy.headerTitle} — home`}
        >
          {title}
        </Link>
      )}
      {house
        ? editing
          ? house
          : (
            <Link
              href="/home"
              className={brandLinkClass}
              aria-current={onHome ? 'page' : undefined}
              aria-label="Home"
            >
              {house}
            </Link>
          )
        : null}
    </>
  )

  return (
    <header className="sticky top-0 z-40 home-bg border-b home-border">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-1">{brandItems}</div>

        <nav className="ml-auto hidden items-center gap-2 lg:flex" aria-label="Primary">
          <Suspense fallback={null}>
            <HeaderNavLinks nav={nav} adminNav={adminNav} pathname={pathname} />
          </Suspense>
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
        <nav id="home-mobile-nav" className="border-t home-border px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            <Suspense fallback={null}>
              <HeaderNavLinks
                nav={nav}
                adminNav={adminNav}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </Suspense>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
