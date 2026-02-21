import {type JSONContent} from '@tiptap/core'
import {arrify} from 'common/util/array'
import {z} from 'zod'

/* GET request array can be like ?a=1 or ?a=1&a=2  */
export const arraybeSchema = z.array(z.string()).or(z.string()).transform(arrify)

export const contentSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z.intersection(
    z.record(z.any()),
    z.object({
      type: z.string().optional(),
      attrs: z.record(z.any()).optional(),
      content: z.array(contentSchema).optional(),
      marks: z
        .array(
          z.intersection(
            z.record(z.any()),
            z.object({
              type: z.string(),
              attrs: z.record(z.any()).optional(),
            }),
          ),
        )
        .optional(),
      text: z.string().optional(),
    }),
  ),
)

const genderType = z.string()
// z.union([
//   z.literal('male'),
//   z.literal('female'),
//   z.literal('trans-female'),
//   z.literal('trans-male'),
//   z.literal('non-binary'),
// ])
const genderTypes = z.array(genderType)

export const zBoolean = z
  .union([z.boolean(), z.string()])
  .transform((val) => val === true || val === 'true')

export const baseProfilesSchema = z.object({
  age: z.number().min(18).max(100).optional().nullable(),
  bio: contentSchema.optional().nullable(),
  bio_length: z.number().optional().nullable(),
  city: z.string(),
  city_latitude: z.number().optional().nullable(),
  city_longitude: z.number().optional().nullable(),
  country: z.string().optional().nullable(),
  gender: genderType,
  geodb_city_id: z.string().optional().nullable(),
  languages: z.array(z.string()).optional().nullable(),
  looking_for_matches: zBoolean,
  photo_urls: z.array(z.string()).nullable(),
  pinned_url: z.string(),
  pref_age_max: z.number().min(18).max(100).optional().nullable(),
  pref_age_min: z.number().min(18).max(100).optional().nullable(),
  pref_gender: genderTypes.nullable(),
  pref_relation_styles: z.array(z.string()).nullable(),
  referred_by_username: z.string().optional().nullable(),
  region_code: z.string().optional().nullable(),
  visibility: z.union([z.literal('public'), z.literal('member')]),
  wants_kids_strength: z.number().nullable(),
})

const optionalProfilesSchema = z.object({
  avatar_url: z.string().optional().nullable(),
  bio: contentSchema.optional().nullable(),
  big5_openness: z.number().min(0).max(100).optional().nullable(),
  big5_conscientiousness: z.number().min(0).max(100).optional().nullable(),
  big5_extraversion: z.number().min(0).max(100).optional().nullable(),
  big5_agreeableness: z.number().min(0).max(100).optional().nullable(),
  big5_neuroticism: z.number().min(0).max(100).optional().nullable(),
  born_in_location: z.string().optional().nullable(),
  causes: z.array(z.string()).optional().nullable(),
  comments_enabled: zBoolean.optional(),
  company: z.string().optional().nullable(),
  diet: z.array(z.string()).optional().nullable(),
  disabled: zBoolean.optional(),
  drinks_max: z.number().min(0).optional().nullable(),
  drinks_min: z.number().min(0).optional().nullable(),
  drinks_per_month: z.number().min(0).optional().nullable(),
  education_level: z.string().optional().nullable(),
  ethnicity: z.array(z.string()).optional().nullable(),
  has_kids: z.number().min(0).optional().nullable(),
  has_pets: zBoolean.optional().nullable(),
  height_in_inches: z.number().optional().nullable(),
  image_descriptions: z.any().optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  is_smoker: zBoolean.optional().nullable(),
  mbti: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  occupation_title: z.string().optional().nullable(),
  political_beliefs: z.array(z.string()).optional().nullable(),
  political_details: z.string().optional().nullable(),
  pref_romantic_styles: z.array(z.string()).nullable(),
  raised_in_city: z.string().optional().nullable(),
  raised_in_country: z.string().optional().nullable(),
  raised_in_geodb_city_id: z.string().optional().nullable(),
  raised_in_lat: z.number().optional().nullable(),
  raised_in_lon: z.number().optional().nullable(),
  raised_in_radius: z.number().optional().nullable(),
  raised_in_region_code: z.string().optional().nullable(),
  relationship_status: z.array(z.string()).optional().nullable(),
  religion: z.array(z.string()).optional().nullable(),
  religious_belief_strength: z.number().optional().nullable(),
  religious_beliefs: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  work: z.array(z.string()).optional().nullable(),
})

export const combinedProfileSchema = baseProfilesSchema.merge(optionalProfilesSchema)
