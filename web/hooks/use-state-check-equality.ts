import {isEqual} from 'lodash'
import {SetStateAction, useCallback, useRef, useState} from 'react'

export const useStateCheckEquality = <T>(initialState: T) => {
  const [state, setState] = useState(initialState)

  const stateRef = useRef(state)
  stateRef.current = state

  const checkSetState = useCallback(
    (next: SetStateAction<T>) => {
      const state = stateRef.current
      const newState = next instanceof Function ? next(state) : next
      if (!isEqual(state, newState)) {
        setState(newState)
      }
    },
    [stateRef],
  )

  return [state, checkSetState] as const
}
