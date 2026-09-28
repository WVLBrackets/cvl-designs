'use client'



import Link from 'next/link'

import { useMemo, useState } from 'react'

import AdminLabel from '@/components/home/AdminLabel'

import DestinationField from '@/components/home/DestinationField'

import HeroSlideshow, { type HeroSlide } from '@/components/home/HeroSlideshow'

import EditableText from '@/components/home/EditableText'

import ShowToggle from '@/components/home/ShowToggle'

import StyleToggle from '@/components/home/StyleToggle'

import type { HeroButtonStyle, HomeContent } from '@/lib/homeContent'

import { HOME_LABELS } from '@/lib/homeVocabulary'

import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'

import type { PublicGalleryItem } from '@/lib/types'

import GalleryLightbox from '@/components/studio/GalleryLightbox'



interface HomeHeroProps {

  content: HomeContent

  galleryItems: PublicGalleryItem[]

}



const STYLE_1 =

  'inline-flex min-h-11 items-center justify-center rounded-full home-accent-bg px-5 py-2 text-sm font-semibold text-white'

const STYLE_2 =

  'inline-flex min-h-11 items-center justify-center rounded-full border home-border px-5 py-2 text-sm font-semibold home-text'



/**

 * CSS classes for filled (1) vs outlined (2) hero buttons.

 *

 * @param style - Button chrome

 */

function buttonClass(style: HeroButtonStyle): string {

  return style === 2 ? STYLE_2 : STYLE_1

}



/**

 * Hero band: Home Hero gallery photos plus headline and up to three CTAs.

 */

export default function HomeHero({ content, galleryItems }: HomeHeroProps) {

  const admin = useHomeAdmin()

  const delayMs = Math.max(1, content.heroDelaySeconds || 5) * 1000

  const [lightboxId, setLightboxId] = useState<string | null>(null)



  const slides: HeroSlide[] = useMemo(() => {

    const marked = galleryItems.filter((item) => item.homeHero)

    if (marked.length > 0) {

      return marked.map((item) => ({

        id: item.id,

        src: item.imageUrl,

        alt: item.caption || content.heroImageAlt,

        playFull: item.heroVideoPlay === 'full',

      }))

    }

    return [

      {

        id: 'home-fallback',

        src: content.heroImageSrc,

        alt: content.heroImageAlt,

      },

    ]

  }, [galleryItems, content.heroImageSrc, content.heroImageAlt])



  const lightboxItems = useMemo(

    () =>

      slides.map((slide) => ({

        id: slide.id,

        src: slide.src,

        alt: slide.alt,

        caption: galleryItems.find((item) => item.id === slide.id)?.caption || slide.alt,

      })),

    [slides, galleryItems]

  )



  const buttons = [

    {

      id: 1 as const,

      label: content.heroCta1,

      href: content.heroCta1Href,

      style: content.heroCta1Style,

      show: content.showHeroCta1,

      field: 'heroCta1' as const,

      hrefField: 'heroCta1Href' as const,

      styleField: 'heroCta1Style' as const,

      showField: 'showHeroCta1' as const,

      vocab: HOME_LABELS.heroButton1,

    },

    {

      id: 2 as const,

      label: content.heroCta2,

      href: content.heroCta2Href,

      style: content.heroCta2Style,

      show: content.showHeroCta2,

      field: 'heroCta2' as const,

      hrefField: 'heroCta2Href' as const,

      styleField: 'heroCta2Style' as const,

      showField: 'showHeroCta2' as const,

      vocab: HOME_LABELS.heroButton2,

    },

    {

      id: 3 as const,

      label: content.heroCta3,

      href: content.heroCta3Href,

      style: content.heroCta3Style,

      show: content.showHeroCta3,

      field: 'heroCta3' as const,

      hrefField: 'heroCta3Href' as const,

      styleField: 'heroCta3Style' as const,

      showField: 'showHeroCta3' as const,

      vocab: HOME_LABELS.heroButton3,

    },

  ]



  const visibleButtons = buttons.filter((button) => (admin ? true : button.show && button.label.trim()))



  return (

    <section id="hero" className="home-bg">

      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-14">

        <div className="lg:order-2">

          <AdminLabel label={HOME_LABELS.heroImage}>

            <HeroSlideshow

              slides={slides}

              delayMs={delayMs}

              aspectClass="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]"

              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"

              hold={Boolean(lightboxId)}

              onSelect={

                admin

                  ? undefined

                  : (slide) => setLightboxId(slide.id)

              }

            />

          </AdminLabel>

        </div>

        <div className="flex flex-col gap-3 lg:order-1">

          <EditableText

            field="heroKicker"

            value={content.heroKicker}

            label={HOME_LABELS.eyebrow}

            as="p"

            className="text-xs font-semibold uppercase tracking-[0.2em] home-accent"

          />

          <EditableText

            field="heroTitle"

            value={content.heroTitle}

            label={HOME_LABELS.headline}

            as="h1"

            className="font-serif text-4xl font-semibold leading-tight home-text sm:text-5xl"

          />

          <EditableText

            field="heroSubtitle"

            value={content.heroSubtitle}

            label={HOME_LABELS.subhead}

            as="p"

            multiline

            className="max-w-lg text-base home-text-muted sm:text-lg"

          />

          {visibleButtons.length > 0 ? (

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

              {visibleButtons.map((button) => (

                <div

                  key={button.field}

                  className={admin && !button.show ? 'opacity-50' : ''}

                >

                  <ShowToggle

                    checked={button.show}

                    onChange={(checked) =>

                      admin && patchHomeField(admin.setContent, button.showField, checked)

                    }

                  />

                  {admin ? (

                    <EditableText

                      field={button.field}

                      value={button.label}

                      label={button.vocab}

                      onDark={button.style === 1}

                      className={buttonClass(button.style)}

                    />

                  ) : (

                    <Link

                      href={button.href}

                      className={`${buttonClass(button.style)} hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}

                    >

                      {button.label}

                    </Link>

                  )}

                  {admin ? (

                    <>

                      <StyleToggle

                        name={`hero-cta-style-${button.id}`}

                        value={button.style}

                        onChange={(style) =>

                          patchHomeField(admin.setContent, button.styleField, style)

                        }

                      />

                      <DestinationField

                        value={button.href}

                        onChange={(href) =>

                          patchHomeField(admin.setContent, button.hrefField, href)

                        }

                      />

                    </>

                  ) : null}

                </div>

              ))}

            </div>

          ) : null}

        </div>

      </div>

      {lightboxId && !admin ? (
        <GalleryLightbox
          items={lightboxItems}
          startId={lightboxId}
          onClose={() => setLightboxId(null)}
        />
      ) : null}

    </section>

  )

}

