import path from 'node:path'

import type { CommunityOption, RunRecord } from '@/lib/ranking'
import type { RunInput } from '@/lib/runs'
import type { PartySettings } from '@/lib/settings'

export type PartyDb = {
  insertRun: (run: RunInput) => Promise<void>
  /** 指定した問題数で打ち切った記録だけを返す */
  listRuns: (roundSize: number) => Promise<RunRecord[]>
  rememberCommunity: (community: CommunityOption) => Promise<void>
  listCommunities: () => Promise<CommunityOption[]>
  getSettings: () => Promise<PartySettings>
  saveSettings: (settings: PartySettings) => Promise<void>
  /** 記録とコミュニティ名の件数 */
  countAll: () => Promise<{ runs: number; communities: number }>
  /** 記録とコミュニティ名をすべて消す。設定は残す */
  resetAll: () => Promise<void>
  close: () => void
}

const globalForDb = globalThis as unknown as { partyDb?: Promise<PartyDb> }

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim()
  return url ? url : undefined
}

export function getPartyDb(): Promise<PartyDb> {
  if (!globalForDb.partyDb) {
    globalForDb.partyDb = openPartyDb().catch((error: unknown) => {
      globalForDb.partyDb = undefined
      throw error
    })
  }
  return globalForDb.partyDb
}

async function openPartyDb(): Promise<PartyDb> {
  const url = databaseUrl()
  if (url) {
    const { createNeonPartyDb } = await import('@/lib/neon-db')
    return createNeonPartyDb(url)
  }
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL が未設定です。v0 の Integrations で Neon を接続してください。')
  }
  const { createPartyDb } = await import('@/lib/sqlite-db')
  return createPartyDb(path.join(process.cwd(), 'data', 'party.sqlite'))
}
