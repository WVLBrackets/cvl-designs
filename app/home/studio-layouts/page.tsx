/**
 * Side-by-side layout options for the Balloons and Banners home-page entry.
 * Temporary comparison page — not linked from the live home page.
 */

import Image from 'next/image'
import Link from 'next/link'
import {
  StudioFeaturedTile,
  StudioHeaderLink,
  StudioHeroBand,
  StudioLeadBanner,
} from '@/components/studio/StudioPlacements'
import {
  DEFAULT_STUDIO_IMAGE_SRC,
  DEFAULT_STUDIO_TAGLINE,
  DEFAULT_STUDIO_TITLE,
  STUDIO_ROUTE,
} from '@/lib/studio'

export const metadata = {
  title: 'Studio layout options | CVL Designs',
}

const MOCK_STORES = [
  { name: 'Phenoms', logo: '/images/brand/Phenoms.jpg', accent: '#1e3a8a', color: '#1d4ed8' },
  { name: 'Hooks', logo: '/images/brand/Hooks.jpg', accent: '#b45309', color: '#c2410c' },
  { name: 'PBF', logo: '/images/brand/PBF.jpg', accent: '#0f766e', color: '#0f766e' },
  { name: 'Blueprint', logo: '/images/brand/Blueprint.jpg', accent: '#334155', color: '#1e293b' },
]

const STUDIO = {
  href: STUDIO_ROUTE,
  title: DEFAULT_STUDIO_TITLE,
  tagline: DEFAULT_STUDIO_TAGLINE,
  imageSrc: DEFAULT_STUDIO_IMAGE_SRC,
  fallbackImageSrc: DEFAULT_STUDIO_IMAGE_SRC,
}

const HEADER_LOGO = '/images/brand/VL Design Logo - Padded.png'

/**
 * Placeholder team-store grid so layout options can be judged against real store tiles.
 */
function MockStoreGrid() {
  return (
    <>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Select Your Team Store</h2>
      </div>
      <p className="text-gray-600 mb-8 text-center">
        Choose your team to view custom apparel and place orders
      </p>
      <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
        {MOCK_STORES.map((store) => (
          <div key={store.name} className="flex flex-col items-center">
            <div
              className="w-full aspect-square rounded-lg border-4 bg-white flex items-center justify-center p-6"
              style={{ borderColor: store.accent }}
            >
              <div className="relative w-full h-full">
                <Image src={store.logo} alt={store.name} fill className="object-contain" />
              </div>
            </div>
            <p className="mt-3 text-center font-semibold text-lg" style={{ color: store.color }}>
              {store.name}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * Shared site header used by each layout frame.
 */
function PreviewHeader({ studioInHeader = false }: { studioInHeader?: boolean }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 w-16 h-16">
              <Image src={HEADER_LOGO} alt="CVL Designs Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CVL Designs</h1>
              <p className="text-gray-600 text-sm sm:text-base">Custom Apparel &amp; Event Decor</p>
            </div>
          </div>
          {studioInHeader ? <StudioHeaderLink {...STUDIO} /> : null}
        </div>
      </div>
    </header>
  )
}

export default function StudioLayoutOptionsPage() {
  return (
    <main className="min-h-screen bg-slate-200 py-10">
      <div className="max-w-3xl mx-auto px-4 mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Layout comparison</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Balloons and Banners on Home</h1>
        <p className="text-gray-600 mt-3">
          Four placements with placeholder team stores. Pick the one that should ship on{' '}
          <Link href="/home" className="underline text-blue-700">
            /home
          </Link>
          .
        </p>
      </div>

      <div className="space-y-16 max-w-5xl mx-auto px-4 pb-20">
        {/* Option A */}
        <section id="option-a" className="space-y-3">
          <div className="bg-slate-800 text-white rounded-lg px-4 py-3">
            <h2 className="text-lg font-bold">Option A — Lead banner in the card</h2>
            <p className="text-sm text-slate-200">
              Studio is the first thing in the white card. Team stores stay underneath as a second choice.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl shadow-xl border border-slate-300 bg-gradient-to-b from-gray-50 to-gray-100">
            <PreviewHeader />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
              <div className="bg-white rounded-lg shadow-lg p-8 space-y-10">
                <StudioLeadBanner {...STUDIO} />
                <div className="border-t border-gray-200 pt-8">
                  <MockStoreGrid />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option B */}
        <section id="option-b" className="space-y-3">
          <div className="bg-slate-800 text-white rounded-lg px-4 py-3">
            <h2 className="text-lg font-bold">Option B — Featured tile above the stores</h2>
            <p className="text-sm text-slate-200">
              Same square-tile language as the teams, but larger and first. Quiet secondary heading for apparel.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl shadow-xl border border-slate-300 bg-gradient-to-b from-gray-50 to-gray-100">
            <PreviewHeader />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <StudioFeaturedTile {...STUDIO} />
                <div className="border-t border-gray-200 mt-10 pt-8">
                  <MockStoreGrid />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option C */}
        <section id="option-c" className="space-y-3">
          <div className="bg-slate-800 text-white rounded-lg px-4 py-3">
            <h2 className="text-lg font-bold">Option C — Header chip in the lead banner</h2>
            <p className="text-sm text-slate-200">
              Studio lives in the site header next to the CVL mark. The card stays a team-store picker.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl shadow-xl border border-slate-300 bg-gradient-to-b from-gray-50 to-gray-100">
            <PreviewHeader studioInHeader />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <MockStoreGrid />
              </div>
            </div>
          </div>
        </section>

        {/* Option D */}
        <section id="option-d" className="space-y-3">
          <div className="bg-slate-800 text-white rounded-lg px-4 py-3">
            <h2 className="text-lg font-bold">Option D — Full-width hero band</h2>
            <p className="text-sm text-slate-200">
              Studio is the page lead, between the header and the team card. Strongest “this is a different experience.”
            </p>
          </div>
          <div className="overflow-hidden rounded-xl shadow-xl border border-slate-300 bg-gradient-to-b from-gray-50 to-gray-100">
            <PreviewHeader />
            <StudioHeroBand {...STUDIO} />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <MockStoreGrid />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
