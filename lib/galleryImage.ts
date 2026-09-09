/**
 * Store a gallery image in Vercel Blob, or on local disk when Blob is not configured.
 */

import { list, put } from '@vercel/blob'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 4.5 * 1024 * 1024

/**
 * Sanitize an upload filename and keep a short unique prefix.
 *
 * @param originalName - Browser-provided file name
 */
function safeFileName(originalName: string): string {
  const base = originalName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
  const trimmed = base.slice(-80) || 'image.jpg'
  return `${Date.now()}-${trimmed}`
}

/**
 * True when this deployment can write gallery files to Vercel Blob.
 * Connected stores use BLOB_STORE_ID plus Vercel's rotating OIDC token.
 * A static BLOB_READ_WRITE_TOKEN still works if present.
 */
function hasVercelBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
}

/**
 * Persist an uploaded gallery image and return a public URL.
 *
 * @param file - Image file from the admin form
 * @returns Public URL for the stored image
 */
export async function storeGalleryImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be smaller than 4.5 MB')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = safeFileName(file.name)

  if (hasVercelBlobConfig()) {
    const blob = await put(`gallery/${filename}`, buffer, {
      access: 'public',
      contentType: file.type,
      ...(process.env.BLOB_READ_WRITE_TOKEN
        ? { token: process.env.BLOB_READ_WRITE_TOKEN }
        : {}),
    })
    return blob.url
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Gallery uploads need a Blob store connected to this Vercel project. Add Blob in Storage, then redeploy Preview.'
    )
  }

  const dir = path.join(process.cwd(), 'public', 'images', 'gallery')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/images/gallery/${filename}`
}

const BLOB_RECOVERY_SENTINEL = 'gallery/_recovered_v1.txt'

/**
 * Build a visitor-facing caption from a stored blob pathname.
 *
 * @param pathname - Blob path such as gallery/123-Pink-arch.jpg
 */
function captionFromBlobPath(pathname: string): string {
  const file = pathname.split('/').pop() || 'Recovered photo'
  const withoutStamp = file.replace(/^\d+-/, '').replace(/\.[^.]+$/, '')
  const readable = withoutStamp.replace(/[-_]+/g, ' ').trim()
  return readable || 'Recovered photo'
}

export interface OrphanedGalleryBlob {
  url: string
  caption: string
  createdAt: string
}

/**
 * One-time lookup of gallery images that exist in Blob but are missing from the sheet.
 * After this recovery runs, a sentinel blob is written so it does not undo later deletes.
 *
 * @param existingUrls - Image URLs already stored in the Gallery tab
 */
export async function listOrphanedGalleryBlobs(existingUrls: string[]): Promise<OrphanedGalleryBlob[] | null> {
  if (!hasVercelBlobConfig()) return []

  try {
    const listed = await list({ prefix: 'gallery/' })
    const alreadyRecovered = listed.blobs.some(
      (blob) => blob.pathname === BLOB_RECOVERY_SENTINEL || blob.pathname.endsWith('_recovered_v1.txt')
    )
    if (alreadyRecovered) return []

    return listed.blobs
      .filter((blob) => blob.pathname.startsWith('gallery/') && !blob.pathname.endsWith('.txt'))
      .filter((blob) => {
        const already = existingUrls.some(
          (url) => url === blob.url || (blob.pathname && url.includes(blob.pathname))
        )
        return !already
      })
      .map((blob) => ({
        url: blob.url,
        caption: captionFromBlobPath(blob.pathname),
        createdAt: blob.uploadedAt instanceof Date ? blob.uploadedAt.toISOString() : new Date().toISOString(),
      }))
  } catch (error) {
    console.error('[gallery] Failed to list Blob images for recovery:', error)
    return null
  }
}

/**
 * Record that missing Blob images were already restored, so later deletes stay deleted.
 */
export async function markGalleryBlobRecoveryDone(): Promise<void> {
  if (!hasVercelBlobConfig()) return
  try {
    await put(BLOB_RECOVERY_SENTINEL, 'recovered', {
      access: 'public',
      ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    })
  } catch (error) {
    console.error('[gallery] Failed to write Blob recovery sentinel:', error)
  }
}
