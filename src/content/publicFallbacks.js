import { HOME_PRESENTATION_SEED } from './homePresentationSeed.js'
import { ABOUT_SEED, ABOUT_PRESENTATION_SEED } from './aboutSeed.js'

// Last published original image is used only for the first paint; live CMS data wins on load.
const publishedPhotoFallback = 'https://albertsanflepage.s3.us-east-1.amazonaws.com/media/albertsanflefotopg.jpg'

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
    photo: publishedPhotoFallback,
  },
}]

// Render the profile immediately, then replace it with the latest published CMS record.
export const ABOUT_FALLBACK_ROWS = [{
  id:'bundled-public-about-fallback',
  kind:'about',
  slug:'sobre-mi',
  status:'published',
  data:{ ...ABOUT_PRESENTATION_SEED, ...ABOUT_SEED, photo:publishedPhotoFallback },
}]
