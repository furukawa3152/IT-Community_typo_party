import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import {
  advanceStates,
  buildLiteralUnits,
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

/** 画面で押したキーを、ゲームと同じく normalizeKey を通して打つ */
function press(word: { keys: string; lang?: string }, typed: string) {
  const keys = [...typed].map((key) => normalizeKey(key, Boolean(word.lang)))
  if (keys.some((key) => key === null)) return { accepted: false, complete: false, typed: 0 }
  return typeUnits(unitsFor(word), (keys as string[]).join(''))
}

describe('英単語', () => {
  it('用語は小文字の英字と1つの空白だけ', () => {
    for (const term of TERMS) {
      assert.match(term.keys, /^[a-z]+( [a-z]+)?$/, term.keys)
      assert.equal(term.lang, undefined, term.keys)
    }
  })

  it('大文字で打っても通る', () => {
    assert.equal(press({ keys: 'variable' }, 'Variable').complete, true)
    assert.equal(press({ keys: 'pull request' }, 'PULL REQUEST').complete, true)
  })

  it('ローマ字のゆれは受け付けない', () => {
    assert.equal(press({ keys: 'function' }, 'hunc').accepted, false)
    assert.equal(press({ keys: 'string' }, 'sutoringu').accepted, false)
  })

  it('出題どおりに打てば全部完了する', () => {
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
