'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GalleryMedia from '@/components/studio/GalleryMedia'
import HeroVideoPlayFields from '@/components/studio/HeroVideoPlayFields'
import {
  GALLERY_FILE_ACCEPT,
  galleryFileKind,
  gallerySafeFileName,
  isGalleryVideoUrl,
  parseHeroVideoPlay,
  shouldClientUploadToBlob,
  type HeroVideoPlay,
} from '@/lib/galleryMedia'
import type { GalleryCategory, GalleryItem } from '@/lib/types'

interface StudioAdminClientProps {
  categories: GalleryCategory[]
  items: GalleryItem[]
  embedded?: boolean
}

interface DeletedSnapshot {
  item: GalleryItem
  index: number
}

/**
 * Password form for studio and homepage admin screens.
 *
 * @param title - Heading shown above the password field
 * @param description - Short explanation of the admin area
 */
export function StudioAdminLogin({
  title = 'Studio Admin',
  description = 'Add gallery photos and videos here. Visitors never see this screen.',
}: {
  title?: string
  description?: string
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  /**
   * Submit the admin password and refresh into the dashboard.
   */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/studio/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        setError(result.error || 'Login failed')
        return
      }
      router.refresh()
    } catch {
      setError('Login failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm min-w-0 space-y-4 rounded-2xl border home-border home-bg-2 p-6 shadow-sm">
      <h1 className="text-center font-serif text-2xl font-semibold home-text">{title}</h1>
      <p className="text-center text-sm home-text-muted">
        {description}
      </p>
      <label className="block text-sm font-medium home-text">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full max-w-full rounded-lg border home-border px-3 py-2 home-bg"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full home-accent-bg py-2 font-semibold text-white disabled:bg-gray-400"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

/**
 * Read shared gallery fields from an admin form.
 *
 * @param data - FormData from add or edit
 */
function readGalleryFields(data: FormData) {
  return {
    caption: String(data.get('caption') || '').trim(),
    categorySlug: String(data.get('categorySlug') || '').trim().toLowerCase(),
    studioHero:
      data.get('studioHero') === 'on' ||
      data.get('studioHero') === 'true' ||
      data.get('featured') === 'on' ||
      data.get('featured') === 'true',
    homeHero: data.get('homeHero') === 'on' || data.get('homeHero') === 'true',
    heroVideoPlay: parseHeroVideoPlay(data.get('heroVideoPlay')),
    status: String(data.get('status') || 'Public') === 'Draft' ? 'Draft' : 'Public',
    price: Number(data.get('price') || 0) || 0,
  }
}

/**
 * Replace one gallery item in local list state after a successful save.
 *
 * @param items - Current gallery list
 * @param next - Updated item from the API
 */
function replaceItem(items: GalleryItem[], next: GalleryItem): GalleryItem[] {
  return items.map((item) => (item.id === next.id ? next : item))
}

/**
 * Admin dashboard: upload a new piece, edit existing rows, and review the gallery.
 */
export default function StudioAdminClient({ categories, items, embedded = false }: StudioAdminClientProps) {
  const router = useRouter()
  const galleryRef = useRef<HTMLElement>(null)
  const [galleryItems, setGalleryItems] = useState(items)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [lastDeleted, setLastDeleted] = useState<DeletedSnapshot | null>(null)
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [addIsVideo, setAddIsVideo] = useState(false)
  const [addVideoPlay, setAddVideoPlay] = useState<HeroVideoPlay>('delay')

  /**
   * Scroll the Current gallery heading into view after a delete.
   */
  function scrollToGallery() {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /**
   * Clear the one-shot undo control after any other gallery change.
   */
  function clearUndo() {
    setLastDeleted(null)
    setRecoverOpen(false)
  }

  /**
   * Upload a gallery photo or video without using GitHub.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    clearUndo()
    const form = event.currentTarget
    const data = new FormData(form)
    const fields = readGalleryFields(data)
    data.set('studioHero', fields.studioHero ? 'true' : 'false')
    data.set('homeHero', fields.homeHero ? 'true' : 'false')
    data.set('heroVideoPlay', addIsVideo ? addVideoPlay : 'delay')
    const file = data.get('image')

    try {
      let response: Response
      if (file instanceof File && file.size > 0 && shouldClientUploadToBlob(file)) {
        try {
          const { upload } = await import('@vercel/blob/client')
          const blob = await upload(`gallery/${gallerySafeFileName(file.name)}`, file, {
            access: 'public',
            handleUploadUrl: '/api/studio/admin/gallery/blob',
          })
          response = await fetch('/api/studio/admin/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: blob.url,
              caption: fields.caption,
              categorySlug: fields.categorySlug,
              studioHero: fields.studioHero,
              featured: fields.studioHero,
              homeHero: fields.homeHero,
              heroVideoPlay: addIsVideo ? addVideoPlay : 'delay',
              status: fields.status,
              price: fields.price,
            }),
          })
        } catch {
          response = await fetch('/api/studio/admin/gallery', {
            method: 'POST',
            body: data,
          })
        }
      } else {
        response = await fetch('/api/studio/admin/gallery', {
          method: 'POST',
          body: data,
        })
      }
      const result = await response.json()
      if (!response.ok || !result.success) {
        setError(result.error || 'Save failed')
        return
      }
      if (result.item) {
        setGalleryItems((current) => [result.item as GalleryItem, ...current])
      }
      setMessage('Saved to the gallery.')
      form.reset()
      setAddIsVideo(false)
      setAddVideoPlay('delay')
    } catch {
      setError('Save failed')
    } finally {
      setPending(false)
    }
  }

  /**
   * Save attribute changes for an existing gallery photo.
   */
  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setPending(true)
    setError('')
    setMessage('')
    clearUndo()
    const fields = readGalleryFields(new FormData(event.currentTarget))

    try {
      const response = await fetch('/api/studio/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...fields, featured: fields.studioHero, studioHero: fields.studioHero }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        setError(result.error || 'Update failed')
        return
      }
      if (result.item) {
        setGalleryItems((current) => replaceItem(current, result.item as GalleryItem))
      }
      setMessage('Updated. Visitors will see Public photos on the studio page.')
      setEditing(null)
    } catch {
      setError('Update failed')
    } finally {
      setPending(false)
    }
  }

  /**
   * Toggle Home Hero and/or Studio Hero for a gallery photo.
   */
  async function handleHeroFlags(
    item: GalleryItem,
    patch: { featured?: boolean; homeHero?: boolean; heroVideoPlay?: HeroVideoPlay }
  ) {
    clearUndo()
    setError('')
    const next = {
      ...item,
      featured: patch.featured !== undefined ? patch.featured : item.featured,
      homeHero: patch.homeHero !== undefined ? patch.homeHero : item.homeHero,
      heroVideoPlay: patch.heroVideoPlay !== undefined ? patch.heroVideoPlay : item.heroVideoPlay,
    }
    setGalleryItems((current) => replaceItem(current, next))
    try {
      const response = await fetch('/api/studio/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          caption: item.caption,
          categorySlug: item.categorySlug,
          studioHero: next.featured,
          featured: next.featured,
          homeHero: next.homeHero,
          heroVideoPlay: next.heroVideoPlay,
          status: item.status,
          price: item.price,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        setGalleryItems((current) => replaceItem(current, item))
        setError(result.error || 'Could not update hero')
        return
      }
      if (result.item) {
        setGalleryItems((current) => replaceItem(current, result.item as GalleryItem))
      }
    } catch {
      setGalleryItems((current) => replaceItem(current, item))
      setError('Could not update hero')
    }
  }

  /**
   * Remove a photo from the gallery and offer a one-shot undo.
   *
   * @param item - Gallery row to delete
   * @param index - Position in the current list, used to restore in place
   */
  async function handleDelete(item: GalleryItem, index: number) {
    setPending(true)
    setError('')
    setMessage('')
    setRecoverOpen(false)
    try {
      const response = await fetch(`/api/studio/admin/gallery?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        setError(result.error || 'Delete failed')
        return
      }
      setGalleryItems((current) => current.filter((row) => row.id !== item.id))
      setLastDeleted({ item: result.item || item, index })
      setMessage('Photo deleted.')
      scrollToGallery()
    } catch {
      setError('Delete failed')
    } finally {
      setPending(false)
    }
  }

  /**
   * Restore the most recently deleted photo after the user confirms.
   */
  async function handleRecoverYes() {
    if (!lastDeleted) return
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/studio/admin/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastDeleted.item),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        setError(result.error || 'Could not recover that photo')
        return
      }
      const restored = (result.item || lastDeleted.item) as GalleryItem
      setGalleryItems((current) => {
        const next = current.filter((row) => row.id !== restored.id)
        const index = Math.min(lastDeleted.index, next.length)
        next.splice(index, 0, restored)
        return next
      })
      setMessage('Photo recovered.')
      clearUndo()
    } catch {
      setError('Could not recover that photo')
    } finally {
      setPending(false)
    }
  }

  /**
   * End the admin session.
   */
  async function logout() {
    await fetch('/api/studio/admin/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-8 overflow-x-hidden">
      {embedded ? (
        <div>
          <h2 className="font-serif text-2xl font-semibold home-text">Gallery photos</h2>
          <p className="mt-1 text-sm home-text-muted">
            Add, edit, or hide photos here. This list saves immediately and is separate from SAVE above.
          </p>
        </div>
      ) : (
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">Gallery admin</h1>
        <button type="button" onClick={logout} className="flex-shrink-0 text-sm text-blue-600 underline">
          Sign out
        </button>
      </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4 min-w-0 overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900">Add a photo or video</h2>
        <p className="text-sm text-gray-600 break-words">
          Uploads go to the gallery from this screen — no GitHub step. Photos up to 4.5 MB; videos
          up to 80 MB (MP4, WebM, or MOV). Instagram and Facebook posting is still copy-and-paste
          for now.
        </p>

        <label className="block text-sm font-medium text-gray-700 min-w-0">
          Photo or video
          <span className="mt-1 block w-full max-w-full min-w-0 overflow-hidden">
            <input
              type="file"
              name="image"
              accept={GALLERY_FILE_ACCEPT}
              required
              className="block w-full max-w-full min-w-0 text-sm"
              onChange={(event) => {
                const chosen = event.target.files?.[0]
                const video = Boolean(chosen && galleryFileKind(chosen) === 'video')
                setAddIsVideo(video)
                if (!video) setAddVideoPlay('delay')
              }}
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Category
          <select name="categorySlug" required className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue={categories[0]?.slug}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Caption
          <textarea name="caption" required rows={3} className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Internal price (not shown on the site or social posts)
          <input type="number" name="price" min="0" step="0.01" className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="homeHero" className="rounded" />
            Home Hero
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="studioHero" className="rounded" />
            Studio Hero
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Visibility
            <select name="status" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue="Public">
              <option value="Public">Public</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
        </div>
        {addIsVideo ? (
          <HeroVideoPlayFields value={addVideoPlay} onChange={setAddVideoPlay} />
        ) : null}

        {error && !editing && !recoverOpen ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
        {message && !editing && !recoverOpen ? <p className="text-sm text-green-700 break-words">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full home-accent-bg px-5 py-2 font-semibold text-white hover:opacity-90 disabled:bg-gray-400"
        >
          {pending ? 'Saving…' : 'Add to gallery'}
        </button>
      </form>

      <section ref={galleryRef} className="min-w-0 scroll-mt-4">
        <div className="flex items-center justify-between gap-3 mb-2 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 min-w-0 truncate">Current gallery</h2>
          <button
            type="button"
            disabled={!lastDeleted || pending}
            onClick={() => lastDeleted && setRecoverOpen(true)}
            className="text-sm font-semibold text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed underline flex-shrink-0"
          >
            Undo
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4 break-words">
          Tap a photo to edit caption, category, price, or Public/Draft. Use Home Hero, Studio Hero, and the trash can without opening the photo.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
          {galleryItems.map((item, index) => (
            <article key={item.id} className="bg-white rounded-lg shadow overflow-hidden min-w-0 max-w-full">
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <GalleryMedia src={item.imageUrl} alt={item.caption} sizes="50vw" mode="thumb" />
                <button
                  type="button"
                  onClick={() => {
                    setEditing(item)
                    setError('')
                    setMessage('')
                  }}
                  className="absolute inset-0 z-[1]"
                  aria-label={`Edit ${item.caption || 'photo'}`}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(item, index)}
                  className="absolute top-2 right-2 z-10 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label={`Delete ${item.caption || 'photo'}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" />
                  </svg>
                </button>
              </div>
              <div className="p-3 min-w-0">
                <p className="truncate font-semibold home-accent">
                  {categories.find((category) => category.slug === item.categorySlug)?.name ||
                    item.categorySlug}
                </p>
                <p className="text-gray-800 line-clamp-2 break-words">{item.caption}</p>
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {item.status}
                  {item.price ? ` · $${item.price.toFixed(0)} internal` : ''}
                </p>
                <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(item.homeHero)}
                    disabled={pending}
                    onChange={(event) => handleHeroFlags(item, { homeHero: event.target.checked })}
                    className="rounded"
                  />
                  Home Hero
                </label>
                <label className="mt-1 flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={item.featured}
                    disabled={pending}
                    onChange={(event) => handleHeroFlags(item, { featured: event.target.checked })}
                    className="rounded"
                  />
                  Studio Hero
                </label>
                {isGalleryVideoUrl(item.imageUrl) ? (
                  <div className="mt-2">
                    <HeroVideoPlayFields
                      name={`heroVideoPlay-${item.id}`}
                      value={item.heroVideoPlay || 'delay'}
                      onChange={(heroVideoPlay) => handleHeroFlags(item, { heroVideoPlay })}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {galleryItems.length === 0 ? (
          <p className="text-gray-500 text-sm">No photos yet. Add the first one above.</p>
        ) : null}
      </section>

      {editing ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Edit gallery photo"
        >
          <form
            key={editing.id}
            onSubmit={handleUpdate}
            className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 min-w-0"
          >
            <h2 className="text-lg font-semibold text-gray-900">Edit photo</h2>
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
              <GalleryMedia
                src={editing.imageUrl}
                alt={editing.caption}
                sizes="100vw"
                mode={isGalleryVideoUrl(editing.imageUrl) ? 'lightbox' : 'thumb'}
                objectFit={isGalleryVideoUrl(editing.imageUrl) ? 'contain' : 'cover'}
              />
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Category
              <select
                name="categorySlug"
                required
                className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2"
                defaultValue={editing.categorySlug}
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Caption
              <textarea
                name="caption"
                required
                rows={3}
                defaultValue={editing.caption}
                className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Internal price (not shown on the site or social posts)
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                defaultValue={editing.price || ''}
                className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="homeHero" defaultChecked={editing.homeHero} className="rounded" />
              Home Hero
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="studioHero" defaultChecked={editing.featured} className="rounded" />
              Studio Hero
            </label>
            {isGalleryVideoUrl(editing.imageUrl) ? (
              <HeroVideoPlayFields
                value={editing.heroVideoPlay || 'delay'}
                onChange={(heroVideoPlay) => setEditing({ ...editing, heroVideoPlay })}
              />
            ) : null}

            <label className="block text-sm font-medium text-gray-700">
              Visibility
              <select
                name="status"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                defaultValue={editing.status}
              >
                <option value="Public">Public</option>
                <option value="Draft">Draft</option>
              </select>
            </label>

            {error ? <p className="text-sm text-red-600 break-words">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full home-accent-bg px-5 py-2 font-semibold text-white hover:opacity-90 disabled:bg-gray-400"
              >
                {pending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {recoverOpen && lastDeleted ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Recover deleted photo"
        >
          <div className="bg-white rounded-xl w-full max-w-lg p-4 sm:p-6 space-y-4 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Recover this photo?</h2>
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
              <GalleryMedia
                src={lastDeleted.item.imageUrl}
                alt={lastDeleted.item.caption}
                sizes="100vw"
                mode="thumb"
              />
            </div>
            <p className="text-sm text-gray-700 break-words">{lastDeleted.item.caption}</p>
            {error ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={handleRecoverYes}
                className="rounded-full home-accent-bg px-5 py-2 font-semibold text-white hover:opacity-90 disabled:bg-gray-400"
              >
                Yes
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={clearUndo}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700"
              >
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
