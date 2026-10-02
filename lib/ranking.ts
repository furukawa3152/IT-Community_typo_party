export type RunRecord = {
  community: string
  communityKey: string
  playerName: string
  playerKey: string
  elapsedMs: number
  hits: number
  misses: number
}

export type CommunityRank = {
  rank: number
  community: string
  communityKey: string
  members: number
  /** そのコミュニティで一番速い人の自己ベスト */
  bestMs: number
}

export type PlayerRank = {
  rank: number
  community: string
  playerName: string
  bestMs: number
  communityKey: string
  playerKey: string
}

export type Rankings = {
  communities: CommunityRank[]
  players: PlayerRank[]
}

const LABEL_MAX = 40

export function cleanLabel(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}

export function normalizeKey(value: string): string {
  return cleanLabel(value).toLocaleLowerCase('ja-JP')
}

export type CommunityOption = {
  community: string
  communityKey: string
}

export function parseCommunityName(value: string): CommunityOption | null {
  const community = cleanLabel(value)
  if (community.length === 0 || community.length > LABEL_MAX) return null
  return { community, communityKey: normalizeKey(community) }
}

export function parseIdentity(community: string, playerName: string): {
  community: string
  communityKey: string
  playerName: string
  playerKey: string
} | null {
  const communityName = parseCommunityName(community)
  const name = parseCommunityName(playerName)
  if (!communityName || !name) return null
  return {
    community: communityName.community,
    communityKey: communityName.communityKey,
    playerName: name.community,
    playerKey: name.communityKey,
  }
}

type Best = {
  community: string
  communityKey: string
  playerName: string
  playerKey: string
  bestMs: number
}

function personalBests(runs: readonly RunRecord[]): Best[] {
  const map = new Map<string, Best>()

  for (const run of runs) {
    const id = `${run.communityKey}\t${run.playerKey}`
    const current = map.get(id)
    if (!current || run.elapsedMs < current.bestMs) {
      map.set(id, {
        community: run.community,
        communityKey: run.communityKey,
        playerName: run.playerName,
        playerKey: run.playerKey,
        bestMs: run.elapsedMs,
      })
    }
  }

  return [...map.values()]
}

/**
 * コミュニティ順位は、その中で一番速い人の自己ベスト。速い方が上。
 * 個人順位も自己ベスト。同タイムは名前順。
 */
export function buildRankings(runs: readonly RunRecord[]): Rankings {
  const bests = personalBests(runs)

  const players = [...bests].sort((a, b) => {
    if (a.bestMs !== b.bestMs) return a.bestMs - b.bestMs
    return a.playerName.localeCompare(b.playerName, 'ja')
  })

  const byCommunity = new Map<string, { community: string; bestMs: number; members: number }>()
  for (const best of bests) {
    const bucket = byCommunity.get(best.communityKey)
    if (!bucket) {
      byCommunity.set(best.communityKey, {
        community: best.community,
        bestMs: best.bestMs,
        members: 1,
      })
      continue
    }
    bucket.members += 1
    if (best.bestMs < bucket.bestMs) {
      bucket.bestMs = best.bestMs
      bucket.community = best.community
    }
  }

  const communities = [...byCommunity.entries()]
    .map(([key, bucket]) => ({
      key,
      community: bucket.community,
      members: bucket.members,
      bestMs: bucket.bestMs,
    }))
    .sort((a, b) => {
      if (a.bestMs !== b.bestMs) return a.bestMs - b.bestMs
      return a.community.localeCompare(b.community, 'ja')
    })

  return {
    communities: communities.map((entry, index) => ({
      rank: index + 1,
      community: entry.community,
      communityKey: entry.key,
      members: entry.members,
      bestMs: entry.bestMs,
    })),
    players: players.map((entry, index) => ({
      rank: index + 1,
      community: entry.community,
      playerName: entry.playerName,
      bestMs: entry.bestMs,
      communityKey: entry.communityKey,
      playerKey: entry.playerKey,
    })),
  }
}
