import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyVisits } from '@/lib/gymmaster'

// GET /api/gymmaster/visits?memberId=1234&year=2026&month=4
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const memberId = searchParams.get('memberId')
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10)

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
  }

  if (month < 1 || month > 12 || isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
  }

  const data = await getMonthlyVisits(memberId, year, month)
  return NextResponse.json(data)
}
