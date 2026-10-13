import { NextResponse } from 'next/server'

import { getPartyDb } from '@/lib/db'
import { buildRankings } from '@/lib/ranking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await getPartyDb()
  const { roundSize } = await db.getSettings()
  const rankings = buildRankings(await db.listRuns(roundSize))
  return NextResponse.json(rankings)
}
