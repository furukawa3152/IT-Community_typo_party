import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

import type { PartyDb } from '@/lib/db'
import type { CommunityOption, RunRecord } from '@/lib/ranking'
import type { RunInput } from '@/lib/runs'

type Sql = NeonQueryFunction<false, false>

export async function createNeonPartyDb(url: string): Promise<PartyDb> {
  const sql = neon(url)
  await ensureSchema(sql)

  return {
    async insertRun(run) {
      await sql`
        with inserted as (
          insert into runs (
            community, community_key, player_name, player_key, elapsed_ms, hits, misses
          ) values (
            ${run.community},
            ${run.communityKey},
            ${run.playerName},
            ${run.playerKey},
            ${run.elapsedMs},
            ${run.hits},
            ${run.misses}
          )
          returning community_key, community
        )
        insert into communities (community_key, community)
        select community_key, community from inserted
        on conflict (community_key) do nothing
      `
    },
    async listRuns() {
      const rows = await sql`
        select community, community_key, player_name, player_key, elapsed_ms, hits, misses
        from runs
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
      created_at timestamptz not null default now()
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
