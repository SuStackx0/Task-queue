// Deterministic pseudo-random values seeded by ticket id, so rotation/jitter
// is stable across renders and reloads instead of re-randomizing.
function seedFrom(id: number) {
  let x = Math.sin(id * 9973 + 13) * 10000
  return x - Math.floor(x)
}

export function ticketRotation(id: number): number {
  // -3deg..3deg
  return (seedFrom(id) - 0.5) * 6
}

export function ticketJitter(id: number): number {
  // small horizontal offset for a hand-clipped look, -2px..2px
  return (seedFrom(id + 1) - 0.5) * 4
}

/** 0 = fresh paper, 1 = fully aged (yellowed, curled, drooping). */
export function agingFactor(hangStart: number): number {
  const hours = (Date.now() - hangStart) / 36e5
  // ramps up over ~72 hours, caps at 1
  return Math.max(0, Math.min(1, hours / 72))
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
