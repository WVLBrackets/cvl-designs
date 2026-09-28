'use client'

import Link from 'next/link'
import DestinationField from '@/components/home/DestinationField'
import EditableText, { EditableOfferingText } from '@/components/home/EditableText'
import EditableImage from '@/components/home/EditableImage'
import ShowToggle from '@/components/home/ShowToggle'
import { useHomeAdmin, patchOffering } from '@/components/home/HomeAdminContext'
import HomeSection from '@/components/home/HomeSection'
import { offeringHref, type HomeContent } from '@/lib/homeContent'
import { HOME_LABELS } from '@/lib/homeVocabulary'

interface OfferingsProps {
  content: HomeContent
}

/**
 * Offering cards. Public visitors only see enabled cards; admin always sees all three with toggles.
 */
export default function Offerings({ content }: OfferingsProps) {
  const admin = useHomeAdmin()
  const visible = admin ? content.offerings : content.offerings.filter((item) => item.enabled)
  const count = visible.length

  if (!admin && count === 0) return null

  const gridClass =
    count <= 1
      ? 'grid gap-6 sm:max-w-md sm:mx-auto'
      : count === 2
        ? 'grid gap-6 sm:grid-cols-2'
        : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <HomeSection
      id="offerings"
      labelledBy="offerings-heading"
      visible={content.showOfferingsSection}
      visibleField="showOfferingsSection"
      className="home-bg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-4 sm:px-6">
        <EditableText
          field="offeringsHeading"
          value={content.offeringsHeading}
          label={HOME_LABELS.offeringsHeading}
          as="h2"
          className="font-serif text-2xl font-semibold home-text sm:text-3xl"
        />
        <ul className={gridClass}>
          {visible.map((item) => {
            const showCta = admin || item.ctaVisible
            return (
              <li
                key={item.id}
                className={`rounded-2xl border home-border home-bg-2 p-5 ${
                  admin && !item.enabled ? 'opacity-60' : ''
                }`}
              >
                {admin ? (
                  <label className="mb-4 flex min-h-11 items-center gap-2 text-sm font-medium home-text">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) =>
                        patchOffering(admin.setContent, item.id, { enabled: event.target.checked })
                      }
                      className="h-4 w-4"
                      style={{ accentColor: 'var(--home-accent)' }}
                    />
                    Show this offering
                  </label>
                ) : null}
                <div className="relative mx-auto h-16 w-16 sm:h-20 sm:w-20">
                  <EditableImage
                    field={`offering.${item.id}.imageSrc`}
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    objectFit="contain"
                    variant="icon"
                    sizes="80px"
                    label={HOME_LABELS.offeringIcon}
                  />
                </div>
                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                  <EditableOfferingText
                    id={item.id}
                    offeringKey="title"
                    value={item.title}
                    label={HOME_LABELS.offeringTitle}
                    as="h3"
                    className="text-base font-semibold home-text"
                  />
                  <EditableOfferingText
                    id={item.id}
                    offeringKey="body"
                    value={item.body}
                    label={HOME_LABELS.offeringBody}
                    as="p"
                    multiline
                    className="text-sm home-text-muted"
                  />
                  {showCta ? (
                    <div className={admin && !item.ctaVisible ? 'opacity-50' : ''}>
                      <ShowToggle
                        label="Show this link"
                        checked={item.ctaVisible}
                        onChange={(checked) =>
                          admin && patchOffering(admin.setContent, item.id, { ctaVisible: checked })
                        }
                      />
                      {admin ? (
                        <>
                          <EditableOfferingText
                            id={item.id}
                            offeringKey="cta"
                            value={item.cta}
                            label={HOME_LABELS.offeringCta}
                            className="inline-flex min-h-11 items-center text-sm font-semibold home-accent"
                          />
                          <DestinationField
                            value={item.ctaHref}
                            onChange={(href) =>
                              patchOffering(admin.setContent, item.id, { ctaHref: href })
                            }
                          />
                        </>
                      ) : item.cta.trim() ? (
                        <Link
                          href={offeringHref(item.id, item.ctaHref)}
                          className="inline-flex min-h-11 items-center text-sm font-semibold home-accent hover:underline"
                        >
                          {item.cta}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </HomeSection>
  )
}
