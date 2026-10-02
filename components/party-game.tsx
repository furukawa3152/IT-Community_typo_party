'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  buildUnits,
  calcResult,
  endsWithSyllabicN,
  INITIAL_STATES,
  isWordComplete,
  typedLength,
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
      units: buildUnits(queue[0].romaji),
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

      const key = normalizeKey(event.key)
      if (!key) return
      event.preventDefault()

      const current = sessionRef.current
      if (!current) return
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
        graceN: endsWithSyllabicN(current.queue[current.index].romaji),
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
        units: buildUnits(current.queue[nextIndex].romaji),
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
      <main className="party">
        <Header />
        <div className="center">
          <p className="meta">{identity?.community} / {identity?.playerName}</p>
          <p className="count" aria-live="assertive">{count}</p>
          <p className="meta">20語句。カウントが終わったら計測開始</p>
        </div>
      </main>
    )
  }

  if (phase === 'playing' && session) {
    const word = session.queue[session.index]
    const typed = typedLength(session.units, session.states)
    return (
      <main className="party">
        <section className="play-top">
          <div>
            <p className="kicker">{identity?.community}</p>
            <p className="progress" data-testid="progress">
              {session.cleared + 1} / {ROUND_SIZE}
            </p>
          </div>
          <p className="timer" data-testid="timer">{formatTime(elapsedMs)}</p>
        </section>
        <section className={`card prompt${isMiss ? ' miss' : ''}`}>
          <h2>{word.display}</h2>
          <p className="romaji" data-testid="romaji">
            {word.romaji.split('').map((char, index) => {
              const isDone = index < typed
              const isCurrent = index === typed
              const className = isCurrent ? `now${isMiss ? ' miss' : ''}` : isDone ? 'done' : ''
              return (
                <span key={`${word.romaji}-${index}`} className={className}>
                  {char === ' ' ? '␣' : char}
                </span>
              )
            })}
          </p>
        </section>
        <p className="meta">Esc で登録画面に戻る。戻ったプレイは記録されない</p>
      </main>
    )
  }

  if (phase === 'result' && session && result && identity) {
    return (
      <main className="party">
        <Header />
        <section className="card result-hero">
          <div>
            <p className="kicker">{identity.community}</p>
            <h2>{identity.playerName}</h2>
            {isBest && <p className="best">自己ベスト</p>}
            {saveError && <p className="error">{saveError}</p>}
          </div>
          <p className="timer" data-testid="final-time">{formatTime(session.elapsedMs)}</p>
        </section>
        <div className="stats">
          <div className="stat"><span>正確率</span><strong>{result.accuracy}%</strong></div>
          <div className="stat"><span>打鍵/分</span><strong>{result.kpm}</strong></div>
          <div className="stat"><span>ミス</span><strong>{session.misses}</strong></div>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={startRound}>もう一度</button>
          <button type="button" className="ghost" onClick={() => setPhase('entry')}>名前を変える</button>
        </div>
        <RankingsView rankings={rankings} ready identity={identity} />
      </main>
    )
  }

  const ready = parseIdentity(community, playerName) !== null

  return (
    <main className="party">
      <Header />
      <p className="lead">
        プログラミングのことばを20個。表示されたローマ字を打ち切るまでの速さで、コミュニティの順位が動く。
      </p>
      <div className="layout">
        <form
          className="card"
          onSubmit={(event) => {
            event.preventDefault()
            startRound()
          }}
        >
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
          <button className="primary" type="submit" disabled={!ready}>
            20語句に挑戦する
          </button>
          <ul className="notes">
            <li>計測はカウント後、最初の語句から始まる</li>
            <li>「ん」は n でも nn でも打てる。「し」は shi でも si でも打てる</li>
            <li>長音の「ー」はハイフン。空白はスペース</li>
            <li>コミュニティの順位は、その中で一番速い人のタイムで決まる</li>
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

function Header() {
  return (
    <header>
      <p className="kicker">SAGA IT COMMUNITY DAY 2027</p>
      <h1>TYPE PARTY</h1>
    </header>
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
    <section className="card ranking">
      <h2>コミュニティ順位</h2>
      <p>速い方が上。数字は、そのコミュニティで一番速い人のタイム。</p>
      {rankings.communities.length === 0 ? (
        <p className="empty">{ready ? 'まだ記録がありません' : '読み込み中'}</p>
      ) : (
        <ol className="board" data-testid="community-ranking">
          {rankings.communities.map((entry) => (
            <li
              key={entry.communityKey}
              className={entry.communityKey === identity?.communityKey ? 'me' : ''}
            >
              <span className="rank-no">{entry.rank}</span>
              <span>
                {entry.community}
                <span className="meta"> {entry.members}人</span>
              </span>
              <span className="time">{formatTime(entry.bestMs)}</span>
            </li>
          ))}
        </ol>
      )}

      <h2 className="subhead">個人の自己ベスト</h2>
      {rankings.players.length === 0 ? (
        <p className="empty">{ready ? '20語句を打ち切るとここに載る' : '読み込み中'}</p>
      ) : (
        <ol className="board" data-testid="player-ranking">
          {rankings.players.slice(0, 20).map((entry) => {
            const mine =
              entry.communityKey === identity?.communityKey &&
              entry.playerKey === identity?.playerKey
            return (
              <li key={`${entry.communityKey}:${entry.playerKey}`} className={mine ? 'me' : ''}>
                <span className="rank-no">{entry.rank}</span>
                <span>
                  {entry.playerName}
                  <span className="meta"> {entry.community}</span>
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

function normalizeKey(key: string): string | null {
  if (key === ' ' || key === '-') return key
  if (/^[a-z]$/.test(key)) return key
  if (/^[A-Z]$/.test(key)) return key.toLowerCase()
  return null
}

function identityFromRefs(rankings: Rankings, community: string, playerName: string) {
  const identity = parseIdentity(community, playerName)
  if (!identity) return null
  return rankings.players.find(
    (entry) =>
      entry.communityKey === identity.communityKey && entry.playerKey === identity.playerKey,
  )
}
