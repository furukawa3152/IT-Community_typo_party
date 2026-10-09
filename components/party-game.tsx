'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { formatTime } from '@/lib/format'
import {
  normalizeKey as communityKeyOf,
  parseIdentity,
  type CommunityOption,
  type Rankings,
} from '@/lib/ranking'
import { pickRound, ROUND_SIZE } from '@/lib/round'
import {
  advanceStates,
  allowsTrailingN,
  calcResult,
  INITIAL_STATES,
  isWordComplete,
  normalizeKey,
  typedLength,
  unitsFor,
  type TypingState,
  type TypingUnit,
} from '@/lib/typing'
import type { Word } from '@/lib/words'

const MISS_FLASH_MS = 180

type Phase = 'entry' | 'countdown' | 'playing' | 'result'

type Identity = {
  community: string
  communityKey: string
  playerName: string
  playerKey: string
}

type Session = {
  queue: Word[]
  index: number
  units: TypingUnit[]
  states: TypingState[]
  graceN: boolean
  hits: number
  misses: number
  cleared: number
  elapsedMs: number
}

const EMPTY_RANKINGS: Rankings = { communities: [], players: [] }

export function PartyGame() {
  const [phase, setPhase] = useState<Phase>('entry')
  const [community, setCommunity] = useState('')
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [playerName, setPlayerName] = useState('')
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [count, setCount] = useState(3)
  const [session, setSession] = useState<Session | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isMiss, setIsMiss] = useState(false)
  const [rankings, setRankings] = useState<Rankings>(EMPTY_RANKINGS)
  const [rankingsReady, setRankingsReady] = useState(false)
  const [isBest, setIsBest] = useState(false)
  const [saveError, setSaveError] = useState('')

  const sessionRef = useRef<Session | null>(null)
  const startedAtRef = useRef(0)
  const missTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSubmittedRef = useRef(false)
  const rankingsRef = useRef(rankings)
  rankingsRef.current = rankings

  const applySession = useCallback((next: Session) => {
    sessionRef.current = next
    setSession(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/rankings')
      .then((response) => response.json())
      .then((data: Rankings) => {
        if (!cancelled) setRankings(data)
      })
      .catch(() => {
        // ランキングが読めなくても、入力とプレイは続ける
      })
      .finally(() => {
        if (!cancelled) setRankingsReady(true)
      })

    fetch('/api/communities')
      .then((response) => response.json())
      .then((data: { communities: CommunityOption[] }) => {
        if (!cancelled) setCommunities(data.communities)
      })
      .catch(() => {
        // 候補が取れなくても、新しい名前は手入力できる
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (missTimerRef.current) clearTimeout(missTimerRef.current)
    }
  }, [])

  const flashMiss = useCallback(() => {
    setIsMiss(true)
    if (missTimerRef.current) clearTimeout(missTimerRef.current)
    missTimerRef.current = setTimeout(() => setIsMiss(false), MISS_FLASH_MS)
  }, [])

  const startRound = useCallback(() => {
    const nextIdentity = parseIdentity(community, playerName)
    if (!nextIdentity) return
    const queue = pickRound()
    const next: Session = {
      queue,
      index: 0,
      units: unitsFor(queue[0]),
      states: [...INITIAL_STATES],
      graceN: false,
      hits: 0,
      misses: 0,
      cleared: 0,
      elapsedMs: 0,
    }
    setIdentity(nextIdentity)
    setCommunities((current) =>
      current.some((item) => item.communityKey === nextIdentity.communityKey)
        ? current
        : [...current, nextIdentity],
    )
    void fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community: nextIdentity.community }),
    })
      .then(async (response) => {
        if (!response.ok) return
        const data = (await response.json()) as { communities: CommunityOption[] }
        setCommunities(data.communities)
      })
      .catch(() => {
        // 送信に失敗しても、この画面では選んだ名前のまま進める
      })
    setSaveError('')
    setIsBest(false)
    hasSubmittedRef.current = false
    applySession(next)
    setElapsedMs(0)
    setCount(3)
    setPhase('countdown')
  }, [applySession, community, playerName])

  useEffect(() => {
    if (phase !== 'countdown') return
    let current = 3
    setCount(3)
    const id = setInterval(() => {
      current -= 1
      if (current <= 0) {
        clearInterval(id)
        startedAtRef.current = Date.now()
        setElapsedMs(0)
        setPhase('playing')
        return
      }
      setCount(current)
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current)
    }, 50)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return
      if (event.key === 'Escape') {
        setPhase('entry')
        return
      }
      if (event.repeat) return

      const current = sessionRef.current
      if (!current) return
      const word = current.queue[current.index]
      const key = normalizeKey(event.key, Boolean(word.lang))
      if (!key) return
      event.preventDefault()
      const nextStates = advanceStates(current.units, current.states, key)

      if (nextStates.length === 0) {
        if (current.graceN && key === 'n') {
          applySession({ ...current, graceN: false })
          return
        }
        applySession({ ...current, misses: current.misses + 1, graceN: false })
        flashMiss()
        return
      }

      const hits = current.hits + 1
      if (!isWordComplete(current.units, nextStates)) {
        applySession({ ...current, states: nextStates, hits, graceN: false })
        return
      }

      const cleared = current.cleared + 1
      const finished = {
        ...current,
        states: nextStates,
        hits,
        cleared,
        graceN: allowsTrailingN(word),
      }

      if (cleared >= ROUND_SIZE) {
        const elapsed = Date.now() - startedAtRef.current
        const done = { ...finished, elapsedMs: elapsed }
        const player = identityFromRefs(rankingsRef.current, community, playerName)
        setIsBest(!player || elapsed < player.bestMs)
        setElapsedMs(elapsed)
        applySession(done)
        setPhase('result')
        return
      }

      const nextIndex = current.index + 1
      applySession({
        ...finished,
        index: nextIndex,
        units: unitsFor(current.queue[nextIndex]),
        states: [...INITIAL_STATES],
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applySession, community, flashMiss, phase, playerName])

  useEffect(() => {
    if (phase !== 'result' || !session || !identity) return
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true

    let cancelled = false
    fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        community: identity.community,
        playerName: identity.playerName,
        elapsedMs: session.elapsedMs,
        hits: session.hits,
        misses: session.misses,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('save failed')
        return response.json() as Promise<Rankings>
      })
      .then((data) => {
        if (!cancelled) setRankings(data)
      })
      .catch(() => {
        if (!cancelled) setSaveError('記録を保存できませんでした。この画面のタイムは残っていません。')
      })

    return () => {
      cancelled = true
    }
  }, [identity, phase, session])

  const result = useMemo(() => {
    if (!session || phase !== 'result') return null
    return calcResult({
      hits: session.hits,
      misses: session.misses,
      elapsedMs: session.elapsedMs,
    })
  }, [phase, session])

  if (phase === 'countdown') {
    return (
      <main className="stage countdown">
        <p className="who">
          <span>{identity?.community}</span>
          <span className="who-name">{identity?.playerName}</span>
        </p>
        <p key={count} className="count" aria-live="assertive">{count}</p>
        <p className="countdown-note">用語12個とコード8行。カウントが終わると計測が始まる</p>
      </main>
    )
  }

  if (phase === 'playing' && session) {
    const word = session.queue[session.index]
    const upcoming = session.queue[session.index + 1]
    const typed = typedLength(session.units, session.states)
    return (
      <main className="stage play">
        <header className="hud">
          <p className="who">
            <span>{identity?.community}</span>
            <span className="who-name">{identity?.playerName}</span>
          </p>
          <p className="clock" data-testid="timer">{formatTime(elapsedMs)}</p>
        </header>

        <Track queue={session.queue} cleared={session.cleared} />

        <section
          key={session.index}
          className={`prompt${word.lang ? ' is-code' : ''}${isMiss ? ' is-miss' : ''}`}
          aria-live="polite"
        >
          <p className="prompt-meta">
            <span className="progress" data-testid="progress">
              {session.cleared + 1}<span className="of">/{ROUND_SIZE}</span>
            </span>
            {word.lang && <span className="lang" data-testid="lang">{word.lang}</span>}
          </p>
          <h2 className="gloss">{word.display}</h2>
          <p
            className="line"
            data-testid="romaji"
            style={{ '--len': word.keys.length } as CSSProperties}
          >
            {word.keys.split('').map((char, index) => {
              const state = index < typed ? 'done' : index === typed ? 'now' : 'todo'
              return (
                <span
                  key={`${word.keys}-${index}`}
                  className={`ch ${state}${char === ' ' ? ' space' : ''}`}
                >
                  {char === ' ' ? '␣' : char}
                </span>
              )
            })}
          </p>
        </section>

        <footer className="play-foot">
          <p className="next">
            {upcoming ? (
              <>
                <span className="next-label">つぎ</span>
                {upcoming.lang && <span className="lang small">{upcoming.lang}</span>}
                <span className="next-word">{upcoming.display}</span>
              </>
            ) : (
              <span className="next-label">これが最後</span>
            )}
          </p>
          <p className="hint">
            ミス <strong>{session.misses}</strong>
            <span className="sep" />
            <kbd>Esc</kbd> でやめる。記録は残らない
          </p>
        </footer>
      </main>
    )
  }

  if (phase === 'result' && session && result && identity) {
    const myCommunity = rankings.communities.find(
      (entry) => entry.communityKey === identity.communityKey,
    )
    return (
      <main className="stage result">
        <Masthead compact />
        <div className="result-grid">
          <section className="result-hero">
            <p className="who">
              <span>{identity.community}</span>
              <span className="who-name">{identity.playerName}</span>
            </p>
            <p className="final" data-testid="final-time">{formatTime(session.elapsedMs)}</p>
            <div className="badges">
              {isBest && <p className="best">自己ベスト更新</p>}
              {myCommunity && (
                <p className="standing">
                  コミュニティ <strong>{myCommunity.rank}</strong> 位
                </p>
              )}
            </div>
            {saveError && <p className="error">{saveError}</p>}
            <dl className="stats">
              <div><dt>正確率</dt><dd>{result.accuracy}<small>%</small></dd></div>
              <div><dt>打鍵/分</dt><dd>{result.kpm}</dd></div>
              <div><dt>ミス</dt><dd>{session.misses}</dd></div>
            </dl>
            <div className="actions">
              <button type="button" className="primary" onClick={startRound}>もう一度</button>
              <button type="button" className="ghost" onClick={() => setPhase('entry')}>名前を変える</button>
            </div>
          </section>
          <RankingsView rankings={rankings} ready identity={identity} />
        </div>
      </main>
    )
  }

  const ready = parseIdentity(community, playerName) !== null

  return (
    <main className="stage entry">
      <Masthead />
      <div className="entry-grid">
        <form
          className="entry-form"
          onSubmit={(event) => {
            event.preventDefault()
            startRound()
          }}
        >
          <p className="lead">
            プログラミングのことば12個と、Python や HTML の1行コード8行。20問を打ち切るまでの速さで、コミュニティの順位が動く。
          </p>
          <div className="field">
            <label htmlFor="community">コミュニティ</label>
            {communities.length > 0 && (
              <div className="choices" role="group" aria-label="入力済みのコミュニティ">
                {communities.map((option) => {
                  const selected = communityKeyOf(community) === option.communityKey
                  return (
                    <button
                      key={option.communityKey}
                      type="button"
                      className={selected ? 'choice on' : 'choice'}
                      aria-pressed={selected}
                      onClick={() => setCommunity(option.community)}
                    >
                      {option.community}
                    </button>
                  )
                })}
              </div>
            )}
            <input
              id="community"
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
              placeholder="例: Saga.js"
              maxLength={40}
              autoComplete="organization"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="player-name">名前</label>
            <input
              id="player-name"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="例: たろう"
              maxLength={40}
              autoComplete="nickname"
              required
            />
          </div>
          <button className="primary start" type="submit" disabled={!ready}>
            20問に挑戦する
          </button>
          <ul className="rules">
            <li><kbd>n</kbd> でも <kbd>nn</kbd> でも「ん」。<kbd>shi</kbd> でも <kbd>si</kbd> でも「し」</li>
            <li>長音の「ー」は <kbd>-</kbd>、空白は <kbd>Space</kbd></li>
            <li>コードは書いてあるとおり。記号も大文字小文字もそのまま</li>
            <li>日本語入力はオフにしておく</li>
          </ul>
        </form>
        <RankingsView
          rankings={rankings}
          ready={rankingsReady}
          identity={parseIdentity(community, playerName)}
        />
      </div>
    </main>
  )
}

function Masthead({ compact = false }: { compact?: boolean }) {
  return (
    <header className={compact ? 'masthead compact' : 'masthead'}>
      <p className="event">SAGA IT COMMUNITY DAY 2027</p>
      <h1 className="wordmark">
        TYPE PARTY<span className="caret" aria-hidden="true" />
      </h1>
    </header>
  )
}

/** 20問の進み具合。用語は丸、コードは横長で示す */
function Track({ queue, cleared }: { queue: readonly Word[]; cleared: number }) {
  return (
    <ol className="track" aria-label={`${cleared} / ${queue.length} 問クリア`}>
      {queue.map((word, index) => {
        const state = index < cleared ? 'done' : index === cleared ? 'now' : 'todo'
        return (
          <li
            key={`${word.keys}-${index}`}
            className={`pip ${state}${word.lang ? ' code' : ''}`}
          />
        )
      })}
    </ol>
  )
}

function RankingsView({
  rankings,
  identity,
  ready,
}: {
  rankings: Rankings
  identity: Identity | null
  ready: boolean
}) {
  return (
    <section className="ranking">
      <h2>コミュニティ順位</h2>
      <p className="ranking-note">数字は、そのコミュニティで一番速い人のタイム</p>
      {rankings.communities.length === 0 ? (
        <p className="empty">{ready ? 'まだ記録がない。最初の1人になろう' : '読み込み中'}</p>
      ) : (
        <ol className="board" data-testid="community-ranking">
          {rankings.communities.map((entry) => (
            <li
              key={entry.communityKey}
              className={entry.communityKey === identity?.communityKey ? 'me' : ''}
            >
              <span className="rank-no">{entry.rank}</span>
              <span className="name">
                {entry.community}
                <span className="sub">{entry.members}人</span>
              </span>
              <span className="time">{formatTime(entry.bestMs)}</span>
            </li>
          ))}
        </ol>
      )}

      <h2 className="subhead">個人の自己ベスト</h2>
      {rankings.players.length === 0 ? (
        <p className="empty">{ready ? '20問を打ち切るとここに載る' : '読み込み中'}</p>
      ) : (
        <ol className="board players" data-testid="player-ranking">
          {rankings.players.slice(0, 20).map((entry) => {
            const mine =
              entry.communityKey === identity?.communityKey &&
              entry.playerKey === identity?.playerKey
            return (
              <li key={`${entry.communityKey}:${entry.playerKey}`} className={mine ? 'me' : ''}>
                <span className="rank-no">{entry.rank}</span>
                <span className="name">
                  {entry.playerName}
                  <span className="sub">{entry.community}</span>
                </span>
                <span className="time">{formatTime(entry.bestMs)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function identityFromRefs(rankings: Rankings, community: string, playerName: string) {
  const identity = parseIdentity(community, playerName)
  if (!identity) return null
  return rankings.players.find(
    (entry) =>
      entry.communityKey === identity.communityKey && entry.playerKey === identity.playerKey,
  )
}
