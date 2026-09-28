/**
 * Header and footer link slots shared by public chrome and admin editors.
 */

import type { HomeContent } from '@/lib/homeContent'
import { HOME_LABELS } from '@/lib/homeVocabulary'

export interface ChromeLinkSlot {
  label: string
  href: string
  labelField: keyof HomeContent
  hrefField: keyof HomeContent
  vocab: string
}

/**
 * Seven header navigation slots, including two unused extras.
 *
 * @param content - Homepage content
 */
export function headerNavSlots(content: HomeContent): ChromeLinkSlot[] {
  return [
    {
      label: content.navBalloons,
      href: content.navBalloonsHref,
      labelField: 'navBalloons',
      hrefField: 'navBalloonsHref',
      vocab: HOME_LABELS.navBalloons,
    },
    {
      label: content.navBanners,
      href: content.navBannersHref,
      labelField: 'navBanners',
      hrefField: 'navBannersHref',
      vocab: HOME_LABELS.navBanners,
    },
    {
      label: content.navTeamStores,
      href: content.navTeamStoresHref,
      labelField: 'navTeamStores',
      hrefField: 'navTeamStoresHref',
      vocab: HOME_LABELS.navTeamStores,
    },
    {
      label: content.navAbout,
      href: content.navAboutHref,
      labelField: 'navAbout',
      hrefField: 'navAboutHref',
      vocab: HOME_LABELS.navAbout,
    },
    {
      label: content.navContact,
      href: content.navContactHref,
      labelField: 'navContact',
      hrefField: 'navContactHref',
      vocab: HOME_LABELS.navContact,
    },
    {
      label: content.navSlot6,
      href: content.navSlot6Href,
      labelField: 'navSlot6',
      hrefField: 'navSlot6Href',
      vocab: HOME_LABELS.navSlot6,
    },
    {
      label: content.navSlot7,
      href: content.navSlot7Href,
      labelField: 'navSlot7',
      hrefField: 'navSlot7Href',
      vocab: HOME_LABELS.navSlot7,
    },
  ]
}

/**
 * Five footer navigation slots, including two unused extras.
 *
 * @param content - Homepage content
 */
export function footerNavSlots(content: HomeContent): ChromeLinkSlot[] {
  return [
    {
      label: content.footerHome,
      href: content.footerHomeHref,
      labelField: 'footerHome',
      hrefField: 'footerHomeHref',
      vocab: HOME_LABELS.footerHome,
    },
    {
      label: content.footerContact,
      href: content.footerContactHref,
      labelField: 'footerContact',
      hrefField: 'footerContactHref',
      vocab: HOME_LABELS.footerContact,
    },
    {
      label: content.footerTeamStores,
      href: content.footerTeamStoresHref,
      labelField: 'footerTeamStores',
      hrefField: 'footerTeamStoresHref',
      vocab: HOME_LABELS.footerTeamStores,
    },
    {
      label: content.footerSlot4,
      href: content.footerSlot4Href,
      labelField: 'footerSlot4',
      hrefField: 'footerSlot4Href',
      vocab: HOME_LABELS.footerSlot4,
    },
    {
      label: content.footerSlot5,
      href: content.footerSlot5Href,
      labelField: 'footerSlot5',
      hrefField: 'footerSlot5Href',
      vocab: HOME_LABELS.footerSlot5,
    },
  ]
}

export const ADMIN_NAV_HELP =
  'Admin only appears in the header when you are signed in. Visitors never see it. It always opens Admin home and cannot be renamed or moved.'
