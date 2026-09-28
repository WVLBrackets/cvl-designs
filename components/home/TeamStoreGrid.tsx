import Image from 'next/image'
import Link from 'next/link'

export interface TeamStoreCard {
  slug: string
  displayName: string
  logoSrc: string
  primaryColor: string
  accentColor: string
}

interface TeamStoreGridProps {
  stores: TeamStoreCard[]
  errorMessage?: string
  title: string
  instruction: string
}

/**
 * Apparel store picker (2×2 logo tiles linking to `/?store=`).
 */
export default function TeamStoreGrid({
  stores,
  errorMessage,
  title,
  instruction,
}: TeamStoreGridProps) {
  const visible = stores.filter((store) => store.slug && store.slug.toLowerCase() !== 'all')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        {errorMessage ? (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4" role="alert">
            <p className="text-center font-semibold text-red-800">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <p className="mb-8 text-center text-gray-600">{instruction}</p>

        <div className="mx-auto grid max-w-lg grid-cols-2 gap-6">
          {visible.map((store) => (
            <Link
              key={store.slug}
              href={`/?store=${store.slug}`}
              className="group flex flex-col items-center"
            >
              <div
                className="flex aspect-square w-full items-center justify-center rounded-lg border-4 bg-white p-6 transition-all hover:scale-105 hover:shadow-xl"
                style={{ borderColor: store.accentColor }}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={store.logoSrc}
                    alt={`${store.displayName} Logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p
                className="mt-3 text-center text-lg font-semibold"
                style={{ color: store.primaryColor }}
              >
                {store.displayName}
              </p>
            </Link>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No stores available at this time.</p>
        ) : null}
      </div>
    </div>
  )
}
