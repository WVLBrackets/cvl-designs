'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  QUOTE_FIELD_DEFS,
  QUOTE_FIELD_GROUPS,
  type QuoteFieldSettings,
  type QuoteFormSettings,
  type QuoteWhen,
} from '@/lib/quoteForm'

interface QuoteFormAdminClientProps {
  initialSettings: QuoteFormSettings
}

/**
 * Edit quote form title, intro, and per-question visibility / required / condition.
 */
export default function QuoteFormAdminClient({ initialSettings }: QuoteFormAdminClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)

  /**
   * Patch one field's admin flags.
   *
   * @param key - Catalog key
   * @param patch - Partial settings
   */
  function patchField(key: string, patch: Partial<QuoteFieldSettings>) {
    setSettings((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [key]: { ...current.fields[key], ...patch },
      },
    }))
  }

  async function handleSave() {
    setPending(true)
    setError('')
    setStatus('')
    try {
      const response = await fetch('/api/studio/admin/quote-form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not save the quote form')
      }
      setSettings(data.settings as QuoteFormSettings)
      setStatus('Saved. The public quote form will use these questions.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold home-text">Quote form</h1>
          <p className="mt-2 text-sm home-text-muted">
            Show, hide, or require questions. Conditional questions only appear for balloons or banners.
            Hidden questions still have a column so you can turn them on later.
          </p>
        </div>
        <Link href="/admin/quotes" className="text-sm font-semibold home-accent underline">
          View quote requests
        </Link>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border home-border home-bg-2 p-5">
        <label className="block text-sm font-medium text-gray-700">
          Form title
          <input
            value={settings.title}
            onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))}
            className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Intro
          <textarea
            rows={2}
            value={settings.intro}
            onChange={(event) => setSettings((current) => ({ ...current, intro: event.target.value }))}
            className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
          />
        </label>
      </div>

      {QUOTE_FIELD_GROUPS.map((group) => (
        <section key={group.id} className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide home-text">{group.label}</h2>
          <div className="mt-3 space-y-3">
            {QUOTE_FIELD_DEFS.filter((field) => field.group === group.id).map((field) => {
              const row = settings.fields[field.key]
              const locked = Boolean(field.locked)
              return (
                <div key={field.key} className="rounded-xl border home-border home-bg-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold home-text">{row.label}</p>
                      <p className="text-xs home-text-muted">{field.key}</p>
                    </div>
                    {locked ? (
                      <p className="text-xs font-medium text-yellow-900">Always shown, always required</p>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Label
                      <input
                        value={row.label}
                        onChange={(event) => patchField(field.key, { label: event.target.value })}
                        className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Help text
                      <input
                        value={row.help}
                        onChange={(event) => patchField(field.key, { help: event.target.value })}
                        className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex min-h-9 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.visible}
                        disabled={locked}
                        onChange={(event) => patchField(field.key, { visible: event.target.checked })}
                      />
                      Show this question
                    </label>
                    <label className="inline-flex min-h-9 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.required}
                        disabled={locked}
                        onChange={(event) => patchField(field.key, { required: event.target.checked })}
                      />
                      Required
                    </label>
                    <label className="inline-flex min-h-9 items-center gap-2">
                      Show for
                      <select
                        value={row.when}
                        disabled={locked}
                        onChange={(event) => patchField(field.key, { when: event.target.value as QuoteWhen })}
                        className="rounded-md border home-border home-bg px-2 py-1"
                      >
                        <option value="all">All quotes</option>
                        <option value="balloons">Balloons only</option>
                        <option value="banners">Banners only</option>
                      </select>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 mt-8 border-t home-border bg-white/95 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="inline-flex min-h-11 items-center rounded-full home-accent-bg px-6 py-2 font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save quote form'}
          </button>
          {status ? <p className="text-sm text-green-800">{status}</p> : null}
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
