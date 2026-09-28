/**
 * Store quote venue and inspiration photos in Vercel Blob, or local disk in development.
 */

import { put } from '@vercel/blob'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { GALLERY_IMAGE_MAX_BYTES, GALLERY_IMAGE_TYPES, gallerySafeFileName, mimeFromFileName } from '@/lib/galleryMedia'

export const QUOTE_PHOTO_FOLDERS = ['venue', 'inspiration'] as const
export type QuotePhotoFolder = (typeof QUOTE_PHOTO_FOLDERS)[number]

/**
 * True when this environment can write files to Vercel Blob.
 */
function canWriteToBlob(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true
  return Boolean(process.env.VERCEL && process.env.BLOB_STORE_ID)
}

/**
 * Persist one quote photo and return a public URL.
 *
 * @param file - Image from the public quote form
 * @param folder - venue or inspiration
 */
export async function storeQuoteImage(file: File, folder: QuotePhotoFolder): Promise<string> {
  const type = file.type || mimeFromFileName(file.name)
  if (!(GALLERY_IMAGE_TYPES as readonly string[]).includes(type)) {
    throw new Error('Please choose a JPEG, PNG, WebP, or GIF.')
  }
  if (file.size > GALLERY_IMAGE_MAX_BYTES) {
    throw new Error('Photos must be smaller than 4.5 MB.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = gallerySafeFileName(file.name)

  if (canWriteToBlob()) {
    const blob = await put(`quotes/${folder}/${filename}`, buffer, {
      access: 'public',
      contentType: type,
      ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    })
    return blob.url
  }

  if (process.env.VERCEL) {
    throw new Error('Photo uploads need a Blob store connected to this project.')
  }

  const dir = path.join(process.cwd(), 'public', 'images', 'quotes', folder)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/images/quotes/${folder}/${filename}`
}
