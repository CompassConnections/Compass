export type CardSize = 'small' | 'medium' | 'large'

export type DisplayOptions = {
  showPhotos: boolean | null | undefined
  showAge: boolean | null | undefined
  showGender: boolean | null | undefined
  showLanguages: boolean | null | undefined
  cardSize: CardSize
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

export const initialDisplayOptions: DisplayOptions = {
  showPhotos: undefined,
  showAge: undefined,
  showGender: undefined,
  showLanguages: true,
  cardSize: 'medium',
  showHeadline: true,
  showKeywords: true,
  showCity: true,
  showOccupation: true,
  showSeeking: true,
  showInterests: true,
  showCauses: false,
  showDiet: true,
  showSmoking: true,
  showDrinks: true,
  showMBTI: true,
  showBio: true,
}
