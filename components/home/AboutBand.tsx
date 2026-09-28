'use client'

import EditableImage from '@/components/home/EditableImage'
import EditableText from '@/components/home/EditableText'
import HomeSection from '@/components/home/HomeSection'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'
import { HOME_LABELS } from '@/lib/homeVocabulary'

interface AboutBandProps {
  content: HomeContent
}

/**
 * Meet-the-artist band: portrait sits in a tilted frame with copy wrapping beside it.
 */
export default function AboutBand({ content }: AboutBandProps) {
  const admin = useHomeAdmin()
  if (
    !admin &&
    !content.aboutHeading.trim() &&
    !content.aboutLead.trim() &&
    !content.aboutText.trim()
  ) {
    return null
  }

  return (
    <HomeSection
      id="about"
      labelledBy="about-heading"
      visible={content.showAboutSection}
      visibleField="showAboutSection"
      className="home-bg-2"
    >
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 sm:pb-20">
        <div className="relative lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="relative mx-auto max-w-sm lg:col-span-5 lg:mx-0 lg:max-w-none">
            <div
              className="absolute -left-6 top-10 h-40 w-40 rounded-full opacity-30 sm:h-56 sm:w-56"
              style={{ background: 'var(--home-accent)' }}
              aria-hidden
            />
            <div
              className="absolute -right-4 bottom-8 h-24 w-24 rounded-full opacity-20"
              style={{ background: 'var(--home-accent)' }}
              aria-hidden
            />
            <div className="relative -rotate-2 overflow-hidden rounded-[2rem] border-4 border-white shadow-xl">
              <EditableImage
                field="aboutImageSrc"
                src={content.aboutImageSrc}
                alt={content.aboutImageAlt}
                fill={false}
                width={1600}
                height={1200}
                sizes="(max-width: 1024px) 90vw, 40vw"
                label={HOME_LABELS.aboutImage}
              />
            </div>
          </div>

          <div className="relative mt-10 lg:col-span-7 lg:mt-0 lg:pt-6">
            <EditableText
              field="aboutKicker"
              value={content.aboutKicker}
              label={HOME_LABELS.aboutKicker}
              as="p"
              className="text-xs font-semibold uppercase tracking-[0.2em] home-accent"
            />
            <EditableText
              field="aboutHeading"
              value={content.aboutHeading}
              label={HOME_LABELS.aboutHeading}
              as="h2"
              className="mt-2 font-serif text-3xl font-semibold leading-tight home-text sm:text-4xl"
            />
            <EditableText
              field="aboutLead"
              value={content.aboutLead}
              label={HOME_LABELS.aboutLead}
              as="p"
              multiline
              className="mt-5 font-serif text-xl leading-relaxed home-text sm:text-2xl"
            />
            <EditableText
              field="aboutText"
              value={content.aboutText}
              label={HOME_LABELS.aboutText}
              as="p"
              multiline
              className="mt-5 max-w-prose text-base leading-relaxed home-text-muted"
            />
            <EditableText
              field="aboutSignoff"
              value={content.aboutSignoff}
              label={HOME_LABELS.aboutSignoff}
              as="p"
              className="mt-6 text-sm italic home-accent"
            />
          </div>
        </div>
      </div>
    </HomeSection>
  )
}
