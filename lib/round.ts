import { shuffle } from '@/lib/typing'
import { WORDS, type Word } from '@/lib/words'

export const ROUND_SIZE = 20

export function pickRound(words: readonly Word[] = WORDS, size = ROUND_SIZE): Word[] {
  if (words.length < size) {
    throw new Error(`need at least ${size} words`)
  }
  return shuffle(words).slice(0, size)
}
