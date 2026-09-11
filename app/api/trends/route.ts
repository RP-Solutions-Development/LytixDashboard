import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-sql'
import { getDashboardTrends } from '@/lib/dashboard-db'
import { parseFilters } from '@/lib/parse-filters'
import type { ApiResponse, TrendData } from '@/types/api'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<TrendData>>> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response as NextResponse<ApiResponse<TrendData>>

    const f = parseFilters(req)
    const data = await getDashboardTrends(
      auth.profile.userId,
      f.dateFrom,
      f.dateTo,
      (f.granularity ?? 'day') as 'day' | 'week' | 'month',
      f.suppliers || undefined,
      f.buyers || undefined,
      f.verticals || undefined
    )

    return NextResponse.json({ data: data as TrendData, error: null })
  } catch (error) {
    console.error('Error in /api/trends:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

