import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import {filterDefined} from 'common/util/array'
import {removeNullOrUndefinedProps} from 'common/util/object'
import DropdownMenu, {DropdownButton, DropdownItem} from 'web/components/comments/dropdown-menu'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

export type CompatibilitySort =
  | 'your_important'
  | 'their_important'
  | 'disagree'
  | 'your_unanswered'
  | 'random'
  | 'community_importance'
  | 'most_answered'
  | 'newest'

export function CompatibilitySortWidget(props: {
  sort: CompatibilitySort
  setSort: (sort: CompatibilitySort) => void
  user: User
  profile?: Profile | undefined
  className?: string
  ignore?: CompatibilitySort[] | undefined
}) {
  const {sort, setSort, user, profile, className} = props
  const ignore = props.ignore ?? []

  const currentUser = useUser()
  const t = useT()
  const isCheckingOtherProfile = currentUser && profile && profile.user_id !== currentUser.id

  const sortToDisplay = removeNullOrUndefinedProps({
    your_important: t('answers.sort.important_to_you', 'Important to you'),
    their_important: isCheckingOtherProfile
      ? t('answers.sort.important_to_them', 'Important to {name}', {
          name: user.name,
        })
      : undefined,
    disagree: isCheckingOtherProfile ? t('answers.sort.incompatible', 'Incompatible') : undefined,
    your_unanswered: isCheckingOtherProfile
      ? t('answers.sort.unanswered_by_you', 'Unanswered by you')
      : undefined,
    random: t('compatibility.sort.random', 'Random'),
    community_importance: t('compatibility.sort.importance', 'Important to the community'),
    most_answered: t('compatibility.sort.most_answered', 'Most answered'),
    newest: t('compatibility.sort.newest', 'Newest'),
  }) as Record<CompatibilitySort, string>

  return (
    <DropdownMenu
      className={className}
      items={
        filterDefined(
          Object.entries(sortToDisplay).map(([key, value]) => {
            if (ignore.includes(key as CompatibilitySort)) return
            return {
              name: value as string,
              onClick: () => {
                setSort(key as CompatibilitySort)
              },
            }
          }),
        ) as DropdownItem[]
      }
      closeOnClick
      buttonClass={''}
      buttonContent={(open: boolean) => (
        <DropdownButton content={sortToDisplay[sort]} open={open} />
      )}
      menuItemsClass={'bg-canvas-0'}
      menuWidth="w-56"
    />
  )
}

export function compareBySort(a: any, b: any, sort: CompatibilitySort) {
  // if (a.id < 10) console.log({a, b, sort})
  if (sort === 'random') {
    return Math.random() - 0.5
  } else if (sort === 'community_importance') {
    const rateA = a?.community_importance_percent ?? 0
    const rateB = b?.community_importance_percent ?? 0
    return rateB - rateA
  } else if (sort === 'most_answered') {
    return (b?.answer_count ?? 0) - (a?.answer_count ?? 0)
  } else if (sort === 'newest') {
    return (
      (b?.created_time ? new Date(b?.created_time).getTime() : 0) -
      (a?.created_time ? new Date(a?.created_time).getTime() : 0)
    )
  }
  const aImportance = (a?.answer ?? a)?.importance ?? -1
  const bImportance = (b?.answer ?? b)?.importance ?? -1
  return bImportance - aImportance
}

export function isMatchingSearch(question: any, searchTerm: string) {
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()

    const questionMatches = question.question?.toLowerCase().includes(searchLower)
    if (questionMatches) return true

    const a = question.answer
    if (a) {
      const explanationMatches = a?.explanation?.toLowerCase().includes(searchLower)
      const answerText =
        a.multiple_choice != null && question.multiple_choice_options
          ? Object.entries(question.multiple_choice_options as Record<string, number>).find(
              ([, val]) => val === a.multiple_choice,
            )?.[0]
          : null
      const answerMatches = answerText?.toLowerCase().includes(searchLower)
      const acceptableAnswersText = a.pref_choices
        ?.map(
          (choice: any) =>
            Object.entries(question.multiple_choice_options as Record<string, number>).find(
              ([, val]) => val === choice,
            )?.[0],
        )
        .filter(Boolean) as string[] | undefined
      const acceptableMatches = acceptableAnswersText?.some((text) =>
        text.toLowerCase().includes(searchLower),
      )
      if (explanationMatches || answerMatches || acceptableMatches) return true
    }
    return false
  }
  return true
}
