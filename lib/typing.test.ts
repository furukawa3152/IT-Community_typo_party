import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import {
  advanceStates,
  buildUnits,
  endsWithSyllabicN,
  INITIAL_STATES,
  isWordComplete,
  typedLength,
} from '@/lib/typing'
import { WORDS } from '@/lib/words'

function typeAll(romaji: string, keys: string) {
  const units = buildUnits(romaji)
  let states = [...INITIAL_STATES]
  for (const key of keys) {
    states = advanceStates(units, states, key)
    if (states.length === 0) return { accepted: false, complete: false, typed: 0 }
  }
  return {
    accepted: true,
    complete: isWordComplete(units, states),
    typed: typedLength(units, states),
  }
}

describe('ローマ字の別表記', () => {
  it('し は shi でも si でも打ち切れる', () => {
    assert.equal(typeAll('shi', 'shi').complete, true)
    assert.equal(typeAll('shi', 'si').complete, true)
    assert.equal(typeAll('shi', 'si').typed, 3)
  })

  it('ん は n 1回でも nn でも打ち切れる', () => {
    assert.equal(endsWithSyllabicN('kankyouhensuu'), false)
    assert.equal(typeAll('angouka', 'angouka').complete, true)
    const units = buildUnits('kankyouhensuu')
    const nUnit = units.find((unit) => unit.candidates.includes('nn'))
    assert.ok(nUnit)
    assert.equal(typeAll('kankyouhensuu', 'kannkyouhensuu').complete, true)
  })

  it('っち は tti でも cchi でも打ち切れる', () => {
    assert.equal(typeAll('matti', 'matti').complete, true)
    assert.equal(typeAll('matti', 'macchi').complete, true)
  })

  it('出題のローマ字どおりに打てば全部完了する', () => {
    for (const word of WORDS) {
      const result = typeAll(word.romaji, word.romaji)
      assert.equal(result.complete, true, word.display)
    }
  })
})
