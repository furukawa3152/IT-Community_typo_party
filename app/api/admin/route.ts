import { NextResponse } from 'next/server'

import { adminErrorMessage, adminPasswordRequired, checkAdmin } from '@/lib/admin'
import { getPartyDb } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** 設定画面の初期表示。パスワードが要るかと、今の件数 */
export async function GET() {
  const db = await getPartyDb()
  return NextResponse.json({
    passwordRequired: adminPasswordRequired(),
    counts: await db.countAll(),
  })
}

/** パスワードの確認だけをする */
export async function POST(request: Request) {
  const check = checkAdmin(request)
  if (check !== 'ok') {
    return NextResponse.json({ error: adminErrorMessage(check) }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
