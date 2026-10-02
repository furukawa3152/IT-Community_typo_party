import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import type { CommunityOption, RunRecord } from '@/lib/ranking'
import type { RunInput } from '@/lib/runs'

const SCHEMA = `
  create table if not exists runs (
    id integer primary key,
    community text not null,
    community_key text not null,
    player_name text not null,
    player_key text not null,
    elapsed_ms integer not null,
    hits integer not null,
    misses integer not null,
    created_at text not null default (datetime('now'))
  );

  create table if not exists communities (
    community_key text primary key,
    community text not null
  );

  insert or ignore into communities (community_key, community)
  select community_key, community from runs order by id asc
`

export type PartyDb = {
  insertRun: (run: RunInput) => void
  listRuns: () => RunRecord[]
  rememberCommunity: (community: CommunityOption) => void
  listCommunities: () => CommunityOption[]
  close: () => void
}

export function createPartyDb(filename: string): PartyDb {
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec('pragma journal_mode = wal')
  db.exec(SCHEMA)

  const insert = db.prepare(`
    insert into runs (
      community, community_key, player_name, player_key, elapsed_ms, hits, misses
    ) values (?, ?, ?, ?, ?, ?, ?)
  `)
  const select = db.prepare(`
    select community, community_key, player_name, player_key, elapsed_ms, hits, misses
    from runs
    order by id asc
  `)
  const remember = db.prepare(`
    insert or ignore into communities (community_key, community) values (?, ?)
  `)
  const selectCommunities = db.prepare(`
    select community, community_key from communities order by rowid asc
  `)

  return {
    insertRun(run) {
      insert.run(
        run.community,
        run.communityKey,
        run.playerName,
        run.playerKey,
        run.elapsedMs,
        run.hits,
        run.misses,
      )
      remember.run(run.communityKey, run.community)
    },
    rememberCommunity(community) {
      remember.run(community.communityKey, community.community)
    },
    listCommunities() {
      return selectCommunities.all().map((row) => ({
        community: String(row.community),
        communityKey: String(row.community_key),
      }))
    },
    listRuns() {
      return select.all().map((row) => ({
        community: String(row.community),
        communityKey: String(row.community_key),
        playerName: String(row.player_name),
        playerKey: String(row.player_key),
        elapsedMs: Number(row.elapsed_ms),
        hits: Number(row.hits),
        misses: Number(row.misses),
      }))
    },
    close() {
      db.close()
    },
  }
}

const globalForDb = globalThis as unknown as { partyDb?: PartyDb }

export function getPartyDb(): PartyDb {
  if (!globalForDb.partyDb) {
    globalForDb.partyDb = createPartyDb(path.join(process.cwd(), 'data', 'party.sqlite'))
  }
  return globalForDb.partyDb
}
