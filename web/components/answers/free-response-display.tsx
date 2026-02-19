import {PencilIcon, XIcon} from '@heroicons/react/outline'
import {Row as rowFor} from 'common/supabase/utils'
import {User} from 'common/user'
import {deleteAnswer} from 'web/lib/supabase/answers'
import {useState} from 'react'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Linkify} from 'web/components/widgets/linkify'
import {IndividualQuestionRow} from '../questions-form'
import {Subtitle} from '../widgets/profile-subtitle'
import {
  QuestionWithCountType,
  useFRQuestionsWithAnswerCount,
  useUserAnswers,
} from 'web/hooks/use-questions'
import {TbMessage} from 'react-icons/tb'
import {OtherProfileAnswers} from './other-profile-answers'
import {Modal, MODAL_CLASS, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
import {partition} from 'lodash'
import {shortenName} from 'web/components/widgets/user-link'
import {AddQuestionButton} from './free-response-add-question'
import {Profile} from 'common/profiles/profile'
import {useT} from 'web/lib/locale'

export function FreeResponseDisplay(props: {
  isCurrentUser: boolean
  user: User
  fromProfilePage: Profile | undefined
}) {
  const {isCurrentUser, user, fromProfilePage} = props
  const t = useT()

  const {refreshAnswers, answers: allAnswers} = useUserAnswers(user?.id)

  const answers = allAnswers.filter((a) => a.free_response != null && a.free_response !== '')

  const answerQuestionIds = new Set(answers.map((answer) => answer.question_id))

  const FRquestionsWithCount = useFRQuestionsWithAnswerCount()

  const [yourFRQuestions, otherFRQuestions] = partition(FRquestionsWithCount, (question) =>
    answerQuestionIds.has(question.id),
  )

  const noAnswers = answers.length < 1

  if (noAnswers && !isCurrentUser) {
    return null
  }

  return (
    <Col className="gap-2">
      <Row className={'w-full items-center justify-between gap-2'}>
        <Subtitle>
          {isCurrentUser
            ? t('answers.free.your_title', 'Your Free Response')
            : t('answers.free.user_title', "{name}'s Free Response", {
                name: shortenName(user.name),
              })}
        </Subtitle>
      </Row>

      <Col className="gap-2">
        {answers.map((answer) => {
          return (
            <AnswerBlock
              key={answer.free_response ?? '' + answer.id}
              answer={answer}
              questions={yourFRQuestions}
              isCurrentUser={isCurrentUser}
              user={user}
              refreshAnswers={refreshAnswers}
            />
          )
        })}
      </Col>

      {isCurrentUser && !fromProfilePage && (
        <AddQuestionButton
          isFirstQuestion={answers.length < 1}
          questions={otherFRQuestions}
          user={user}
          refreshAnswers={refreshAnswers}
        />
      )}
    </Col>
  )
}

function AnswerBlock(props: {
  answer: rowFor<'compatibility_answers_free'>
  questions: QuestionWithCountType[]
  isCurrentUser: boolean
  user: User
  refreshAnswers: () => void
}) {
  const {answer, questions, isCurrentUser, user, refreshAnswers} = props
  const question = questions.find((q) => q.id === answer.question_id)
  const [edit, setEdit] = useState(false)
  const t = useT()

  const [otherAnswerModal, setOtherAnswerModal] = useState<boolean>(false)

  if (!question) return null

  return (
    <Col
      key={question.id}
      className={'bg-canvas-0 flex-grow whitespace-pre-line rounded-md px-3 py-2 leading-relaxed'}
    >
      <Row className="text-ink-600 justify-between text-sm">
        {question.question}
        {isCurrentUser && (
          <DropdownMenu
            items={[
              {
                name: t('answers.menu.edit', 'Edit'),
                icon: <PencilIcon className="h-5 w-5" />,
                onClick: () => setEdit(true),
              },
              {
                name: t('answers.menu.delete', 'Delete'),
                icon: <XIcon className="h-5 w-5" />,
                onClick: () => deleteAnswer(answer, user.id).then(() => refreshAnswers()),
              },
              {
                name: t('answers.free.see_others', 'See {count} other answers', {
                  count: String(question.answer_count),
                }),
                icon: <TbMessage className="h-5 w-5" />,
                onClick: () => setOtherAnswerModal(true),
              },
            ]}
            closeOnClick
            menuWidth="w-40"
          />
        )}
      </Row>
      {!edit && (
        <Linkify
          className="font-semibold"
          text={answer.free_response ?? answer.integer?.toString() ?? ''}
        />
      )}
      {edit && (
        <IndividualQuestionRow
          user={user}
          initialAnswer={answer}
          row={question}
          onCancel={() => {
            setEdit(false)
          }}
          onSubmit={() => {
            refreshAnswers()
            setEdit(false)
          }}
          className="mt-2"
        />
      )}
      <Modal open={otherAnswerModal} setOpen={setOtherAnswerModal}>
        <Col className={MODAL_CLASS}>
          <span className="font-semibold">{question.question}</span>
          <OtherProfileAnswers question={question} user={user} className={SCROLLABLE_MODAL_CLASS} />
        </Col>
      </Modal>
    </Col>
  )
}
