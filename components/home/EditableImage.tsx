'use client'

import { useRef } from 'react'
import Image from 'next/image'
import AdminLabel from '@/components/home/AdminLabel'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'

interface EditableImageProps {
  field: string
  src: string
  alt: string
  className?: string
  sizes: string
  objectFit?: 'cover' | 'contain'
  objectPosition?: string
  fill?: boolean
  priority?: boolean
  width?: number
  height?: number
  variant?: 'photo' | 'icon'
  label?: string
}

const ACTIVE =
  'outline outline-2 outline-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.85)]'

/**
 * Click-to-replace image in homepage admin. Visitors see a static next/image.
 */
export default function EditableImage({
  field,
  src,
  alt,
  className = '',
  sizes,
  objectFit = 'cover',
  objectPosition,
  fill = true,
  priority = false,
  width,
  height,
  variant = 'photo',
  label = 'Image',
}: EditableImageProps) {
  const admin = useHomeAdmin()
  const inputRef = useRef<HTMLInputElement>(null)
  const active = admin?.activeField === field
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover'
  const image = fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={`${fitClass} ${className}`}
      style={objectPosition ? { objectPosition } : undefined}
      sizes={sizes}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width || 80}
      height={height || 80}
      priority={priority}
      className={`h-auto w-full ${className}`}
      sizes={sizes}
      style={{ width: '100%', height: 'auto' }}
    />
  )

  if (!admin) return image

  return (
    <AdminLabel label={label} className={fill ? 'h-full w-full' : 'block w-full'}>
    <button
      type="button"
      className={`relative block w-full cursor-pointer rounded-sm ${fill ? 'h-full' : ''} ${active ? ACTIVE : 'hover:outline hover:outline-1 hover:outline-yellow-300'}`}
      onClick={() => {
        admin.setActiveField(field)
        inputRef.current?.click()
      }}
      aria-label="Replace image"
    >
      {image}
      {variant === 'photo' ? (
        <span className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-950">
          Change photo
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          await admin.uploadImage(field, file)
        }}
      />
    </button>
    </AdminLabel>
  )
}
