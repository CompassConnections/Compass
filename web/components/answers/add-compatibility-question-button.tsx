import {PlusIcon, XIcon} from '@heroicons/react/outline'
import {MAX_ANSWER_LENGTH} from 'common/envs/constants'
import {MAX_COMPATIBILITY_QUESTION_LENGTH} from 'common/profiles/constants'
import {Row as rowFor} from 'common/supabase/utils'
import {User} from 'common/user'
import {uniq} from 'lodash'
import {useState} from 'react'
import {toast} from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {ExpandingInput} from 'web/components/widgets/expanding-input'
import {useEvent} from 'web/hooks/use-event'
import {QuestionWithCountType} from 'web/hooks/use-questions'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

import {AnswerCompatibilityQuestionContent} from './answer-compatibility-question-content'

export function AddCompatibilityQuestionButton(props: {refreshCompatibilityAll: () => void}) {
  const {refreshCompatibilityAll} = props
  const [open, setOpen] = useState(false)
  const t = useT()
  const user = useUser()
  if (!user) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm">
        {t('answers.add.submit_own', 'submit your own!')}
      </button>
      <AddCompatibilityQuestionModal
        open={open}
        setOpen={setOpen}
        user={user}
        onClose={() => {
          refreshCompatibilityAll()
        }}
      />
    </>
  )
}

function AddCompatibilityQuestionModal(props: {
  open: boolean
  setOpen: (open: boolean) => void
  user: User
  onClose?: () => void
}) {
  const {open, setOpen, user, onClose} = props
  const [dbQuestion, setDbQuestion] = useState<rowFor<'compatibility_prompts'> | null>(null)
  const afterAddQuestion = (newQuestion: rowFor<'compatibility_prompts'>) => {
    setDbQuestion(newQuestion)
    console.debug('setDbQuestion', newQuestion)
  }

  return (
    <Modal open={open} setOpen={setOpen} onClose={onClose}>
      <Col className={MODAL_CLASS}>
        {!dbQuestion ? (
          <CreateCompatibilityModalContent afterAddQuestion={afterAddQuestion} setOpen={setOpen} />
        ) : (
          <AnswerCompatibilityQuestionContent
            compatibilityQuestion={dbQuestion as QuestionWithCountType}
            user={user}
            onSubmit={() => {
              // setOpen(false)
              setDbQuestion(null)
            }}
            isLastQuestion
            onNext={() => {
              // setOpen(false)
              setDbQuestion(null)
            }}
          />
        )}
      </Col>
    </Modal>
  )
}

function CreateCompatibilityModalContent(props: {
  afterAddQuestion: (question: rowFor<'compatibility_prompts'>) => void
  setOpen: (open: boolean) => void
}) {
  const {afterAddQuestion, setOpen} = props
  const t = useT()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)

  const onOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const deleteOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
  }

  const optionsAreValid = options.every((o) => o.trim().length > 0) && options.length >= 2

  const questionIsValid = question.trim().length > 0

  const noRepeatOptions = uniq(options).length == options.length

  const generateJson = () => {
    // Note the change in the generic type
    return options.reduce(
      (obj, item, index) => {
        if (item.trim() !== '') {
          obj[item] = index // Mapping each option to its index
        }
        return obj
      },
      {} as Record<string, number>,
    )
  }

  const onAddQuestion = useEvent(async () => {
    try {
      const data = {
        question: question,
        options: generateJson(),
      }
      const newQuestion = await api('create-compatibility-question', data)
      console.debug('create-compatibility-question', newQuestion, data)
      const q = newQuestion?.question
      if (q) {
        afterAddQuestion(q as rowFor<'compatibility_prompts'>)
      }
      track('create compatibility question')
    } catch (_e) {
      toast.error(
        t('answers.add.error_create', 'Error creating compatibility question. Try again?'),
      )
    }
  })

  return (
    <Col className="w-full gap-4 main-font">
      <Col className="gap-1">
        <label>
          {t('answers.add.question_label', 'Question')}
          <span className={'text-scarlet-500'}>*</span>
        </label>
        <ExpandingInput
          maxLength={MAX_COMPATIBILITY_QUESTION_LENGTH}
          value={question}
          onChange={(e) => setQuestion(e.target.value || '')}
        />
      </Col>
      <Col className="gap-1">
        <label>
          {t('answers.add.options_label', 'Options')}
          <span className={'text-scarlet-500'}>*</span>
        </label>
        <Col className="w-full gap-1">
          {options.map((o, index) => (
            <div key={index} className="relative">
              <ExpandingInput
                value={options[index]}
                onChange={(e) => onOptionChange(index, e.target.value)}
                className="w-full"
                placeholder={t('answers.add.option_placeholder', 'Option {n}', {
                  n: String(index + 1),
                })}
                rows={1}
                maxLength={MAX_ANSWER_LENGTH}
              />
              {options.length > 2 && (
                <button
                  className="bg-ink-400 text-ink-0 hover:bg-ink-600 transition-color absolute -right-1.5 -top-1.5 rounded-full p-0.5"
                  onClick={() => deleteOption(index)}
                >
                  <XIcon className="z-10 h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <Button onClick={addOption} color="gray-outline">
            <Row className="items-center gap-1">
              <PlusIcon className="h-4 w-4" />
              {t('answers.add.add_option', 'Add Option')}
            </Row>
          </Button>
        </Col>
      </Col>

      <Row className="w-full justify-between">
        <Button
          color="gray"
          onClick={() => {
            setOpen(false)
          }}
        >
          {t('settings.action.cancel', 'Cancel')}
        </Button>
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true)
            onAddQuestion().finally(() => setLoading(false))
          }}
          disabled={!optionsAreValid || !questionIsValid || !noRepeatOptions}
        >
          {t('answers.add.submit_and_answer', 'Submit & Answer')}
        </Button>
      </Row>
    </Col>
  )
}
