'use client'

import { useMemo, useState } from 'react'
import { QUOTE_STATUS_LABELS, quoteStatuses, type QuoteStatus, type StudioQuoteRecord } from '@/lib/quoteTypes'
import { fieldKind, fieldOptions, orderedQuoteDefs, parseChoiceList, parsePhotoList, type QuoteFormSettings } from '@/lib/quoteForm'
import Link from 'next/link'

interface QuotesAdminClientProps {
  initialItems: StudioQuoteRecord[]
  form: QuoteFormSettings
}

/**
 * Admin list and detail editor for studio quote requests.
 */
export default function QuotesAdminClient({ initialItems, form }: QuotesAdminClientProps) {
  const [items, setItems] = useState(initialItems)
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id || '')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const [notesDraft, setNotesDraft] = useState(initialItems[0]?.adminNotes || '')

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  )

  /**
   * Select a quote and load its notes into the editor.
   *
   * @param id - Quote number
   */
  function selectQuote(id: string) {
    const next = items.find((item) => item.id === id)
    setSelectedId(id)
    setNotesDraft(next?.adminNotes || '')
    setError('')
    setStatus('')
  }

  /**
   * Persist status and/or notes for the selected quote.
   *
   * @param patch - Fields to send
   */
  async function savePatch(patch: { status?: QuoteStatus; adminNotes?: string }) {
    if (!selected) return
    setPending(true)
    setError('')
    setStatus('')
    try {
      const response = await fetch('/api/studio/admin/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...patch }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not update quote')
      }
      const updated = data.item as StudioQuoteRecord
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setNotesDraft(updated.adminNotes)
      setStatus('Saved')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update quote')
    } finally {
      setPending(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold home-text">Quotes</h1>
        <p className="mt-3 text-sm home-text-muted">
          No quote requests yet. When someone submits the studio form, it will show up here.
        </p>
        <p className="mt-4">
          <Link href="/admin/quotes/form" className="text-sm font-semibold home-accent underline">
            Edit quote form
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold home-text">Quotes</h1>
          <p className="mt-2 text-sm home-text-muted">
            Newest first. Open a request to change status or add internal notes.
          </p>
        </div>
        <Link href="/admin/quotes/form" className="text-sm font-semibold home-accent underline">
          Edit quote form
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ul className="divide-y home-border overflow-hidden rounded-2xl border home-border home-bg-2">
          {items.map((item) => {
            const active = item.id === selectedId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectQuote(item.id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${
                    active ? 'home-accent-bg text-white' : 'hover:bg-black/5'
                  }`}
                >
                  <span className="text-sm font-semibold">{item.id}</span>
                  <span className="text-sm">
                    {item.firstName} {item.lastName}
                  </span>
                  <span className={`text-xs ${active ? 'text-white/80' : 'home-text-muted'}`}>
                    {QUOTE_STATUS_LABELS[item.status]} · {item.eventDate || 'No date'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {selected ? (
          <div className="rounded-2xl border home-border home-bg-2 p-5 shadow-sm sm:p-6">
            <h2 className="font-serif text-xl font-semibold home-text">{selected.id}</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-gray-600">Name</dt>
                <dd>
                  {selected.firstName} {selected.lastName}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Submitted</dt>
                <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
              {orderedQuoteDefs(form)
                .filter((field) => field.key !== 'firstName' && field.key !== 'lastName')
                .map((field) => {
                const settings = form.fields[field.key]
                const kind = settings ? fieldKind(field, settings) : field.kind
                const options = settings ? fieldOptions(field, settings) : field.options
                const label = settings?.label || field.defaultLabel
                if (kind === 'photos') {
                  const urls =
                    field.key === 'venuePhotos'
                      ? selected.venuePhotos
                      : field.key === 'inspirationPhotos'
                        ? selected.inspirationPhotos
                        : parsePhotoList(selected[field.key])
                  if (!urls?.length) return null
                  return (
                    <div key={field.key} className="sm:col-span-2">
                      <dt className="font-medium text-gray-600">{label}</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {urls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-20 w-20 rounded-md object-cover border home-border" />
                          </a>
                        ))}
                      </dd>
                    </div>
                  )
                }
                const raw =
                  field.key === 'interests'
                    ? selected.interests.join(', ')
                    : kind === 'checkbox'
                      ? parseChoiceList(selected[field.key]).join(', ')
                      : Array.isArray(selected[field.key])
                        ? (selected[field.key] as string[]).join(', ')
                        : String(selected[field.key] || '')
                if (!raw) return null
                const option = options?.find((item) => item.value === raw)
                return (
                  <div key={field.key} className={kind === 'textarea' ? 'sm:col-span-2' : undefined}>
                    <dt className="font-medium text-gray-600">{label}</dt>
                    <dd className="whitespace-pre-wrap">
                      {field.key === 'email' ? (
                        <a className="home-accent underline" href={`mailto:${raw}`}>
                          {raw}
                        </a>
                      ) : field.key === 'phone' ? (
                        <a className="home-accent underline" href={`tel:${raw}`}>
                          {raw}
                        </a>
                      ) : (
                        option?.label || raw
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>

            <label className="mt-5 block text-sm font-medium text-gray-700">
              Status
              <select
                className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
                value={selected.status}
                disabled={pending}
                onChange={(event) => savePatch({ status: event.target.value as QuoteStatus })}
              >
                {quoteStatuses.map((value) => (
                  <option key={value} value={value}>
                    {QUOTE_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              Internal notes
              <textarea
                rows={4}
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => savePatch({ adminNotes: notesDraft })}
                className="inline-flex min-h-11 items-center rounded-full home-accent-bg px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? 'Saving…' : 'Save notes'}
              </button>
              {status ? <p className="text-sm text-green-800">{status}</p> : null}
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
