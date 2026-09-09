'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { GalleryCategory, GalleryItem } from '@/lib/types'

interface StudioAdminClientProps {
  categories: GalleryCategory[]
  items: GalleryItem[]
}

interface DeletedSnapshot {
  item: GalleryItem
  index: number
}

/**
 * Password form for /studio/admin
 */
export function StudioAdminLogin() {
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
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto bg-white rounded-lg shadow-lg p-6 space-y-4 min-w-0">
      <h1 className="text-2xl font-bold text-gray-900 text-center">Studio Admin</h1>
      <p className="text-sm text-gray-600 text-center">
        Add gallery photos here. Visitors never see this screen.
      </p>
      <label className="block text-sm font-medium text-gray-700">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full max-w-full rounded-lg border border-gray-300 px-3 py-2"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold"
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
    featured: data.get('featured') === 'on' || data.get('featured') === 'true',
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
export default function StudioAdminClient({ categories, items }: StudioAdminClientProps) {
  const router = useRouter()
  const galleryRef = useRef<HTMLElement>(null)
  const [galleryItems, setGalleryItems] = useState(items)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [lastDeleted, setLastDeleted] = useState<DeletedSnapshot | null>(null)
  const [recoverOpen, setRecoverOpen] = useState(false)

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
   * Upload a gallery image without using GitHub.
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
    data.set('featured', fields.featured ? 'true' : 'false')

    try {
      const response = await fetch('/api/studio/admin/gallery', {
        method: 'POST',
        body: data,
      })
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
        body: JSON.stringify({ id: editing.id, ...fields }),
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
   * Toggle whether a photo is included in the public rotating hero.
   *
   * @param item - Gallery row to update
   * @param featured - Next hero flag
   */
  async function handleHeroToggle(item: GalleryItem, featured: boolean) {
    clearUndo()
    setError('')
    setGalleryItems((current) => replaceItem(current, { ...item, featured }))
    try {
      const response = await fetch('/api/studio/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          caption: item.caption,
          categorySlug: item.categorySlug,
          featured,
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
    <div className="w-full max-w-4xl mx-auto space-y-8 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Gallery admin</h1>
        <button type="button" onClick={logout} className="text-sm text-blue-600 underline flex-shrink-0">
          Sign out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4 min-w-0 overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900">Add a photo</h2>
        <p className="text-sm text-gray-600 break-words">
          Uploads go to the gallery from this screen — no GitHub step. Instagram and Facebook are
          personal accounts, so posting there is still copy-and-paste for now.
        </p>

        <label className="block text-sm font-medium text-gray-700 min-w-0">
          Photo
          <span className="mt-1 block w-full max-w-full min-w-0 overflow-hidden">
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              className="block w-full max-w-full min-w-0 text-sm"
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
            <input type="checkbox" name="featured" className="rounded" />
            Featured in the rotating hero
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Visibility
            <select name="status" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue="Public">
              <option value="Public">Public</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
        </div>

        {error && !editing && !recoverOpen ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
        {message && !editing && !recoverOpen ? <p className="text-sm text-green-700 break-words">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold"
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
          Tap a photo to edit caption, category, price, or Public/Draft. Use In hero and the trash can without opening the photo.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
          {galleryItems.map((item, index) => (
            <article key={item.id} className="bg-white rounded-lg shadow overflow-hidden min-w-0 max-w-full">
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <Image src={item.imageUrl} alt={item.caption} fill className="object-cover" sizes="50vw" />
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
                <p className="font-semibold text-pink-600 truncate">{item.categorySlug}</p>
                <p className="text-gray-800 line-clamp-2 break-words">{item.caption}</p>
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {item.status}
                  {item.price ? ` · $${item.price.toFixed(0)} internal` : ''}
                </p>
                <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={item.featured}
                    disabled={pending}
                    onChange={(event) => handleHeroToggle(item, event.target.checked)}
                    className="rounded"
                  />
                  In hero
                </label>
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
              <Image src={editing.imageUrl} alt={editing.caption} fill className="object-cover" sizes="100vw" />
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
              <input type="checkbox" name="featured" defaultChecked={editing.featured} className="rounded" />
              Featured in the rotating hero
            </label>

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
                className="px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold"
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
              <Image
                src={lastDeleted.item.imageUrl}
                alt={lastDeleted.item.caption}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <p className="text-sm text-gray-700 break-words">{lastDeleted.item.caption}</p>
            {error ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={handleRecoverYes}
                className="px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold"
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
