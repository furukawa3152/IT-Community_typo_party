import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'vitest'

import { createPartyDb } from '@/lib/db'
import { buildRankings } from '@/lib/ranking'

describe('SQLite', () => {
  it('記録を書き戻せる', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitcd-'))
    const db = createPartyDb(path.join(dir, 'party.sqlite'))
    db.insertRun({
      community: 'Saga.js',
      communityKey: 'saga.js',
      playerName: 'たろう',
      playerKey: 'たろう',
      elapsedMs: 42_000,
      hits: 180,
      misses: 2,
    })
    const rankings = buildRankings(db.listRuns())
    assert.equal(rankings.communities[0]?.community, 'Saga.js')
    assert.equal(rankings.players[0]?.bestMs, 42_000)

    db.insertRun({
      community: 'SAGA.JS',
      communityKey: 'saga.js',
      playerName: 'じろう',
      playerKey: 'じろう',
      elapsedMs: 50_000,
      hits: 100,
      misses: 0,
    })
    db.rememberCommunity({ community: '遅い会', communityKey: '遅い会' })
    assert.deepEqual(db.listCommunities(), [
      { community: 'Saga.js', communityKey: 'saga.js' },
      { community: '遅い会', communityKey: '遅い会' },
    ])
    db.close()
  })
})
