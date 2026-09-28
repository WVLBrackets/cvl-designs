/**
 * Shared gallery photo and video types, size limits, and URL helpers.
 */

export const GALLERY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const GALLERY_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'] as const

export const GALLERY_FILE_ACCEPT = [...GALLERY_IMAGE_TYPES, ...GALLERY_VIDEO_TYPES].join(',')

/** How a video behaves in the automatic hero rotation. */
export type HeroVideoPlay = 'delay' | 'full'

/**
 * Parse the gallery sheet / form value for hero video playback.
 *
 * @param value - Stored cell or form field
 */
export function parseHeroVideoPlay(value: unknown): HeroVideoPlay {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'full' || raw === 'play in full' || raw === 'play-full') return 'full'
  return 'delay'
}

/** Direct POST through the App Router — Vercel payload cap. */
export const GALLERY_DIRECT_POST_MAX_BYTES = 4.5 * 1024 * 1024
export const GALLERY_IMAGE_MAX_BYTES = 4.5 * 1024 * 1024
export const GALLERY_VIDEO_MAX_BYTES = 80 * 1024 * 1024

const IMAGE_TYPE_SET = new Set<string>(GALLERY_IMAGE_TYPES)
const VIDEO_TYPE_SET = new Set<string>(GALLERY_VIDEO_TYPES)

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?|#|$)/i

/**
 * Guess MIME from a filename when the browser leaves `file.type` empty.
 *
 * @param name - Original file name
 */
export function mimeFromFileName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4'
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.mov')) return 'video/quicktime'
  return ''
}

/**
 * @param type - MIME type
 */
export function isGalleryVideoType(type: string): boolean {
  return VIDEO_TYPE_SET.has(type)
}

/**
 * True when a stored gallery URL should play as video.
 *
 * @param url - Public imageUrl
 */
export function isGalleryVideoUrl(url: string): boolean {
  const value = url.trim()
  if (!value) return false
  if (VIDEO_EXT.test(value)) return true
  if (IMAGE_EXT.test(value)) return false
  return false
}

/**
 * @param file - Admin upload
 */
export function galleryFileKind(file: File): 'image' | 'video' {
  const type = file.type || mimeFromFileName(file.name)
  if (isGalleryVideoType(type) || VIDEO_EXT.test(file.name)) return 'video'
  return 'image'
}

/**
 * Reject unsupported types and oversize files.
 *
 * @param file - Admin upload
 */
export function assertGalleryFile(file: File): void {
  const type = file.type || mimeFromFileName(file.name)
  const kind = galleryFileKind(file)
  if (!IMAGE_TYPE_SET.has(type) && !VIDEO_TYPE_SET.has(type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, GIF, MP4, WebM, or MOV file')
  }
  if (kind === 'image' && file.size > GALLERY_IMAGE_MAX_BYTES) {
    throw new Error('Photos must be smaller than 4.5 MB')
  }
  if (kind === 'video' && file.size > GALLERY_VIDEO_MAX_BYTES) {
    throw new Error('Videos must be smaller than 80 MB')
  }
}

/**
 * Sanitize an upload filename and keep a short unique prefix.
 *
 * @param originalName - Browser-provided file name
 */
export function gallerySafeFileName(originalName: string): string {
  const base = originalName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
  const trimmed = base.slice(-80) || 'media.bin'
  return `${Date.now()}-${trimmed}`
}

/**
 * Videos (and large files) should skip the function body and go to Blob from the browser.
 *
 * @param file - Admin upload
 */
export function shouldClientUploadToBlob(file: File): boolean {
  return galleryFileKind(file) === 'video' || file.size > GALLERY_DIRECT_POST_MAX_BYTES
}

/**
 * Allow only gallery Blob URLs or local /images/gallery paths after a client upload.
 *
 * @param url - URL to persist as imageUrl
 */
export function isAllowedStoredGalleryUrl(url: string): boolean {
  const value = url.trim()
  if (!value || value.length > 2000) return false
  if (value.startsWith('/images/gallery/')) return true
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') return false
    return (
      parsed.hostname.endsWith('.blob.vercel-storage.com') ||
      parsed.hostname === 'blob.vercel-storage.com'
    )
  } catch {
    return false
  }
}
