import { HOME_PRESENTATION_SEED } from './homePresentationSeed.js'
import { ABOUT_SEED, ABOUT_PRESENTATION_SEED } from './aboutSeed.js'

// Render immediately with the current public profile while the CMS revalidates.
export const HOME_FALLBACK_ROWS = [{
  id: 'bundled-public-home-fallback',
  kind: 'home',
  slug: 'inicio',
  status: 'published',
  data: {
    ...HOME_PRESENTATION_SEED,
    name: 'Albert Javier Sanfle Lopez',
    title: 'DevOps Engineer | AWS Certified',
    // Keep the profile image fully controlled by the CMS; no fixed URL fallback.
    photo: '',
  },
}]

// Render the profile immediately, then replace it with the latest published CMS record.
export const ABOUT_FALLBACK_ROWS = [{
  id:'bundled-public-about-fallback',
  kind:'about',
  slug:'sobre-mi',
  status:'published',
  data:{ ...ABOUT_PRESENTATION_SEED, ...ABOUT_SEED, photo:'' },
}]
