'use client'

import {debug} from 'common/logger'
import {useCallback, useEffect, useRef, useState} from 'react'

const GRID_SIZE = 9
const MAX_LIVES = 3
const GAME_DURATION = 30

const BUG_TYPES = [
  {icon: '🐛', label: 'worm', duration: 1600},
  {icon: '🪲', label: 'beetle', duration: 1200},
  {icon: '🦟', label: 'mozzie', duration: 800},
]

function Heart({filled}: {filled: any}) {
  return (
    <span style={{fontSize: 20, filter: filled ? 'none' : 'grayscale(1) opacity(0.3)'}}>❤️</span>
  )
}

const css = `
  .wab-wrap * { box-sizing: border-box; }

  .wab-wrap {
    font-family: 'Share Tech Mono', monospace;
    min-height: 420px;
    border-radius: 16px;
    border: 1px solid #1a2e1a;
    padding: 28px 24px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }

  .wab-wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(57,255,20,0.018) 2px,
      rgba(57,255,20,0.018) 4px
    );
    pointer-events: none;
    border-radius: 16px;
  }

  .wab-title {
    font-family: 'VT323', monospace;
    font-size: 36px;
    letter-spacing: 2px;
    text-shadow: 0 0 8px #39ff1466;
    margin: 0;
    line-height: 1;
  }

  .wab-subtitle {
    font-size: 13px;
    margin: -12px 0 0;
    letter-spacing: 1px;
  }

  .wab-hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 380px;
    background: #0d170d;
    border: 1px solid #1f3a1f;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
  }

  .wab-hud-label {  font-size: 11px; letter-spacing: 1px; display: block; }
  .wab-hud-val   {  font-size: 18px; font-family: 'VT323', monospace; }

  .wab-timer-bar-wrap {
    width: 100%;
    max-width: 380px;
    background: #0d170d;
    border: 1px solid #1f3a1f;
    border-radius: 4px;
    height: 6px;
    overflow: hidden;
  }
  .wab-timer-bar {
    height: 100%;
    transition: width 1s linear, background 0.3s;
    border-radius: 4px;
  }
  .wab-timer-bar.warn { background: #ffcc00; }
  .wab-timer-bar.crit { background: #ff4444; }

  .wab-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    max-width: 380px;
    width: 100%;
  }

  .wab-hole {
    aspect-ratio: 1;
    background: #050c05;
    border: 2px solid #1a2e1a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    position: relative;
    overflow: hidden;
    transition: border-color 0.15s;
    box-shadow: inset 0 4px 12px rgba(0,0,0,0.7);
  }

  .wab-hole.has-bug {
    cursor: crosshair;
    border-color: #2a4a2a;
  }

  .wab-hole.has-bug:hover { border-color: #39ff1466; }

  .wab-bug {
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bugPop 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards;
    transform-origin: center bottom;
    user-select: none;
    line-height: 1;
  }

  .wab-bug.whacked {
    animation: bugWhack 0.22s ease-out forwards;
  }

  @keyframes bugPop {
    from { transform: scale(0) translateY(20px); opacity: 0; }
    to   { transform: scale(1) translateY(0px);  opacity: 1; }
  }

  @keyframes bugWhack {
    0%   { transform: scale(1.2) rotate(-10deg); opacity: 1; }
    100% { transform: scale(0) rotate(20deg);    opacity: 0; }
  }

  .wab-score-pop {
    position: absolute;
    top: 12%;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'VT323', monospace;
    font-size: 22px;
    animation: scoreFly 0.7s ease-out forwards;
    pointer-events: none;
    white-space: nowrap;
    z-index: 10;
  }

  .wab-miss-flash {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(255,60,60,0.35);
    animation: missFade 0.4s ease-out forwards;
    pointer-events: none;
  }
  @keyframes missFade {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  .wab-btn {
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    border: none;
    border-radius: 6px;
    padding: 10px 32px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .wab-btn:hover { transform: scale(1.04); box-shadow: 0 0 16px #39ff1466; }
  .wab-btn:active { transform: scale(0.97); }

  .wab-idle, .wab-gameover {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
    padding: 8px 0;
  }

  .wab-idle p, .wab-gameover p {
    font-size: 11px;
    margin: 0;
    max-width: 480px;
    line-height: 1.6;
    letter-spacing: 0.5px;
  }

  .wab-legend {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #4a7a4a;
  }
  .wab-legend span { display: flex; align-items: center; gap: 4px; }

  .wab-lives { display: flex; gap: 4px; }
`

export default function WhackABug() {
  const [gameState, setGameState] = useState('idle')
  const [lives, setLives] = useState(MAX_LIVES)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [holes, setHoles] = useState(Array(GRID_SIZE).fill(null))
  const [effects, setEffects] = useState<{id: number; index: number; type: string}[]>([])

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const livesRef = useRef(MAX_LIVES)
  const gameRef = useRef('idle')

  const clearAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearTimeout(spawnRef.current)
  }, [])

  const endGame = useCallback(() => {
    gameRef.current = 'gameover'
    setGameState('gameover')
    clearAll()
    setHoles(Array(GRID_SIZE).fill(null))
  }, [clearAll])

  const spawnBug = useCallback(() => {
    if (gameRef.current !== 'playing') return

    const type = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)]
    const index = Math.floor(Math.random() * GRID_SIZE)

    setHoles((prev) => {
      if (prev[index]) {
        scheduleNext()
        return prev
      }
      const next = [...prev]
      next[index] = {type, id: Date.now() + Math.random(), whacked: false}
      return next
    })

    const disappear = setTimeout(() => {
      if (gameRef.current !== 'playing') return

      let wasWhacked = false
      setHoles((prev) => {
        if (!prev[index] || prev[index].whacked) {
          wasWhacked = true
          return prev
        }
        const next = [...prev]
        next[index] = null
        return next
      })

      if (wasWhacked) return

      livesRef.current -= 1
      setLives(livesRef.current)
      setEffects((prev) => [...prev, {id: Date.now(), index, type: 'miss'}])
      if (livesRef.current <= 0) endGame()
    }, type.duration)

    timersRef.current.push(disappear)
    scheduleNext()
  }, [endGame])

  function scheduleNext() {
    const delay = 700 + Math.random() * 900
    spawnRef.current = setTimeout(spawnBug, delay)
  }

  const startGame = useCallback(() => {
    clearAll()
    livesRef.current = MAX_LIVES
    gameRef.current = 'playing'
    setLives(MAX_LIVES)
    setTimeLeft(GAME_DURATION)
    setHoles(Array(GRID_SIZE).fill(null))
    setEffects([])
    setGameState('playing')

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame()
          return 0
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setTimeout(spawnBug, 400)
  }, [clearAll, endGame, spawnBug])

  const whack = useCallback((index: number) => {
    debug('Wacked')
    setHoles((prev) => {
      const hole = prev[index]
      if (!hole || hole.whacked) return prev
      const next = [...prev]
      next[index] = {...hole, whacked: true}
      const t = setTimeout(() => {
        setHoles((h) => {
          const n = [...h]
          n[index] = null
          return n
        })
      }, 220)
      timersRef.current.push(t)
      return next
    })
  }, [])

  useEffect(() => {
    const _cleanup = (e: any) => {
      setEffects((prev) => prev.filter((ef) => ef.id !== e.id))
    }
    return () => clearAll()
  }, [clearAll])

  useEffect(() => {
    effects.forEach((ef) => {
      const t = setTimeout(() => {
        setEffects((prev) => prev.filter((x) => x.id !== ef.id))
      }, 700)
      return () => clearTimeout(t)
    })
  }, [effects])

  const pct = (timeLeft / GAME_DURATION) * 100
  const barClass = pct <= 20 ? 'crit' : pct <= 40 ? 'warn' : ''

  return (
    <>
      <style>{css}</style>
      <div className="wab-wrap">
        <h2 className="wab-title">WHACK-A-BUG</h2>
        <p className="wab-subtitle">// blame the bugs for the error</p>

        {
          <div className="wab-idle">
            <div className="wab-legend">
              {BUG_TYPES.map((b) => (
                <span key={b.label}>
                  <span style={{fontSize: 16}}>{b.icon}</span>
                </span>
              ))}
            </div>
            <p className={'text-ink-1000/75 text-sm'}>
              You have {MAX_LIVES} lives. Bugs escape = lost life.
              <br />
              30 seconds. Smash as many as you can.
            </p>
          </div>
        }

        {gameState === 'gameover' ? (
          <div className="wab-gameover">
            <p style={{color: '#ff4444', fontSize: 14}}>// GAME OVER — all bugs escaped</p>
            <button className="wab-btn" onClick={startGame}>
              RETRY
            </button>
          </div>
        ) : (
          <button className="wab-btn" onClick={startGame}>
            START GAME
          </button>
        )}

        {gameState === 'playing' && (
          <>
            <div className="wab-hud">
              <div className="wab-lives">
                {Array.from({length: MAX_LIVES}).map((_, i) => (
                  <Heart key={i} filled={i < lives} />
                ))}
              </div>
              <div style={{textAlign: 'right'}}>
                <span className="wab-hud-label">TIME</span>
                <span
                  className="wab-hud-val"
                  style={{color: timeLeft <= 6 ? '#ff4444' : '#39ff14'}}
                >
                  {String(timeLeft).padStart(2, '0')}s
                </span>
              </div>
            </div>

            <div className="wab-timer-bar-wrap">
              <div className={`wab-timer-bar ${barClass}`} style={{width: `${pct}%`}} />
            </div>

            <div className="wab-grid">
              {holes.map((hole, i) => {
                const holeEffects = effects.filter((e) => e.index === i)
                return (
                  <div
                    key={i}
                    className={`wab-hole${hole && !hole.whacked ? ' has-bug' : ''}`}
                    onClick={() => whack(i)}
                  >
                    {hole && (
                      <div key={hole.id} className={`wab-bug${hole.whacked ? ' whacked' : ''}`}>
                        {hole.type.icon}
                      </div>
                    )}
                    {holeEffects.map((ef) => (
                      <div key={ef.id} className="wab-miss-flash" />
                    ))}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
