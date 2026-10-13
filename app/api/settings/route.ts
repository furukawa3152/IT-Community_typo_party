import { NextResponse } from 'next/server'

import { adminErrorMessage, checkAdmin } from '@/lib/admin'
import { getPartyDb } from '@/lib/db'
import { parseSettings } from '@/lib/settings'
import { MAX_ROUND_SIZE, MIN_ROUND_SIZE } from '@/lib/round'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** ゲーム画面も読むので、取得は誰でもできる */
export async function GET() {
  const db = await getPartyDb()
  return NextResponse.json(await db.getSettings())
}

export async function PUT(request: Request) {
  const check = checkAdmin(request)
  if (check !== 'ok') {
    return NextResponse.json({ error: adminErrorMessage(check) }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '設定の形式が不正です' }, { status: 400 })
  }

  const settings = parseSettings(body)
  if (!settings) {
    return NextResponse.json(
      { error: `問題数は ${MIN_ROUND_SIZE}〜${MAX_ROUND_SIZE} の整数にしてください` },
      { status: 400 },
    )
  }

  const db = await getPartyDb()
  await db.saveSettings(settings)
  return NextResponse.json(await db.getSettings())
}
