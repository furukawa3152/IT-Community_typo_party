import { shuffle } from '@/lib/typing'
import { CODES, TERMS, type CodeLang, type Word } from '@/lib/words'

/** 設定画面で選べる問題数。既定は20問 */
export const DEFAULT_ROUND_SIZE = 20
export const MIN_ROUND_SIZE = 5
export const MAX_ROUND_SIZE = 50

/** 用語の割合。20問なら用語12個とコード8行 */
const TERM_RATIO = 12 / 20
/** コードのうち必ず入れる言語の割合。8行なら Python 3行と HTML 2行 */
const CODE_QUOTA_RATIO: Readonly<Partial<Record<CodeLang, number>>> = { Python: 3 / 8, HTML: 2 / 8 }

export type RoundPlan = {
  size: number
  terms: number
  codes: number
  quota: Partial<Record<CodeLang, number>>
}

export function isRoundSize(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_ROUND_SIZE &&
    value <= MAX_ROUND_SIZE
  )
}

/**
 * 1試合の内訳。問題数が変わっても、用語とコードの比率は 12:8 のまま。
 * コードのうち Python と HTML は 3:2:残り の比率で必ず入れ、残りはほかの言語も含めて無作為に引く。
 * 内訳が毎回同じなので、引いたお題による有利不利は小さい。
 */
export function planRound(size: number = DEFAULT_ROUND_SIZE): RoundPlan {
  if (!isRoundSize(size)) throw new Error(`round size must be ${MIN_ROUND_SIZE}-${MAX_ROUND_SIZE}`)
  const terms = Math.round(size * TERM_RATIO)
  const codes = size - terms
  const quota: Partial<Record<CodeLang, number>> = {}
  for (const [lang, ratio] of Object.entries(CODE_QUOTA_RATIO) as [CodeLang, number][]) {
    quota[lang] = Math.floor(codes * ratio)
  }
  return { size, terms, codes, quota }
}

function take(words: readonly Word[], size: number, label: string): Word[] {
  if (words.length < size) throw new Error(`need at least ${size} ${label}`)
  return shuffle(words).slice(0, size)
}

export function pickRound(
  size: number = DEFAULT_ROUND_SIZE,
  terms: readonly Word[] = TERMS,
  codes: readonly Word[] = CODES,
): Word[] {
  const plan = planRound(size)
  const pickedCodes: Word[] = []
  for (const [lang, count] of Object.entries(plan.quota) as [CodeLang, number][]) {
    pickedCodes.push(...take(codes.filter((code) => code.lang === lang), count, lang))
  }
  const rest = codes.filter((code) => !pickedCodes.includes(code))
  pickedCodes.push(...take(rest, plan.codes - pickedCodes.length, 'codes'))

  return shuffle([...take(terms, plan.terms, 'terms'), ...pickedCodes])
}
