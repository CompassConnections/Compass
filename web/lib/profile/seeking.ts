import {convertRelationshipType, RelationshipType} from "web/lib/util/convert-types";
import stringOrStringArrayToText from "web/lib/util/string-or-string-array-to-text";
import {Profile} from "common/profiles/profile";
import {INVERTED_ROMANTIC_CHOICES} from "web/components/filters/choices";

export function getSeekingGenderText(profile: Profile, t: any) {
  const relationshipTypes = profile.pref_relation_styles
  if (!relationshipTypes?.length) return ''
  let seekingGenderText = stringOrStringArrayToText({
    text: relationshipTypes?.map((rel) =>
      t(`profile.relationship.${rel}`, convertRelationshipType(rel as RelationshipType)).toLowerCase()
    ).sort(),
    preText: t('profile.seeking', 'Seeking'),
    asSentence: true,
    capitalizeFirstLetterOption: false,
    t: t,
  })
  if (relationshipTypes?.includes('relationship')) {
    const romanticStyles = profile.pref_romantic_styles
      ?.map((style) => t(`profile.romantic.${style}`, INVERTED_ROMANTIC_CHOICES[style]).toLowerCase())
      .filter(Boolean)
    if (romanticStyles && romanticStyles.length > 0) {
      seekingGenderText += ` (${romanticStyles.join(', ')})`
    }
  }
  return seekingGenderText
}