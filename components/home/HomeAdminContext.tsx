'use client'

import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { HomeContent, HomeOffering, OfferingId } from '@/lib/homeContent'

interface HomeAdminContextValue {
  content: HomeContent
  setContent: Dispatch<SetStateAction<HomeContent>>
  activeField: string | null
  setActiveField: Dispatch<SetStateAction<string | null>>
  uploadImage: (field: string, file: File) => Promise<void>
}

const HomeAdminContext = createContext<HomeAdminContextValue | null>(null)

export function HomeAdminProvider({
  value,
  children,
}: {
  value: HomeAdminContextValue
  children: React.ReactNode
}) {
  return <HomeAdminContext.Provider value={value}>{children}</HomeAdminContext.Provider>
}

/**
 * Admin editing context. Null on the public homepage.
 */
export function useHomeAdmin(): HomeAdminContextValue | null {
  return useContext(HomeAdminContext)
}

/**
 * Patch a top-level homepage text field.
 *
 * @param setContent - Admin content setter
 * @param key - HomeContent text key
 * @param value - New string
 */
export function patchHomeField(
  setContent: Dispatch<SetStateAction<HomeContent>>,
  key: keyof HomeContent,
  value: HomeContent[keyof HomeContent]
) {
  setContent((prev) => ({ ...prev, [key]: value }))
}

/**
 * Patch one offering card.
 *
 * @param setContent - Admin content setter
 * @param id - Offering id
 * @param patch - Partial offering fields
 */
export function patchOffering(
  setContent: Dispatch<SetStateAction<HomeContent>>,
  id: OfferingId,
  patch: Partial<HomeOffering>
) {
  setContent((prev) => ({
    ...prev,
    offerings: prev.offerings.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }))
}
