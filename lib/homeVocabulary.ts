/**
 * Shared names for homepage admin hover labels and empty placeholders.
 */

export const HOME_LABELS = {
  headerIcon: 'Header icon',
  headerTitle: 'Header title',
  navBalloons: 'Nav — Balloons',
  navBanners: 'Nav — Banners',
  navTeamStores: 'Nav — Team Stores',
  navAbout: 'Nav — About',
  navContact: 'Nav — Contact',
  navSlot6: 'Nav — extra 1',
  navSlot7: 'Nav — extra 2',
  eyebrow: 'Eyebrow',
  headline: 'Headline',
  subhead: 'Subhead',
  heroButton1: 'Button 1',
  heroButton2: 'Button 2',
  heroButton3: 'Button 3',
  destination: 'Destination',
  heroImage: 'Hero image',
  pathsHeading: 'Paths heading',
  pathTitle: 'Path title',
  pathBody: 'Path body',
  pathCta: 'Path link',
  offeringsHeading: 'Offerings heading',
  offeringIcon: 'Offering icon',
  offeringTitle: 'Offering title',
  offeringBody: 'Offering body',
  offeringCta: 'Offering link',
  recentHeading: 'Selected work heading',
  recentCta: 'Selected work link',
  recentEmpty: 'Selected work empty message',
  aboutHeading: 'About heading',
  aboutLead: 'About intro',
  aboutText: 'About text',
  aboutKicker: 'About eyebrow',
  aboutSignoff: 'About sign-off',
  aboutImage: 'About photo',
  finalHeading: 'Final heading',
  finalBody: 'Final subhead',
  finalPrimary: 'Final primary button',
  finalSecondary: 'Final secondary button',
  footerHome: 'Footer — Home',
  footerContact: 'Footer — Contact',
  footerTeamStores: 'Footer — Team Stores',
  footerSlot4: 'Footer — extra 1',
  footerSlot5: 'Footer — extra 2',
  footerText: 'Footer text',
  studioTitle: 'Studio headline',
  studioTagline: 'Studio subhead',
  studioKicker: 'Studio eyebrow',
  studioAllLabel: 'All filter',
  studioQuoteCta: 'Studio quote button',
  studioEmpty: 'Studio empty message',
} as const

/**
 * Admin placeholder shown when a named field has no copy.
 *
 * @param label - Vocabulary name, e.g. Eyebrow
 */
export function emptyPlaceholder(label: string): string {
  return `${label} Empty`
}
