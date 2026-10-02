import { NextResponse } from 'next/server'

import { getPartyDb } from '@/lib/db'
import { buildRankings } from '@/lib/ranking'
import { parseRun } from '@/lib/runs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '記録の形式が不正です' }, { status: 400 })
  }

  const run = parseRun(body)
  if (!run) {
    return NextResponse.json({ error: '名前、コミュニティ、タイムを確認してください' }, { status: 400 })
  }

  getPartyDb().insertRun(run)
  return NextResponse.json(buildRankings(getPartyDb().listRuns()))
}
