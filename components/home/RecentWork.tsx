'use client'



import Link from 'next/link'

import DestinationField from '@/components/home/DestinationField'

import EditableText from '@/components/home/EditableText'

import HomeSection from '@/components/home/HomeSection'

import ShowToggle from '@/components/home/ShowToggle'

import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'

import type { HomeContent } from '@/lib/homeContent'

import { HOME_LABELS } from '@/lib/homeVocabulary'

import type { PublicGalleryItem } from '@/lib/types'

import GalleryMedia from '@/components/studio/GalleryMedia'



interface RecentWorkProps {

  items: PublicGalleryItem[]

  content: HomeContent

}



/**

 * Selected public gallery work. Renders an empty state when none are available.

 */

export default function RecentWork({ items, content }: RecentWorkProps) {

  const photos = items.slice(0, 8)

  const admin = useHomeAdmin()

  const showCta = admin || content.showRecentCta



  const ctaEditor = (

    <div className={admin && !content.showRecentCta ? 'opacity-50' : ''}>

      <ShowToggle

        label="Show this link"

        checked={content.showRecentCta}

        onChange={(checked) => admin && patchHomeField(admin.setContent, 'showRecentCta', checked)}

      />

      {admin ? (

        <>

          <EditableText

            field="recentCta"

            value={content.recentCta}

            label={HOME_LABELS.recentCta}

            className="inline-flex min-h-11 items-center text-sm font-semibold home-accent"

          />

          <DestinationField

            value={content.recentCtaHref}

            onChange={(href) => patchHomeField(admin.setContent, 'recentCtaHref', href)}

          />

        </>

      ) : content.recentCta.trim() ? (

        <Link

          href={content.recentCtaHref}

          className="inline-flex min-h-11 items-center text-sm font-semibold home-accent hover:underline"

        >

          {content.recentCta}

        </Link>

      ) : null}

    </div>

  )



  return (

    <HomeSection

      id="work"

      labelledBy="recent-heading"

      visible={content.showRecentSection}

      visibleField="showRecentSection"

      className="home-bg-2"

    >

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-4 sm:px-6">

        <div className="flex items-end justify-between gap-4">

          <EditableText

            field="recentHeading"

            value={content.recentHeading}

            label={HOME_LABELS.recentHeading}

            as="h2"

            className="font-serif text-2xl font-semibold home-text sm:text-3xl"

          />

          {showCta ? <div className="hidden sm:block">{ctaEditor}</div> : null}

        </div>



        {photos.length === 0 ? (

          <EditableText

            field="recentEmpty"

            value={content.recentEmpty}

            label={HOME_LABELS.recentEmpty}

            as="p"

            multiline

            className="rounded-2xl border border-dashed home-border home-bg px-5 py-10 text-center text-sm home-text-muted"

          />

        ) : (

          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">

            {photos.map((item) => (

              <li key={item.id} className="overflow-hidden rounded-xl home-bg">

                <div className="relative aspect-square">

                  <GalleryMedia

                    src={item.imageUrl}

                    alt={item.caption || 'Recent celebration work'}

                    sizes="(max-width: 768px) 50vw, 25vw"

                    mode="thumb"

                  />

                </div>

              </li>

            ))}

          </ul>

        )}



        {showCta ? <div className="sm:hidden">{ctaEditor}</div> : null}

      </div>

    </HomeSection>

  )

}

