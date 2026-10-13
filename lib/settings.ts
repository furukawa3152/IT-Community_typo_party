import { DEFAULT_ROUND_SIZE, isRoundSize } from '@/lib/round'

/** 会場全体で共有する設定。データベースに入る */
export type PartySettings = {
  /** 1試合の問題数 */
  roundSize: number
}

export const DEFAULT_SETTINGS: PartySettings = { roundSize: DEFAULT_ROUND_SIZE }

export function parseSettings(input: unknown): PartySettings | null {
  if (!input || typeof input !== 'object') return null
  const roundSize = (input as Record<string, unknown>).roundSize
  if (!isRoundSize(roundSize)) return null
  return { roundSize }
}

/** データベースに残った値を読む。壊れていれば既定値に戻す */
export function settingsFromStored(stored: Record<string, string>): PartySettings {
  const roundSize = Number(stored.round_size)
  return { roundSize: isRoundSize(roundSize) ? roundSize : DEFAULT_SETTINGS.roundSize }
}

export function settingsToStored(settings: PartySettings): Record<string, string> {
  return { round_size: String(settings.roundSize) }
}
