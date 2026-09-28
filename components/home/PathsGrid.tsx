'use client'

import Link from 'next/link'
import DestinationField from '@/components/home/DestinationField'
import EditableText from '@/components/home/EditableText'
import HomeSection from '@/components/home/HomeSection'
import ShowToggle from '@/components/home/ShowToggle'
import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'
import { HOME_LABELS } from '@/lib/homeVocabulary'

interface PathsGridProps {
  content: HomeContent
}

/**
 * Two equal customer paths: celebrations vs team apparel.
 */
export default function PathsGrid({ content }: PathsGridProps) {
  const admin = useHomeAdmin()
  const paths = [
    {
      href: content.path1Href,
      hrefField: 'path1Href' as const,
      titleField: 'path1Title' as const,
      bodyField: 'path1Body' as const,
      ctaField: 'path1Cta' as const,
      showKey: 'showPath1Cta' as const,
      title: content.path1Title,
      body: content.path1Body,
      cta: content.path1Cta,
      showCta: content.showPath1Cta,
    },
    {
      href: content.path2Href,
      hrefField: 'path2Href' as const,
      titleField: 'path2Title' as const,
      bodyField: 'path2Body' as const,
      ctaField: 'path2Cta' as const,
      showKey: 'showPath2Cta' as const,
      title: content.path2Title,
      body: content.path2Body,
      cta: content.path2Cta,
      showCta: content.showPath2Cta,
    },
  ]

  return (
    <HomeSection
      id="paths"
      labelledBy="paths-heading"
      visible={content.showPathsSection}
      visibleField="showPathsSection"
      className="home-bg-2"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-4 sm:px-6">
        <EditableText
          field="pathsHeading"
          value={content.pathsHeading}
          label={HOME_LABELS.pathsHeading}
          as="h2"
          className="font-serif text-2xl font-semibold home-text sm:text-3xl"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((path) => {
            const showCta = admin || path.showCta
            const inner = (
              <div className="flex flex-col gap-2">
                <EditableText
                  field={path.titleField}
                  value={path.title}
                  label={HOME_LABELS.pathTitle}
                  as="h3"
                  className="text-lg font-semibold home-text"
                />
                <EditableText
                  field={path.bodyField}
                  value={path.body}
                  label={HOME_LABELS.pathBody}
                  as="p"
                  multiline
                  className="text-sm leading-relaxed home-text-muted"
                />
                {showCta ? (
                  <div className={admin && !path.showCta ? 'opacity-50' : ''}>
                    <ShowToggle
                      label="Show this link"
                      checked={path.showCta}
                      onChange={(checked) =>
                        admin && patchHomeField(admin.setContent, path.showKey, checked)
                      }
                    />
                    {admin ? (
                      <EditableText
                        field={path.ctaField}
                        value={path.cta}
                        label={HOME_LABELS.pathCta}
                        className="inline-flex min-h-11 items-center text-sm font-semibold home-accent"
                      />
                    ) : path.cta.trim() ? (
                      <span className="inline-flex min-h-11 items-center text-sm font-semibold home-accent">
                        {path.cta}
                      </span>
                    ) : null}
                    {admin ? (
                      <DestinationField
                        value={path.href}
                        onChange={(href) => patchHomeField(admin.setContent, path.hrefField, href)}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
            const className =
              'rounded-2xl border home-border home-bg p-6 transition hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
            return admin ? (
              <div key={path.titleField} className={className}>
                {inner}
              </div>
            ) : (
              <Link key={path.titleField} href={path.href} className={className}>
                {inner}
              </Link>
            )
          })}
        </div>
      </div>
    </HomeSection>
  )
}
