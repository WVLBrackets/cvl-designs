'use client'

import DestinationField from '@/components/home/DestinationField'
import EditableText from '@/components/home/EditableText'
import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import { footerNavSlots } from '@/lib/homeChrome'
import { HOME_LABELS } from '@/lib/homeVocabulary'

/**
 * Form for footer captions, destinations, and legal line.
 */
export default function FooterAdminPanel() {
  const admin = useHomeAdmin()
  if (!admin) return null
  const { content, setContent } = admin
  const links = footerNavSlots(content)

  return (
    <section className="border-t home-border bg-yellow-50/70 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-yellow-950/80">
          Edit labels and destinations here. Empty labels are hidden on the live footer.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
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
        </div>
        <div className="mt-4 rounded-lg border border-yellow-300 bg-white p-3">
          <EditableText
            field="footerText"
            value={content.footerText}
            label={HOME_LABELS.footerText}
            as="p"
            multiline
            className="text-sm home-text-muted"
          />
        </div>
      </div>
    </section>
  )
}
