'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  createCustomQuoteKey,
  fieldKind,
  fieldOptions,
  isCustomQuoteKey,
  orderedQuoteDefs,
  QUOTE_ADMIN_KINDS,
  QUOTE_KIND_LABELS,
  type QuoteFieldDef,
  type QuoteFieldKind,
  type QuoteFieldOption,
  type QuoteFieldSettings,
  type QuoteFormSettings,
  type QuoteWhen,
} from '@/lib/quoteForm'

interface QuoteFormAdminClientProps {
  initialSettings: QuoteFormSettings
}

/**
 * Edit quote form questions: type, options, required, order, and custom fields.
 */
export default function QuoteFormAdminClient({ initialSettings }: QuoteFormAdminClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)

  const defs = orderedQuoteDefs(settings)

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

  /**
   * Move a question one step in the form order.
   *
   * @param index - Current index
   * @param direction - Up or down
   */
  function moveField(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= defs.length) return
    const order = defs.map((item) => item.key)
    const swap = order[index]
    order[index] = order[next]
    order[next] = swap
    setSettings((current) => ({ ...current, fieldOrder: order }))
  }

  /**
   * Append a new custom question.
   */
  function addQuestion() {
    const key = createCustomQuoteKey()
    const def: QuoteFieldDef = {
      key,
      group: 'extra',
      kind: 'text',
      defaultLabel: 'New question',
      defaultHelp: '',
      defaultWhen: 'all',
      defaultVisible: true,
      defaultRequired: false,
      maxLength: 200,
      custom: true,
    }
    setSettings((current) => ({
      ...current,
      customFields: [...current.customFields, def],
      fieldOrder: [...orderedQuoteDefs(current).map((item) => item.key), key],
      fields: {
        ...current.fields,
        [key]: {
          visible: true,
          required: false,
          when: 'all',
          label: 'New question',
          help: '',
          kind: 'text',
          options: [],
        },
      },
    }))
  }

  /**
   * Remove an admin-created question.
   *
   * @param key - Custom field key
   */
  function removeQuestion(key: string) {
    setSettings((current) => {
      const fields = { ...current.fields }
      delete fields[key]
      return {
        ...current,
        customFields: current.customFields.filter((item) => item.key !== key),
        fieldOrder: current.fieldOrder.filter((item) => item !== key),
        fields,
      }
    })
  }

  /**
   * Replace option list for a dropdown / choice field.
   *
   * @param key - Field key
   * @param options - Next options
   */
  function setOptions(key: string, options: QuoteFieldOption[]) {
    patchField(key, { options })
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
            Reorder questions, choose a field type, and make any field optional. Custom questions are stored as JSON
            on each quote, so they do not require a new database column.
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

      <div className="mt-8 space-y-3">
        {defs.map((field, index) => {
          const row = settings.fields[field.key]
          if (!row) return null
          const kind = fieldKind(field, row)
          const options = fieldOptions(field, row)
          const needsOptions = kind === 'select' || kind === 'radio' || kind === 'checkbox'
          const custom = isCustomQuoteKey(field.key)
          return (
            <div key={field.key} className="rounded-xl border home-border home-bg-2 p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  {index > 0 ? (
                    <button
                      type="button"
                      aria-label={`Move ${row.label} up`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border home-border text-sm"
                      onClick={() => moveField(index, -1)}
                    >
                      ↑
                    </button>
                  ) : null}
                  {index < defs.length - 1 ? (
                    <button
                      type="button"
                      aria-label={`Move ${row.label} down`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border home-border text-sm"
                      onClick={() => moveField(index, 1)}
                    >
                      ↓
                    </button>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold home-text">{row.label}</p>
                  <p className="text-xs home-text-muted">{field.key}</p>
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
                    <label className="block text-sm font-medium text-gray-700">
                      Field type
                      <select
                        value={kind}
                        disabled={field.kind === 'interests'}
                        onChange={(event) =>
                          patchField(field.key, { kind: event.target.value as QuoteFieldKind })
                        }
                        className="mt-1 w-full rounded-md border home-border home-bg px-3 py-2"
                      >
                        {field.kind === 'interests' ? (
                          <option value="interests">{QUOTE_KIND_LABELS.interests}</option>
                        ) : (
                          QUOTE_ADMIN_KINDS.map((item) => (
                            <option key={item} value={item}>
                              {QUOTE_KIND_LABELS[item]}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                  </div>
                  {needsOptions ? (
                    <div className="mt-3 rounded-lg border home-border p-3">
                      <p className="text-sm font-medium text-gray-700">List values</p>
                      <div className="mt-2 space-y-2">
                        {options.map((option, optionIndex) => (
                          <div key={`${option.value}-${optionIndex}`} className="flex gap-2">
                            <input
                              value={option.label}
                              onChange={(event) => {
                                const next = options.map((item, i) =>
                                  i === optionIndex
                                    ? {
                                        label: event.target.value,
                                        value: item.value || slugValue(event.target.value),
                                      }
                                    : item
                                )
                                setOptions(field.key, next)
                              }}
                              className="w-full rounded-md border home-border home-bg px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              className="text-sm home-accent underline"
                              onClick={() =>
                                setOptions(
                                  field.key,
                                  options.filter((_, i) => i !== optionIndex)
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-sm font-semibold home-accent underline"
                        onClick={() =>
                          setOptions(field.key, [
                            ...options,
                            { value: `option-${options.length + 1}`, label: `Option ${options.length + 1}` },
                          ])
                        }
                      >
                        Add value
                      </button>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex min-h-9 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.visible}
                        onChange={(event) => patchField(field.key, { visible: event.target.checked })}
                      />
                      Show this question
                    </label>
                    <label className="inline-flex min-h-9 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.required}
                        onChange={(event) => patchField(field.key, { required: event.target.checked })}
                      />
                      Required
                    </label>
                    <label className="inline-flex min-h-9 items-center gap-2">
                      Show for
                      <select
                        value={row.when}
                        onChange={(event) => patchField(field.key, { when: event.target.value as QuoteWhen })}
                        className="rounded-md border home-border home-bg px-2 py-1"
                      >
                        <option value="all">All quotes</option>
                        <option value="balloons">Balloons only</option>
                        <option value="banners">Banners only</option>
                      </select>
                    </label>
                    {custom ? (
                      <button
                        type="button"
                        className="text-sm text-red-700 underline"
                        onClick={() => removeQuestion(field.key)}
                      >
                        Delete question
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="mt-4 text-sm font-semibold home-accent underline"
      >
        Add a question
      </button>

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

/**
 * Stable option value from a label.
 *
 * @param label - Display text
 */
function slugValue(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'option'
  )
}
