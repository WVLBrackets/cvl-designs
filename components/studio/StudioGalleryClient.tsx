'use client'

import { useMemo, useState } from 'react'
import StudioHero from './StudioHero'
import GalleryLightbox, { type GalleryLightboxItem } from '@/components/studio/GalleryLightbox'
import GalleryMedia from '@/components/studio/GalleryMedia'
import EditableText from '@/components/home/EditableText'
import EditableChip from '@/components/studio/EditableChip'
import { useHomeAdmin, patchHomeField } from '@/components/home/HomeAdminContext'
import { HOME_LABELS } from '@/lib/homeVocabulary'
import type { HomeContent } from '@/lib/homeContent'
import type { GalleryCategory, PublicGalleryItem } from '@/lib/types'

interface StudioGalleryClientProps {
  content: HomeContent
  categories: GalleryCategory[]
  items: PublicGalleryItem[]
  initialCategory?: string
  onCategoriesChange?: (categories: GalleryCategory[]) => void
}

/**
 * Public studio gallery, or admin chips + hero without the filterable grid.
 */
export default function StudioGalleryClient({
  content,
  categories,
  items,
  initialCategory = 'all',
  onCategoriesChange,
}: StudioGalleryClientProps) {
  const admin = useHomeAdmin()
  const [filter, setFilter] = useState(() => {
    const slug = initialCategory.trim().toLowerCase()
    if (!slug || slug === 'all') return 'all'
    return categories.some((category) => category.slug === slug) ? slug : 'all'
  })
  const [lightbox, setLightbox] = useState<{ items: GalleryLightboxItem[]; startId: string } | null>(
    null
  )

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.categorySlug === filter)),
    [filter, items]
  )

  const categoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug

  /**
   * Build lightbox fields for a public gallery item.
   *
   * @param item - Gallery piece
   */
  function toLightboxItem(item: PublicGalleryItem): GalleryLightboxItem {
    return {
      id: item.id,
      src: item.imageUrl,
      alt: item.caption || 'Gallery piece',
      caption: item.caption,
      categoryName: categoryName(item.categorySlug),
    }
  }

  /**
   * Open the lightbox on a piece, using the given playlist for previous/next.
   *
   * @param item - Item to show first
   * @param playlist - Items the arrows step through
   */
  function openLightbox(item: PublicGalleryItem, playlist: PublicGalleryItem[]) {
    const list = playlist.length > 0 ? playlist : [item]
    setLightbox({
      items: list.map(toLightboxItem),
      startId: item.id,
    })
  }

  const chipClass = (selected: boolean) =>
    selected
      ? 'home-accent-bg border-transparent text-white'
      : 'home-bg-2 home-text border home-border hover:opacity-90'

  /**
   * Persist a category display name so gallery card titles stay in sync.
   */
  async function renameCategory(slug: string, name: string) {
    const nextName = name.trim()
    if (!nextName) return
    const previous = categories
    onCategoriesChange?.(
      categories.map((category) => (category.slug === slug ? { ...category, name: nextName } : category))
    )
    try {
      const response = await fetch('/api/studio/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: nextName }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        onCategoriesChange?.(previous)
      }
    } catch {
      onCategoriesChange?.(previous)
    }
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <StudioHero
        items={items}
        content={content}
        onSelect={admin ? undefined : openLightbox}
        hold={Boolean(lightbox)}
      />

      <div className={`mx-auto max-w-6xl min-w-0 px-4 sm:px-6 ${admin ? 'py-6' : 'py-8 sm:py-10'}`}>
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {admin ? (
            <>
              <EditableChip
                label={HOME_LABELS.studioAllLabel}
                value={content.studioAllLabel}
                className="home-accent-bg border-transparent text-white"
                onCommit={(value) => {
                  if (admin && value.trim()) {
                    patchHomeField(admin.setContent, 'studioAllLabel', value.trim())
                  }
                }}
              />
              {categories.map((category) => (
                <EditableChip
                  key={category.slug}
                  label={`${category.slug} filter`}
                  value={category.name}
                  onCommit={(value) => renameCategory(category.slug, value)}
                />
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${chipClass(filter === 'all')}`}
              >
                {content.studioAllLabel.trim() || 'All'}
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setFilter(category.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${chipClass(filter === category.slug)}`}
                >
                  {category.name}
                </button>
              ))}
            </>
          )}
        </div>

        {admin ? null : visible.length === 0 ? (
          <EditableText
            field="studioEmpty"
            value={content.studioEmpty}
            label={HOME_LABELS.studioEmpty}
            as="p"
            multiline
            className="rounded-2xl border border-dashed home-border px-5 py-12 text-center text-sm home-text-muted"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openLightbox(item, visible)}
                className="group min-w-0 overflow-hidden rounded-2xl border home-border home-bg-2 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-square">
                  <GalleryMedia
                    src={item.imageUrl}
                    alt={item.caption || 'Gallery piece'}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    mode="thumb"
                  />
                </div>
                <div className="min-w-0 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide home-accent">
                    {categoryName(item.categorySlug)}
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-sm home-text">{item.caption}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && !admin ? (
        <GalleryLightbox
          items={lightbox.items}
          startId={lightbox.startId}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  )
}
