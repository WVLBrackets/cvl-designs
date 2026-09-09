import Image from 'next/image'
import Link from 'next/link'

interface StudioPublicHeaderProps {
  businessName: string
  logoSrc: string
}

/**
 * Compact public-studio bar: logo and company name only, so the hero sits high on a phone.
 */
export default function StudioPublicHeader({ businessName, logoSrc }: StudioPublicHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-3 h-11 flex items-center gap-2 min-w-0">
        <Link href="/studio" className="flex items-center gap-2 min-w-0">
          <span className="relative h-7 w-7 flex-shrink-0">
            <Image src={logoSrc} alt="" fill className="object-contain" sizes="28px" />
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{businessName}</span>
        </Link>
        <Link
          href="/home"
          className="ml-auto flex-shrink-0 text-xs text-blue-600 underline"
        >
          Stores
        </Link>
      </div>
    </header>
  )
}
