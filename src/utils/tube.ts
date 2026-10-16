// Deterministic pseudo-random values seeded by tube id, so lean/pattern/color
// offsets are stable across renders and reloads instead of flickering every
// second (the 1s countdown tick would otherwise make a true per-render
// random look like a glitch).
function seedFrom(id: number) {
  const x = Math.sin(id * 9973 + 13) * 10000
  return x - Math.floor(x)
}

export function tubeLean(id: number): number {
  // -4deg..4deg
  return (seedFrom(id) - 0.5) * 8
}

export function patternOffset(id: number): number {
  return seedFrom(id + 1) * 40
}

export interface TubeVariant {
  glowOp: number
  glowBlur: number
  haloOp: number
  haloBlur: number
  patternScale: number
  hue: number
  sheenAngle: number
  sheenOp: number
}

// 30 distinct "looks" (glow strength, halo, pattern density, a hue for the
// ambient glow, and a diagonal liquid sheen at its own angle/strength) so
// tubes read as individuals at a glance — in how the liquid itself looks,
// not just its glow — without breaking the tag-encoded pattern/cap meaning
// or the monochrome glass and liquid. Hue only tints the glow/halo/label
// edge, never the body/liquid/cap itself, so the piece still reads as
// monochrome overall, just with each tube carrying its own quiet identity.
const VARIANT_COUNT = 30
const VARIANTS: TubeVariant[] = Array.from({ length: VARIANT_COUNT }, (_, i) => {
  const hue = Math.round((i / VARIANT_COUNT) * 360)
  const s = seedFrom(i * 7 + 3)
  const s2 = seedFrom(i * 13 + 41)
  return {
    hue,
    glowOp: 0.3 + s * 0.55, // 0.3–0.85, never fully invisible
    glowBlur: 6 + s * 18,
    haloOp: 0.12 + (1 - s) * 0.35,
    haloBlur: 10 + (1 - s) * 22,
    patternScale: 0.65 + ((i * 37) % 10) / 10,
    sheenAngle: Math.round(30 + s2 * 150),
    sheenOp: 0.05 + s2 * 0.16,
  }
})

export function tubeVariant(id: number): TubeVariant {
  const idx = Math.floor(seedFrom(id + 5) * VARIANTS.length)
  return VARIANTS[Math.min(idx, VARIANTS.length - 1)]
}

/** 0 = fresh, 1 = fully aged (fogged, evaporated, sediment, peeling label). */
export function agingFactor(hangStart: number): number {
  const hours = (Date.now() - hangStart) / 36e5
  return Math.max(0, Math.min(1, hours / 72))
}

/** Liquid fill height as a fraction of the tube, evaporating down with age. */
export function liquidLevel(aging: number): number {
  return 0.82 - aging * 0.3
}

export const MS_PER_DAY = 86400000
/** A full tube now represents a month of queued time, not a single task's
 * own setting — so a 3-day task visibly shows far less full than a 25-day
 * one, and a backlog of several timed tasks can fill a tube on its own. */
export const MAX_DAYS = 30

export function ownRemainingMs(expiresAt: number): number {
  return expiresAt - Date.now()
}

interface QueueableTask {
  id: number
  daysTotal: number | null
  expiresAt: number | null
}

/**
 * The rack is a shared timeline, not independent deadlines: a task's
 * displayed remaining time is its own upper-bound estimate PLUS every timed
 * task ahead of it in queue order. Because this is recomputed fresh from
 * live state every tick:
 *  - finishing a task early removes its term from everything behind it
 *    immediately (its slot shrinks to what it actually took)
 *  - dragging a tube to a new position changes who's "ahead" of it, so the
 *    sums (and liquid levels) update on their own, no extra bookkeeping
 * `aheadMs` seeds the chain with time already committed ahead of the rack
 * (the active tube on the bench, if it has its own countdown).
 */
export function computeCumulativeMs(orderedRackTasks: QueueableTask[], aheadMs = 0): Map<number, number> {
  const result = new Map<number, number>()
  let running = aheadMs
  for (const task of orderedRackTasks) {
    if (task.daysTotal == null || task.expiresAt == null) continue
    running += ownRemainingMs(task.expiresAt)
    result.set(task.id, running)
  }
  return result
}

/** Fraction of the tube's 30-day scale that a given remaining-ms value fills.
 * Ticks continuously (not in daily steps) so the liquid visibly drains in
 * real time. 1 = at or past the 30-day cap, 0 = expired. */
export function fractionFromMs(ms: number): number {
  return Math.max(0, Math.min(1, ms / (MAX_DAYS * MS_PER_DAY)))
}

/** A literal countdown readout alongside the ambient liquid-level cue —
 * urgency shouldn't rely on the user eyeballing a fill line. */
export function countdownLabelFromMs(ms: number): string {
  if (ms <= 0) return 'expired'
  const mins = Math.ceil(ms / 60000)
  if (mins < 60) return `${mins}m left`
  const hours = Math.ceil(ms / 3600000)
  if (hours < 24) return `${hours}h left`
  const days = Math.ceil(ms / MS_PER_DAY)
  return `${days}d left`
}

export function expiredAgo(expiredAt: number): string {
  const ms = Date.now() - expiredAt
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function hungAgo(hangStart: number): string {
  const ms = Date.now() - hangStart
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'hung just now'
  if (mins < 60) return `hung ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hung ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `hung ${days}d ago`
}
