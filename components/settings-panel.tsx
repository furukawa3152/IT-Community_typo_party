'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { ADMIN_HEADER } from '@/lib/admin-header'
import {
  DEFAULT_ROUND_SIZE,
  isRoundSize,
  MAX_ROUND_SIZE,
  MIN_ROUND_SIZE,
  planRound,
} from '@/lib/round'

/** 初期化ボタンを押す前に打ってもらう言葉 */
const RESET_WORD = '初期化'

type Counts = { runs: number; communities: number }
type Notice = { kind: 'ok' | 'error'; text: string } | null

export function SettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const [savedSize, setSavedSize] = useState(DEFAULT_ROUND_SIZE)
  const [draftSize, setDraftSize] = useState(String(DEFAULT_ROUND_SIZE))
  const [saving, setSaving] = useState(false)
  const [sizeNotice, setSizeNotice] = useState<Notice>(null)

  const [counts, setCounts] = useState<Counts>({ runs: 0, communities: 0 })
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetNotice, setResetNotice] = useState<Notice>(null)

  const load = useCallback(async () => {
    try {
      const [adminRes, settingsRes] = await Promise.all([
        fetch('/api/admin', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ])
      if (!adminRes.ok || !settingsRes.ok) throw new Error('load failed')
      const admin = (await adminRes.json()) as { passwordRequired: boolean; counts: Counts }
      const settings = (await settingsRes.json()) as { roundSize: number }
      setPasswordRequired(admin.passwordRequired)
      setUnlocked((current) => current || !admin.passwordRequired)
      setCounts(admin.counts)
      setSavedSize(settings.roundSize)
      setDraftSize(String(settings.roundSize))
      setLoadError('')
    } catch {
      setLoadError('設定を読み込めませんでした。データベースの接続を確認してください。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const headers = useCallback(
    (): HeadersInit => ({ 'Content-Type': 'application/json', [ADMIN_HEADER]: password }),
    [password],
  )

  async function unlock(event: React.FormEvent) {
    event.preventDefault()
    setUnlockError('')
    const response = await fetch('/api/admin', { method: 'POST', headers: headers() }).catch(() => null)
    if (response?.ok) {
      setUnlocked(true)
      return
    }
    const data = (await response?.json().catch(() => null)) as { error?: string } | null
    setUnlockError(data?.error ?? '確認できませんでした')
  }

  const parsedSize = Number(draftSize)
  const sizeValid = draftSize.trim() !== '' && isRoundSize(parsedSize)
  const plan = sizeValid ? planRound(parsedSize) : null
  const sizeChanged = sizeValid && parsedSize !== savedSize

  function nudge(delta: number) {
    const base = isRoundSize(parsedSize) ? parsedSize : savedSize
    const next = Math.min(MAX_ROUND_SIZE, Math.max(MIN_ROUND_SIZE, base + delta))
    setDraftSize(String(next))
    setSizeNotice(null)
  }

  async function saveSize(event: React.FormEvent) {
    event.preventDefault()
    if (!sizeValid) return
    setSaving(true)
    setSizeNotice(null)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ roundSize: parsedSize }),
      })
      const data = (await response.json()) as { roundSize?: number; error?: string }
      if (!response.ok || !data.roundSize) throw new Error(data.error ?? '保存できませんでした')
      setSavedSize(data.roundSize)
      setDraftSize(String(data.roundSize))
      setSizeNotice({ kind: 'ok', text: `${data.roundSize}問にしました。次の挑戦から反映されます。` })
    } catch (error) {
      setSizeNotice({ kind: 'error', text: error instanceof Error ? error.message : '保存できませんでした' })
    } finally {
      setSaving(false)
    }
  }

  async function resetAll(event: React.FormEvent) {
    event.preventDefault()
    if (confirmText.trim() !== RESET_WORD) return
    setResetting(true)
    setResetNotice(null)
    try {
      const response = await fetch('/api/admin/reset', { method: 'POST', headers: headers() })
      const data = (await response.json()) as { counts?: Counts; error?: string }
      if (!response.ok || !data.counts) throw new Error(data.error ?? '初期化できませんでした')
      setCounts(data.counts)
      setConfirmText('')
      setResetNotice({ kind: 'ok', text: '記録とコミュニティ名をすべて消しました。' })
    } catch (error) {
      setResetNotice({ kind: 'error', text: error instanceof Error ? error.message : '初期化できませんでした' })
    } finally {
      setResetting(false)
    }
  }

  return (
    <main className="stage settings">
      <header className="masthead compact">
        <p className="event">SAGA IT COMMUNITY DAY 2027</p>
        <h1 className="wordmark">
          SETTINGS<span className="caret" aria-hidden="true" />
        </h1>
      </header>

      <div className="settings-body">
        <p className="back">
          <Link href="/">← ゲームに戻る</Link>
        </p>

        {loading ? (
          <p className="empty">読み込み中</p>
        ) : loadError ? (
          <p className="error">{loadError}</p>
        ) : !unlocked ? (
          <form className="panel" onSubmit={unlock}>
            <h2>管理パスワード</h2>
            <p className="panel-note">問題数の変更と初期化には、管理パスワードが要る。</p>
            <div className="field">
              <label htmlFor="admin-password">パスワード</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {unlockError && <p className="error">{unlockError}</p>}
            <button type="submit" className="primary">開く</button>
          </form>
        ) : (
          <>
            <form className="panel" onSubmit={saveSize}>
              <h2>競う問題数</h2>
              <p className="panel-note">
                1試合で打つ数。{MIN_ROUND_SIZE}〜{MAX_ROUND_SIZE}問。いまは <strong>{savedSize}問</strong>。
              </p>

              <div className="stepper">
                <button
                  type="button"
                  className="ghost step"
                  onClick={() => nudge(-1)}
                  aria-label="1問減らす"
                  disabled={parsedSize <= MIN_ROUND_SIZE}
                >
                  −
                </button>
                <input
                  id="round-size"
                  aria-label="問題数"
                  inputMode="numeric"
                  value={draftSize}
                  onChange={(event) => {
                    setDraftSize(event.target.value.replace(/[^0-9]/g, ''))
                    setSizeNotice(null)
                  }}
                />
                <button
                  type="button"
                  className="ghost step"
                  onClick={() => nudge(1)}
                  aria-label="1問増やす"
                  disabled={parsedSize >= MAX_ROUND_SIZE}
                >
                  ＋
                </button>
              </div>

              <div className="presets" role="group" aria-label="よく使う問題数">
                {[10, 20, 30, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={parsedSize === size ? 'choice on' : 'choice'}
                    aria-pressed={parsedSize === size}
                    onClick={() => {
                      setDraftSize(String(size))
                      setSizeNotice(null)
                    }}
                  >
                    {size}問
                  </button>
                ))}
              </div>

              {plan ? (
                <p className="breakdown">
                  用語 <strong>{plan.terms}</strong>
                  <span className="sep" />
                  コード <strong>{plan.codes}</strong>
                  <span className="sub">
                    （Python {plan.quota.Python ?? 0}・HTML {plan.quota.HTML ?? 0} 以上）
                  </span>
                </p>
              ) : (
                <p className="error">{MIN_ROUND_SIZE}〜{MAX_ROUND_SIZE} の数を入れてください</p>
              )}

              <p className="panel-note">
                順位は、いまの問題数で打ち切った記録だけで並ぶ。ほかの問題数の記録は消えず、戻せばまた出る。
              </p>

              {sizeNotice && <p className={sizeNotice.kind === 'ok' ? 'notice' : 'error'}>{sizeNotice.text}</p>}
              <button type="submit" className="primary" disabled={!sizeChanged || saving}>
                {saving ? '保存中' : '保存する'}
              </button>
            </form>

            <form className="panel danger" onSubmit={resetAll}>
              <h2>データベースの初期化</h2>
              <p className="panel-note">
                すべての記録とコミュニティ名を消す。元には戻せない。問題数の設定は残る。
              </p>
              <dl className="counts">
                <div><dt>記録</dt><dd>{counts.runs}<small>件</small></dd></div>
                <div><dt>コミュニティ</dt><dd>{counts.communities}<small>件</small></dd></div>
              </dl>
              <div className="field">
                <label htmlFor="reset-confirm">確認のため「{RESET_WORD}」と入力</label>
                <input
                  id="reset-confirm"
                  value={confirmText}
                  onChange={(event) => {
                    setConfirmText(event.target.value)
                    setResetNotice(null)
                  }}
                  placeholder={RESET_WORD}
                  autoComplete="off"
                />
              </div>
              {resetNotice && <p className={resetNotice.kind === 'ok' ? 'notice' : 'error'}>{resetNotice.text}</p>}
              <button
                type="submit"
                className="primary destructive"
                disabled={confirmText.trim() !== RESET_WORD || resetting}
              >
                {resetting ? '消去中' : 'すべて消す'}
              </button>
            </form>

            {passwordRequired && (
              <p className="panel-note">パスワードはこのページを離れると忘れる。</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
