import {isUrl} from 'common/parsing'
import {useT} from 'web/lib/locale'

import {BaseTextEditor} from './bio/editable-bio'
import {Button} from './buttons/button'
import {Col} from './layout/col'

interface LLMExtractSectionProps {
  parsingEditor: any
  setParsingEditor: (editor: any) => void
  isExtracting: boolean
  isSubmitting: boolean
  onExtract: () => void
  progress: number
}

export function LLMExtractSection({
  parsingEditor,
  setParsingEditor,
  isExtracting,
  isSubmitting,
  onExtract,
  progress,
}: LLMExtractSectionProps) {
  const t = useT()
  const parsingText = parsingEditor?.getText?.()

  return (
    <Col className={'gap-4'}>
      <div className="">
        {t(
          'profile.llm.extract.description',
          'Auto-fill your profile by dropping a link (LinkedIn, Notion, Google Docs, personal website, etc.) or pasting your content directly.',
        )}
      </div>
      <div className="guidance">
        {t(
          'profile.llm.extract.guidance',
          'Heads up: we use Google AI to extract your info. Google may use this content to improve their models. Prefer to keep things private? Just fill the form manually — no AI involved.',
        )}
      </div>
      <BaseTextEditor
        onEditor={(e) => {
          if (e) setParsingEditor(e)
        }}
        onChange={() => {
          // Trigger re-render to update button state and text on every key stroke
          setParsingEditor({...parsingEditor})
        }}
        placeholder={t(
          'profile.llm.extract.placeholder',
          'Insert a URL or paste your profile content here.',
        )}
      />
      {isExtracting && (
        <div className="w-full h-2 bg-canvas-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-100 ease-linear rounded-full"
            style={{width: `${Math.min(progress, 100)}%`}}
          />
        </div>
      )}
      <Button
        onClick={onExtract}
        disabled={isExtracting || !parsingEditor?.getJSON?.() || isSubmitting}
        loading={isExtracting}
        className="self-start"
      >
        {isExtracting
          ? t('profile.llm.extract.button_extracting', 'Extracting Profile Data')
          : isUrl(parsingText)
            ? t('profile.llm.extract.button_url', 'Extract Profile Data from URL')
            : t('profile.llm.extract.button_text', 'Extract Profile Data from Text')}
      </Button>
    </Col>
  )
}
