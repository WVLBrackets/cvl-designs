'use client'

import { useEffect, useMemo, useState } from 'react'
import GalleryMedia from '@/components/studio/GalleryMedia'

export interface GalleryLightboxItem {
  id: string
  src: string
  alt: string
  caption?: string
  categoryName?: string
}

interface GalleryLightboxProps {
  items: GalleryLightboxItem[]
  startId: string
  onClose: () => void
}

/**
 * Previous / next chevron used in the lightbox.
 *
 * @param direction - Which arrow to draw
 */
function ChevronIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
      {direction === 'prev' ? (
        <path d="M15.4 4.6 8 12l7.4 7.4 1.4-1.4L10.8 12l6-5.6z" />
      ) : (
        <path d="M8.6 4.6 7.2 6l6 5.6-6 6 1.4 1.4L16 12z" />
      )}
    </svg>
  )
}

/**
 * Full-size gallery photo or video. Stays open until the visitor closes it.
 * When more than one item is passed, previous/next step through that set.
 */
export default function GalleryLightbox({ items, startId, onClose }: GalleryLightboxProps) {
  const playlist = items.length > 0 ? items : []
  const startIndex = Math.max(
    0,
    playlist.findIndex((item) => item.id === startId)
  )
  const [index, setIndex] = useState(startIndex)
  const count = playlist.length
  const current = playlist[Math.min(index, Math.max(count - 1, 0))]
  const showControls = count > 1

  const playlistKey = useMemo(() => playlist.map((item) => item.id).join('|'), [playlist])

  useEffect(() => {
    setIndex(startIndex)
  }, [startId, playlistKey, startIndex])

  /**
   * Move one item, wrapping at both ends.
   *
   * @param delta - `-1` previous, `1` next
   */
  function go(delta: number) {
    if (count < 2) return
    setIndex((value) => (value + delta + count) % count)
  }

  useEffect(() => {
    /**
     * Arrow keys step through the playlist; Escape closes.
     */
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (count < 2) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndex((value) => (value - 1 + count) % count)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setIndex((value) => (value + 1) % count)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, onClose])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={current.caption || current.alt || 'Gallery item'}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl min-w-0 overflow-y-auto rounded-2xl home-bg-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
          </svg>
        </button>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          <GalleryMedia
            key={current.id}
            src={current.src}
            alt={current.alt}
            sizes="90vw"
            mode="lightbox"
            objectFit="contain"
          />
          {showControls ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
                aria-label="Previous"
                onClick={() => go(-1)}
              >
                <ChevronIcon direction="prev" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
                aria-label="Next"
                onClick={() => go(1)}
              >
                <ChevronIcon direction="next" />
              </button>
            </>
          ) : null}
        </div>
        <div className="p-4 sm:p-6">
          {current.categoryName ? (
            <p className="text-xs font-semibold uppercase tracking-wide home-accent">{current.categoryName}</p>
          ) : null}
          {current.caption ? <p className="mt-2 break-words home-text">{current.caption}</p> : null}
        </div>
      </div>
    </div>
  )
}
