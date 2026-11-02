import {DealbreakerKey, FactorKey} from 'common/profiles/compatibility-factors'
import {useT} from 'web/lib/locale'

/**
 * Member-facing names for the factors and dealbreakers of `common/profiles/compatibility-factors`,
 * shared by the rail block, the breakdown modal and the explainer page's copy.
 */
export const useCompatibilityFactorLabels = () => {
  const t = useT()
  const factor: Record<FactorKey, string> = {
    prompts: t('compatibility.factor.prompts', 'Prompt answers'),
    age: t('compatibility.factor.age', 'Age range'),
    wants_kids: t('compatibility.factor.wants_kids', 'Wanting children'),
    distance: t('compatibility.factor.distance', 'Distance'),
    availability: t('compatibility.factor.availability', 'Relationship status'),
    religion: t('compatibility.factor.religion', 'Religion'),
    politics: t('compatibility.factor.politics', 'Politics'),
    monogamy: t('compatibility.factor.monogamy', 'Relationship style'),
    cannabis: t('compatibility.factor.cannabis', 'Cannabis'),
    psychedelics: t('compatibility.factor.psychedelics', 'Psychedelics'),
    big5: t('compatibility.factor.big5', 'Big Five personality'),
    shared_options: t('compatibility.factor.shared_options', 'Shared interests, causes and work'),
    smoking: t('compatibility.factor.smoking', 'Smoking'),
    drinking: t('compatibility.factor.drinking', 'Drinking'),
    diet: t('compatibility.factor.diet', 'Diet'),
    exercise: t('compatibility.factor.exercise', 'Exercise'),
    education: t('compatibility.factor.education', 'Education'),
    languages: t('compatibility.factor.languages', 'Shared language'),
  }
  const dealbreaker: Record<DealbreakerKey, string> = {
    gender: t('compatibility.dealbreaker.gender', "You are not each other's preferred gender"),
    connection_type: t(
      'compatibility.dealbreaker.connection_type',
      'You are looking for different kinds of connection',
    ),
    monogamy: t(
      'compatibility.dealbreaker.monogamy',
      'One of you is monogamous and the other is not',
    ),
    wants_kids: t(
      'compatibility.dealbreaker.wants_kids',
      'You gave opposite answers about wanting children',
    ),
  }
  return {factor, dealbreaker}
}
