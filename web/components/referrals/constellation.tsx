import clsx from 'clsx'
import {ReferralTree, ReferralTreeNode} from 'common/referrals'
import Link from 'next/link'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useT} from 'web/lib/locale'

import {
  buildConstellation,
  ConstellationNode,
  edgePath,
  nodeRadius,
  trailTo,
} from './constellation-layout'

/**
 * How many stars get a real face. Past this they are drawn as points of light.
 *
 * The limit is network, not paint: every avatar is a separate request to Firebase storage, and a
 * member with six hundred descendants would otherwise open six hundred connections to render one
 * screen. Faces are spent innermost-first, which is also where they carry information — at the centre
 * you recognise people, at the rim you are reading shape and size.
 */
const AVATAR_BUDGET = 180

/** Above this the per-star drift is dropped. Hundreds of simultaneous CSS animations cost more than the effect is worth. */
const DRIFT_LIMIT = 400

/** Edges past this depth get the base line but not the travelling highlight. */
const FLOW_MAX_DEPTH = 2

/**
 * How long a hover card survives the pointer leaving its star.
 *
 * Long enough to cross the few pixels between the star and the card, short enough that a card left
 * behind by a pointer heading somewhere else does not linger. Below ~100ms the card becomes
 * genuinely hard to reach with a trackpad.
 */
const HOVER_GRACE_MS = 160

/** Movement, in client px, past which a press on the sky counts as a drag rather than a dismissal. */
const DRAG_SLOP = 4

/**
 * Margin kept between the outermost star and the edge of the frame, in **screen pixels**.
 *
 * Pixels rather than viewBox units because what it has to clear is measured in pixels: the title
 * across the top and the hint along the bottom are fixed-size overlays, while the viewBox is whatever
 * the tree happened to need — so a constant expressed in drawing units is a different amount of
 * clearance for every member. More is reserved vertically than horizontally for the same reason;
 * nothing overlays the sides.
 */
const FRAME_INSET_X_PX = 28
const FRAME_INSET_Y_PX = 72

/**
 * Orientations tried when fitting the drawing to the frame, over a half-turn.
 *
 * The packing has no preferred direction — where a big system lands is an accident of who invited
 * whom — so a composition that comes out wide is simply the wrong way up in a portrait frame, and on
 * a phone that cost more than half the available area. Twelve is every fifteen degrees, which is
 * finer than the difference is visible at.
 */
const ROTATION_CANDIDATES = 12

/** Deterministic PRNG, so the background stars are in the same place on every render and every reload. */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const avatarFor = (n: ReferralTreeNode) =>
  n.avatarUrl && n.avatarUrl.length > 0
    ? n.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(n.username[0] ?? 'U')}`

type View = {scale: number; tx: number; ty: number}
const IDENTITY: View = {scale: 1, tx: 0, ty: 0}
const MIN_SCALE = 0.6
const MAX_SCALE = 6

/**
 * Everyone who is on Compass because of one member, drawn as a sky.
 *
 * The reason this is a picture and not the list it replaces: a list of names answers "who did I
 * invite", which a member already knows. What they cannot know from a list is that the four people
 * they invited two years ago have since become sixty — that the thing they did once kept going
 * without them. Generations as rings is the only presentation where that is the *first* thing you
 * see rather than something you work out.
 */
export function ReferralConstellation(props: {
  tree: ReferralTree
  className?: string
  /**
   * Stretch to the height the parent gives it instead of drawing into a square. `/constellation`
   * hands it the whole content area; `/referrals` has no such height to give.
   */
  fill?: boolean
}) {
  const {tree, className, fill} = props
  const t = useT()

  const treeRootId = tree.nodes.find((n) => n.depth === 0)?.id ?? tree.nodes[0]?.id

  // Which member the sky is currently drawn around. Tapping a star re-centres on them; the trail
  // above the canvas walks back.
  const [focusId, setFocusId] = useState<string | undefined>(treeRootId)
  useEffect(() => setFocusId(treeRootId), [treeRootId])

  /**
   * Two ways a card can be open, and they behave differently on purpose.
   *
   * `hovered` is the mouse resting on a star: it is a peek, and it goes away by itself the moment the
   * pointer leaves — unless the pointer is on its way *into* the card, which is the only reason a
   * hover card would ever need to survive the star losing the cursor (its Profile and Their-sky links
   * have to be clickable). Hence the short grace period rather than an immediate close.
   *
   * `pinned` is a click, and a tap on touch. It stays until it is dismissed, so a card can be read
   * without keeping a finger or a cursor perfectly still.
   */
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [view, setView] = useState<View>(IDENTITY)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const full = useMemo(
    () => (treeRootId ? buildConstellation(tree.nodes, treeRootId) : null),
    [tree.nodes, treeRootId],
  )
  const sky = useMemo(
    () => (focusId ? buildConstellation(tree.nodes, focusId) : null),
    [tree.nodes, focusId],
  )

  // A fresh centre is a fresh frame — carrying a pan and zoom across would drop the member somewhere
  // off-screen in a sky they have not seen yet.
  useEffect(() => {
    setView(IDENTITY)
    setPinned(null)
    setHovered(null)
  }, [focusId])

  // Closing a hover card is deferred by a beat so the pointer can cross the gap between the star and
  // the card above it. The card cancels the timer when it takes the pointer.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keepOpen = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])
  const closeSoon = useCallback(() => {
    keepOpen()
    closeTimer.current = setTimeout(() => setHovered(null), HOVER_GRACE_MS)
  }, [keepOpen])
  useEffect(() => keepOpen, [keepOpen])

  const svgRef = useRef<SVGSVGElement | null>(null)
  const skyRef = useRef<HTMLDivElement | null>(null)
  const pointers = useRef(new Map<number, {x: number; y: number}>())
  const pinch = useRef<{dist: number; scale: number} | null>(null)
  const pressOrigin = useRef<{x: number; y: number; moved: boolean} | null>(null)

  // The viewBox is matched to the container's own proportions rather than fixed square. Two reasons,
  // and the second is the one that bites: a square box inside a wide container gets letterboxed by
  // `preserveAspectRatio`, so the sky stops filling its frame — and the HTML tooltip, which finds its
  // anchor by treating a node's coordinates as a percentage of the box, lands somewhere else
  // entirely. Measuring keeps the two in step at any shape.
  const [box, setBox] = useState({w: 1, h: 1})
  useEffect(() => {
    const el = skyRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect
      if (width > 0 && height > 0) setBox({w: width, h: height})
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The smallest box with the container's proportions that still holds the whole drawing, centred on
  // the drawing rather than on the origin. Whichever way the frame is shaped, the constrained
  // dimension is the one the picture is actually wider or taller in — so a tall phone and a wide
  // monitor both come out filled rather than one of them showing a band of empty sky.
  const aspect = box.w / box.h

  /**
   * Turn the whole drawing to whichever angle lets it be drawn largest in this frame.
   *
   * A rotation of the *coordinates*, applied to the group that holds the graph, with each star
   * counter-rotated so faces and labels stay upright. Rotating the positions rather than re-running
   * the packing keeps the layout itself a property of the tree — the same people stay in the same
   * systems, the picture is simply held at a different angle for a phone than for a monitor.
   */
  const frame = useMemo(() => {
    const fallback = {theta: 0, minX: -200, minY: -200, maxX: 200, maxY: 200}
    if (!sky?.all.length) return fallback

    let best = fallback
    let bestFit = -Infinity
    for (let i = 0; i < ROTATION_CANDIDATES; i++) {
      const theta = (i * Math.PI) / ROTATION_CANDIDATES
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const n of sky.all) {
        const r = nodeRadius(n.depth)
        const x = n.x * cos - n.y * sin
        const y = n.x * sin + n.y * cos
        minX = Math.min(minX, x - r)
        maxX = Math.max(maxX, x + r)
        minY = Math.min(minY, y - r)
        maxY = Math.max(maxY, y + r)
      }
      // The largest uniform scale at which this orientation fits a frame of the container's
      // proportions — height normalised to 1, so width is the aspect ratio.
      const fitScale = Math.min(aspect / Math.max(maxX - minX, 1), 1 / Math.max(maxY - minY, 1))
      if (fitScale > bestFit) {
        bestFit = fitScale
        best = {theta, minX, minY, maxX, maxY}
      }
    }
    return best
  }, [sky, aspect])

  const b = frame
  const spin = {cos: Math.cos(frame.theta), sin: Math.sin(frame.theta)}
  const spinDeg = (frame.theta * 180) / Math.PI
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2

  const fit = (w: number, h: number) =>
    w / h > aspect ? {viewW: w, viewH: w / aspect} : {viewW: h * aspect, viewH: h}

  const rawW = Math.max(b.maxX - b.minX, 1)
  const rawH = Math.max(b.maxY - b.minY, 1)
  // Fit once with no margin to learn the scale, convert the pixel insets into drawing units at that
  // scale, then fit again with them. One pass is enough: the second fit changes the scale by the size
  // of the margin, which moves the margin itself by a couple of pixels.
  const unitsPerPx = fit(rawW, rawH).viewW / Math.max(box.w, 1)
  const {viewW, viewH} = fit(
    rawW + FRAME_INSET_X_PX * unitsPerPx * 2,
    rawH + FRAME_INSET_Y_PX * unitsPerPx * 2,
  )
  const viewMinX = cx - viewW / 2
  const viewMinY = cy - viewH / 2

  /** Client coordinates → viewBox units, before the pan/zoom transform. */
  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect || !rect.width) return {x: 0, y: 0}
      return {
        x: ((clientX - rect.left) / rect.width) * viewW + viewMinX,
        y: ((clientY - rect.top) / rect.height) * viewH + viewMinY,
      }
    },
    [viewW, viewH, viewMinX, viewMinY],
  )

  // Registered by hand rather than via onWheel: React's wheel listener is passive, so preventDefault()
  // from it is ignored and zooming the sky would scroll the page underneath at the same time.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = toLocal(e.clientX, e.clientY)
      setView((v) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * Math.exp(-e.deltaY / 500)))
        const k = next / v.scale
        // Keep whatever is under the cursor under the cursor.
        return {scale: next, tx: p.x - (p.x - v.tx) * k, ty: p.y - (p.y - v.ty) * k}
      })
    }
    el.addEventListener('wheel', onWheel, {passive: false})
    return () => el.removeEventListener('wheel', onWheel)
  }, [toLocal])

  /**
   * Panning starts here, and *only* here.
   *
   * Stars stop this event before it arrives (see their own `onPointerDown`), so pressing a star can
   * never begin a drag — which is what made tapping one on a phone so unreliable: the press was
   * simultaneously the start of a pan, and any slight movement of the finger dragged the whole sky
   * out from under the tap.
   */
  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY})
    pressOrigin.current = {x: e.clientX, y: e.clientY, moved: false}
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY})
    const pts = [...pointers.current.values()]

    if (pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (!pinch.current) pinch.current = {dist, scale: view.scale}
      else {
        const ratio = dist / (pinch.current.dist || 1)
        setView((v) => ({
          ...v,
          scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, (pinch.current?.scale ?? 1) * ratio)),
        }))
      }
      return
    }

    const origin = pressOrigin.current
    if (origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > DRAG_SLOP) {
      origin.moved = true
    }

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect?.width) return
    const perPx = viewW / rect.width
    setView((v) => ({
      ...v,
      tx: v.tx + (e.clientX - prev.x) * perPx,
      ty: v.ty + (e.clientY - prev.y) * perPx,
    }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null

    // A press on empty sky that did not become a drag is a dismissal — the ordinary way out of an
    // open card, and the only one available on a phone once tapping a star pins it.
    const origin = pressOrigin.current
    pressOrigin.current = null
    if (origin && !origin.moved) {
      setPinned(null)
      setHovered(null)
    }
  }

  // Above the early return: hook order cannot depend on whether the tree came back.
  const stars = useMemo(() => {
    const rand = mulberry32(0x5eed)
    return Array.from({length: 110}, () => ({
      x: (rand() - 0.5) * 2,
      y: (rand() - 0.5) * 2,
      r: 0.35 + rand() * 1.15,
      o: 0.12 + rand() * 0.4,
      delay: rand() * 6,
    }))
  }, [])

  if (!sky || !full) return null

  const {all, root} = sky
  const showDrift = !reduced && all.length <= DRIFT_LIMIT

  // Faces go to the stars first, then to whatever is nearest the centre. `all` is in depth-first
  // order, so without this one deep branch would eat the whole budget and the people around the
  // middle — the ones a member actually recognises — would come out as anonymous dots. Members who
  // brought someone outrank those who did not at the same depth: they are the ones the drawing is
  // organised around, and the ones worth being able to identify at a glance.
  const withAvatar = new Set(
    [...all]
      .sort((a, b) => {
        const star = (n: ConstellationNode) => (n.children.length ? 0 : 1)
        return star(a) - star(b) || a.depth - b.depth
      })
      .slice(0, AVATAR_BUDGET)
      .map((n) => n.node.id),
  )

  // A pin outranks a hover: once a card is clicked open, drifting the mouse over other stars must not
  // swap it out from under the cursor that is on its way to a link.
  const selectedId = pinned ?? hovered
  const selectedNode = selectedId ? sky.byId.get(selectedId) : undefined
  const trail = trailTo(full, root.node.id)

  // Node centre in viewBox units after the pan/zoom transform, as a percentage of the box — which is
  // how the HTML tooltip above the SVG finds its anchor without duplicating the transform maths.
  const anchor = (n: ConstellationNode) => {
    // Post-rotation, since that is the space the pan/zoom transform and the viewBox both live in.
    const rx = n.x * spin.cos - n.y * spin.sin
    const ry = n.x * spin.sin + n.y * spin.cos
    return {
      left: `${(((rx * view.scale + view.tx - viewMinX) / viewW) * 100).toFixed(3)}%`,
      top: `${(((ry * view.scale + view.ty - viewMinY) / viewH) * 100).toFixed(3)}%`,
    }
  }

  return (
    // In fill mode nothing may contribute height: the sky is pinned to the frame and everything else
    // floats over it. A trail rendered above the sky would push it down by its own height, which is
    // exactly the scroll the full-screen page must not have.
    //
    // Pinned with `absolute inset-0` rather than `h-full`, which looks equivalent and is not: a
    // percentage height resolves against the parent's *specified* height, and the parent here is a
    // flex item whose height is `auto` until flex layout gives it one. On the desktop grid path it
    // happens to resolve; on the mobile flex path it collapses to zero and the sky disappears
    // entirely. Absolute positioning asks the parent for its edges instead, which it always has.
    <div className={clsx('cn-wrap', fill && 'absolute inset-0', className)}>
      <style>{constellationStyles}</style>

      {trail.length > 1 && (
        <div
          className={clsx(
            'text-ink-500 flex flex-wrap items-center gap-1 text-sm',
            fill ? 'absolute bottom-3 left-3 z-20 max-w-[60%]' : 'mb-2',
          )}
        >
          {trail.map((n, i) => (
            <span key={n.node.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-ink-300">›</span>}
              <button
                type="button"
                className={clsx(
                  'rounded px-1',
                  i === trail.length - 1
                    ? 'text-ink-900 font-medium'
                    : 'hover:text-ink-800 underline underline-offset-2',
                )}
                onClick={() => setFocusId(n.node.id)}
              >
                {i === 0 ? t('referrals.constellation.you', 'You') : n.node.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        ref={skyRef}
        className={clsx(
          'cn-sky overflow-hidden',
          fill ? 'absolute inset-0' : 'relative aspect-square w-full rounded-2xl',
        )}
      >
        <svg
          ref={svgRef}
          viewBox={`${viewMinX} ${viewMinY} ${viewW} ${viewH}`}
          className="h-full w-full touch-none select-none"
          role="img"
          aria-label={t(
            'referrals.constellation.aria',
            'A constellation of the {count} people on Compass because of you',
            {count: String(tree.stats.total)},
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <radialGradient id="cn-core">
              <stop offset="0%" stopColor="rgb(var(--cn-warm))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(var(--cn-warm))" stopOpacity="0" />
            </radialGradient>
            {all.map((n) =>
              withAvatar.has(n.node.id) ? (
                <clipPath key={n.node.id} id={`cn-c-${n.node.id}`}>
                  <circle cx="0" cy="0" r={nodeRadius(n.depth)} />
                </clipPath>
              ) : null,
            )}
          </defs>

          {/* Background sky. Outside the pan/zoom group on purpose: stars that slide with the graph
              read as more graph, and the depth cue disappears. */}
          <g className="cn-stars" aria-hidden="true">
            {stars.map((s, i) => (
              <circle
                key={i}
                cx={cx + s.x * viewW}
                cy={cy + s.y * viewH}
                r={s.r}
                opacity={s.o}
                className={reduced ? undefined : 'cn-twinkle'}
                style={reduced ? undefined : {animationDelay: `${s.delay}s`}}
              />
            ))}
          </g>

          <g
            transform={`translate(${view.tx} ${view.ty}) scale(${view.scale}) rotate(${spinDeg.toFixed(3)})`}
          >
            {/* One faint circle per star, drawn on the orbit its own invitees sit on. This is what
                makes a system read as a system rather than as a cluster that happens to be near each
                other — the ring says "these belong to that one". */}
            <g className="cn-rings" aria-hidden="true">
              {all.map((n) =>
                n.shellRadii.map((r, i) => (
                  <circle key={`${n.node.id}-${i}`} cx={n.x} cy={n.y} r={r} />
                )),
              )}
              {!root.children.length && <circle className="cn-ghost-ring" cx="0" cy="0" r={104} />}
            </g>

            <g className="cn-edges" aria-hidden="true">
              {all.map((n) =>
                n.parent ? (
                  <path
                    key={n.node.id}
                    d={edgePath(n.parent, n)}
                    strokeWidth={Math.max(0.5, 2.1 - n.depth * 0.35)}
                    opacity={Math.max(0.12, 0.5 - n.depth * 0.06)}
                  />
                ) : null,
              )}
            </g>

            {!reduced && (
              <g className="cn-flows" aria-hidden="true">
                {all.map((n, i) =>
                  n.parent && n.depth <= FLOW_MAX_DEPTH ? (
                    <path
                      key={n.node.id}
                      d={edgePath(n.parent, n)}
                      className="cn-flow"
                      style={{animationDelay: `${(i % 17) * 0.42}s`}}
                    />
                  ) : null,
                )}
              </g>
            )}

            {/* Halo behind the centre, sized to the member's *innermost* shell so the bloom stops
                where their invitees begin rather than washing over them. */}
            <circle cx="0" cy="0" r={(root.shellRadii[0] || 120) * 0.95} fill="url(#cn-core)" />
            {!reduced && (
              <>
                <circle className="cn-pulse" cx="0" cy="0" r={nodeRadius(0)} />
                <circle
                  className="cn-pulse"
                  cx="0"
                  cy="0"
                  r={nodeRadius(0)}
                  style={{animationDelay: '1.9s'}}
                />
              </>
            )}

            <g className="cn-nodes">
              {all.map((n, i) => {
                const r = nodeRadius(n.depth)
                const isRoot = n.depth === 0
                const isSelected = selectedId === n.node.id
                return (
                  <g
                    key={n.node.id}
                    transform={`translate(${n.x.toFixed(2)} ${n.y.toFixed(2)}) rotate(${(-spinDeg).toFixed(3)})`}
                  >
                    <g
                      className={clsx(showDrift && !isRoot && 'cn-drift')}
                      style={
                        showDrift && !isRoot
                          ? {
                              animationDelay: `${-(i % 23) * 0.71}s`,
                              animationDuration: `${7 + (i % 5)}s`,
                            }
                          : undefined
                      }
                    >
                      <circle
                        className={clsx('cn-star', isRoot && 'cn-star-root')}
                        r={r + (isRoot ? 4.5 : 2.6)}
                        opacity={isSelected ? 1 : undefined}
                      />
                      {withAvatar.has(n.node.id) ? (
                        <image
                          href={avatarFor(n.node)}
                          x={-r}
                          y={-r}
                          width={r * 2}
                          height={r * 2}
                          clipPath={`url(#cn-c-${n.node.id})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      ) : (
                        <circle className="cn-dot" r={r * 0.72} />
                      )}
                      <circle
                        className="cn-hit"
                        r={Math.max(r + 6, 13)}
                        // Swallowed so the sky below never sees it: a press on a star is a press on
                        // the star, not the beginning of a pan.
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => {
                          e.stopPropagation()
                          setPinned(isSelected && pinned ? null : n.node.id)
                        }}
                        // Hover is a mouse affordance only. On touch, `pointerenter` fires as part of
                        // the tap, and letting it open a card here would race the tap that pins one.
                        onPointerEnter={(e) => {
                          if (e.pointerType !== 'mouse') return
                          keepOpen()
                          setHovered(n.node.id)
                        }}
                        onPointerLeave={(e) => {
                          if (e.pointerType !== 'mouse') return
                          closeSoon()
                        }}
                      />
                    </g>
                  </g>
                )
              })}
            </g>
          </g>
        </svg>

        {selectedNode && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2"
            style={{...anchor(selectedNode), marginTop: '-8px'}}
          >
            <div
              className="bg-canvas-0 border-ink-200 pointer-events-auto w-52 -translate-y-full rounded-xl border p-3 shadow-lg"
              // Taking the pointer cancels the pending close, which is what makes the links inside
              // reachable; giving it back starts the close again unless the card was pinned open.
              onPointerEnter={keepOpen}
              onPointerLeave={closeSoon}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <div className="text-ink-900 truncate text-sm font-medium">
                {selectedNode.node.name}
              </div>
              <div className="text-ink-500 truncate text-xs">@{selectedNode.node.username}</div>
              <div className="text-ink-400 mt-1 text-xs">
                {t('referrals.constellation.joined', 'Joined {date}', {
                  date: new Date(selectedNode.node.joinedTime).toLocaleDateString(),
                })}
              </div>
              {selectedNode.descendants > 0 && (
                <div className="text-ink-600 mt-1 text-xs">
                  {t('referrals.constellation.brought', 'Brought {count} people', {
                    count: String(selectedNode.descendants),
                  })}
                </div>
              )}
              <div className="mt-2 flex gap-3 text-xs">
                <Link
                  href={`/${selectedNode.node.username}`}
                  className="text-primary-600 hover:text-primary-700 underline underline-offset-2"
                >
                  {t('referrals.constellation.view_profile', 'Profile')}
                </Link>
                {selectedNode.descendants > 0 && (
                  <button
                    type="button"
                    className="text-primary-600 hover:text-primary-700 underline underline-offset-2"
                    onClick={() => {
                      keepOpen()
                      setFocusId(selectedNode.node.id)
                    }}
                  >
                    {t('referrals.constellation.focus', 'Their sky')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {(view.scale !== 1 || view.tx !== 0 || view.ty !== 0) && (
          <button
            type="button"
            className="bg-canvas-0/80 text-ink-600 hover:text-ink-900 absolute bottom-3 right-3 rounded-lg px-2 py-1 text-xs backdrop-blur"
            onClick={() => setView(IDENTITY)}
          >
            {t('referrals.constellation.reset', 'Reset view')}
          </button>
        )}
      </div>

      {/* The same information as a document, for screen readers and for anyone who would rather read
          it. Hundreds of focusable stars would make a tab order nobody can escape; a list is what this
          actually is to assistive technology. */}
      <ul className="sr-only">
        {all.map((n) => (
          <li key={n.node.id}>
            <Link href={`/${n.node.username}`}>{n.node.name}</Link>
            {n.parent
              ? ` — ${t('referrals.constellation.brought_by', 'brought by {name}', {
                  name: n.parent.node.name,
                })}`
              : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

const constellationStyles = `
.cn-wrap{
  /* light — the sky as dusk over cream, so it still sits inside a warm page */
  --cn-sky1:#efe7db; --cn-sky2:#e2d6c4;
  --cn-line:133 80 34;   /* primary-700 */
  --cn-warm:193 127 62;  /* primary-500 */
  --cn-star:255 255 255;
  --cn-dot:166 104 46;   /* primary-600 */
  --cn-ring:133 80 34;
}
.dark .cn-wrap{
  --cn-sky1:#241E15; --cn-sky2:#14110c;
  --cn-line:220 171 113; /* primary-300 */
  --cn-warm:220 171 113;
  --cn-star:247 244 239;
  --cn-dot:232 201 157;  /* primary-200 */
  --cn-ring:232 201 157;
}
.cn-sky{background:radial-gradient(120% 100% at 50% 45%,var(--cn-sky1) 0%,var(--cn-sky2) 72%)}
.cn-stars circle{fill:rgb(var(--cn-star))}
.cn-rings circle{fill:none;stroke:rgb(var(--cn-ring)/.13);stroke-width:1}
.cn-ghost-ring{stroke-dasharray:5 9;stroke:rgb(var(--cn-ring)/.22)!important}
.cn-edges path{fill:none;stroke:rgb(var(--cn-line));stroke-linecap:round}
.cn-flows path{fill:none;stroke:rgb(var(--cn-warm)/.85);stroke-width:1.7;stroke-linecap:round;
  stroke-dasharray:5 460;animation:cn-travel 5.5s linear infinite}
.cn-star{fill:rgb(var(--cn-warm)/.30)}
.cn-star-root{fill:rgb(var(--cn-warm)/.55)}
.cn-dot{fill:rgb(var(--cn-dot))}
.cn-hit{fill:transparent;cursor:pointer}
.cn-nodes g:hover .cn-star{fill:rgb(var(--cn-warm)/.85)}
.cn-pulse{fill:none;stroke:rgb(var(--cn-warm)/.5);stroke-width:1.5;
  transform-origin:0 0;animation:cn-pulse 3.8s ease-out infinite}
@keyframes cn-travel{to{stroke-dashoffset:-465}}
@keyframes cn-pulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(3.1);opacity:0}}
@keyframes cn-twinkle{0%,100%{opacity:.15}50%{opacity:.55}}
.cn-twinkle{animation:cn-twinkle 4.5s ease-in-out infinite}
@keyframes cn-drift{0%{transform:translate(0,0)}25%{transform:translate(1.6px,-1.1px)}
  50%{transform:translate(0,-2px)}75%{transform:translate(-1.6px,-1.1px)}100%{transform:translate(0,0)}}
.cn-drift{animation:cn-drift 8s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){
  .cn-wrap *{animation:none!important}
}
`
