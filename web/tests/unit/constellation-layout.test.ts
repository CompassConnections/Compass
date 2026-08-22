import {ReferralTreeNode} from 'common/referrals'
import {
  buildConstellation,
  ConstellationNode,
  edgePath,
  nodeRadius,
  trailTo,
} from 'web/components/referrals/constellation-layout'

/**
 * The layout is the part of the constellation with checkable answers. What matters is not where any
 * one star lands but that the arrangement holds together: nothing overlaps anything, every planet is
 * the same distance from its own star, a system stays inside the space reserved for it, and the same
 * tree lays out the same way twice.
 */

const node = (
  id: string,
  referrerId: string | null,
  depth: number,
  joined = '2024-01-01T00:00:00.000Z',
): ReferralTreeNode => ({
  id,
  name: id,
  username: id,
  avatarUrl: null,
  joinedTime: joined,
  referrerId,
  depth,
})

/** A tree where each node at depth d gets `branching[d]` children. */
const fanOut = (branching: number[]) => {
  const nodes = [node('r', null, 0)]
  let frontier = ['r']
  branching.forEach((n, i) => {
    const next: string[] = []
    for (const parent of frontier) {
      for (let k = 0; k < n; k++) {
        const id = `${parent}.${k}`
        next.push(id)
        nodes.push(node(id, parent, i + 1, `2024-0${i + 2}-0${k + 1}T00:00:00.000Z`))
      }
    }
    frontier = next
  })
  return nodes
}

/** The closest any two stars come to each other, minus the room the two of them need. */
const worstClearance = (all: ConstellationNode[]) => {
  let worst = Infinity
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const gap = Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y)
      worst = Math.min(worst, gap - nodeRadius(all[i].depth) - nodeRadius(all[j].depth))
    }
  }
  return worst
}

describe('buildConstellation', () => {
  it('returns null when the requested root is not in the tree', () => {
    expect(buildConstellation(fanOut([2]), 'nobody')).toBeNull()
  })

  it('lays out a lone member at the centre, orbiting nothing', () => {
    const c = buildConstellation([node('r', null, 0)], 'r')!
    expect(c.all).toHaveLength(1)
    expect(c.root.x).toBeCloseTo(0)
    expect(c.root.y).toBeCloseTo(0)
    expect(c.root.orbit).toBe(0)
    expect(c.root.descendants).toBe(0)
    // Still needs a box to draw into, or the empty sky collapses to a point.
    expect(c.bounds.maxX - c.bounds.minX).toBeCloseTo(nodeRadius(0) * 2, 6)
    expect(c.bounds.maxY - c.bounds.minY).toBeCloseTo(nodeRadius(0) * 2, 6)
  })

  it('puts a member who brought nobody in orbit and nothing in orbit of them', () => {
    const c = buildConstellation(fanOut([3]), 'r')!
    expect(c.root.orbit).toBeGreaterThan(0)
    for (const planet of c.root.children) {
      expect(planet.orbit).toBe(0)
      expect(planet.shells).toHaveLength(0)
      expect(planet.children).toHaveLength(0)
    }
  })

  it('seats every invitee on one of their star’s shells', () => {
    const c = buildConstellation(fanOut([4, 3, 2]), 'r')!
    for (const n of c.all) {
      if (!n.parent) continue
      const d = Math.hypot(n.x - n.parent.x, n.y - n.parent.y)
      const onAShell = n.parent.shellRadii.some((r) => Math.abs(r - d) < 1e-6)
      expect(onAShell).toBe(true)
    }
    // And the shells account for the children exactly once each.
    for (const n of c.all) {
      expect(n.shells.flat()).toHaveLength(n.children.length)
      expect(new Set(n.shells.flat())).toEqual(new Set(n.children))
      expect(n.shells).toHaveLength(n.shellRadii.length)
    }
  })

  it('spreads a crowd of planets over several radii instead of one thin ring', () => {
    // The point of shells: everyone at one radius means the ring is pushed out in proportion to how
    // many people are on it, and every face on it shrinks to a speck.
    const many = buildConstellation(fanOut([40]), 'r')!
    expect(many.root.shellRadii.length).toBeGreaterThan(1)
    // Strictly increasing outwards, and the innermost is well inside the outermost.
    for (let i = 1; i < many.root.shellRadii.length; i++) {
      expect(many.root.shellRadii[i]).toBeGreaterThan(many.root.shellRadii[i - 1])
    }
    expect(many.root.shellRadii[0]).toBeLessThan(many.root.orbit * 0.8)

    // And it is genuinely tighter than the one-ring arrangement it replaced: forty planets at a
    // single radius would need a circumference of forty pitches.
    const onePitch = nodeRadius(1) * 2
    expect(many.root.orbit).toBeLessThan((40 * onePitch) / (Math.PI * 2))

    // A handful still gets a single shell — nothing to gain from splitting three ways.
    expect(buildConstellation(fanOut([3]), 'r')!.root.shellRadii).toHaveLength(1)
  })

  it('puts members who brought someone on the outermost shell, alone', () => {
    // They carry the widest discs, so sharing a shell with planets would cost a radial gap the width
    // of a whole sub-system for every planet on it — and outermost is where there is room around them
    // for the people they brought.
    const nodes = [node('r', null, 0)]
    for (let i = 0; i < 12; i++) nodes.push(node(`p${i}`, 'r', 1))
    for (const id of ['sA', 'sB']) {
      nodes.push(node(id, 'r', 1))
      for (let k = 0; k < 5; k++) nodes.push(node(`${id}.${k}`, id, 2))
    }

    const c = buildConstellation(nodes, 'r')!
    const outermost = c.root.shells[c.root.shells.length - 1]
    expect(outermost.map((n) => n.node.id).sort()).toEqual(['sA', 'sB'])
    for (const shell of c.root.shells.slice(0, -1)) {
      expect(shell.every((n) => n.children.length === 0)).toBe(true)
    }
  })

  it('gives a member who invited others a wider orbit than one who invited nobody', () => {
    // The point of the whole arrangement: bringing people earns you room to show them.
    const nodes = [node('r', null, 0), node('star', 'r', 1), node('planet', 'r', 1)]
    for (let i = 0; i < 6; i++) nodes.push(node(`s${i}`, 'star', 2))

    const c = buildConstellation(nodes, 'r')!
    const star = c.byId.get('star')!
    const planet = c.byId.get('planet')!
    expect(star.orbit).toBeGreaterThan(0)
    expect(planet.orbit).toBe(0)
    // And the star's system is reserved enough extra room over the bare planet to actually hold the
    // people in it — at least another invitee's width.
    expect(star.discR - planet.discR).toBeGreaterThan(nodeRadius(2) * 2)
  })

  it('never overlaps two members', () => {
    const c = buildConstellation(fanOut([6, 4, 3]), 'r')!
    expect(worstClearance(c.all)).toBeGreaterThan(0)
  })

  it('never overlaps on a lopsided tree, where a few members brought almost everyone', () => {
    // The shape that broke the old ring layout: many direct referrals, most of whom brought nobody,
    // a handful of whom brought a crowd. Under rings the crowd had to fit in the same narrow wedge as
    // a lone planet and overlapped badly; here each of them is simply given an orbit of their own.
    const nodes = [node('r', null, 0)]
    for (let i = 0; i < 41; i++) {
      nodes.push(
        node(`d${i}`, 'r', 1, `2024-02-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`),
      )
      if (i % 7 === 0) {
        for (let k = 0; k < 12; k++) {
          nodes.push(node(`d${i}.${k}`, `d${i}`, 2))
          if (k % 4 === 0) nodes.push(node(`d${i}.${k}.0`, `d${i}.${k}`, 3))
        }
      }
    }

    const c = buildConstellation(nodes, 'r')!
    expect(c.all).toHaveLength(1 + 41 + 6 * 12 + 6 * 3)
    expect(worstClearance(c.all)).toBeGreaterThan(0)
  })

  it('keeps every system inside the disc reserved for it', () => {
    // What makes the packing sound: a parent sizes its orbit from its children's `discR`, so if a
    // subtree ever escaped its own disc, two systems could collide without either being "too close"
    // by any local measure.
    const c = buildConstellation(fanOut([3, 3, 2]), 'r')!
    for (const n of c.all) {
      const walk = (d: ConstellationNode) => {
        const reach = Math.hypot(d.x - n.x, d.y - n.y) + nodeRadius(d.depth)
        expect(reach).toBeLessThanOrEqual(n.discR + 1e-6)
        d.children.forEach(walk)
      }
      walk(n)
    }
  })

  it('counts descendants and leaves', () => {
    const c = buildConstellation(fanOut([2, 3]), 'r')!
    expect(c.root.descendants).toBe(2 + 6)
    expect(c.root.leaves).toBe(6)
    for (const child of c.root.children) {
      expect(child.descendants).toBe(3)
      expect(child.leaves).toBe(3)
    }
  })

  it('shrinks stars with depth, and never past the point of being clickable', () => {
    expect(nodeRadius(1)).toBeLessThan(nodeRadius(0))
    expect(nodeRadius(4)).toBeLessThan(nodeRadius(2))
    expect(nodeRadius(30)).toBeGreaterThanOrEqual(10)
  })

  it('is stable: the same tree lays out the same way twice, whatever order it arrives in', () => {
    const nodes = fanOut([3, 2])
    const a = buildConstellation(nodes, 'r')!
    const b = buildConstellation([...nodes].reverse(), 'r')!
    const key = (c: typeof a) =>
      [...c.all]
        .sort((x, y) => x.node.id.localeCompare(y.node.id))
        .map((n) => `${n.node.id}:${n.x.toFixed(4)},${n.y.toFixed(4)}`)
    expect(key(b)).toEqual(key(a))
  })

  it('re-centres on any member, dropping everyone who is not below them', () => {
    const c = buildConstellation(fanOut([2, 2]), 'r')!
    const branch = c.root.children[0].node.id

    const refocused = buildConstellation(fanOut([2, 2]), branch)!
    expect(refocused.root.node.id).toBe(branch)
    expect(refocused.root.depth).toBe(0)
    expect(refocused.root.x).toBeCloseTo(0)
    expect(refocused.all).toHaveLength(3) // the member plus the two they brought
    expect(refocused.all.every((n) => n.depth <= 1)).toBe(true)
  })

  it('reports the box the drawing actually uses, not the disc it reserved', () => {
    // The frame is built from these numbers, so slack here is dead sky on screen. The packing always
    // reserves more than it spends — `root.discR` is a worst case — and the bounds must be measured
    // from where the stars ended up instead.
    const c = buildConstellation(fanOut([5, 2]), 'r')!

    for (const n of c.all) {
      const r = nodeRadius(n.depth)
      expect(n.x - r).toBeGreaterThanOrEqual(c.bounds.minX - 1e-6)
      expect(n.x + r).toBeLessThanOrEqual(c.bounds.maxX + 1e-6)
      expect(n.y - r).toBeGreaterThanOrEqual(c.bounds.minY - 1e-6)
      expect(n.y + r).toBeLessThanOrEqual(c.bounds.maxY + 1e-6)
    }
    // Tight: some star is touching each edge.
    const touches = (edge: number, values: number[]) =>
      values.some((v) => Math.abs(v - edge) < 1e-6)
    expect(
      touches(
        c.bounds.minX,
        c.all.map((n) => n.x - nodeRadius(n.depth)),
      ),
    ).toBe(true)
    expect(
      touches(
        c.bounds.maxY,
        c.all.map((n) => n.y + nodeRadius(n.depth)),
      ),
    ).toBe(true)
    // And strictly smaller than the disc the packing set aside.
    expect(c.bounds.maxX - c.bounds.minX).toBeLessThan(c.root.discR * 2)
  })
})

describe('edgePath', () => {
  it('runs from the star to the planet and nowhere else', () => {
    const c = buildConstellation(fanOut([3, 2]), 'r')!
    for (const n of c.all) {
      if (!n.parent) continue
      const d = edgePath(n.parent, n)
      expect(d).toBe(
        `M${n.parent.x.toFixed(2)},${n.parent.y.toFixed(2)}L${n.x.toFixed(2)},${n.y.toFixed(2)}`,
      )
      expect(d).not.toMatch(/NaN|Infinity/)
    }
  })
})

describe('trailTo', () => {
  it('walks from the root down to the member', () => {
    const c = buildConstellation(fanOut([2, 2]), 'r')!
    const deep = c.all.find((n) => n.depth === 2)!
    const trail = trailTo(c, deep.node.id)
    expect(trail.map((n) => n.node.id)).toEqual(['r', deep.parent!.node.id, deep.node.id])
  })

  it('is just the root when asked for the root', () => {
    const c = buildConstellation(fanOut([2]), 'r')!
    expect(trailTo(c, 'r')).toHaveLength(1)
  })
})
