import {API} from 'common/api/schema'

describe('set-compatibility-answer props', () => {
  const props = API['set-compatibility-answer'].props
  const answer = {questionId: 1, multipleChoice: 0, prefChoices: [0]}

  it.each([-1, 0, 1, 2, 3])('accepts importance %d', (importance) => {
    expect(props.safeParse({...answer, importance}).success).toBe(true)
  })

  it.each([-2, 4, 2147483647, 1.5])('rejects importance %d', (importance) => {
    expect(props.safeParse({...answer, importance}).success).toBe(false)
  })
})
