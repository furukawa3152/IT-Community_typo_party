import { NextResponse } from 'next/server'

import { getPartyDb } from '@/lib/db'
import { buildRankings } from '@/lib/ranking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await getPartyDb()
  const rankings = buildRankings(await db.listRuns())
  return NextResponse.json(rankings)
}
