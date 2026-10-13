import { timingSafeEqual } from 'node:crypto'

import { ADMIN_HEADER } from '@/lib/admin-header'

export type AdminCheck = 'ok' | 'denied' | 'unconfigured'

function adminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim()
  return value ? value : undefined
}

/** 設定画面でパスワードを聞くか。ローカルで ADMIN_PASSWORD が空なら聞かない */
export function adminPasswordRequired(): boolean {
  return Boolean(adminPassword() || process.env.VERCEL)
}

/**
 * 設定の変更と初期化を許すか。
 * ADMIN_PASSWORD があればヘッダーの値と照合する。
 * 空のときはローカルだけ許し、公開先（Vercel）では誰も操作できないようにする。
 */
export function checkAdmin(request: Request): AdminCheck {
  const expected = adminPassword()
  if (!expected) return process.env.VERCEL ? 'unconfigured' : 'ok'

  const given = request.headers.get(ADMIN_HEADER) ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return 'denied'
  return timingSafeEqual(a, b) ? 'ok' : 'denied'
}

export function adminErrorMessage(check: Exclude<AdminCheck, 'ok'>): string {
  return check === 'unconfigured'
    ? 'ADMIN_PASSWORD が未設定のため、公開先では設定を変えられません。'
    : '管理パスワードが違います'
}
