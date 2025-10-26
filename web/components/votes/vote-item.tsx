import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Row as rowFor} from 'common/supabase/utils'
import {Content} from 'web/components/widgets/editor'
import {JSONContent} from '@tiptap/core'
import {VoteButtons} from 'web/components/votes/vote-buttons'
import {getVoteCreator} from "web/lib/supabase/votes";
import {useEffect, useState} from "react";
import Link from "next/link";
import {STATUS_CHOICES} from "common/votes/constants";

export type Vote = rowFor<'votes'> & {
  votes_for: number
  votes_against: number
  votes_abstain: number
  priority: number
  status?: string
}

export function VoteItem(props: {
  vote: Vote
  onVoted?: () => void | Promise<void>
}) {
  const {vote, onVoted} = props
  const [creator, setCreator] = useState<any>(null)
  useEffect(() => {
    getVoteCreator(vote.creator_id).then(setCreator)
  }, [vote.creator_id])
  // console.debug('creator', creator, vote)
  return (
    <Col className={'mb-4 rounded-lg border border-canvas-200 p-4'}>
      <Row className={'mb-2'}>
        <Col className={'flex-grow'}>
          <p className={'text-2xl'}>{vote.title}</p>
          <Col className='text-sm italic'>
            <Content className="w-full" content={vote.description as JSONContent}/>
          </Col>
          <Row className={'gap-2 mt-2 items-center justify-between w-full custom-link flex-wrap'}>
            {!!vote.priority ? <div>Priority: {vote.priority.toFixed(0)}%</div> : <p></p>}
            {!vote.is_anonymous && creator?.username &&
                <Link href={`/${creator.username}`} className="custom-link">{creator.username}</Link>}
          </Row>
        </Col>
      </Row>
      <Row className="flex-wrap gap-2 items-center justify-between">
        <VoteButtons
          voteId={vote.id}
          counts={{
            for: vote.votes_for,
            abstain: vote.votes_abstain,
            against: vote.votes_against,
          }}
          onVoted={onVoted}
          disabled={vote.status !== 'voting_open'}
        />
        {vote.status && (
          <p className="text-ink-500">
            {STATUS_CHOICES[vote.status]}
          </p>
        )}
      </Row>
    </Col>
  )
}
