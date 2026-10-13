import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { describe, it } from 'vitest'

import { createPartyDb } from '@/lib/sqlite-db'
import { buildRankings } from '@/lib/ranking'

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitcd-'))
  return path.join(dir, 'party.sqlite')
}

describe('SQLite', () => {
  it('記録を書き戻せる', async () => {
    const db = createPartyDb(tempFile())
    await db.insertRun({
      community: 'Saga.js',
      communityKey: 'saga.js',
      playerName: 'たろう',
      playerKey: 'たろう',
      elapsedMs: 42_000,
      hits: 180,
      misses: 2,
      roundSize: 20,
    })
    const rankings = buildRankings(await db.listRuns(20))
    assert.equal(rankings.communities[0]?.community, 'Saga.js')
    assert.equal(rankings.players[0]?.bestMs, 42_000)

    await db.insertRun({
      community: 'SAGA.JS',
      communityKey: 'saga.js',
      playerName: 'じろう',
      playerKey: 'じろう',
      elapsedMs: 50_000,
      hits: 100,
      misses: 0,
      roundSize: 20,
    })
    await db.rememberCommunity({ community: '遅い会', communityKey: '遅い会' })
    assert.deepEqual(await db.listCommunities(), [
      { community: 'Saga.js', communityKey: 'saga.js' },
      { community: '遅い会', communityKey: '遅い会' },
    ])
    db.close()
  })

  it('順位には同じ問題数の記録だけを使う', async () => {
    const db = createPartyDb(tempFile())
    const base = {
      community: 'Saga.js',
      communityKey: 'saga.js',
      playerName: 'たろう',
      playerKey: 'たろう',
      hits: 100,
      misses: 0,
    }
    await db.insertRun({ ...base, elapsedMs: 40_000, roundSize: 20 })
    await db.insertRun({ ...base, elapsedMs: 15_000, roundSize: 10 })
    assert.deepEqual((await db.listRuns(20)).map((run) => run.elapsedMs), [40_000])
    assert.deepEqual((await db.listRuns(10)).map((run) => run.elapsedMs), [15_000])
    db.close()
  })

  it('問題数を保存でき、初期化しても設定は残る', async () => {
    const file = tempFile()
    const db = createPartyDb(file)
    assert.equal((await db.getSettings()).roundSize, 20)
    await db.saveSettings({ roundSize: 30 })
    assert.equal((await db.getSettings()).roundSize, 30)

    await db.insertRun({
      community: 'Saga.js',
      communityKey: 'saga.js',
      playerName: 'たろう',
      playerKey: 'たろう',
      elapsedMs: 40_000,
      hits: 100,
      misses: 0,
      roundSize: 30,
    })
    await db.rememberCommunity({ community: '遅い会', communityKey: '遅い会' })
    assert.deepEqual(await db.countAll(), { runs: 1, communities: 2 })

    await db.resetAll()
    assert.deepEqual(await db.countAll(), { runs: 0, communities: 0 })
    assert.deepEqual(await db.listCommunities(), [])
    assert.equal((await db.getSettings()).roundSize, 30)
    db.close()

    // 開き直しても、消したコミュニティが runs から戻ってこない
    const reopened = createPartyDb(file)
    assert.deepEqual(await reopened.countAll(), { runs: 0, communities: 0 })
    reopened.close()
  })

  it('問題数の列がない古いファイルは20問の記録として読む', async () => {
    const file = tempFile()
    const old = new DatabaseSync(file)
    old.exec(`
      create table runs (
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
      insert into runs (community, community_key, player_name, player_key, elapsed_ms, hits, misses)
      values ('Saga.js', 'saga.js', 'たろう', 'たろう', 33000, 100, 0);
    `)
    old.close()

    const db = createPartyDb(file)
    assert.deepEqual((await db.listRuns(20)).map((run) => run.elapsedMs), [33_000])
    assert.deepEqual(await db.listCommunities(), [{ community: 'Saga.js', communityKey: 'saga.js' }])
    db.close()
  })
})
