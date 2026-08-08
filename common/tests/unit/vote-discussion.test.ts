import {type VoteComment} from 'common/comment'
import {type Stance} from 'common/votes/constants'
import {buildThreads, pickHighlightedArguments} from 'common/votes/discussion'

const comment = (
  id: string,
  opts: {stance?: Stance; replyTo?: string; createdTime?: number; hidden?: boolean} = {},
): VoteComment => ({
  id,
  commentType: 'vote',
  voteId: 1,
  userId: `user-${id}`,
  userName: `User ${id}`,
  userUsername: `user${id}`,
  content: {type: 'doc', content: []},
  createdTime: opts.createdTime ?? Number(id),
  visibility: 'public',
  stance: opts.stance,
  replyToCommentId: opts.replyTo,
  hidden: opts.hidden,
})

describe('buildThreads', () => {
  it('groups replies under their parent, oldest first', () => {
    const threads = buildThreads([
      comment('3', {replyTo: '1', createdTime: 30}),
      comment('1', {createdTime: 10}),
      comment('2', {createdTime: 20}),
      comment('4', {replyTo: '1', createdTime: 40}),
    ])

    expect(threads.map((t) => t.parent.id)).toEqual(['1', '2'])
    expect(threads[0].replies.map((r) => r.id)).toEqual(['3', '4'])
    expect(threads[1].replies).toEqual([])
  })

  it('promotes an orphaned reply rather than dropping it', () => {
    // The parent was hidden and filtered out upstream. Silently discarding the reply would delete
    // someone's argument from the page.
    const threads = buildThreads([comment('2', {replyTo: '1'})])

    expect(threads.map((t) => t.parent.id)).toEqual(['2'])
  })
})

describe('pickHighlightedArguments', () => {
  it('surfaces one argument from each side', () => {
    const threads = buildThreads([
      comment('1', {stance: 'for', createdTime: 10}),
      comment('2', {stance: 'against', createdTime: 20}),
      comment('3', {stance: 'for', createdTime: 30}),
    ])

    expect(pickHighlightedArguments(threads).map((c) => c.id)).toEqual(['1', '2'])
  })

  it('prefers the most-replied-to argument over the oldest', () => {
    const threads = buildThreads([
      comment('1', {stance: 'against', createdTime: 10}),
      comment('2', {stance: 'against', createdTime: 20}),
      comment('3', {replyTo: '2', createdTime: 30}),
    ])

    expect(pickHighlightedArguments(threads).map((c) => c.id)).toEqual(['2'])
  })

  it('ignores neutral, question and answer comments', () => {
    const threads = buildThreads([
      comment('1', {createdTime: 10}),
      comment('2', {stance: 'question', createdTime: 20}),
      comment('3', {stance: 'answer', createdTime: 30}),
    ])

    expect(pickHighlightedArguments(threads)).toEqual([])
  })

  it('does not let a both-ways comment stand in for a one-sided argument', () => {
    const threads = buildThreads([
      comment('1', {stance: 'both', createdTime: 10}),
      comment('2', {stance: 'for', createdTime: 20}),
    ])

    expect(pickHighlightedArguments(threads).map((c) => c.id)).toEqual(['2'])
  })
})
