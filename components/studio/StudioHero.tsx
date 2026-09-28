'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import EditableText from '@/components/home/EditableText'
import ShowToggle from '@/components/home/ShowToggle'
import HeroSlideshow, { type HeroSlide } from '@/components/home/HeroSlideshow'
import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import { DEFAULT_STUDIO_IMAGE_SRC, STUDIO_QUOTE_ROUTE } from '@/lib/studio'
import { HOME_LABELS } from '@/lib/homeVocabulary'
import type { HomeContent } from '@/lib/homeContent'
import type { PublicGalleryItem } from '@/lib/types'

const HERO_COUNT = 8

interface StudioHeroProps {
  items: PublicGalleryItem[]
  content: HomeContent
  onSelect?: (item: PublicGalleryItem, playlist: PublicGalleryItem[]) => void
  hold?: boolean
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
 * Studio hero slides: items marked Studio Hero, otherwise a public subset.
 * First paint uses a stable order so server HTML matches hydration.
 *
 * @param items - Public gallery items
 * @param randomize - When true, shuffle after the client has mounted
 */
function pickStudioHeroItems(items: PublicGalleryItem[], randomize: boolean): PublicGalleryItem[] {
  const marked = items.filter((item) => item.featured)
  const pool = marked.length > 0 ? marked : items
  const ordered = randomize ? shuffle(pool) : [...pool]
  return ordered.slice(0, HERO_COUNT)
}

/**
 * Full-width rotating hero of studio work, with pause and previous/next when needed.
 */
export default function StudioHero({ items, content, onSelect, hold = false }: StudioHeroProps) {
  const admin = useHomeAdmin()
  const [slides, setSlides] = useState<PublicGalleryItem[]>(() => pickStudioHeroItems(items, false))
  const showQuote = admin || content.showStudioQuoteCta
  const delayMs = Math.max(1, content.heroDelaySeconds || 5) * 1000

  useEffect(() => {
    setSlides(pickStudioHeroItems(items, true))
  }, [items])

  const heroSlides: HeroSlide[] =
    slides.length > 0
      ? slides.map((item) => ({
          id: item.id,
          src: item.imageUrl,
          alt: item.caption || content.studioTitle,
          playFull: item.heroVideoPlay === 'full',
        }))
      : [{ id: 'fallback', src: DEFAULT_STUDIO_IMAGE_SRC, alt: content.studioTitle }]

  const [caption, setCaption] = useState(slides[0]?.caption || '')

  return (
    <section className="relative overflow-hidden border-y home-border home-bg-2">
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 py-8 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-8 sm:px-6 lg:py-12">
        <HeroSlideshow
          slides={heroSlides}
          delayMs={delayMs}
          sizes="(max-width: 768px) 100vw, 60vw"
          hold={hold}
          onSelect={
            onSelect
              ? (slide) => {
                  const item = slides.find((entry) => entry.id === slide.id)
                  if (item) onSelect(item, slides)
                }
              : undefined
          }
          onSlideChange={(slide) => {
            const item = slides.find((entry) => entry.id === slide.id)
            setCaption(item?.caption || '')
          }}
        />
        <div className="flex min-w-0 flex-col gap-3 px-1 text-center sm:text-left">
          <EditableText
            field="studioKicker"
            value={content.studioKicker}
            label={HOME_LABELS.studioKicker}
            as="p"
            className="text-xs font-semibold uppercase tracking-[0.2em] home-accent"
          />
          <EditableText
            field="studioTitle"
            value={content.studioTitle}
            label={HOME_LABELS.studioTitle}
            as="h1"
            className="font-serif text-3xl font-semibold leading-tight home-text sm:text-4xl"
          />
          <EditableText
            field="studioTagline"
            value={content.studioTagline}
            label={HOME_LABELS.studioTagline}
            as="p"
            multiline
            className="text-base home-text-muted sm:text-lg"
          />
          {showQuote ? (
            <div className={admin && !content.showStudioQuoteCta ? 'opacity-50' : ''}>
              <ShowToggle
                checked={content.showStudioQuoteCta}
                onChange={(checked) =>
                  admin && patchHomeField(admin.setContent, 'showStudioQuoteCta', checked)
                }
              />
              {admin ? (
                <EditableText
                  field="studioQuoteCta"
                  value={content.studioQuoteCta}
                  label={HOME_LABELS.studioQuoteCta}
                  onDark
                  className="inline-flex min-h-11 items-center justify-center rounded-full home-accent-bg px-5 py-2 text-sm font-semibold text-white"
                />
              ) : content.studioQuoteCta.trim() ? (
                <Link
                  href={STUDIO_QUOTE_ROUTE}
                  className="inline-flex min-h-11 items-center justify-center rounded-full home-accent-bg px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  {content.studioQuoteCta}
                </Link>
              ) : null}
            </div>
          ) : null}
          {caption ? (
            <p className="italic home-text-muted">“{caption}”</p>
          ) : (
            <p className="home-text-muted">Gallery coming soon — check back for recent work.</p>
          )}
        </div>
      </div>
    </section>
  )
}
