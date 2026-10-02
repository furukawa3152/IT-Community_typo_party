import { parseIdentity } from '@/lib/ranking'

const MIN_ELAPSED_MS = 1
const MAX_ELAPSED_MS = 30 * 60 * 1000
const MAX_KEY_COUNT = 8_000

export type RunInput = {
  community: string
  communityKey: string
  playerName: string
  playerKey: string
  elapsedMs: number
  hits: number
  misses: number
}

export function parseRun(input: unknown): RunInput | null {
  if (!input || typeof input !== 'object') return null
  const body = input as Record<string, unknown>
  if (typeof body.community !== 'string' || typeof body.playerName !== 'string') return null

  const identity = parseIdentity(body.community, body.playerName)
  if (!identity) return null
  if (!Number.isInteger(body.elapsedMs)) return null
  if (!Number.isInteger(body.hits) || !Number.isInteger(body.misses)) return null

  const elapsedMs = body.elapsedMs as number
  const hits = body.hits as number
  const misses = body.misses as number
  if (elapsedMs < MIN_ELAPSED_MS || elapsedMs > MAX_ELAPSED_MS) return null
  if (hits < 1 || hits > MAX_KEY_COUNT) return null
  if (misses < 0 || misses > MAX_KEY_COUNT) return null

  return { ...identity, elapsedMs, hits, misses }
}
