'use client'

import { useState } from 'react'
import AdminEditorShell from '@/components/home/AdminEditorShell'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import StudioGalleryClient from '@/components/studio/StudioGalleryClient'
import StudioAdminClient from '@/components/studio/StudioAdminClient'
import type { HomeContent } from '@/lib/homeContent'
import type { GalleryCategory, GalleryItem, PublicGalleryItem } from '@/lib/types'

interface StudioSiteAdminClientProps {
  initialContent: HomeContent
  categories: GalleryCategory[]
  publicItems: PublicGalleryItem[]
  adminItems: GalleryItem[]
  initialCategory?: string
}

interface StudioAdminBodyProps {
  categories: GalleryCategory[]
  publicItems: PublicGalleryItem[]
  adminItems: GalleryItem[]
  initialCategory?: string
}

/**
 * Studio preview and gallery tools bound to live admin content.
 */
function StudioAdminBody({
  categories,
  publicItems,
  adminItems,
  initialCategory,
}: StudioAdminBodyProps) {
  const admin = useHomeAdmin()
  const [categoryList, setCategoryList] = useState(categories)
  if (!admin) return null
  return (
    <>
      <main id="main-content">
        <StudioGalleryClient
          content={admin.content}
          categories={categoryList}
          items={publicItems}
          initialCategory={initialCategory}
          onCategoriesChange={setCategoryList}
        />
      </main>
      <section className="border-t home-border home-bg px-4 py-10 sm:px-6">
        <StudioAdminClient categories={categoryList} items={adminItems} embedded />
      </section>
    </>
  )
}

/**
 * Studio admin: shared header/colors plus in-place studio copy and gallery photo tools.
 */
export default function StudioSiteAdminClient({
  initialContent,
  categories,
  publicItems,
  adminItems,
  initialCategory,
}: StudioSiteAdminClientProps) {
  return (
    <AdminEditorShell
      initialContent={initialContent}
      notice="Editing studio — gallery photos save on their own forms. Header, Footer and colors are on Home Admin."
      savedMessage="Saved. Visitors will see these changes on Home and Studio."
    >
      <StudioAdminBody
        categories={categories}
        publicItems={publicItems}
        adminItems={adminItems}
        initialCategory={initialCategory}
      />
    </AdminEditorShell>
  )
}
