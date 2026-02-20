// Conversion factors
const INCHES_TO_CM = 2.54
const MILES_TO_KM = 1.60934

export type MeasurementSystem = 'metric' | 'imperial'

/**
 * Format height in inches according to the specified measurement system
 */
export function formatHeight(heightInInches: number, measurementSystem: MeasurementSystem): string {
  if (measurementSystem === 'metric') {
    // Convert to centimeters
    const cm = Math.round(heightInInches * INCHES_TO_CM)
    return `${cm} cm`
  } else {
    // Show in feet and inches
    const feet = Math.floor(heightInInches / 12)
    const inches = Math.round(heightInInches % 12)
    return `${feet}' ${inches}"`
  }
}

/**
 * Format distance in miles according to the specified measurement system
 */
export function formatDistance(
  distanceInMiles: number,
  measurementSystem: MeasurementSystem,
): string {
  if (measurementSystem === 'metric') {
    // Convert to kilometers
    const km = Math.round(distanceInMiles * MILES_TO_KM)
    return `${km} km`
  } else {
    // Show in miles
    return `${distanceInMiles} miles`
  }
}

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * INCHES_TO_CM
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm / INCHES_TO_CM
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km / MILES_TO_KM
}
