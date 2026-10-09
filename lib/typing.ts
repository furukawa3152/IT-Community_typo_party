/**
 * 入力判定は furukawa-family-typo-quest の lib/typing.ts を移したもの。
 * 「ん」の n / nn、し の shi / si、促音の子音違いを同じ単位として受け付ける。
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

const VOWELS_AND_Y = 'aiueoy'

const SPELLING_GROUPS: readonly (readonly string[])[] = [
  ['shi', 'si'],
  ['chi', 'ti'],
  ['tsu', 'tu'],
  ['ji', 'zi'],
  ['fu', 'hu'],
  ['sha', 'sya'],
  ['shu', 'syu'],
  ['sho', 'syo'],
  ['she', 'sye'],
  ['cha', 'tya', 'cya'],
  ['chu', 'tyu', 'cyu'],
  ['cho', 'tyo', 'cyo'],
  ['che', 'tye', 'cye'],
  ['ja', 'jya', 'zya'],
  ['ju', 'jyu', 'zyu'],
  ['jo', 'jyo', 'zyo'],
  ['je', 'jye', 'zye'],
]

const SPELLINGS: ReadonlyMap<string, readonly string[]> = new Map(
  SPELLING_GROUPS.flatMap((group) => group.map((spelling) => [spelling, group])),
)

const MAX_SPELLING_LENGTH = Math.max(
  ...SPELLING_GROUPS.flatMap((group) => group.map((spelling) => spelling.length)),
)

export function isSyllabicN(romaji: string, index: number): boolean {
  if (romaji[index] !== 'n') return false
  const next = romaji[index + 1]
  return next === undefined || !VOWELS_AND_Y.includes(next)
}

export function endsWithSyllabicN(romaji: string): boolean {
  return isSyllabicN(romaji, romaji.length - 1)
}

function matchSpelling(romaji: string, index: number): TypingUnit | null {
  for (let length = MAX_SPELLING_LENGTH; length >= 2; length -= 1) {
    const source = romaji.slice(index, index + length)
    const candidates = SPELLINGS.get(source)
    if (candidates) return { source, candidates }
  }
  return null
}

function expandSokuon(units: readonly TypingUnit[]): TypingUnit[] {
  return units.map((unit, index) => {
    const next = units[index + 1]
    if (!next) return unit
    if (unit.source.length !== 1 || unit.candidates.length !== 1) return unit
    if (VOWELS_AND_Y.includes(unit.source) || unit.source === 'n') return unit
    if (!next.candidates.some((candidate) => candidate.startsWith(unit.source))) return unit

    const heads = [...new Set(next.candidates.map((candidate) => candidate[0]))]
    return { source: unit.source, candidates: heads }
  })
}

export function buildUnits(romaji: string): TypingUnit[] {
  const units: TypingUnit[] = []

  for (let index = 0; index < romaji.length; ) {
    const matched = matchSpelling(romaji, index)
    if (matched) {
      units.push(matched)
      index += matched.source.length
      continue
    }

    const char = romaji[index]
    units.push({
      source: char,
      candidates: isSyllabicN(romaji, index) ? ['n', 'nn'] : [char],
    })
    index += 1
  }

  return expandSokuon(units)
}

/** コード用。1文字が1単位で、書いてある文字だけを受け付ける。 */
export function buildLiteralUnits(text: string): TypingUnit[] {
  return [...text].map((char) => ({ source: char, candidates: [char] }))
}

export function unitsFor(word: { keys: string; lang?: string }): TypingUnit[] {
  return word.lang ? buildLiteralUnits(word.keys) : buildUnits(word.keys)
}

/** 打ち終えたあと、余分な n を1回だけ見逃すか。ローマ字の「ん」で終わる用語だけ */
export function allowsTrailingN(word: { keys: string; lang?: string }): boolean {
  return !word.lang && endsWithSyllabicN(word.keys)
}

/**
 * KeyboardEvent.key を判定用の1文字にする。打てない入力は null。
 * 用語は英字を小文字にそろえ、空白とハイフンだけ通す。
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
