import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import {
  advanceStates,
  allowsTrailingN,
  buildLiteralUnits,
  buildUnits,
  endsWithSyllabicN,
  INITIAL_STATES,
  isWordComplete,
  normalizeKey,
  typedLength,
  unitsFor,
  type TypingUnit,
} from '@/lib/typing'
import { CODES, TERMS, WORDS } from '@/lib/words'

function typeUnits(units: TypingUnit[], keys: string) {
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

function typeAll(romaji: string, keys: string) {
  return typeUnits(buildUnits(romaji), keys)
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
      const result = typeUnits(unitsFor(word), word.keys)
      assert.equal(result.complete, true, word.display)
      assert.equal(result.typed, word.keys.length, word.display)
    }
  })
})

describe('コード', () => {
  it('ローマ字のゆれは受け付けない', () => {
    const fn = buildLiteralUnits('def fun(): return')
    assert.equal(typeUnits(fn, 'def hun').accepted, false)
    assert.equal(typeUnits(buildLiteralUnits('print(i)'), 'prinnt').accepted, false)
    assert.equal(typeUnits(buildLiteralUnits('<p class="x">'), '<p cla').accepted, true)
  })

  it('大文字小文字を区別する', () => {
    assert.equal(typeUnits(buildLiteralUnits('True'), 'true').accepted, false)
    assert.equal(typeUnits(buildLiteralUnits('True'), 'True').complete, true)
  })

  it('記号はそのまま通り、用語では捨てる', () => {
    assert.equal(normalizeKey('"', true), '"')
    assert.equal(normalizeKey('<', true), '<')
    assert.equal(normalizeKey('T', true), 'T')
    assert.equal(normalizeKey('T', false), 't')
    assert.equal(normalizeKey('"', false), null)
    assert.equal(normalizeKey('Shift', true), null)
    assert.equal(normalizeKey('Enter', true), null)
    assert.equal(normalizeKey('Dead', true), null)
  })

  it('コードで終わっても n の見逃しはしない', () => {
    assert.equal(allowsTrailingN({ keys: 'x = fn', lang: 'Python' }), false)
    assert.equal(allowsTrailingN({ keys: 'kansuuten' }), true)
  })

  it('コードはどれも1行で、普通の配列で打てる半角文字だけ', () => {
    for (const code of CODES) {
      assert.match(code.keys, /^[\x20-\x7e]+$/, code.keys)
      assert.ok(!/[\\`]/.test(code.keys), code.keys)
      assert.equal(code.keys, code.keys.trim(), code.keys)
      assert.ok(!code.keys.includes('  '), code.keys)
      assert.ok(code.keys.length <= 40, code.keys)
    }
  })

  it('用語とコードのお題に重複がない', () => {
    assert.equal(new Set(WORDS.map((word) => word.keys)).size, WORDS.length)
    assert.ok(TERMS.every((word) => !word.lang))
  })
})
