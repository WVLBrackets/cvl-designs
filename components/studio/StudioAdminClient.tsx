'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { GalleryCategory, GalleryItem } from '@/lib/types'

interface StudioAdminClientProps {
  categories: GalleryCategory[]
  items: GalleryItem[]
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
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto bg-white rounded-lg shadow-lg p-8 space-y-4">
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
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
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
 * Admin dashboard: upload a new piece and review existing gallery rows.
 */
export default function StudioAdminClient({ categories, items }: StudioAdminClientProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lastCaption, setLastCaption] = useState('')

  /**
   * Upload a gallery image without using GitHub.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    const form = event.currentTarget
    const data = new FormData(form)
    data.set('featured', data.get('featured') ? 'true' : 'false')

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
      setLastCaption(result.item?.caption || '')
      setMessage('Saved to the gallery. Copy the caption below if you want to post it on Instagram or Facebook.')
      form.reset()
      router.refresh()
    } catch {
      setError('Save failed')
    } finally {
      setPending(false)
    }
  }

  /**
   * Copy the most recently saved caption for a manual social post.
   */
  async function copyCaption() {
    if (!lastCaption) return
    await navigator.clipboard.writeText(lastCaption)
    setMessage('Caption copied. Paste it into Instagram or Facebook with the photo.')
  }

  /**
   * End the admin session.
   */
  async function logout() {
    await fetch('/api/studio/admin/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gallery admin</h1>
        <button type="button" onClick={logout} className="text-sm text-blue-600 underline">
          Sign out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Add a photo</h2>
        <p className="text-sm text-gray-600">
          Uploads go to the gallery from this screen — no GitHub step. Instagram and Facebook are
          personal accounts, so posting there is still copy-and-paste for now.
        </p>

        <label className="block text-sm font-medium text-gray-700">
          Photo
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" required className="mt-1 block w-full text-sm" />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Category
          <select name="categorySlug" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue={categories[0]?.slug}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Caption
          <textarea name="caption" required rows={3} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Internal price (not shown on the site or social posts)
          <input type="number" name="price" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>

        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="featured" className="rounded" />
            Featured in the rotating hero
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Visibility
            <select name="status" className="mt-1 rounded-lg border border-gray-300 px-3 py-2" defaultValue="Public">
              <option value="Public">Public</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {lastCaption ? (
          <button type="button" onClick={copyCaption} className="text-sm text-blue-600 underline">
            Copy last caption
          </button>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold"
        >
          {pending ? 'Saving…' : 'Add to gallery'}
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <article key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                <Image src={item.imageUrl} alt={item.caption} fill className="object-cover" sizes="33vw" />
              </div>
              <div className="p-3 text-sm">
                <p className="font-semibold text-pink-600">{item.categorySlug}</p>
                <p className="text-gray-800 line-clamp-2">{item.caption}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.status}
                  {item.featured ? ' · Featured' : ''}
                  {item.price ? ` · $${item.price.toFixed(0)} internal` : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No photos yet. Add the first one above.</p>
        ) : null}
      </section>
    </div>
  )
}
