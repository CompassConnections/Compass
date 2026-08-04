export type CardSize = 'small' | 'medium' | 'large'

/**
 * `masonry` lets each card be only as tall as its content, so a sparse profile stays short.
 * `uniform` gives every card the same tile size, which reads as a tidier grid at the cost of
 * empty space under the shorter cards.
 */
export type GridLayout = 'masonry' | 'uniform'

export type DisplayOptions = {
  showPhotos: boolean | null | undefined
  showAge: boolean | null | undefined
  showGender: boolean | null | undefined
  showLanguages: boolean | null | undefined
  cardSize: CardSize
  gridLayout: GridLayout
  showHeadline: boolean | null | undefined
  showKeywords: boolean | null | undefined
  showCity: boolean | null | undefined
  showOccupation: boolean | null | undefined
  showSeeking: boolean | null | undefined
  showInterests: boolean | null | undefined
  showCauses: boolean | null | undefined
  showDiet: boolean | null | undefined
  showSmoking: boolean | null | undefined
  showDrinks: boolean | null | undefined
  showMBTI: boolean | null | undefined
  showBio: boolean | null | undefined
}

/**
 * What a profile card shows out of the box: city, age, headline, keywords, bio and the photo.
 * Gender stays a toggle people can switch on, it's just off by default. The rest live on the
 * profile page — their card renders are commented out in `web/components/profile-grid.tsx`, so
 * those flags are inert until they're restored.
 */
export const initialDisplayOptions: DisplayOptions = {
  showPhotos: true,
  showAge: true,
  showCity: true,
  showHeadline: true,
  showKeywords: true,
  showBio: true,
  cardSize: 'medium',
  gridLayout: 'masonry',
  showGender: false,
  showLanguages: false,
  showOccupation: false,
  showSeeking: false,
  showInterests: false,
  showCauses: false,
  showDiet: false,
  showSmoking: false,
  showDrinks: false,
  showMBTI: false,
}
