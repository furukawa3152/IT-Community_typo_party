import { NextResponse } from 'next/server'

import { getPartyDb } from '@/lib/db'
import { parseCommunityName } from '@/lib/ranking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ communities: getPartyDb().listCommunities() })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'コミュニティ名の形式が不正です' }, { status: 400 })
  }

  const community =
    body && typeof body === 'object' && typeof (body as { community?: unknown }).community === 'string'
      ? parseCommunityName((body as { community: string }).community)
      : null
  if (!community) {
    return NextResponse.json({ error: 'コミュニティ名を確認してください' }, { status: 400 })
  }

  const db = getPartyDb()
  db.rememberCommunity(community)
  return NextResponse.json({ communities: db.listCommunities() })
}
