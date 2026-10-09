import { shuffle } from '@/lib/typing'
import { CODES, TERMS, type CodeLang, type Word } from '@/lib/words'

export const ROUND_SIZE = 20

/**
 * 1試合の内訳。用語12個とコード8行。
 * コードのうち Python 3行と HTML 2行は必ず入れ、残り3行はほかの言語も含めて無作為に引く。
 * 内訳が毎回同じなので、引いたお題による有利不利は小さい。
 */
export const TERM_COUNT = 12
export const CODE_QUOTA: Readonly<Partial<Record<CodeLang, number>>> = { Python: 3, HTML: 2 }
export const CODE_COUNT = ROUND_SIZE - TERM_COUNT

function take(words: readonly Word[], size: number, label: string): Word[] {
  if (words.length < size) throw new Error(`need at least ${size} ${label}`)
  return shuffle(words).slice(0, size)
}

export function pickRound(
  terms: readonly Word[] = TERMS,
  codes: readonly Word[] = CODES,
): Word[] {
  const pickedCodes: Word[] = []
  for (const [lang, size] of Object.entries(CODE_QUOTA) as [CodeLang, number][]) {
    pickedCodes.push(...take(codes.filter((code) => code.lang === lang), size, lang))
  }
  const rest = codes.filter((code) => !pickedCodes.includes(code))
  pickedCodes.push(...take(rest, CODE_COUNT - pickedCodes.length, 'codes'))

  return shuffle([...take(terms, TERM_COUNT, 'terms'), ...pickedCodes])
}
