import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getEnvBadge } from '@/lib/config'
import { fetchConfiguration } from '@/lib/googleSheets'
import { mergeHomeContent } from '@/lib/homeContent'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const FALLBACK_TAB_ICON = '/images/home/1790521458016-CVL-Rainbow-Only.png'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

/**
 * Site metadata, including the tab icon from Header icon 1.
 */
export async function generateMetadata(): Promise<Metadata> {
  let icon = FALLBACK_TAB_ICON
  try {
    const content = mergeHomeContent(await fetchConfiguration())
    if (content.headerLogoSrc) icon = content.headerLogoSrc
  } catch (error) {
    console.error('[layout] Could not load header icon for tab:', error)
  }
  return {
    title: 'CVL Designs',
    description: 'Handmade balloons, banners, and custom team apparel by CVL Designs.',
    icons: {
      icon: [{ url: icon }],
      apple: [{ url: icon }],
      shortcut: icon,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const envBadge = getEnvBadge()

  return (
    <html lang="en">
      <body className={`${inter.className} w-full max-w-full overflow-x-clip`}>
        {/* Staging/Preview/Local badge. No rotate: iOS treats transformed corners as extra
            page width and forces pinch-to-fit. Production has no badge. */}
        {envBadge && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
            <div
              className={`absolute top-2 right-2 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow ${
                envBadge.backgroundClass === 'bg-orange-600' ? 'bg-orange-600' : 'bg-red-600'
              }`}
            >
              {envBadge.label}
            </div>
          </div>
        )}
        <div className="w-full max-w-full overflow-x-clip">
          {children}
        </div>
      </body>
    </html>
  )
}
