/**
 * Store homepage admin image uploads in Vercel Blob, or local disk in development.
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
 * True when this deployment can write files to Vercel Blob.
 */
function canWriteToBlob(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true
  return Boolean(process.env.VERCEL && process.env.BLOB_STORE_ID)
}

/**
 * Persist an uploaded homepage image and return a public URL.
 *
 * @param file - Image file from the home admin form
 */
export async function storeHomeImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be smaller than 4.5 MB')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = safeFileName(file.name)

  if (canWriteToBlob()) {
    const blob = await put(`home/${filename}`, buffer, {
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
      'Homepage image uploads need a Blob store connected to this Vercel project.'
    )
  }

  const dir = path.join(process.cwd(), 'public', 'images', 'home')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/images/home/${filename}`
}
