'use client'

import DestinationField from '@/components/home/DestinationField'
import EditableImage from '@/components/home/EditableImage'
import EditableText from '@/components/home/EditableText'
import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import { ADMIN_NAV_HELP, headerNavSlots } from '@/lib/homeChrome'
import { HOME_LABELS } from '@/lib/homeVocabulary'

/**
 * Form for header logos, title, visibility, and navigation slots.
 */
export default function HeaderAdminPanel() {
  const admin = useHomeAdmin()
  if (!admin) return null
  const { content, setContent } = admin
  const nav = headerNavSlots(content)

  return (
    <section className="border-b home-border bg-yellow-50/70 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-yellow-950/80">
          Edit labels and destinations here. Empty labels are hidden on the live header.
          Header icon 1 is always shown and is also the browser tab icon.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-1">
          <div className="relative h-14 w-14 flex-shrink-0 sm:h-16 sm:w-16">
            <EditableImage
              field="headerLogoSrc"
              src={content.headerLogoSrc}
              alt=""
              fill
              sizes="48px"
              objectFit="contain"
              variant="icon"
              label={HOME_LABELS.headerIcon}
            />
          </div>
          <div className="relative h-14 w-36 flex-shrink-0 sm:h-16 sm:w-40">
            <EditableImage
              field="headerLogo2Src"
              src={content.headerLogo2Src}
              alt=""
              fill
              sizes="160px"
              objectFit="contain"
              variant="icon"
              label={HOME_LABELS.headerIcon2}
            />
          </div>
          <EditableText
            field="headerTitle"
            value={content.headerTitle}
            label={HOME_LABELS.headerTitle}
            className="text-base font-semibold home-text"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-yellow-950">
          <label className="inline-flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={content.showHeaderIcon2}
              onChange={(event) => patchHomeField(setContent, 'showHeaderIcon2', event.target.checked)}
            />
            Show {HOME_LABELS.headerIcon2}
          </label>
          <label className="inline-flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={content.showHeaderHouse}
              onChange={(event) => patchHomeField(setContent, 'showHeaderHouse', event.target.checked)}
            />
            Show {HOME_LABELS.headerHouse}
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nav.map((item) => (
            <div key={item.labelField} className="rounded-lg border border-yellow-300 bg-white p-3">
              <EditableText
                field={item.labelField}
                value={item.label}
                label={item.vocab}
                className="text-sm font-medium home-text"
              />
              <DestinationField
                value={item.href}
                onChange={(href) => patchHomeField(setContent, item.hrefField, href)}
              />
            </div>
          ))}
          <div
            className="rounded-lg border border-dashed border-yellow-400 bg-white p-3"
            title={ADMIN_NAV_HELP}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-900">Admin</p>
            <p className="mt-1 text-sm font-medium home-text">Admin</p>
            <p className="mt-2 text-xs text-yellow-950/80">{ADMIN_NAV_HELP}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
