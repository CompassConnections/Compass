import {RELATIONSHIP_CHOICES} from 'common/choices'
import {Profile} from 'common/profiles/profile'
import {capitalize, sortBy} from 'lodash'
import {convertRelationshipType, RelationshipType} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function getSeekingConnectionText(profile: Profile, t: any, _short?: boolean) {
  const relationshipTypes = profile.pref_relation_styles
  const seekingGenderText = stringOrStringArrayToText({
    text: relationshipTypes?.length
      ? // Same order as RELATIONSHIP_CHOICES, not alphabetical, so it reads the same in every language.
        sortBy(relationshipTypes, (rel) =>
          Object.values(RELATIONSHIP_CHOICES).indexOf(rel as any),
        ).map((rel) =>
          t(
            `profile.relationship.${rel}`,
            convertRelationshipType(rel as RelationshipType),
          ).toLowerCase(),
        )
      : [t('profile.connection.default', 'connection')],
    // preText: !short ? t('profile.seeking', 'Seeking') : undefined,
    asSentence: true,
    capitalizeFirstLetterOption: false,
    t: t,
  })
  // if (relationshipTypes?.includes('relationship')) {
  //   const romanticStyles = profile.pref_romantic_styles
  //     ?.map((style) =>
  //       t(`profile.romantic.${style}`, INVERTED_ROMANTIC_CHOICES[style]).toLowerCase(),
  //     )
  //     .filter(Boolean)
  //   if (romanticStyles && romanticStyles.length > 0) {
  //     seekingGenderText += ` (${romanticStyles.join(', ')})`
  //   }
  // }
  return capitalize(seekingGenderText ?? undefined)
}
