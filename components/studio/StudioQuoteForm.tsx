'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STUDIO_ROUTE } from '@/lib/studio'

interface StudioQuoteFormProps {
  title: string
}

/**
 * Format a US phone number as the user types.
 *
 * @param digitsOnly - Raw input
 */
function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-400 focus:border-pink-400'

/**
 * Public form to request a balloons and banners quote.
 */
export default function StudioQuoteForm({ title }: StudioQuoteFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [occasion, setOccasion] = useState('')
  const [location, setLocation] = useState('')
  const [balloons, setBalloons] = useState(false)
  const [banners, setBanners] = useState(false)
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const interests: Array<'balloons' | 'banners'> = []
      if (balloons) interests.push('balloons')
      if (banners) interests.push('banners')

      const response = await fetch('/api/studio/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          eventDate,
          occasion,
          location,
          interests,
          details,
        }),
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

  if (submittedId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Request received</h1>
        <p className="text-gray-600 mb-6">
          Thank you. We will review your details and follow up by email or phone.
        </p>
        <Link
          href={STUDIO_ROUTE}
          className="inline-block px-5 py-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold"
        >
          Back to gallery
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-md p-5 sm:p-8 space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 text-sm sm:text-base">
        Tell us about your event and what you have in mind. We will follow up with a quote.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-gray-700">
          First name *
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`${inputClass} mt-1`}
            autoComplete="given-name"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Last name *
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`${inputClass} mt-1`}
            autoComplete="family-name"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Email *
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-1`}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Phone *
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className={`${inputClass} mt-1`}
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Event date
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Occasion
          <input
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="Birthday, wedding, team event…"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-700">
        Location / venue
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">I am interested in</legend>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={balloons}
              onChange={(e) => setBalloons(e.target.checked)}
              className="rounded border-gray-300 text-pink-500 focus:ring-pink-400"
            />
            Balloons
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={banners}
              onChange={(e) => setBanners(e.target.checked)}
              className="rounded border-gray-300 text-pink-500 focus:ring-pink-400"
            />
            Banners
          </label>
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-gray-700">
        What would you like? *
        <textarea
          required
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className={`${inputClass} mt-1`}
          placeholder="Colors, size, theme, quantity, deadline, or anything else we should know."
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold"
        >
          {submitting ? 'Sending…' : 'Submit request'}
        </button>
        <Link href={STUDIO_ROUTE} className="text-sm text-blue-600 underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
