import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getEnvBadge } from '@/lib/config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVL Designs',
  description: 'Custom Apparel & Clothing',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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

