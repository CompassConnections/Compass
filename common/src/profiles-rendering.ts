export type CardSize = 'small' | 'medium' | 'large'

export type DisplayOptions = {
  showPhotos: boolean | null | undefined
  showAge: boolean | null | undefined
  cardSize: CardSize
}

export const initialDisplayOptions: DisplayOptions = {
  showPhotos: undefined,
  showAge: undefined,
  cardSize: 'medium',
}
