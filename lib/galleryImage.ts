/**
 * Store a gallery image in Vercel Blob, or on local disk when Blob is not configured.
 */

import { put } from '@vercel/blob'
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
