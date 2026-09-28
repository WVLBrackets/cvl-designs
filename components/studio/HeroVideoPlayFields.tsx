'use client'

import type { HeroVideoPlay } from '@/lib/galleryMedia'

interface HeroVideoPlayFieldsProps {
  value: HeroVideoPlay
  /** Uncontrolled form field name when `onChange` is omitted. */
  name?: string
  onChange?: (value: HeroVideoPlay) => void
}

/**
 * Hero Delay vs Play in Full. Only shown for videos.
 */
export default function HeroVideoPlayFields({
  value,
  name = 'heroVideoPlay',
  onChange,
}: HeroVideoPlayFieldsProps) {
  /**
   * @param next - Selected playback mode
   */
  function choose(next: HeroVideoPlay) {
    onChange?.(next)
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-medium text-gray-700">Hero video</legend>
      <div className="mt-1 flex flex-col gap-1">
        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
          <input
            type="radio"
            name={name}
            value="delay"
            checked={value === 'delay'}
            onChange={() => choose('delay')}
            className="rounded-full"
          />
          Hero Delay
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
          <input
            type="radio"
            name={name}
            value="full"
            checked={value === 'full'}
            onChange={() => choose('full')}
            className="rounded-full"
          />
          Play in Full
        </label>
      </div>
    </fieldset>
  )
}
