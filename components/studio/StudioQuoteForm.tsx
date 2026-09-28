'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import QuotePhotoField from '@/components/studio/QuotePhotoField'
import { STUDIO_ROUTE } from '@/lib/studio'
import {
  isQuoteFieldRequired,
  isQuoteFieldShown,
  QUOTE_FIELD_DEFS,
  type QuoteFieldDef,
  type QuoteFormSettings,
} from '@/lib/quoteForm'
import { formatUsPhone } from '@/lib/validation'

interface StudioQuoteFormProps {
  form: QuoteFormSettings
}

const inputClass =
  'w-full px-3 py-2 rounded-md border home-border home-bg focus:outline-none focus:ring-2'

const CONTACT_KEYS = ['firstName', 'lastName', 'email', 'phone']

/**
 * Public form to request a balloons and banners quote.
 */
export default function StudioQuoteForm({ form }: StudioQuoteFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [balloons, setBalloons] = useState(false)
  const [banners, setBanners] = useState(false)
  const [venuePhotos, setVenuePhotos] = useState<string[]>([])
  const [inspirationPhotos, setInspirationPhotos] = useState<string[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState('')

  const interests = useMemo(() => {
    const list: Array<'balloons' | 'banners'> = []
    if (balloons) list.push('balloons')
    if (banners) list.push('banners')
    return list
  }, [balloons, banners])

  /**
   * Update a text-like field.
   *
   * @param key - Field key
   * @param value - Next value
   */
  function setField(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { ...values, interests, venuePhotos, inspirationPhotos }
      const response = await fetch('/api/studio/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.error || 'Could not send your request. Please try again.')
        return
      }
      setSubmittedId(data.id || 'ok')
    } catch {
      setError('Could not send your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Render one catalog field according to kind and live settings.
   *
   * @param def - Catalog field
   */
  function renderField(def: QuoteFieldDef) {
    const settings = form.fields[def.key]
    if (!settings || !isQuoteFieldShown(def, settings, interests)) return null
    const required = isQuoteFieldRequired(settings, interests)
    const label = `${settings.label}${required ? ' *' : ''}`
    const value = values[def.key] || ''

    if (def.kind === 'interests') {
      return (
        <fieldset key={def.key}>
          <legend className="text-sm font-medium text-gray-700 mb-2">{label}</legend>
          {settings.help ? <p className="mb-2 text-sm home-text-muted">{settings.help}</p> : null}
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={balloons}
                onChange={(event) => setBalloons(event.target.checked)}
                className="rounded border-gray-300"
              />
              Balloons
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={banners}
                onChange={(event) => setBanners(event.target.checked)}
                className="rounded border-gray-300"
              />
              Banners
            </label>
          </div>
        </fieldset>
      )
    }

    if (def.kind === 'photos') {
      return (
        <QuotePhotoField
          key={def.key}
          label={label}
          help={settings.help}
          folder={def.key === 'venuePhotos' ? 'venue' : 'inspiration'}
          urls={def.key === 'venuePhotos' ? venuePhotos : inspirationPhotos}
          onChange={def.key === 'venuePhotos' ? setVenuePhotos : setInspirationPhotos}
        />
      )
    }

    if (def.kind === 'textarea') {
      return (
        <label key={def.key} className="block text-sm font-medium text-gray-700">
          {label}
          {settings.help ? <span className="block font-normal home-text-muted">{settings.help}</span> : null}
          <textarea
            required={required}
            rows={4}
            value={value}
            onChange={(event) => setField(def.key, event.target.value)}
            className={`${inputClass} mt-1`}
            maxLength={def.maxLength}
          />
        </label>
      )
    }

    if (def.kind === 'select') {
      return (
        <label key={def.key} className="block text-sm font-medium text-gray-700">
          {label}
          {settings.help ? <span className="block font-normal home-text-muted">{settings.help}</span> : null}
          <select
            required={required}
            value={value}
            onChange={(event) => setField(def.key, event.target.value)}
            className={`${inputClass} mt-1`}
          >
            <option value="">{required ? 'Please choose' : 'Optional'}</option>
            {(def.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (def.kind === 'radio') {
      return (
        <fieldset key={def.key}>
          <legend className="text-sm font-medium text-gray-700">{label}</legend>
          {settings.help ? <p className="text-sm home-text-muted">{settings.help}</p> : null}
          <div className="mt-2 space-y-2">
            {(def.options || []).map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name={def.key}
                  value={option.value}
                  required={required}
                  checked={value === option.value}
                  onChange={() => setField(def.key, option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      )
    }

    const inputType =
      def.kind === 'date' ? 'date' : def.key === 'email' ? 'email' : def.key === 'phone' ? 'tel' : 'text'
    return (
      <label key={def.key} className="block text-sm font-medium text-gray-700">
        {label}
        {settings.help ? <span className="block font-normal home-text-muted">{settings.help}</span> : null}
        <input
          type={inputType}
          name={def.key === 'phone' ? 'phone' : undefined}
          required={required}
          value={value}
          onChange={(event) =>
            setField(def.key, def.key === 'phone' ? formatUsPhone(event.target.value) : event.target.value)
          }
          onInput={
            def.key === 'phone'
              ? (event) => setField('phone', formatUsPhone((event.target as HTMLInputElement).value))
              : undefined
          }
          className={`${inputClass} mt-1`}
          autoComplete={
            def.key === 'firstName'
              ? 'given-name'
              : def.key === 'lastName'
                ? 'family-name'
                : def.key === 'email'
                  ? 'email'
                  : def.key === 'phone'
                    ? 'tel-national'
                    : undefined
          }
          placeholder={def.key === 'phone' ? '(555) 555-5555' : undefined}
        />
      </label>
    )
  }

  if (submittedId) {
    return (
      <div className="rounded-2xl border home-border home-bg-2 p-6 text-center shadow-sm sm:p-8">
        <h1 className="mb-3 font-serif text-2xl font-semibold home-text">Request received</h1>
        <p className="mb-6 home-text-muted">
          Thank you. We will review your details and follow up by email or phone.
          {submittedId && submittedId !== 'ok' ? (
            <>
              {' '}
              Your quote number is <span className="font-semibold home-text">{submittedId}</span>.
            </>
          ) : null}
        </p>
        <Link
          href={STUDIO_ROUTE}
          className="inline-flex min-h-11 items-center rounded-full home-accent-bg px-5 py-2 font-semibold text-white hover:opacity-90"
        >
          Back to gallery
        </Link>
      </div>
    )
  }

  const contactDefs = QUOTE_FIELD_DEFS.filter((field) => CONTACT_KEYS.includes(field.key))
  const restDefs = QUOTE_FIELD_DEFS.filter((field) => !CONTACT_KEYS.includes(field.key))

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border home-border home-bg-2 p-5 shadow-sm sm:p-8">
      <h1 className="font-serif text-2xl font-semibold home-text sm:text-3xl">{form.title}</h1>
      {form.intro ? <p className="text-sm home-text-muted sm:text-base">{form.intro}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{contactDefs.map((def) => renderField(def))}</div>
      {restDefs.map((def) => renderField(def))}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center rounded-full home-accent-bg px-5 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Submit request'}
        </button>
        <Link href={STUDIO_ROUTE} className="text-sm font-semibold home-accent underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
