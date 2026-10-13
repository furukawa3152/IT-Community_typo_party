/**
 * 入力判定。お題は1文字が1単位で、書いてある文字だけを受け付ける。
 * 用語は英字の大文字小文字を区別せず、コードは区別する（normalizeKey）。
 */

export type TypingUnit = {
  source: string
  candidates: readonly string[]
}

export type TypingState = {
  unit: number
  prefix: string
}

export const INITIAL_STATES: readonly TypingState[] = [{ unit: 0, prefix: '' }]

/** 1文字が1単位で、書いてある文字だけを受け付ける。 */
export function buildLiteralUnits(text: string): TypingUnit[] {
  return [...text].map((char) => ({ source: char, candidates: [char] }))
}

export function unitsFor(word: { keys: string }): TypingUnit[] {
  return buildLiteralUnits(word.keys)
}

/**
 * KeyboardEvent.key を判定用の1文字にする。打てない入力は null。
 * 用語は英字を小文字にそろえ、空白とハイフンだけ通す。大文字で打っても正解になる。
 * コードは半角の表示文字をすべて、大文字小文字もそのまま通す。
 */
export function normalizeKey(key: string, literal: boolean): string | null {
  if (literal) return /^[\x20-\x7e]$/.test(key) ? key : null
  if (key === ' ' || key === '-') return key
  if (/^[a-z]$/.test(key)) return key
  if (/^[A-Z]$/.test(key)) return key.toLowerCase()
  return null
}

export function advanceStates(
  units: readonly TypingUnit[],
  states: readonly TypingState[],
  key: string,
): TypingState[] {
  const next: TypingState[] = []
  const seen = new Set<string>()

  for (const state of states) {
    const candidates = units[state.unit]?.candidates
    if (!candidates) continue
    const prefix = state.prefix + key

    for (const candidate of candidates) {
      let advanced: TypingState | null = null
      if (candidate === prefix) {
        advanced = { unit: state.unit + 1, prefix: '' }
      } else if (candidate.startsWith(prefix)) {
        advanced = { unit: state.unit, prefix }
      }
      if (!advanced) continue

      const id = `${advanced.unit}:${advanced.prefix}`
      if (seen.has(id)) continue
      seen.add(id)
      next.push(advanced)
    }
  }

  return next
}

export function isWordComplete(
  units: readonly TypingUnit[],
  states: readonly TypingState[],
): boolean {
  return states.some((state) => state.unit >= units.length)
}

export function typedLength(
  units: readonly TypingUnit[],
  states: readonly TypingState[],
): number {
  let max = 0

  for (const state of states) {
    let length = 0
    for (let index = 0; index < state.unit && index < units.length; index += 1) {
      length += units[index].source.length
    }
    const current = units[state.unit]
    if (current) {
      length += Math.min(state.prefix.length, current.source.length)
    }
    max = Math.max(max, length)
  }

  return max
}

export type Stats = {
  hits: number
  misses: number
  elapsedMs: number
}

export type Result = {
  accuracy: number
  kpm: number
}

export function calcResult(stats: Stats): Result {
  const attempts = stats.hits + stats.misses
  const accuracy = attempts === 0 ? 100 : (stats.hits / attempts) * 100
  const minutes = stats.elapsedMs / 60_000
  const kpm = minutes <= 0 ? 0 : stats.hits / minutes

  return {
    accuracy: Math.round(accuracy * 10) / 10,
    kpm: Math.round(kpm),
  }
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
