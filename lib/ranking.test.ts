import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { buildRankings, type RunRecord } from '@/lib/ranking'
import { CODE_COUNT, pickRound, ROUND_SIZE, TERM_COUNT } from '@/lib/round'
import { parseRun } from '@/lib/runs'
import { WORDS } from '@/lib/words'

function run(partial: Partial<RunRecord> & Pick<RunRecord, 'elapsedMs'>): RunRecord {
  return {
    community: 'Saga.js',
    communityKey: 'saga.js',
    playerName: 'たろう',
    playerKey: 'たろう',
    hits: 100,
    misses: 0,
    ...partial,
  }
}

describe('20語句', () => {
  it('語句は20個以上あり、1試合は20個で重複しない', () => {
    assert.ok(WORDS.length >= ROUND_SIZE)
    const round = pickRound()
    assert.equal(round.length, ROUND_SIZE)
    assert.equal(new Set(round.map((word) => word.keys)).size, ROUND_SIZE)
  })

  it('1試合は用語12個とコード8行で、Python 3行と HTML 2行以上を含む', () => {
    for (let trial = 0; trial < 50; trial += 1) {
      const round = pickRound()
      const codes = round.filter((word) => word.lang)
      assert.equal(round.length - codes.length, TERM_COUNT)
      assert.equal(codes.length, CODE_COUNT)
      assert.ok(codes.filter((word) => word.lang === 'Python').length >= 3)
      assert.ok(codes.filter((word) => word.lang === 'HTML').length >= 2)
    }
  })
})

describe('記録の検証', () => {
  it('名前とコミュニティが空なら受け取らない', () => {
    assert.equal(parseRun({ community: '  ', playerName: 'たろう', elapsedMs: 20_000, hits: 10, misses: 0 }), null)
    assert.equal(parseRun({ community: 'Saga.js', playerName: '', elapsedMs: 20_000, hits: 10, misses: 0 }), null)
  })

  it('大文字小文字と空白のゆれは同じキーになる', () => {
    const parsed = parseRun({
      community: '  SAGA.JS ',
      playerName: 'Taro',
      elapsedMs: 20_000,
      hits: 10,
      misses: 0,
    })
    assert.equal(parsed?.community, 'SAGA.JS')
    assert.equal(parsed?.communityKey, 'saga.js')
    assert.equal(parsed?.playerKey, 'taro')
  })

  it('0秒のタイムは受け取らない', () => {
    assert.equal(
      parseRun({ community: 'Saga.js', playerName: 'たろう', elapsedMs: 0, hits: 10, misses: 0 }),
      null,
    )
  })
})

describe('コミュニティ順位', () => {
  it('一番速い人がいるコミュニティが上になる', () => {
    const rankings = buildRankings([
      run({ community: '早い会', communityKey: '早い会', playerName: 'A', playerKey: 'a', elapsedMs: 30_000 }),
      run({ community: '早い会', communityKey: '早い会', playerName: 'A', playerKey: 'a', elapsedMs: 20_000 }),
      run({ community: '早い会', communityKey: '早い会', playerName: 'B', playerKey: 'b', elapsedMs: 40_000 }),
      run({ community: '平均は速い会', communityKey: '平均は速い会', playerName: 'C', playerKey: 'c', elapsedMs: 25_000 }),
    ])

    assert.deepEqual(
      rankings.communities.map((entry) => [entry.community, entry.bestMs, entry.members]),
      [
        ['早い会', 20_000, 2],
        ['平均は速い会', 25_000, 1],
      ],
    )
    assert.equal(rankings.players[0]?.playerName, 'A')
    assert.equal(rankings.players[0]?.bestMs, 20_000)
  })

  it('遅いやり直しでは自己ベストの表記を残す', () => {
    const rankings = buildRankings([
      run({ elapsedMs: 20_000 }),
      run({ community: 'SAGA.JS', elapsedMs: 50_000 }),
    ])
    assert.equal(rankings.players[0]?.community, 'Saga.js')
    assert.equal(rankings.players[0]?.bestMs, 20_000)
    assert.equal(rankings.communities[0]?.community, 'Saga.js')
  })
  it('表記ゆれは同じ参加者にまとめる', () => {
    const rankings = buildRankings([
      run({ elapsedMs: 30_000 }),
      run({ community: 'SAGA.JS', playerName: 'タロウ', elapsedMs: 25_000 }),
    ])
    assert.equal(rankings.players.length, 1)
    assert.equal(rankings.communities[0]?.members, 1)
    assert.equal(rankings.communities[0]?.bestMs, 25_000)
  })
})
