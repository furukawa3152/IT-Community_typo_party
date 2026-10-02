import { NextResponse } from 'next/server'

import { getPartyDb } from '@/lib/db'
import { buildRankings } from '@/lib/ranking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  const rankings = buildRankings(getPartyDb().listRuns())
  return NextResponse.json(rankings)
}
