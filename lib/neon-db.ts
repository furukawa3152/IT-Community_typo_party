import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

import type { PartyDb } from '@/lib/db'
import type { CommunityOption, RunRecord } from '@/lib/ranking'
import type { RunInput } from '@/lib/runs'
import { settingsFromStored, settingsToStored } from '@/lib/settings'

type Sql = NeonQueryFunction<false, false>

export async function createNeonPartyDb(url: string): Promise<PartyDb> {
  const sql = neon(url)
  await ensureSchema(sql)

  return {
    async insertRun(run) {
      await sql`
        with inserted as (
          insert into runs (
            community, community_key, player_name, player_key, elapsed_ms, hits, misses, round_size
          ) values (
            ${run.community},
            ${run.communityKey},
            ${run.playerName},
            ${run.playerKey},
            ${run.elapsedMs},
            ${run.hits},
            ${run.misses},
            ${run.roundSize}
          )
          returning community_key, community
        )
        insert into communities (community_key, community)
        select community_key, community from inserted
        on conflict (community_key) do nothing
      `
    },
    async listRuns(roundSize) {
      const rows = await sql`
        select community, community_key, player_name, player_key, elapsed_ms, hits, misses
        from runs
        where round_size = ${roundSize}
        order by id asc
      `
      return rows.map(toRun)
    },
    async rememberCommunity(community) {
      await sql`
        insert into communities (community_key, community)
        values (${community.communityKey}, ${community.community})
        on conflict (community_key) do nothing
      `
    },
    async listCommunities() {
      const rows = await sql`
        select community, community_key
        from communities
        order by id asc
      `
      return rows.map(toCommunity)
    },
    async getSettings() {
      const rows = await sql`select key, value from settings`
      const stored: Record<string, string> = {}
      for (const row of rows) stored[String(row.key)] = String(row.value)
      return settingsFromStored(stored)
    },
    async saveSettings(settings) {
      for (const [key, value] of Object.entries(settingsToStored(settings))) {
        await sql`
          insert into settings (key, value) values (${key}, ${value})
          on conflict (key) do update set value = excluded.value
        `
      }
    },
    async countAll() {
      const [row] = await sql`
        select
          (select count(*) from runs) as runs,
          (select count(*) from communities) as communities
      `
      return { runs: Number(row?.runs ?? 0), communities: Number(row?.communities ?? 0) }
    },
    async resetAll() {
      await sql`truncate table runs, communities restart identity`
    },
    close() {},
  }
}

async function ensureSchema(sql: Sql): Promise<void> {
  await sql`
    create table if not exists runs (
      id bigint generated always as identity primary key,
      community text not null,
      community_key text not null,
      player_name text not null,
      player_key text not null,
      elapsed_ms integer not null,
      hits integer not null,
      misses integer not null,
      round_size integer not null default 20,
      created_at timestamptz not null default now()
    )
  `
  // 問題数を設定できるようになる前の表には round_size がない。当時は20問だった
  await sql`alter table runs add column if not exists round_size integer not null default 20`
  await sql`
    create table if not exists settings (
      key text primary key,
      value text not null
    )
  `
  await sql`
    create table if not exists communities (
      id bigint generated always as identity primary key,
      community_key text not null unique,
      community text not null
    )
  `
  await sql`
    insert into communities (community_key, community)
    select distinct on (community_key) community_key, community
    from runs
    order by community_key, id asc
    on conflict (community_key) do nothing
  `
}

function toRun(row: Record<string, unknown>): RunRecord {
  return {
    community: String(row.community),
    communityKey: String(row.community_key),
    playerName: String(row.player_name),
    playerKey: String(row.player_key),
    elapsedMs: Number(row.elapsed_ms),
    hits: Number(row.hits),
    misses: Number(row.misses),
  }
}

function toCommunity(row: Record<string, unknown>): CommunityOption {
  return {
    community: String(row.community),
    communityKey: String(row.community_key),
  }
}
