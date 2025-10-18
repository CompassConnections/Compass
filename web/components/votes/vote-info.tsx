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
import Link from "next/link";
import {formLink} from "common/constants";
import { ShowMore } from "../widgets/show-more";
import {ORDER_BY, Constants, OrderBy} from "common/votes/constants";

export function VoteComponent() {
  const user = useUser()
  const [orderBy, setOrderBy] = useState<OrderBy>('recent')

  const {data: votes, refresh: refreshVotes} = useGetter(
    'votes',
    {orderBy},
    getVotes
  )

  const [title, setTitle] = useState<string>('')
  const [editor, setEditor] = useState<any>(null)
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)

  const hideButton = title.length == 0

  return (
    <Col className="mx-2">
      <Row className="items-center justify-between flex-col xxs:flex-row mb-4 xxs:mb-0 gap-2">
        <Title className="text-3xl">Proposals</Title>
        <div className="flex items-center gap-2 text-sm justify-end">
          <label htmlFor="orderBy" className="text-ink-700">Order by:</label>
          <select
            id="orderBy"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value as OrderBy)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-canvas-50"
          >
            {ORDER_BY.map((key) => (
              <option key={key} value={key}>
                {Constants[key]}
              </option>
            ))}
          </select>
        </div>
      </Row>
      <p className={'custom-link'}>
        You can discuss any of those proposals through the <Link href={'/contact'}>contact form</Link>, the <Link href={formLink}>feedback form</Link>, or any of our <Link href={'/social'}>socials</Link>.
      </p>

      {user && <Col>
        <ShowMore labelClosed="Add a new proposal" labelOpen="Hide">
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
          <Row className="mx-2 mb-2 items-center gap-2 text-sm">
              <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="anonymous">Anonymous?</label>
          </Row>
        {!hideButton && (
          <Row className="right-1 justify-between gap-2">
            <Button
              size="xs"
              onClick={async () => {
                const data = {
                  title: title,
                  description: editor.getJSON() as JSONContent,
                  isAnonymous: isAnonymous,
                };
                const newVote = await api('create-vote', data).catch(() => {
                  toast.error('Failed to create vote — try again or contact us...')
                })
                if (!newVote) return
                setTitle('')
                editor.commands.clearContent()
                toast.success('Vote created')
                console.debug('Vote created', newVote)
                refreshVotes()
              }}
            >
              Submit
            </Button>
          </Row>
        )}
      </ShowMore>
      </Col>
      }

      {votes && votes.length > 0 && <Col className={'mt-4'}>
        {votes.map((vote: Vote) => {
          return (
            <VoteItem key={vote.id} vote={vote} onVoted={refreshVotes}/>
          )
        })}
      </Col>}

    </Col>
  )
}

interface VoteCreatorProps {
  defaultValue?: any
  onBlur?: (editor: any) => void
  onEditor?: (editor: any) => void
}

export function VoteCreator({defaultValue, onBlur, onEditor}: VoteCreatorProps) {
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
