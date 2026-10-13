import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { buildRankings, type RunRecord } from '@/lib/ranking'
import {
  DEFAULT_ROUND_SIZE,
  isRoundSize,
  MAX_ROUND_SIZE,
  MIN_ROUND_SIZE,
  pickRound,
  planRound,
} from '@/lib/round'
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

describe('1試合のお題', () => {
  it('既定は20問で、重複しない', () => {
    assert.ok(WORDS.length >= DEFAULT_ROUND_SIZE)
    const round = pickRound()
    assert.equal(round.length, DEFAULT_ROUND_SIZE)
    assert.equal(new Set(round.map((word) => word.keys)).size, DEFAULT_ROUND_SIZE)
  })

  it('20問は用語12個とコード8行で、Python 3行と HTML 2行以上を含む', () => {
    const plan = planRound(20)
    assert.equal(plan.terms, 12)
    assert.equal(plan.codes, 8)
    assert.deepEqual(plan.quota, { Python: 3, HTML: 2 })
    for (let trial = 0; trial < 50; trial += 1) {
      const round = pickRound()
      const codes = round.filter((word) => word.lang)
      assert.equal(round.length - codes.length, 12)
      assert.equal(codes.length, 8)
      assert.ok(codes.filter((word) => word.lang === 'Python').length >= 3)
      assert.ok(codes.filter((word) => word.lang === 'HTML').length >= 2)
    }
  })

  it('設定できる問題数はどれも、お題が足りて重複しない', () => {
    for (let size = MIN_ROUND_SIZE; size <= MAX_ROUND_SIZE; size += 1) {
      const plan = planRound(size)
      assert.equal(plan.terms + plan.codes, size)
      for (let trial = 0; trial < 5; trial += 1) {
        const round = pickRound(size)
        assert.equal(round.length, size)
        assert.equal(new Set(round.map((word) => word.keys)).size, size)
        assert.equal(round.filter((word) => !word.lang).length, plan.terms)
      }
    }
  })

  it('範囲外の問題数は受け付けない', () => {
    assert.equal(isRoundSize(MIN_ROUND_SIZE - 1), false)
    assert.equal(isRoundSize(MAX_ROUND_SIZE + 1), false)
    assert.equal(isRoundSize(12.5), false)
    assert.equal(isRoundSize('20'), false)
    assert.throws(() => pickRound(MAX_ROUND_SIZE + 1))
  })
})

describe('記録の検証', () => {
  it('名前とコミュニティが空なら受け取らない', () => {
    assert.equal(parseRun({ community: '  ', playerName: 'たろう', elapsedMs: 20_000, hits: 10, misses: 0, roundSize: 20 }), null)
    assert.equal(parseRun({ community: 'Saga.js', playerName: '', elapsedMs: 20_000, hits: 10, misses: 0, roundSize: 20 }), null)
  })

  it('大文字小文字と空白のゆれは同じキーになる', () => {
    const parsed = parseRun({
      community: '  SAGA.JS ',
      playerName: 'Taro',
      elapsedMs: 20_000,
      hits: 10,
      misses: 0,
      roundSize: 20,
    })
    assert.equal(parsed?.community, 'SAGA.JS')
    assert.equal(parsed?.communityKey, 'saga.js')
    assert.equal(parsed?.playerKey, 'taro')
  })

  it('問題数が無いか範囲外なら受け取らない', () => {
    const base = { community: 'Saga.js', playerName: 'たろう', elapsedMs: 20_000, hits: 10, misses: 0 }
    assert.equal(parseRun(base), null)
    assert.equal(parseRun({ ...base, roundSize: MAX_ROUND_SIZE + 1 }), null)
    assert.equal(parseRun({ ...base, roundSize: 30 })?.roundSize, 30)
  })

  it('0秒のタイムは受け取らない', () => {
    assert.equal(
      parseRun({ community: 'Saga.js', playerName: 'たろう', elapsedMs: 0, hits: 10, misses: 0, roundSize: 20 }),
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
