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
import {keyBy, sortBy} from 'lodash'
import {PinIcon} from 'lucide-react'
import {RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
import {Input} from 'web/components/widgets/input'
import {Linkify} from 'web/components/widgets/linkify'
import {Pagination} from 'web/components/widgets/pagination'
import {Tooltip} from 'web/components/widgets/tooltip'
import {shortenName} from 'web/components/widgets/user-link'
import {useLongPressReveal} from 'web/hooks/use-long-press-reveal'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {usePinnedQuestionIds} from 'web/hooks/use-pinned-question-ids'
import {useProfile} from 'web/hooks/use-profile'
import {useCompatibleProfiles} from 'web/hooks/use-profiles'
import {useCompatibilityQuestionGroups, useUserCompatibilityAnswers} from 'web/hooks/use-questions'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {db} from 'web/lib/supabase/db'

import {CompatibilityScoreBar} from '../widgets/compatible-badge'
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
  submitCompatibilityAnswer,
} from './answer-compatibility-question-content'
import {PreferredList, PreferredListNoComparison} from './compatibility-question-preferred-list'
import {PinQuestionButton} from './pin-question-button'

const NUM_QUESTIONS_TO_SHOW = 8
const NUM_PINNED_QUESTIONS_TO_SHOW = 4

// Matches the `scroll-mt-24` on the paginated lists (6rem), which is what keeps a scrolled-to first prompt
// clear of the sticky header.
const LIST_SCROLL_OFFSET = 96

/**
 * Changing page is a request for new content to read, and reading starts at the first prompt — so put the
 * top of that list back in view instead of leaving the reader parked at the tail of the new page. The
 * paginator itself is not lost: it sits where they left it, one scroll down past the prompts they came for.
 *
 * Only scrolls when the top has actually drifted out of reach (short list, or the reader is already up
 * there) — a jump that changes nothing reads as a glitch.
 */
const scrollListIntoView = (ref: RefObject<HTMLDivElement | null>) => {
  const el = ref.current
  if (!el) return
  if (el.getBoundingClientRect().top >= LIST_SCROLL_OFFSET) return
  el.scrollIntoView({block: 'start', behavior: 'smooth'})
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

  const {
    answers,
    skippedQuestions,
    answeredQuestions,
    otherQuestions,
    compatibilityQuestions,
    refreshCompatibilityAnswers,
    refreshCompatibilityQuestions,
  } = useCompatibilityQuestionGroups(user.id)

  const refreshCompatibilityAll = useCallback(() => {
    refreshCompatibilityAnswers()
    refreshCompatibilityQuestions()
    refreshPinnedQuestionIds()
  }, [refreshCompatibilityAnswers, refreshCompatibilityQuestions, refreshPinnedQuestionIds])

  const [sort, setSort] = usePersistentInMemoryState<CompatibilitySort>(
    isCurrentUser ? 'your_important' : 'their_important',
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

  // Each list scrolls to its own top, not to a shared one — paging the pinned list must not yank the
  // reader down to the main list, or vice versa.
  const listRef = useRef<HTMLDivElement>(null)
  const pinnedListRef = useRef<HTMLDivElement>(null)

  const [page, setPage] = useState(0)
  const goToPage = (p: number) => {
    setPage(p)
    scrollListIntoView(listRef)
  }
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
  const goToPinnedPage = (p: number) => {
    setPinnedPage(p)
    scrollListIntoView(pinnedListRef)
  }
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
      {pinnedAnswers.length > 0 && (
        <Col className="gap-3">
          <PinIcon />
          <Col ref={pinnedListRef} className="scroll-mt-24">
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
          </Col>
          {NUM_PINNED_QUESTIONS_TO_SHOW < pinnedAnswers.length && (
            <Pagination
              page={pinnedPage}
              pageSize={NUM_PINNED_QUESTIONS_TO_SHOW}
              totalItems={pinnedAnswers.length}
              setPage={goToPinnedPage}
            />
          )}
          <div className="border-canvas-200 border-b" />
        </Col>
      )}
      {/* Score first and full width — it is the number the whole section exists to produce, and it was
          previously a badge squeezed between the search box and the sort control. No caption: the
          section heading directly above already reads "Compatibility prompts". */}
      {compatibilityScore && <CompatibilityScoreBar compatibility={compatibilityScore} hideLabel />}
      <Row className="flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {answeredQuestions.length > 0 && (
          <>
            <div className="relative min-w-[180px] flex-1 sm:max-w-[340px]">
              {/*<input*/}
              {/*  type="text"*/}
              {/*  placeholder={t('answers.search_placeholder', 'Search prompts...')}*/}
              {/*  value={searchTerm}*/}
              {/*  onChange={(e) => {*/}
              {/*    setSearchTerm(e.target.value)*/}
              {/*    setPage(0)*/}
              {/*  }}*/}
              {/*  className="h-8 pl-7 pr-2 text-sm border border-ink-300 rounded-xl bg-canvas-50 focus:outline-none focus:ring-1 focus:ring-primary-500 w-48 transition-all"*/}
              {/*/>*/}
              <Input
                value={searchTerm}
                placeholder={t('answers.search_placeholder', 'Search prompts...')}
                className={
                  'w-full !h-10 !rounded-none !border-0 !border-b !border-canvas-300 !bg-transparent !px-0 !shadow-none [&_input]:!bg-transparent'
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value)
                }}
                searchIcon
              />
            </div>
            <CompatibilitySortWidget
              className="text-sm sm:flex"
              sort={sort}
              setSort={setSort}
              user={user}
              profile={profile}
            />
          </>
        )}
      </Row>
      {answeredQuestions.length == 0 ? (
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
          <Col ref={listRef} className="scroll-mt-24">
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
          </Col>
          {shownAnswers.length === 0 && (
            <Col className="items-center py-8 text-center">
              <div className="text-ink-600 mb-2">
                {t('answers.display.no_results', 'No questions match your search')}
              </div>
              <div className="text-sm text-ink-500">
                {t('answers.display.try_different', 'Try adjusting your search or filters')}
              </div>
            </Col>
          )}
        </>
      )}
      {NUM_QUESTIONS_TO_SHOW < answers.length && (
        <Pagination
          page={page}
          pageSize={NUM_QUESTIONS_TO_SHOW}
          totalItems={sortedAndFilteredAnswers.length}
          setPage={goToPage}
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
  className?: string
}) {
  const {
    answer,
    yourQuestions,
    user,
    profile,
    isCurrentUser,
    refreshCompatibilityAll,
    fromProfilePage,
    className,
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

  // Touch has no hover to uncover the pin with, so a press and hold on the prompt does it instead.
  const {
    containerRef: rowRef,
    revealed: showPin,
    handlers: longPressHandlers,
  } = useLongPressReveal<HTMLDivElement>()

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
      ref={rowRef}
      data-testid="profile-compatibility-section"
      {...longPressHandlers}
      className={clsx(
        // No card. A prompt is question → answer → alternatives, which is structurally the same object
        // as a Details row, so it gets the same treatment: a rule, not a box.
        'group border-canvas-200 flex-grow gap-2 whitespace-pre-line border-b py-6 leading-relaxed',
        // Stops the hold from turning into a text selection / iOS callout — but only where there is
        // no hover, so a pointer user can still select and copy the question and answer.
        '[@media(hover:none)]:select-none [@media(hover:none)]:[-webkit-touch-callout:none]',
        className,
      )}
    >
      <Row className="items-baseline justify-between gap-4">
        {/* Body sans, not the serif. The serif marks text a person wrote — the tagline, the bio, the
            explanation below — and this question is platform boilerplate that reads identically on
            every profile. At 19px Newsreader it also outweighed the answer, which is the part anyone
            is actually here to read. It is the label of this row; the answer is the value. */}
        <h3
          // `font-figtree` is the body face: globals.css sets every h1–h6 to Newsreader at weight 700,
          // so a heading element opts out of the serif explicitly or it does not opt out at all.
          className="font-figtree text-ink-600 min-w-0 font-normal"
          style={{fontSize: '18px', lineHeight: '1.45'}}
          data-testid="profile-compatibility-question"
        >
          {question.question}
        </h3>
        <Row
          className="shrink-0 items-center gap-2 font-normal"
          data-testid="profile-compatibility-importance"
        >
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
          {/* Pinning is a rare action that was occupying permanent space in every row. It appears on
              hover where there is a pointer and on a press and hold where there is not. Focus reveals
              it too, so it stays keyboard-reachable. While hidden it is also unclickable on touch —
              an invisible button there is just a trap next to the question. */}
          {!!currentUser && (
            <PinQuestionButton
              questionId={question.id}
              className={clsx(
                'transition-opacity',
                showPin
                  ? 'opacity-100'
                  : [
                      'opacity-0 [@media(hover:none)]:pointer-events-none',
                      'focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100',
                    ],
              )}
            />
          )}
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
      {/* The chosen answer is the value of the question above it, exactly as "Student" is the value of
          "Work" — so it gets the value treatment rather than a pill. Pills in this design mean
          "clickable", and this one never was. */}
      {answerText && (
        <div
          className="text-primary-900 mt-1"
          style={{fontSize: '18px', lineHeight: '1.35'}}
          data-testid="profile-compatibility-question-answer"
        >
          {answerText}
        </div>
      )}
      {/* Free text the member wrote themselves — the only sentence in the block that is theirs, so it
          keeps the serif italic the tagline uses. The keyline it used to hang off is gone. */}
      {answer?.explanation && (
        <div
          className="font-heading text-ink-500 italic"
          style={{fontSize: '15px', lineHeight: '1.55'}}
          data-testid="profile-compatibility-question-answer-explanation"
        >
          <Linkify text={`“${answer.explanation}”`} />
        </div>
      )}
      {distinctPreferredAnswersText.length > 0 && (
        <div
          className="text-ink-500 mt-1"
          style={{fontSize: '14px', lineHeight: '1.55'}}
          data-testid="profile-compatibility-question-acceptable-answer"
        >
          <span
            className="text-ink-400 font-dm-sans mr-2 uppercase"
            style={{fontSize: '10px', letterSpacing: '0.16em'}}
          >
            {preferredDoesNotIncludeAnswerText
              ? t('answers.display.acceptable', 'Acceptable')
              : t('answers.display.also_acceptable', 'Also acceptable')}
          </span>
          {distinctPreferredAnswersText.map((text, i) => (
            <span key={text}>
              {i > 0 && (
                <span aria-hidden className="text-ink-400 select-none">
                  {' · '}
                </span>
              )}
              {text}
            </span>
          ))}
        </div>
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
                className="border-canvas-300 text-ink-700 hover:border-primary-400 hover:bg-primary-50 w-fit gap-1 rounded-full border px-3 py-1 text-sm transition-colors"
              >
                {label}
              </button>
            ))}
        </Row>
      )}
      <Col className={'sm:hidden'}>
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
        <Row className={''}>
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
          {/* Still a button, still opens the comparison modal — only the weight changed. Outlined
              rather than filled: two solid badges per prompt, stacked down a long column, drowned the
              questions they were annotating. */}
          <button
            onClick={() => setOpen(true)}
            className={clsx(
              'font-dm-sans h-fit whitespace-nowrap rounded-full border px-2.5 py-1 uppercase transition-colors',
              answerCompatibility
                ? 'border-green-500/40 text-green-700 hover:bg-green-500/15'
                : 'border-red-500/40 text-red-700 hover:bg-red-500/15',
            )}
            style={{fontSize: '10px', letterSpacing: '0.12em'}}
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

  // Outlined rather than filled, and no fixed width: importance is an annotation on the question, and
  // a solid amber block per prompt read louder than the questions themselves down a long column. The
  // ramp still steps down, now through border and text weight instead of a background.
  const importanceColors = {
    3: {
      // Very Important — full primary amber
      color: 'rgb(var(--color-primary-700))',
      border: 'rgb(var(--color-primary-400))',
    },
    2: {
      // Important — softer amber, slightly stepped back
      color: 'rgb(var(--color-primary-600))',
      border: 'rgb(var(--color-primary-200))',
    },
    1: {
      // Somewhat Important — warm neutral
      color: 'rgb(var(--color-ink-500))',
      border: 'rgb(var(--color-canvas-300))',
    },
    0: {
      // Not Important — near-invisible
      color: 'rgb(var(--color-ink-300))',
      border: 'rgb(var(--color-canvas-200))',
    },
  }

  const colors =
    importanceColors[importance as keyof typeof importanceColors] || importanceColors[3]

  return (
    <button
      onClick={onClick}
      className={clsx(
        'font-dm-sans hover:bg-canvas-50 h-fit whitespace-nowrap rounded-full px-2.5 py-1 uppercase transition-colors',
        className,
      )}
      style={{
        fontSize: '10px',
        letterSpacing: '0.12em',
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      <ImportanceDisplay importance={importance} />
    </button>
  )
}

function getStringKeyFromNumValue(value: number, map: Record<string, number>): string | undefined {
  const choices = Object.keys(map) as (keyof typeof map)[]
  return choices.find((choice) => map[choice] === value)
}
