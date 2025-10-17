import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useUser} from 'web/hooks/use-user'
import {useGetter} from 'web/hooks/use-getter'
import {TextEditor, useTextEditor} from "web/components/widgets/editor";
import {JSONContent} from "@tiptap/core";
import {getVotes} from "web/lib/supabase/votes";
import {MAX_DESCRIPTION_LENGTH} from "common/envs/constants";
import {useEffect, useState} from "react";
import {Button} from "web/components/buttons/button";
import {Input} from "web/components/widgets/input";
import {api} from "web/lib/api";
import {Title} from "web/components/widgets/title";
import toast from "react-hot-toast";
import {Vote, VoteItem} from 'web/components/votes/vote-item'

export function VoteComponent(props: {}) {
  const user = useUser()

  const {data: votes, refresh: refreshVotes} = useGetter(
    'votes',
    {},
    getVotes
  )

  const [title, setTitle] = useState<string>('')
  const [editor, setEditor] = useState<any>(null)

  const hideButton = title.length == 0

  console.debug('votes', votes)

  return (
    <Col className="mx-4">
      <Title className="!mb-2 text-3xl">Proposals</Title>
      {votes && votes.length > 0 && <Col className={'mt-4'}>
        {votes.map((vote: Vote) => {
          return (
            <VoteItem key={vote.id} vote={vote} onVoted={refreshVotes}/>
          )
        })}
      </Col>}
      {user && <Col>
          <Title className="!mb-2 text-3xl">Add a new proposal</Title>
          <Input
              value={title}
              placeholder={'Title'}
              className={'w-full mb-2'}
              onChange={(e) => {
                setTitle(e.target.value)
              }}
          />
          <VoteCreator
              onEditor={(e) => setEditor(e)}
          />
        {!hideButton && (
          <Row className="right-1 justify-between gap-2">
            <Button
              size="xs"
              onClick={async () => {
                const data = {
                  title: title,
                  description: editor.getJSON() as JSONContent,
                };
                const newVote = await api('create-vote', data).catch(() => {
                  toast.error('Failed to create vote — try again or contact us...')
                })
                if (!newVote) return
                toast.success('Vote created')
                console.debug('Vote created', newVote)
                refreshVotes()
              }}
            >
              Submit
            </Button>
          </Row>
        )}
      </Col>
      }
    </Col>
  )
}

interface BaseBioProps {
  defaultValue?: any
  onBlur?: (editor: any) => void
  onEditor?: (editor: any) => void
}

export function VoteCreator({defaultValue, onBlur, onEditor}: BaseBioProps) {
  const editor = useTextEditor({
    // extensions: [StarterKit],
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: defaultValue,
    placeholder: 'Please describe your proposal here',
  })

  useEffect(() => {
    onEditor?.(editor)
  }, [editor, onEditor])

  return (
    <div className={'mb-2'}>
      {/*<p>Description</p>*/}
      <TextEditor
        editor={editor}
        onBlur={() => onBlur?.(editor)}
      />
    </div>
  )
}
