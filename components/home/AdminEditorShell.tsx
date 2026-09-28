'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import SiteFooter from '@/components/home/SiteFooter'
import SiteHeader from '@/components/home/SiteHeader'
import HeaderAdminPanel from '@/components/home/HeaderAdminPanel'
import FooterAdminPanel from '@/components/home/FooterAdminPanel'
import HomeBrandShell from '@/components/home/HomeBrandShell'
import HomeColorFields from '@/components/home/HomeColorFields'
import AdminChromeLabel from '@/components/home/AdminChromeLabel'
import { HomeAdminProvider, patchHomeField, patchOffering } from '@/components/home/HomeAdminContext'
import type { HomeContent, OfferingId } from '@/lib/homeContent'

interface AdminEditorShellProps {
  initialContent: HomeContent
  notice?: string
  savedMessage?: string
  /** Site colors, header/footer preview, and header/footer admin. Home Admin only. */
  siteChrome?: boolean
  /** Home_Content Save/Undo. Hide on quote inbox and quote-form admin. */
  showHomeSave?: boolean
  children: ReactNode
}

/**
 * Shared in-place editor chrome: SAVE/UNDO, and optional site header/footer editors.
 * Header and colors persist in Home_Content and apply to Home and Studio.
 */
export default function AdminEditorShell({
  initialContent,
  notice = 'Header, Footer and colors apply to Home and Studio.',
  savedMessage = 'Saved. Visitors will see these changes on Home and Studio.',
  siteChrome = false,
  showHomeSave = true,
  children,
}: AdminEditorShellProps) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [lastSaved, setLastSaved] = useState(initialContent)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [headerAdminOpen, setHeaderAdminOpen] = useState(false)
  const [footerAdminOpen, setFooterAdminOpen] = useState(false)

  const snapshot = useMemo(() => JSON.stringify(lastSaved), [lastSaved])

  useEffect(() => {
    setDirty(JSON.stringify(content) !== snapshot)
  }, [content, snapshot])

  useEffect(() => {
    if (!dirty) return undefined
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  /**
   * Upload a replacement image and store its URL on the matching content field.
   */
  async function uploadImage(field: string, file: File) {
    setError('')
    setStatus('Uploading image…')
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch('/api/home/admin/image', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }
      const url = String(result.url || '')
      if (field.startsWith('offering.')) {
        const id = field.split('.')[1] as OfferingId
        patchOffering(setContent, id, { imageSrc: url })
      } else {
        patchHomeField(setContent, field as keyof HomeContent, url)
      }
      setStatus('Image updated — click SAVE to publish')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
      setStatus('')
    }
  }

  /**
   * Persist Home_Content JSON for this Preview/Production surface.
   */
  async function handleSave() {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setPending(true)
    setError('')
    setStatus('')
    try {
      const response = await fetch('/api/home/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Save failed')
      }
      const saved = (result.content as HomeContent) || content
      setLastSaved(saved)
      setContent(saved)
      setStatus(savedMessage)
      setDirty(false)
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed')
    } finally {
      setPending(false)
    }
  }

  /**
   * Restore the last saved content and discard unsaved edits.
   */
  function handleUndo() {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    const restored = JSON.parse(JSON.stringify(lastSaved)) as HomeContent
    setContent(restored)
    setEditorKey((value) => value + 1)
    setActiveField(null)
    setError('')
    setStatus('Unsaved changes discarded')
  }

  /**
   * Clear the shared admin cookie and return to the login form.
   */
  async function handleSignOut() {
    await fetch('/api/studio/admin/logout', { method: 'POST' })
    router.push('/admin')
    router.refresh()
  }

  return (
    <HomeAdminProvider value={{ content, setContent, activeField, setActiveField, uploadImage }}>
      <div className="sticky top-0 z-40 border-b border-yellow-400 bg-yellow-50/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <p className="text-sm font-medium text-yellow-950">{notice}</p>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {showHomeSave ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-yellow-400 px-6 py-2 text-sm font-bold uppercase tracking-wide text-yellow-950 shadow disabled:opacity-60"
                >
                  {pending ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={pending || !dirty}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-yellow-950 bg-white px-6 py-2 text-sm font-bold uppercase tracking-wide text-yellow-950 disabled:opacity-40"
                >
                  Undo
                </button>
              </>
            ) : null}
            <a
              href="/admin"
              title="Admin home"
              aria-label="Admin home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-yellow-400 text-yellow-950 hover:bg-yellow-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M9 3h6a1 1 0 0 1 1 1v3h4a1 1 0 0 1 1 1v4h-6.5v-1.2h-3V12H3V8a1 1 0 0 1 1-1h4V4a1 1 0 0 1 1-1zm1 4h4V5h-4v2zM3 14h6.5v1.2h3V14H21v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
              </svg>
            </a>
            <a
              href="/home"
              title="View live Home"
              aria-label="View live Home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-yellow-400 text-yellow-950 hover:bg-yellow-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M12 5c5 0 8.5 4.2 9.8 6.2a1.2 1.2 0 0 1 0 1.6C20.5 14.8 17 19 12 19s-8.5-4.2-9.8-6.2a1.2 1.2 0 0 1 0-1.6C3.5 9.2 7 5 12 5zm0 3.5A3.5 3.5 0 1 0 12 15a3.5 3.5 0 0 0 0-6.5zM12 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
              </svg>
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-yellow-400 text-yellow-950 hover:bg-yellow-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v-2H6V6h4V4zm3.6 4.2 5 3.8-5 3.8v-2.3H9v-3h4.6V8.2z" />
              </svg>
            </button>
          </div>
        </div>
        {status ? <p className="px-4 pb-2 text-sm text-green-800 sm:px-6">{status}</p> : null}
        {error ? <p className="px-4 pb-2 text-sm text-red-700 sm:px-6">{error}</p> : null}
      </div>

      <HomeBrandShell key={editorKey} content={content}>
        {siteChrome ? (
          <>
            <AdminChromeLabel title="Site Admin" />
            <HomeColorFields />
            <AdminChromeLabel title="Header preview" />
            <SiteHeader content={content} preview />
            <AdminChromeLabel
              title="Header admin"
              expanded={headerAdminOpen}
              onToggle={() => setHeaderAdminOpen((open) => !open)}
            />
            {headerAdminOpen ? <HeaderAdminPanel /> : null}
          </>
        ) : null}
        {children}
        {siteChrome ? (
          <>
            <AdminChromeLabel title="Footer preview" bordered />
            <SiteFooter content={content} />
            <AdminChromeLabel
              title="Footer admin"
              bordered
              expanded={footerAdminOpen}
              onToggle={() => setFooterAdminOpen((open) => !open)}
            />
            {footerAdminOpen ? <FooterAdminPanel /> : null}
          </>
        ) : null}
      </HomeBrandShell>
    </HomeAdminProvider>
  )
}
