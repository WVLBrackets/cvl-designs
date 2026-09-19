import Image from 'next/image'
import Link from 'next/link'

interface StudioPublicHeaderProps {
  businessName: string
  logoSrc: string
  secondaryHref?: string
  secondaryLabel?: string
}

/**
 * Compact public-studio bar: logo, company name, and a secondary nav link.
 */
export default function StudioPublicHeader({
  businessName,
  logoSrc,
  secondaryHref = '/home',
  secondaryLabel = 'Stores',
}: StudioPublicHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-3 min-h-11 py-1.5 flex items-center gap-2 min-w-0">
        <Link href="/studio" className="flex items-center gap-2 min-w-0">
          <span className="relative h-7 w-7 flex-shrink-0">
            <Image src={logoSrc} alt="" fill className="object-contain" sizes="28px" />
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{businessName}</span>
        </Link>
        <Link
          href={secondaryHref}
          className="ml-auto text-xs text-blue-600 underline whitespace-nowrap flex-shrink-0"
        >
          {secondaryLabel}
        </Link>
      </div>
    </header>
  )
}
