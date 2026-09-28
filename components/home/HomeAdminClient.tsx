'use client'

import AboutBand from '@/components/home/AboutBand'
import AdminEditorShell from '@/components/home/AdminEditorShell'
import FinalCta from '@/components/home/FinalCta'
import HomeHero from '@/components/home/HomeHero'
import Offerings from '@/components/home/Offerings'
import PathsGrid from '@/components/home/PathsGrid'
import RecentWork from '@/components/home/RecentWork'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HomeContent } from '@/lib/homeContent'
import type { PublicGalleryItem } from '@/lib/types'

interface HomeAdminClientProps {
  initialContent: HomeContent
  galleryItems: PublicGalleryItem[]
}

/**
 * Homepage sections that follow the live admin content in context.
 */
function HomeAdminBody({ galleryItems }: { galleryItems: PublicGalleryItem[] }) {
  const admin = useHomeAdmin()
  if (!admin) return null
  const { content } = admin
  return (
    <main>
          <HomeHero content={content} galleryItems={galleryItems} />
      <PathsGrid content={content} />
      <Offerings content={content} />
      <RecentWork items={galleryItems} content={content} />
      <AboutBand content={content} />
      <FinalCta content={content} />
    </main>
  )
}

/**
 * In-place homepage editor. Header and colors save with the rest of Home_Content.
 */
export default function HomeAdminClient({ initialContent, galleryItems }: HomeAdminClientProps) {
  return (
    <AdminEditorShell
      initialContent={initialContent}
      siteChrome
      notice="Editing homepage — click any text or photo. Header, Footer and colors also apply to Studio."
      savedMessage="Saved. Visitors will see these changes on Home and Studio."
    >
      <HomeAdminBody galleryItems={galleryItems} />
    </AdminEditorShell>
  )
}
