export type Gender =
  | 'male'
  | 'female'
  | 'non-binary'
  | 'trans-male'
  | 'trans-female'

export function convertGender(gender: Gender) {
  if (gender == 'male') {
    return 'man'
  }
  if (gender == 'female') {
    return 'woman'
  }
  if (gender == 'trans-female') {
    return 'trans woman'
  }
  if (gender == 'trans-male') {
    return 'trans man'
  }
  return gender
}

export function convertGenderPlural(gender: Gender) {
  if (gender == 'male') {
    return 'men'
  }
  if (gender == 'female') {
    return 'women'
  }
  if (gender == 'trans-female') {
    return 'trans women'
  }
  if (gender == 'trans-male') {
    return 'trans men'
  }
  return gender
}

// TODO: support more gender expressions and politically inclusive copy
