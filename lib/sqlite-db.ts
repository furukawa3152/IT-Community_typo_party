import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import type { PartyDb } from '@/lib/db'
import type { RunInput } from '@/lib/runs'
import { settingsFromStored, settingsToStored } from '@/lib/settings'

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
    round_size integer not null default 20,
    created_at text not null default (datetime('now'))
  );

  create table if not exists communities (
    community_key text primary key,
    community text not null
  );

  create table if not exists settings (
    key text primary key,
    value text not null
  );

  insert or ignore into communities (community_key, community)
  select community_key, community from runs order by id asc
`

/** 問題数を設定できるようになる前のファイルには round_size がない。当時は20問だった */
function migrate(db: DatabaseSync) {
  const columns = db.prepare('pragma table_info(runs)').all().map((row) => String(row.name))
  if (columns.length > 0 && !columns.includes('round_size')) {
    db.exec('alter table runs add column round_size integer not null default 20')
  }
}

export function createPartyDb(filename: string): PartyDb {
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec('pragma journal_mode = wal')
  migrate(db)
  db.exec(SCHEMA)

  const insert = db.prepare(`
    insert into runs (
      community, community_key, player_name, player_key, elapsed_ms, hits, misses, round_size
    ) values (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const select = db.prepare(`
    select community, community_key, player_name, player_key, elapsed_ms, hits, misses
    from runs
    where round_size = ?
    order by id asc
  `)
  const remember = db.prepare(`
    insert or ignore into communities (community_key, community) values (?, ?)
  `)
  const selectCommunities = db.prepare(`
    select community, community_key from communities order by rowid asc
  `)
  const selectSettings = db.prepare('select key, value from settings')
  const upsertSetting = db.prepare(`
    insert into settings (key, value) values (?, ?)
    on conflict (key) do update set value = excluded.value
  `)
  const countRuns = db.prepare('select count(*) as n from runs')
  const countCommunities = db.prepare('select count(*) as n from communities')

  return {
    async insertRun(run: RunInput) {
      insert.run(
        run.community,
        run.communityKey,
        run.playerName,
        run.playerKey,
        run.elapsedMs,
        run.hits,
        run.misses,
        run.roundSize,
      )
      remember.run(run.communityKey, run.community)
    },
    async rememberCommunity(community) {
      remember.run(community.communityKey, community.community)
    },
    async listCommunities() {
      return selectCommunities.all().map((row) => ({
        community: String(row.community),
        communityKey: String(row.community_key),
      }))
    },
    async listRuns(roundSize) {
      return select.all(roundSize).map((row) => ({
        community: String(row.community),
        communityKey: String(row.community_key),
        playerName: String(row.player_name),
        playerKey: String(row.player_key),
        elapsedMs: Number(row.elapsed_ms),
        hits: Number(row.hits),
        misses: Number(row.misses),
      }))
    },
    async getSettings() {
      const stored: Record<string, string> = {}
      for (const row of selectSettings.all()) stored[String(row.key)] = String(row.value)
      return settingsFromStored(stored)
    },
    async saveSettings(settings) {
      for (const [key, value] of Object.entries(settingsToStored(settings))) {
        upsertSetting.run(key, value)
      }
    },
    async countAll() {
      return {
        runs: Number(countRuns.get()?.n ?? 0),
        communities: Number(countCommunities.get()?.n ?? 0),
      }
    },
    async resetAll() {
      db.exec('begin')
      try {
        db.exec('delete from runs; delete from communities;')
        db.exec('commit')
      } catch (error) {
        db.exec('rollback')
        throw error
      }
    },
    close() {
      db.close()
    },
  }
}
