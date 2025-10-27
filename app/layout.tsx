import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVL Designs',
  description: 'Custom Apparel & Clothing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if we're in a non-production environment
  const isProduction = process.env.VERCEL_ENV === 'production'
  const envName = process.env.VERCEL_ENV || 'development'
  
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Staging/Preview Banner - Only shows in non-production */}
        {!isProduction && (
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm flex items-center gap-2 border-2 border-red-800 rotate-12">
              <span className="text-xl">⚠️</span>
              <span>{envName.toUpperCase()}</span>
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  )
}

