import { NextResponse } from 'next/server'

import { adminErrorMessage, checkAdmin } from '@/lib/admin'
import { getPartyDb } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** 記録とコミュニティ名をすべて消す。問題数の設定は残す */
export async function POST(request: Request) {
  const check = checkAdmin(request)
  if (check !== 'ok') {
    return NextResponse.json({ error: adminErrorMessage(check) }, { status: 401 })
  }

  const db = await getPartyDb()
  await db.resetAll()
  return NextResponse.json({ counts: await db.countAll() })
}
