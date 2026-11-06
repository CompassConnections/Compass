/** @jest-environment jsdom */
import {renderHook} from '@testing-library/react'
import {ChatMessage} from 'common/chat-message'
import {HOUR_MS, MINUTE_MS} from 'common/util/time'
import {useGroupedMessages} from 'web/lib/supabase/chat-messages'

jest.mock('web/lib/api', () => ({api: jest.fn()}))
jest.mock('web/lib/supabase/db', () => ({db: {}}))

const START = 1_800_000_000_000

const message = (id: number, userId: string, minutes: number, extra: Partial<ChatMessage> = {}) =>
  ({
    id,
    userId,
    createdTime: START + minutes * MINUTE_MS,
    visibility: 'private',
    content: {type: 'doc', content: []},
    ...extra,
  }) as ChatMessage

// The hook takes messages newest first, as they come from the API, and returns them oldest first.
const grouped = (oldestFirst: ChatMessage[]) => {
  const {result} = renderHook(() => useGroupedMessages(oldestFirst.slice().reverse()))
  return result.current?.map((group) => group.map((m) => m.id))
}

describe('useGroupedMessages', () => {
  it('is undefined until messages arrive', () => {
    const {result} = renderHook(() => useGroupedMessages(undefined))
    expect(result.current).toBeUndefined()
  })

  it('groups one author writing in quick succession', () => {
    expect(grouped([message(1, 'a', 0), message(2, 'a', 1)])).toEqual([[1, 2]])
  })

  it('splits when the author changes', () => {
    expect(grouped([message(1, 'a', 0), message(2, 'b', 1)])).toEqual([[1], [2]])
  })

  it('splits after two minutes', () => {
    expect(grouped([message(1, 'a', 0), message(2, 'a', 2)])).toEqual([[1], [2]])
  })

  it('keeps system messages apart from what people wrote', () => {
    const status = {visibility: 'system_status' as const}
    expect(grouped([message(1, 'a', 0), message(2, 'a', 1, status)])).toEqual([[1], [2]])
  })

  it('splits system messages four hours apart', () => {
    const status = {visibility: 'system_status' as const}
    const later = (4 * HOUR_MS) / MINUTE_MS
    expect(grouped([message(1, 'a', 0, status), message(2, 'a', later, status)])).toEqual([
      [1],
      [2],
    ])
  })
})
