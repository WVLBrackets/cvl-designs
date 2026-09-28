'use client'

import Link from 'next/link'
import EditableText from '@/components/home/EditableText'
import HomeSection from '@/components/home/HomeSection'
import ShowToggle from '@/components/home/ShowToggle'
import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'
import { HOME_LABELS } from '@/lib/homeVocabulary'
import { QUOTE_ROUTE, TEAM_STORES_ROUTE } from '@/lib/homeHeroMedia'

interface FinalCtaProps {
  content: HomeContent
}

/**
 * Closing call to action for quote vs team-store shoppers.
 */
export default function FinalCta({ content }: FinalCtaProps) {
  const admin = useHomeAdmin()
  const showPrimary = admin || content.showFinalCtaPrimary
  const showSecondary = admin || content.showFinalCtaSecondary

  return (
    <HomeSection
      id="ready"
      labelledBy="final-heading"
      visible={content.showFinalSection}
      visibleField="showFinalSection"
      className="home-inverse"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-12 pt-4 sm:px-6 sm:pb-16">
        <EditableText
          field="finalHeading"
          value={content.finalHeading}
          label={HOME_LABELS.finalHeading}
          as="h2"
          onDark
          className="font-serif text-2xl font-semibold sm:text-3xl"
        />
        <EditableText
          field="finalBody"
          value={content.finalBody}
          label={HOME_LABELS.finalBody}
          as="p"
          multiline
          onDark
          className="max-w-xl text-sm opacity-80 sm:text-base"
        />
        {showPrimary || showSecondary ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            {showPrimary ? (
              <div className={admin && !content.showFinalCtaPrimary ? 'opacity-50' : ''}>
                  <ShowToggle
                    checked={content.showFinalCtaPrimary}
                    className="text-current"
                  onChange={(checked) =>
                    admin && patchHomeField(admin.setContent, 'showFinalCtaPrimary', checked)
                  }
                />
                {admin ? (
                  <EditableText
                    field="finalCtaPrimary"
                    value={content.finalCtaPrimary}
                    label={HOME_LABELS.finalPrimary}
                    onDark
                    className="inline-flex min-h-11 items-center justify-center rounded-full home-accent-bg px-5 py-2 text-sm font-semibold text-white"
                  />
                ) : content.finalCtaPrimary.trim() ? (
                  <Link
                    href={QUOTE_ROUTE}
                    className="inline-flex min-h-11 items-center justify-center rounded-full home-accent-bg px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {content.finalCtaPrimary}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {showSecondary ? (
              <div className={admin && !content.showFinalCtaSecondary ? 'opacity-50' : ''}>
                  <ShowToggle
                    checked={content.showFinalCtaSecondary}
                    className="text-current"
                  onChange={(checked) =>
                    admin && patchHomeField(admin.setContent, 'showFinalCtaSecondary', checked)
                  }
                />
                {admin ? (
                  <EditableText
                    field="finalCtaSecondary"
                    value={content.finalCtaSecondary}
                    label={HOME_LABELS.finalSecondary}
                    onDark
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-current px-5 py-2 text-sm font-semibold"
                  />
                ) : content.finalCtaSecondary.trim() ? (
                  <Link
                    href={TEAM_STORES_ROUTE}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-current px-5 py-2 text-sm font-semibold hover:opacity-80"
                  >
                    {content.finalCtaSecondary}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </HomeSection>
  )
}
