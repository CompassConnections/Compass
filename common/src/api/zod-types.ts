import { z } from 'zod'
import { type JSONContent } from '@tiptap/core'
import { arrify } from 'common/util/array'

/* GET request array can be like ?a=1 or ?a=1&a=2  */
export const arraybeSchema = z
  .array(z.string())
  .or(z.string())
  .transform(arrify)

// @ts-ignore
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
            })
          )
        )
        .optional(),
      text: z.string().optional(),
    })
  )
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

export const baseLoversSchema = z.object({
  // Required fields
  age: z.number().min(18).max(100),
  gender: genderType,
  pref_gender: genderTypes,
  pref_age_min: z.number().min(18).max(999),
  pref_age_max: z.number().min(18).max(1000),
  pref_relation_styles: z.array(
    z.union([
      z.literal('mono'),
      z.literal('poly'),
      z.literal('open'),
      z.literal('other'),
    ])
  ),
  wants_kids_strength: z.number(),
  looking_for_matches: z.boolean(),
  photo_urls: z.array(z.string()),
  visibility: z.union([z.literal('public'), z.literal('member')]),

  bio: contentSchema.optional().nullable(),

  geodb_city_id: z.string().optional(),
  city: z.string(),
  region_code: z.string().optional(),
  country: z.string().optional(),
  city_latitude: z.number().optional(),
  city_longitude: z.number().optional(),

  pinned_url: z.string(),
  referred_by_username: z.string().optional(),
})

const optionalLoversSchema = z.object({
  political_beliefs: z.array(z.string()).optional(),
  religious_belief_strength: z.number().optional(),
  religious_beliefs: z.string().optional(),
  ethnicity: z.array(z.string()).optional(),
  born_in_location: z.string().optional(),
  height_in_inches: z.number().optional(),
  has_pets: z.boolean().optional(),
  education_level: z.string().optional(),
  last_online_time: z.string().optional(),
  is_smoker: z.boolean().optional(),
  drinks_per_month: z.number().min(0).optional(),
  is_vegetarian_or_vegan: z.boolean().optional(),
  has_kids: z.number().min(0).optional(),
  university: z.string().optional(),
  occupation_title: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  comments_enabled: z.boolean().optional(),
  website: z.string().optional(),
  bio: contentSchema.optional().nullable(),
  twitter: z.string().optional(),
  avatar_url: z.string().optional(),
})

export const combinedLoveUsersSchema =
  baseLoversSchema.merge(optionalLoversSchema)
