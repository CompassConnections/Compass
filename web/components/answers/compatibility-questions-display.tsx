import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline'
import {UserIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {QuestionWithStats} from 'common/api/types'
import {debug} from 'common/logger'
import {
  getAnswerCompatibility,
  getScoredAnswerCompatibility,
} from 'common/profiles/compatibility-score'
import {Profile} from 'common/profiles/profile'
import {Row as rowFor} from 'common/supabase/utils'
import {User} from 'common/user'
import {shortenNumber} from 'common/util/format'
import {keyBy, partition, sortBy} from 'lodash'
import {PinIcon} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import toast from 'react-hot-toast'
import {AddCompatibilityQuestionButton} from 'web/components/answers/add-compatibility-question-button'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {
  compareBySort,
  CompatibilitySort,
  CompatibilitySortWidget,
  isMatchingSearch,
} from 'web/components/compatibility/sort-widget'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {CompatibleBadge} from 'web/components/widgets/compatible-badge'
import {Input} from 'web/components/widgets/input'
import {Linkify} from 'web/components/widgets/linkify'
import {Pagination} from 'web/components/widgets/pagination'
import {Tooltip} from 'web/components/widgets/tooltip'
import {shortenName} from 'web/components/widgets/user-link'
import {useIsLooking} from 'web/hooks/use-is-looking'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {usePinnedQuestionIds} from 'web/hooks/use-pinned-question-ids'
import {useProfile} from 'web/hooks/use-profile'
import {useCompatibleProfiles} from 'web/hooks/use-profiles'
import {
  useCompatibilityQuestionsWithAnswerCount,
  useUserCompatibilityAnswers,
} from 'web/hooks/use-questions'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {db} from 'web/lib/supabase/db'

import {Subtitle} from '../widgets/profile-subtitle'
import {
  AnswerCompatibilityQuestionButton,
  AnswerSkippedCompatibilityQuestionsButton,
  CompatibilityPageButton,
} from './answer-compatibility-question-button'
import {
  AnswerCompatibilityQuestionContent,
  CompatibilityAnswerSubmitType,
  deleteCompatibilityAnswer,
  getEmptyAnswer,
  IMPORTANCE_CHOICES,
  IMPORTANCE_DISPLAY_COLORS,
  submitCompatibilityAnswer,
} from './answer-compatibility-question-content'
import {PreferredList, PreferredListNoComparison} from './compatibility-question-preferred-list'
import {PinQuestionButton} from './pin-question-button'

const NUM_QUESTIONS_TO_SHOW = 4
const NUM_PINNED_QUESTIONS_TO_SHOW = 4

export function separateQuestionsArray(
  questions: QuestionWithStats[],
  skippedAnswerQuestionIds: Set<number>,
  answeredQuestionIds: Set<number>,
) {
  debug('Refreshing questions array')
  const skippedQuestions: QuestionWithStats[] = []
  const answeredQuestions: QuestionWithStats[] = []
  const otherQuestions: QuestionWithStats[] = []

  questions.forEach((q) => {
    if (skippedAnswerQuestionIds.has(q.id)) {
      skippedQuestions.push(q)
    } else if (answeredQuestionIds.has(q.id)) {
      answeredQuestions.push(q)
    } else {
      otherQuestions.push(q)
    }
  })

  return {skippedQuestions, answeredQuestions, otherQuestions}
}

export function CompatibilityQuestionsDisplay(props: {
  isCurrentUser: boolean
  user: User
  profile: Profile
  fromSignup?: boolean
  fromProfilePage?: Profile
  showCommunityInfo?: boolean
}) {
  const {isCurrentUser, user, fromSignup, fromProfilePage, profile, showCommunityInfo} = props

  const t = useT()

  const currentUser = useUser()
  const compatibleProfiles = useCompatibleProfiles(currentUser?.id)
  const compatibilityScore = compatibleProfiles?.profileCompatibilityScores?.[profile.user_id]

  const {pinnedQuestionIds, refreshPinnedQuestionIds} = usePinnedQuestionIds()

  const {refreshCompatibilityQuestions, compatibilityQuestions} =
    useCompatibilityQuestionsWithAnswerCount()

  const {refreshCompatibilityAnswers, compatibilityAnswers} = useUserCompatibilityAnswers(user.id)

  const {answers, skippedQuestions, answeredQuestions, otherQuestions} = useMemo(() => {
    debug('Refreshing questions')
    const [skippedAnswers, answers] = partition(
      compatibilityAnswers,
      (answer) => answer.importance == -1,
    )
    const answeredQuestionIds = new Set(answers.map((answer) => answer.question_id))
    const skippedAnswerQuestionIds = new Set(skippedAnswers.map((answer) => answer.question_id))
    const {skippedQuestions, answeredQuestions, otherQuestions} = separateQuestionsArray(
      compatibilityQuestions,
      skippedAnswerQuestionIds,
      answeredQuestionIds,
    )
    return {answers, skippedQuestions, answeredQuestions, otherQuestions}
  }, [compatibilityAnswers, compatibilityQuestions])

  const refreshCompatibilityAll = useCallback(() => {
    refreshCompatibilityAnswers()
    refreshCompatibilityQuestions()
    refreshPinnedQuestionIds()
  }, [refreshCompatibilityAnswers, refreshCompatibilityQuestions, refreshPinnedQuestionIds])

  const isLooking = useIsLooking()
  const [sort, setSort] = usePersistentInMemoryState<CompatibilitySort>(
    !isLooking && !fromProfilePage ? 'their_important' : 'your_important',
    `compatibility-sort-${user.id}`,
  )
  const [searchTerm, setSearchTerm] = useState('')

  const comparedUserId = fromProfilePage?.user_id ?? currentUser?.id
  const {compatibilityAnswers: comparedAnswers} = useUserCompatibilityAnswers(comparedUserId)

  const sortedAndFilteredAnswers = useMemo(() => {
    debug('Refreshing sortedAndFilteredAnswers')
    const questionIdToComparedAnswer = keyBy(comparedAnswers, 'question_id')
    return sortBy(
      answers.filter((a) => {
        // if (a.question_id < 10) console.log({a, sort})
        const question = compatibilityQuestions.find((q) => q.id === a.question_id)
        const comparedAnswer = questionIdToComparedAnswer[a.question_id]
        if (question && !isMatchingSearch({...question, answer: a}, searchTerm)) return false
        if (sort === 'disagree') {
          // Answered and not skipped.
          if (!comparedAnswer || comparedAnswer.importance < 0) return false
          return !getAnswerCompatibility(a, comparedAnswer)
        }
        if (sort === 'your_unanswered') {
          // Not answered or skipped.
          return !comparedAnswer || comparedAnswer.importance === -1
        }
        return true
      }),
      (a) => {
        const comparedAnswer = questionIdToComparedAnswer[a.question_id]
        if (sort === 'your_important') {
          return compareBySort(comparedAnswer, undefined, sort)
        } else if (sort === 'disagree') {
          return comparedAnswer ? getScoredAnswerCompatibility(a, comparedAnswer) : Infinity
        } else if (sort === 'your_unanswered') {
          // Not answered first, then skipped, then answered.
          return comparedAnswer ? (comparedAnswer.importance >= 0 ? 2 : 1) : 0
        }
        const question = compatibilityQuestions.find((q) => q.id === a.question_id)
        return compareBySort({...a, ...question}, undefined, sort)
      },
      // Break ties with their answer importance.
      (a) => -a.importance,
      // Then by whether they wrote an explanation.
      (a) => (a.explanation ? 0 : 1),
    )
  }, [answers, compatibilityQuestions, comparedAnswers, searchTerm, sort])

  const [page, setPage] = useState(0)
  const currentSlice = page * NUM_QUESTIONS_TO_SHOW
  const shownAnswers = sortedAndFilteredAnswers.slice(
    currentSlice,
    currentSlice + NUM_QUESTIONS_TO_SHOW,
  )

  const pinnedAnswers = useMemo(() => {
    if (!pinnedQuestionIds?.length) return []
    const pinned = answers.filter((a) => pinnedQuestionIds.includes(a.question_id))
    const idToIndex = new Map(pinnedQuestionIds.map((id, i) => [id, i] as const))
    return sortBy(pinned, (a) => idToIndex.get(a.question_id) ?? Infinity)
  }, [answers, pinnedQuestionIds])

  const [pinnedPage, setPinnedPage] = useState(0)
  const pinnedCurrentSlice = pinnedPage * NUM_PINNED_QUESTIONS_TO_SHOW
  const shownPinnedAnswers = pinnedAnswers.slice(
    pinnedCurrentSlice,
    pinnedCurrentSlice + NUM_PINNED_QUESTIONS_TO_SHOW,
  )

  useEffect(() => {
    setPinnedPage(0)
  }, [user.id])

  if (!isCurrentUser && !answeredQuestions.length) return null

  return (
    <Col className="gap-4">
      <Row className={'gap-8'}>
        <Subtitle>
          {isCurrentUser
            ? t('answers.display.your_prompts', 'Your Compatibility Prompts')
            : t('answers.display.user_prompts', "{name}'s Compatibility Prompts", {
                name: shortenName(user.name),
              })}
        </Subtitle>
        {compatibilityScore && (
          <CompatibleBadge compatibility={compatibilityScore} className={'mt-7 mr-4'} />
        )}
      </Row>
      {pinnedAnswers.length > 0 && (
        <Col className="gap-3">
          <PinIcon />
          {shownPinnedAnswers.map((answer) => (
            <CompatibilityAnswerBlock
              key={`pinned-${answer.question_id}`}
              answer={answer}
              yourQuestions={answeredQuestions}
              user={user}
              isCurrentUser={isCurrentUser}
              refreshCompatibilityAll={refreshCompatibilityAll}
              profile={profile}
              fromProfilePage={fromProfilePage}
              showCommunityInfo={showCommunityInfo}
            />
          ))}
          {NUM_PINNED_QUESTIONS_TO_SHOW < pinnedAnswers.length && (
            <Pagination
              page={pinnedPage}
              pageSize={NUM_PINNED_QUESTIONS_TO_SHOW}
              totalItems={pinnedAnswers.length}
              setPage={setPinnedPage}
            />
          )}
          <div className="border-canvas-200 border-b" />
        </Col>
      )}
      <Row className="flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {answeredQuestions.length > 0 && (
          <div className="relative mt-3">
            {/*<input*/}
            {/*  type="text"*/}
            {/*  placeholder={t('answers.search_placeholder', 'Search prompts...')}*/}
            {/*  value={searchTerm}*/}
            {/*  onChange={(e) => {*/}
            {/*    setSearchTerm(e.target.value)*/}
            {/*    setPage(0)*/}
            {/*  }}*/}
            {/*  className="h-8 pl-7 pr-2 text-sm border border-ink-300 rounded-xl bg-canvas-0 focus:outline-none focus:ring-1 focus:ring-primary-500 w-48 transition-all"*/}
            {/*/>*/}
            <Input
              value={searchTerm}
              placeholder={t('answers.search_placeholder', 'Search prompts...')}
              className={'w-48 xs:w-64'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value)
              }}
            />
          </div>
        )}
        <CompatibilitySortWidget
          className="text-sm sm:flex mt-4"
          sort={sort}
          setSort={setSort}
          user={user}
          profile={profile}
        />
      </Row>
      {answeredQuestions.length <= 0 ? (
        <span className="text-ink-600 text-sm">
          {isCurrentUser
            ? t(
                'answers.display.none_answered_you',
                "You haven't answered any compatibility questions yet!",
              )
            : t(
                'answers.display.none_answered_user',
                "{name} hasn't answered any compatibility questions yet!",
                {name: user.name},
              )}{' '}
          {isCurrentUser && (
            <>
              {t(
                'answers.display.add_some',
                "Add some to better see who you'd be most compatible with.",
              )}
            </>
          )}
        </span>
      ) : (
        <>
          {shownAnswers.map((answer) => {
            return (
              <CompatibilityAnswerBlock
                key={answer.question_id}
                answer={answer}
                yourQuestions={answeredQuestions}
                user={user}
                isCurrentUser={isCurrentUser}
                refreshCompatibilityAll={refreshCompatibilityAll}
                profile={profile}
                fromProfilePage={fromProfilePage}
                showCommunityInfo={showCommunityInfo}
              />
            )
          })}
          {shownAnswers.length === 0 && (
            <div className="text-ink-500">{t('answers.display.none', 'None')}</div>
          )}
        </>
      )}
      {NUM_QUESTIONS_TO_SHOW < answers.length && (
        <Pagination
          page={page}
          pageSize={NUM_QUESTIONS_TO_SHOW}
          totalItems={sortedAndFilteredAnswers.length}
          setPage={setPage}
        />
      )}
      {isCurrentUser && !fromProfilePage && (
        <span className="custom-link">
          {otherQuestions.length < 1 ? (
            <span className="text-ink-600 text-sm">
              {t(
                'answers.display.already_answered_all',
                "You've already answered all the compatibility questions—",
              )}
            </span>
          ) : (
            <span className="text-ink-600 text-sm">
              {t(
                'answers.display.answer_more',
                'Answer more questions to increase your compatibility scores—or ',
              )}
            </span>
          )}
          <AddCompatibilityQuestionButton refreshCompatibilityAll={refreshCompatibilityAll} />
        </span>
      )}
      {isCurrentUser && (
        <Row className={'w-full justify-center gap-8'}>
          {(fromSignup || (otherQuestions.length >= 1 && !fromProfilePage)) && (
            <AnswerCompatibilityQuestionButton
              user={user}
              otherQuestions={otherQuestions}
              refreshCompatibilityAll={refreshCompatibilityAll}
              fromSignup={fromSignup}
            />
          )}
          <CompatibilityPageButton />
        </Row>
      )}
      {skippedQuestions.length > 0 && isCurrentUser && (
        <Row className="w-full justify-end">
          <AnswerSkippedCompatibilityQuestionsButton
            user={user}
            skippedQuestions={skippedQuestions}
            refreshCompatibilityAll={refreshCompatibilityAll}
          />
        </Row>
      )}
    </Col>
  )
}

export function CompatibilityAnswerBlock(props: {
  answer?: rowFor<'compatibility_answers'>
  yourQuestions: QuestionWithStats[]
  question?: QuestionWithStats
  user: User
  isCurrentUser: boolean
  profile?: Profile
  refreshCompatibilityAll: () => void
  fromProfilePage?: Profile
  showCommunityInfo?: boolean
}) {
  const {
    answer,
    yourQuestions,
    user,
    profile,
    isCurrentUser,
    refreshCompatibilityAll,
    fromProfilePage,
  } = props

  const showCommunityInfo = props.showCommunityInfo === undefined ? true : props.showCommunityInfo

  const question = props.question || yourQuestions.find((q) => q.id === answer?.question_id)
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const currentUser = useUser()
  const currentProfile = useProfile()
  const t = useT()

  const [newAnswer, setNewAnswer] = useState<CompatibilityAnswerSubmitType | undefined>(
    props.answer,
  )

  useEffect(() => {
    setNewAnswer(props.answer)
  }, [props.answer])

  const comparedProfile = isCurrentUser
    ? null
    : fromProfilePage
      ? fromProfilePage
      : {...currentProfile, user: currentUser}

  if (!question || !question.multiple_choice_options || (answer && answer?.multiple_choice == null))
    return null

  const answerText = answer
    ? getStringKeyFromNumValue(
        answer.multiple_choice,
        question.multiple_choice_options as Record<string, number>,
      )
    : null
  const preferredAnswersText = answer
    ? answer.pref_choices.map((choice) =>
        getStringKeyFromNumValue(
          choice,
          question.multiple_choice_options as Record<string, number>,
        ),
      )
    : []
  const distinctPreferredAnswersText = preferredAnswersText.filter((text) => text !== answerText)
  const preferredDoesNotIncludeAnswerText = answerText && !preferredAnswersText.includes(answerText)

  const isAnswered = answer && answer.multiple_choice > -1
  const isSkipped = answer && answer.importance == -1

  const shortenedPopularity = question.answer_count ? shortenNumber(question.answer_count) : null

  return (
    <Col
      data-testid="profile-compatibility-section"
      className={
        'bg-canvas-0 flex-grow gap-4 whitespace-pre-line rounded-xl px-3 py-2 leading-relaxed'
      }
    >
      <Row
        className="justify-between gap-1 font-semibold"
        data-testid="profile-compatibility-question"
      >
        {question.question}
        <Row className="gap-4 font-normal" data-testid="profile-compatibility-importance">
          {comparedProfile && isAnswered && (
            <div className="hidden sm:block">
              <CompatibilityDisplay
                question={question}
                profile1={profile}
                answer1={answer}
                profile2={comparedProfile as Profile}
                currentUserIsComparedProfile={!fromProfilePage}
                currentUser={currentUser}
              />
            </div>
          )}
          {!!currentUser && <PinQuestionButton questionId={question.id} />}
          {isCurrentUser && isAnswered && (
            <>
              <ImportanceButton
                className="hidden sm:block"
                importance={answer.importance}
                onClick={() => setEditOpen(true)}
              />
              <DropdownMenu
                items={[
                  {
                    name: t('answers.menu.edit', 'Edit'),
                    icon: <PencilIcon className="h-5 w-5" />,
                    onClick: () => setEditOpen(true),
                  },
                  {
                    name: t('answers.menu.delete', 'Delete'),
                    icon: <TrashIcon className="h-5 w-5" />,
                    onClick: () => {
                      deleteCompatibilityAnswer(answer.id, user.id)
                        .then(() => refreshCompatibilityAll())
                        .catch((e) => {
                          toast.error(e.message)
                        })
                        .finally(() => {})
                    },
                  },
                ]}
                closeOnClick
                menuWidth="w-40"
              />
            </>
          )}
          {isCurrentUser && !isAnswered && !isSkipped && (
            <>
              <DropdownMenu
                items={[
                  {
                    name: t('answers.menu.skip', 'Skip'),
                    icon: <TrashIcon className="h-5 w-5" />,
                    onClick: () => {
                      submitCompatibilityAnswer(getEmptyAnswer(user.id, question.id))
                        .then(() => {
                          refreshCompatibilityAll()
                        })
                        .catch((e) => {
                          toast.error(e.message)
                        })
                        .finally(() => {})
                    },
                  },
                ]}
                closeOnClick
                menuWidth="w-40"
              />
            </>
          )}
        </Row>
      </Row>
      {answerText && (
        <Row
          className="bg-canvas-100 w-fit gap-1 rounded-xl px-2 py-1 text-sm"
          data-testid="profile-compatibility-question-answer"
        >
          {answerText}
        </Row>
      )}
      <Row className="px-2 -mt-4" data-testid="profile-compatibility-question-answer-explanation">
        {answer?.explanation && <Linkify className="" text={answer.explanation} />}
      </Row>
      {distinctPreferredAnswersText.length > 0 && (
        <Col className="gap-2">
          <div className="text-sm">
            {preferredDoesNotIncludeAnswerText
              ? t('answers.display.acceptable', 'Acceptable')
              : t('answers.display.also_acceptable', 'Also acceptable')}
          </div>
          <Row
            className="flex-wrap gap-2 mt-0"
            data-testid="profile-compatibility-question-acceptable-answer"
          >
            {distinctPreferredAnswersText.map((text) => (
              <Row key={text} className="bg-canvas-100 w-fit gap-1 rounded-xl px-2 py-1 text-sm">
                {text}
              </Row>
            ))}
          </Row>
        </Col>
      )}
      {!isAnswered && (
        <Row className="flex-wrap gap-2 mt-0">
          {sortBy(Object.entries(question.multiple_choice_options), 1)
            .map(([label]) => label)
            .map((label, i) => (
              <button
                key={label}
                onClick={() => {
                  const _answer = getEmptyAnswer(user.id, question.id)
                  _answer.multiple_choice = i
                  setNewAnswer(_answer)
                  setEditOpen(true)
                }}
                className="bg-canvas-100 hover:bg-canvas-200 w-fit gap-1 rounded-xl px-2 py-1 text-sm"
              >
                {label}
              </button>
            ))}
        </Row>
      )}
      <Col>
        {comparedProfile && isAnswered && (
          <Row className="w-full justify-end sm:hidden">
            <CompatibilityDisplay
              question={question}
              profile1={profile}
              answer1={answer}
              profile2={comparedProfile as Profile}
              currentUserIsComparedProfile={!fromProfilePage}
              currentUser={currentUser}
            />
          </Row>
        )}
        {isCurrentUser && isAnswered && (
          <Row className="w-full justify-end sm:hidden">
            <ImportanceButton importance={answer.importance} onClick={() => setEditOpen(true)} />
          </Row>
        )}
        {/*{question.importance_score == 0 && <div className="text-ink-500 text-sm">Core Question</div>}*/}
      </Col>
      {showCommunityInfo && (
        <Row className={'mt-[-10px]'}>
          {shortenedPopularity && (
            <Tooltip
              text={t(
                'answers.content.people_answered',
                '{count} people have answered this question',
                {count: String(shortenedPopularity)},
              )}
            >
              <Row className="select-none items-center text-sm guidance">
                {shortenedPopularity}
                <UserIcon className="h-4 w-4" />
              </Row>
            </Tooltip>
          )}
          {isFinite(question.community_importance_percent) && (
            <span className={'text-sm ml-auto guidance'}>
              {t('compatibility.question.community_importance', 'Community Importance')}:{' '}
              {Math.round(question.community_importance_percent)}%
            </span>
          )}
        </Row>
      )}
      <Modal open={editOpen} setOpen={setEditOpen}>
        <Col className={MODAL_CLASS}>
          <AnswerCompatibilityQuestionContent
            key={`edit answer.id`}
            question={question}
            answer={newAnswer}
            user={user}
            onSubmit={() => {
              setEditOpen(false)
              refreshCompatibilityAll()
            }}
            isLastQuestion={true}
            noSkip={isAnswered}
          />
        </Col>
      </Modal>
    </Col>
  )
}

function CompatibilityDisplay(props: {
  question: QuestionWithStats
  profile1?: Profile
  profile2: Profile
  answer1: rowFor<'compatibility_answers'>
  currentUserIsComparedProfile: boolean
  currentUser: User | null | undefined
  className?: string
}) {
  const {question, profile1, profile2, answer1, currentUserIsComparedProfile, currentUser} = props

  const t = useT()

  const [answer2, setAnswer2] = useState<rowFor<'compatibility_answers'> | null | undefined>(
    undefined,
  )

  async function getComparedProfileAnswer() {
    db.from('compatibility_answers')
      .select()
      .eq('creator_id', profile2.user_id)
      .eq('question_id', question.id)
      .then((res) => {
        if (res.error) {
          console.error(res.error)
          return
        }
        setAnswer2(res.data[0] ?? null)
      })
  }

  useEffect(() => {
    getComparedProfileAnswer()
  }, [])

  const [open, setOpen] = useState(false)

  if (!profile1 || profile1.id === profile2.id) return null

  const showCreateAnswer =
    (!answer2 || answer2.importance == -1) && currentUserIsComparedProfile && !!currentUser

  const isCurrentUser = currentUser?.id === profile2.user_id

  const answerCompatibility = answer2
    ? getAnswerCompatibility(answer1, answer2)
    : //getScoredAnswerCompatibility(answer1, answer2)
      undefined
  const user1 = profile1.user
  const user2 = profile2.user

  const importanceScore = answer1.importance

  return (
    <Row className="gap-2">
      <ImportanceButton importance={importanceScore} onClick={() => setOpen(true)} />

      {showCreateAnswer || answerCompatibility === undefined || !answer2 ? (
        <AnswerCompatibilityQuestionButton
          user={currentUser}
          otherQuestions={[question]}
          refreshCompatibilityAll={getComparedProfileAnswer}
          size="sm"
        />
      ) : (
        <>
          <button
            onClick={() => setOpen(true)}
            className={clsx(
              'text-ink-1000 h-fit w-28 rounded-full px-2 py-0.5 text-xs transition-colors',
              answerCompatibility
                ? 'bg-green-500/20 hover:bg-green-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30',
            )}
          >
            {answerCompatibility
              ? t('answers.compatible', 'Compatible')
              : t('answers.incompatible', 'Incompatible')}
          </button>
        </>
      )}
      <Modal open={open} setOpen={setOpen}>
        <Col className={MODAL_CLASS}>
          <Subtitle>{question.question}</Subtitle>
          <Col className={clsx('w-full gap-1', SCROLLABLE_MODAL_CLASS)}>
            <div className="text-ink-600 items-center gap-2">
              {t('answers.modal.preferred_of_user', "{name}'s preferred answers", {
                name: shortenName(user1.name),
              })}
            </div>
            <div className="text-ink-500 text-sm">
              {t('answers.modal.user_marked', '{name} marked this as ', {
                name: shortenName(user1.name),
              })}
              <span className="font-semibold">
                <ImportanceDisplay importance={answer1.importance} />
              </span>
            </div>
            {!answer2 && <PreferredListNoComparison question={question} answer={answer1} />}
            {answer2 && (
              <>
                <PreferredList
                  answer={answer1}
                  question={question}
                  comparedAnswer={answer2}
                  comparedUser={user2}
                  isComparedUser={isCurrentUser}
                />

                <div className="text-ink-600 mt-6 items-center gap-2">
                  {isCurrentUser
                    ? t('answers.modal.your_preferred', 'Your preferred answers')
                    : t('answers.modal.preferred_of_user', "{name}'s preferred answers", {
                        name: shortenName(user2.name),
                      })}
                </div>
                <div className="text-ink-500 text-sm">
                  {isCurrentUser
                    ? t('answers.modal.you_marked', 'You marked this as ')
                    : t('answers.modal.user_marked', '{name} marked this as ', {
                        name: shortenName(user2.name),
                      })}
                  <span className="font-semibold">
                    <ImportanceDisplay importance={answer2.importance} />
                  </span>
                </div>
                <PreferredList
                  answer={answer2}
                  question={question}
                  comparedAnswer={answer1}
                  comparedUser={user1}
                />
              </>
            )}
          </Col>
        </Col>
      </Modal>
    </Row>
  )
}

function ImportanceDisplay(props: {importance: number}) {
  const {importance} = props
  const t = useT()
  return (
    <span className={clsx('w-fit')}>
      {t(
        `answers.importance.${importance}`,
        getStringKeyFromNumValue(importance, IMPORTANCE_CHOICES) as string,
      )}
    </span>
  )
}

function ImportanceButton(props: {importance: number; onClick: () => void; className?: string}) {
  const {importance, onClick, className} = props
  return (
    <button
      onClick={onClick}
      className={clsx(
        'text-ink-1000 h-fit rounded-full px-2 py-0.5 text-xs transition-colors',
        // Longer width for "Somewhat important"
        importance === 1 ? 'w-36' : 'w-28',
        IMPORTANCE_DISPLAY_COLORS[importance],
        className,
      )}
    >
      <ImportanceDisplay importance={importance} />
    </button>
  )
}

function getStringKeyFromNumValue(value: number, map: Record<string, number>): string | undefined {
  const choices = Object.keys(map) as (keyof typeof map)[]
  return choices.find((choice) => map[choice] === value)
}
