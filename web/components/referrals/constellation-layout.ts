import {ReferralTreeNode} from 'common/referrals'

/**
 * Turns a flat referral tree into nested star systems.
 *
 * The arrangement is a **balloon layout**: every member who brought someone is a star with their
 * invitees in a full circle around them, every member who brought nobody is a planet on somebody
 * else's circle, and a planet that later brings someone becomes a star of its own — pushed far enough
 * out that its system has room to exist.
 *
 * This replaced concentric generation rings, and the reason is space. Rings put "how many steps from
 * you" on the radius, which sounds like the meaningful axis and is not: nobody cares that a member is
 * four hops away, and paying for it means the whole drawing is hoops of empty sky with the interesting
 * structure squeezed onto them. Packing systems inside systems spends the area on the thing worth
 * seeing — who brought whom — and fills the frame at any aspect, because a disc of discs has no
 * preferred direction to run out of.
 *
 * Kept apart from the component because it is the part with answers that can be checked: given a tree,
 * does anything overlap, is every planet the same distance from its star, does the same tree lay out
 * the same way twice.
 */

const TAU = Math.PI * 2

/**
 * Drawn radius of a member's star, shrinking with depth.
 *
 * Continuous rather than a table of four, because the layout no longer has four rings — it nests as
 * deep as the tree goes. The floor stops a deep branch dwindling to something unclickable.
 */
export const nodeRadius = (depth: number) => Math.max(10, 36 * Math.pow(0.72, depth))

/**
 * Clearance between neighbouring systems, and between a star and its own planets.
 *
 * Carried as *half* of it on every disc, so that two systems the packing seats exactly tangent — which
 * is what a saturated orbit produces, and it is the common case — still end up a full `SYSTEM_PAD`
 * apart. Without the halo the solver is perfectly correct and the stars visibly touch.
 */
const SYSTEM_PAD = 10

/** Bisection steps when solving for an orbit. 48 is far past the point where the answer stops moving. */
const ORBIT_SOLVE_STEPS = 48

/**
 * Most shells a system will spread its planets over.
 *
 * Shells are what let a face be big enough to recognise. Everyone at one radius means a system's size
 * is set by how many people are in it — forty planets on one ring pushes that ring far enough out that
 * each of them is a speck. Spread over three, the same forty sit in a third of the circumference each,
 * the system is roughly a third as wide, and every face in it can be three times the size. Past four
 * the radial gaps between shells start costing more than the angular packing saves, which is why this
 * is a small number and why the count is searched rather than assumed.
 */
const MAX_SHELLS = 4

export type ConstellationNode = {
  node: ReferralTreeNode
  parent: ConstellationNode | null
  children: ConstellationNode[]
  /** Depth relative to the *drawn* root, which is not always the tree's root — see `buildConstellation`. */
  depth: number
  /** Bearing from this node's parent. The root points at twelve o'clock. */
  angle: number
  /** Absolute position; the drawn root sits at the origin. */
  x: number
  y: number
  /** This node's invitees, grouped into the shell each one sits on. Empty for a planet. */
  shells: ConstellationNode[][]
  /**
   * Base radius of each shell, innermost first — same length as `shells`. A child on shell `l` sits at
   * `shellBases[l] + its own discR`, so members of one shell are not all the same distance out.
   */
  shellBases: number[]
  /** Every distinct distance an invitee of this node sits at, sorted. What the faint circles are drawn on. */
  shellRadii: number[]
  /** Radius of the outermost shell, or zero for a planet — someone who brought nobody. */
  orbit: number
  /** Radius of the disc containing this node's entire system, from this node outward. */
  discR: number
  /** Everyone below this star, at any remove. Excludes itself. */
  descendants: number
  /** Leaves below this star, minimum 1. */
  leaves: number
}

export type Constellation = {
  root: ConstellationNode
  all: ConstellationNode[]
  byId: Map<string, ConstellationNode>
  /**
   * The box the drawing actually occupies, stars' own widths included.
   *
   * Not a radius about the origin, which is what this used to be, because the origin is the member at
   * the centre and the drawing is not centred on them: a couple of large systems off to one side pull
   * the whole composition that way. Framing to a radius crops nothing but leaves a crescent of dead
   * sky opposite them, and the picture sits smaller and off to one side for no reason.
   */
  bounds: {minX: number; minY: number; maxX: number; maxY: number}
  maxDepth: number
}

/**
 * The smallest base radius at which these systems fit side by side around a circle.
 *
 * Each member of a shell sits at `base + its own disc`, so its inner edge just grazes the base circle
 * and its *centre* is pushed out in proportion to how much it is carrying. That is what stops one
 * large sub-system dragging every small one out to its radius — which is what a single shared radius
 * does, and it leaves a ring of dead sky between the middle and the rim.
 *
 * The angular test is exact and does not care that the radii differ: a disc of radius `d` centred at
 * distance `r` is contained in the sector of width `2·asin(d/r)` about its own bearing, so wedges that
 * do not overlap belong to discs that do not overlap, whatever their distances. The total demanded
 * falls as the base grows, so a bisection finds the crossing.
 */
const solveShell = (discs: number[], minBase: number) => {
  const demand = (base: number) =>
    discs.reduce((sum, d) => sum + 2 * Math.asin(Math.min(1, d / (base + d))), 0)

  if (discs.length < 2 || demand(minBase) <= TAU) return minBase

  let lo = minBase
  let hi = Math.max(minBase, 1) * 2
  // Doubling is bounded rather than `while (true)`: a layout that hangs on some future tree is a
  // worse failure than one that is slightly tight.
  for (let i = 0; i < 40 && demand(hi) > TAU; i++) hi *= 2

  for (let i = 0; i < ORBIT_SOLVE_STEPS; i++) {
    const mid = (lo + hi) / 2
    if (demand(mid) > TAU) lo = mid
    else hi = mid
  }
  return hi
}

/**
 * Lay out the subtree rooted at `rootId`.
 *
 * `rootId` is a parameter rather than always `nodes[0]` because tapping a star re-draws the sky around
 * *that* member — the same maths, a different centre — which is how a member with three hundred
 * descendants can look at any one branch without a separate screen for it.
 */
export const buildConstellation = (
  nodes: ReferralTreeNode[],
  rootId: string,
): Constellation | null => {
  const raw = new Map(nodes.map((n) => [n.id, n]))
  const rootNode = raw.get(rootId)
  if (!rootNode) return null

  const childIds = new Map<string, ReferralTreeNode[]>()
  for (const n of nodes) {
    if (!n.referrerId) continue
    const siblings = childIds.get(n.referrerId)
    if (siblings) siblings.push(n)
    else childIds.set(n.referrerId, [n])
  }
  // Oldest first, id as the tiebreak. Any total order would lay out without overlap; this one is
  // stable across reloads (so the sky does not reshuffle) and reads clockwise in the order people
  // actually arrived.
  for (const siblings of childIds.values()) {
    siblings.sort((a, b) =>
      a.joinedTime === b.joinedTime
        ? a.id.localeCompare(b.id)
        : a.joinedTime < b.joinedTime
          ? -1
          : 1,
    )
  }

  const all: ConstellationNode[] = []
  const byId = new Map<string, ConstellationNode>()

  const build = (n: ReferralTreeNode, parent: ConstellationNode | null): ConstellationNode => {
    const laid: ConstellationNode = {
      node: n,
      parent,
      children: [],
      depth: parent ? parent.depth + 1 : 0,
      angle: -Math.PI / 2,
      x: 0,
      y: 0,
      shells: [],
      shellBases: [],
      shellRadii: [],
      orbit: 0,
      discR: 0,
      descendants: 0,
      leaves: 1,
    }
    all.push(laid)
    byId.set(n.id, laid)
    laid.children = (childIds.get(n.id) ?? []).map((c) => build(c, laid))
    if (laid.children.length) {
      laid.descendants = laid.children.reduce((s, c) => s + 1 + c.descendants, 0)
      laid.leaves = laid.children.reduce((s, c) => s + c.leaves, 0)
    }
    return laid
  }

  const root = build(rootNode, null)
  const maxDepth = all.reduce((m, n) => Math.max(m, n.depth), 0)

  // Bottom-up: how much room does each system need?
  //
  // A planet needs only its own star's width. A star needs shells wide enough to seat all of its
  // children's *systems* — not their stars — because a child that is itself a star arrives carrying
  // its whole retinue. That is the recursion in one sentence, and it is why the measure has to
  // complete before anything is placed.
  const measure = (n: ConstellationNode): number => {
    const r = nodeRadius(n.depth)
    const halo = SYSTEM_PAD / 2

    if (!n.children.length) {
      n.discR = r + halo
      return n.discR
    }

    n.children.forEach(measure)

    // Members who brought someone go on the outermost shell, and get it to themselves.
    //
    // Two reasons, and they agree. Theirs are the wide discs, so an inner shell would have to leave a
    // radial gap the width of an entire sub-system for every planet sharing it — the packing would be
    // paying for space nothing sits in. And it is the arrangement that means something: a member who
    // brought people is pushed outward, where there is room around them for the people they brought,
    // instead of being lost among the planets.
    const systems = n.children.filter((c) => c.children.length)
    const planets = n.children.filter((c) => !c.children.length)

    /** Lay the children out over `shellCount` planet shells and report how wide the result is. */
    const attempt = (shellCount: number) => {
      const shells: ConstellationNode[][] = []
      if (planets.length) {
        for (let l = 0; l < shellCount; l++) shells.push([])
        // Round-robin rather than in blocks, so each shell spans the whole join-time range and the
        // sweep still reads chronologically as it goes round.
        planets.forEach((p, i) => shells[i % shellCount].push(p))
      }
      if (systems.length) shells.push(systems)

      const bases: number[] = []
      const radii = new Set<number>()
      // The outer edge of everything placed so far, starting with the star at the centre.
      let outer = r + halo
      for (const shell of shells) {
        const discs = shell.map((c) => c.discR)
        // Seat the shell outside everything already placed. Clearing the previous shell *radially* is
        // what makes this safe without checking angles across shells: two things a full disc-width
        // apart in radius cannot touch whatever their bearings.
        const base = solveShell(discs, outer)
        bases.push(base)
        for (const d of discs) radii.add(base + d)
        outer = base + 2 * Math.max(...discs)
      }
      return {
        shells,
        bases,
        radii: [...radii].sort((a, b) => a - b),
        discR: outer + halo,
      }
    }

    // Search the shell count rather than deriving it. The trade is real in both directions — more
    // shells buy angular room and cost radial gaps — and where it balances depends on how many
    // children there are and how uneven their sizes are, which is exactly the sort of thing that is
    // easier to measure four times than to predict once.
    let best = attempt(1)
    const maxShells = Math.min(MAX_SHELLS, Math.max(planets.length, 1))
    for (let l = 2; l <= maxShells; l++) {
      const candidate = attempt(l)
      if (candidate.discR < best.discR) best = candidate
    }

    n.shells = best.shells
    n.shellBases = best.bases
    n.shellRadii = best.radii
    n.orbit = best.radii[best.radii.length - 1] ?? 0
    n.discR = best.discR
    return n.discR
  }
  measure(root)

  // Top-down: put everything where the measure says it fits.
  //
  // Each child takes the slice of its shell that its own system subtends; whatever is left over is
  // shared out evenly as spacing, which is what stops a shell with two things on it drawing them nose
  // to nose on one side of an otherwise empty circle.
  const place = (n: ConstellationNode, x: number, y: number, backBearing: number) => {
    n.x = x
    n.y = y

    n.shells.forEach((shell, l) => {
      const base = n.shellBases[l]
      const widths = shell.map((c) => 2 * Math.asin(Math.min(1, c.discR / (base + c.discR))))
      const slack = Math.max(0, TAU - widths.reduce((a, b) => a + b, 0))
      const gap = slack / shell.length

      // The sweep starts pointing back at the parent, so the edge arriving from it lands in a gap
      // rather than straight through a planet — offset per shell by a fraction of a slot, or every
      // shell would line its planets up on the same bearings and the system would read as spokes
      // instead of as a disc.
      let cursor = backBearing + ((l / n.shells.length) * TAU) / shell.length

      shell.forEach((child, i) => {
        cursor += gap / 2
        const angle = cursor + widths[i] / 2
        // Its own size sets how far out it goes: a member carrying a large system of their own is
        // pushed out to make room for it, while a lone planet stays near the shell's inner edge.
        const radius = base + child.discR
        child.angle = angle
        place(child, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, angle + Math.PI)
        cursor += widths[i] + gap / 2
      })
    })
  }
  place(root, 0, 0, -Math.PI / 2)

  // Measured from the drawn positions rather than taken from `root.discR`: the packing leaves slack,
  // and framing to the disc it *reserved* rather than the one it used would show a ring of dead sky.
  const bounds = all.reduce(
    (b, n) => {
      const r = nodeRadius(n.depth)
      return {
        minX: Math.min(b.minX, n.x - r),
        minY: Math.min(b.minY, n.y - r),
        maxX: Math.max(b.maxX, n.x + r),
        maxY: Math.max(b.maxY, n.y + r),
      }
    },
    {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity},
  )

  return {root, all, byId, bounds, maxDepth}
}

/**
 * The line from a star to one of its planets.
 *
 * Straight, now that the layout is systems rather than rings. The curved polar edges the ring layout
 * used were arcs between two concentric circles; between a star and something orbiting it there is no
 * arc to draw, and a curve would only obscure which star a planet belongs to — the single fact these
 * lines exist to carry.
 */
export const edgePath = (parent: ConstellationNode, child: ConstellationNode) =>
  `M${parent.x.toFixed(2)},${parent.y.toFixed(2)}L${child.x.toFixed(2)},${child.y.toFixed(2)}`

/** The chain from the tree's root down to a node, used for the "back to you" trail. */
export const trailTo = (constellation: Constellation, id: string): ConstellationNode[] => {
  const trail: ConstellationNode[] = []
  let cur = constellation.byId.get(id) ?? null
  while (cur) {
    trail.unshift(cur)
    cur = cur.parent
  }
  return trail
}
