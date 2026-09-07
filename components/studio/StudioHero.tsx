'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { DEFAULT_STUDIO_IMAGE_SRC } from '@/lib/studio'
import type { PublicGalleryItem } from '@/lib/types'

const ROTATE_MS = 5000
const HERO_COUNT = 8

interface StudioHeroProps {
  items: PublicGalleryItem[]
  title: string
  tagline: string
  onSelect?: (item: PublicGalleryItem) => void
}

/**
 * Shuffle a copy of an array (Fisher–Yates).
 *
 * @param list - Source items
 */
function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

/**
 * Pick the rotating hero set: featured items first, otherwise a random public subset.
 *
 * @param items - Public gallery items
 */
function pickHeroItems(items: PublicGalleryItem[]): PublicGalleryItem[] {
  const featured = items.filter((item) => item.featured)
  const pool = featured.length > 0 ? featured : items
  return shuffle(pool).slice(0, HERO_COUNT)
}

/**
 * Full-width rotating hero of previous studio work.
 */
export default function StudioHero({ items, title, tagline, onSelect }: StudioHeroProps) {
  const [slides, setSlides] = useState<PublicGalleryItem[]>(() => items.slice(0, HERO_COUNT))
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setSlides(pickHeroItems(items))
    setIndex(0)
  }, [items])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const current = slides[index]
  const imageSrc = current?.imageUrl || DEFAULT_STUDIO_IMAGE_SRC
  const caption = current?.caption || title

  return (
    <section className="relative bg-gradient-to-r from-pink-100 via-rose-50 to-sky-100 border-y border-pink-200">
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => current && onSelect?.(current)}
        aria-label={current ? `View ${caption}` : title}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 items-center">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden bg-white shadow-md">
            <Image
              src={imageSrc}
              alt={caption}
              fill
              className="object-cover transition-opacity duration-700"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600 mb-1">
              Design Studio
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-lg text-gray-600">{tagline}</p>
            {current?.caption ? (
              <p className="mt-4 text-gray-700 italic">“{current.caption}”</p>
            ) : (
              <p className="mt-4 text-gray-500">Gallery coming soon — check back for recent work.</p>
            )}
            {slides.length > 1 ? (
              <div className="mt-5 flex justify-center sm:justify-start gap-2" aria-hidden>
                {slides.map((slide, i) => (
                  <span
                    key={slide.id}
                    className={`h-2 w-2 rounded-full ${i === index ? 'bg-pink-500' : 'bg-pink-200'}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    </section>
  )
}
