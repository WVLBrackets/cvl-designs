'use client'

import { useRef, useState } from 'react'
import { GALLERY_IMAGE_MAX_BYTES, GALLERY_IMAGE_TYPES, mimeFromFileName } from '@/lib/galleryMedia'
import { QUOTE_PHOTO_MAX } from '@/lib/quoteForm'

interface QuotePhotoFieldProps {
  label: string
  help?: string
  folder: 'venue' | 'inspiration'
  urls: string[]
  onChange: (urls: string[]) => void
}

const PHOTO_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif'

/**
 * Optional multi-image upload for venue or inspiration photos.
 */
export default function QuotePhotoField({
  label,
  help,
  folder,
  urls,
  onChange,
}: QuotePhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  /**
   * Upload one image through the quote photo API.
   *
   * @param file - Selected photo
   */
  async function uploadOne(file: File): Promise<string> {
    const type = file.type || mimeFromFileName(file.name)
    if (file.size > GALLERY_IMAGE_MAX_BYTES) {
      throw new Error('Photos must be smaller than 4.5 MB.')
    }
    if (!(GALLERY_IMAGE_TYPES as readonly string[]).includes(type)) {
      throw new Error('Please choose a JPEG, PNG, WebP, or GIF.')
    }
    const form = new FormData()
    form.set('folder', folder)
    form.set('file', file)
    const response = await fetch('/api/studio/quote/blob', { method: 'POST', body: form })
    let data: { success?: boolean; url?: string; error?: string } = {}
    try {
      data = (await response.json()) as { success?: boolean; url?: string; error?: string }
    } catch {
      throw new Error('Could not upload that photo.')
    }
    if (!response.ok || !data.url) {
      throw new Error(data.error || 'Could not upload that photo.')
    }
    return data.url
  }

  /**
   * Upload selected files, up to the remaining slot count.
   *
   * @param files - Copied File objects (not a live FileList)
   */
  async function addFiles(files: File[]) {
    if (!files.length) return
    const room = QUOTE_PHOTO_MAX - urls.length
    if (room <= 0) {
      setError(`You can add up to ${QUOTE_PHOTO_MAX} photos here.`)
      return
    }
    const picked = files.slice(0, room)
    setError(
      files.length > room
        ? `Only the first ${room} photo${room === 1 ? '' : 's'} were added (max ${QUOTE_PHOTO_MAX}).`
        : ''
    )
    setPending(true)
    const added: string[] = []
    try {
      for (const file of picked) {
        added.push(await uploadOne(file))
      }
      onChange([...urls, ...added])
    } catch (uploadError) {
      if (added.length) onChange([...urls, ...added])
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload that photo.')
    } finally {
      setPending(false)
    }
  }

  const remaining = QUOTE_PHOTO_MAX - urls.length

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      {help ? <p className="text-sm home-text-muted">{help}</p> : null}
      <p className="text-xs home-text-muted">
        JPEG, PNG, WebP, or GIF. You can choose several at once. {urls.length} of {QUOTE_PHOTO_MAX} added.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={PHOTO_ACCEPT}
        disabled={pending || remaining <= 0}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files || [])
          event.target.value = ''
          void addFiles(files)
        }}
      />
      <button
        type="button"
        disabled={pending || remaining <= 0}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-11 items-center rounded-full border home-border px-4 py-2 text-sm font-semibold home-text hover:bg-black/5 disabled:opacity-60"
      >
        {pending ? 'Uploading…' : 'Add photos'}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {urls.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-md object-cover home-border border" />
              <button
                type="button"
                className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold shadow"
                aria-label="Remove photo"
                onClick={() => onChange(urls.filter((item) => item !== url))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  )
}
