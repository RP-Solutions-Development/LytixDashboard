import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-sql'
import { getDashboardFinancials } from '@/lib/dashboard-db'
import { parseFilters } from '@/lib/parse-filters'
import type { ApiResponse, FinancialData } from '@/types/api'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<FinancialData>>> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response as NextResponse<ApiResponse<FinancialData>>

    const f = parseFilters(req)
    const data = await getDashboardFinancials(
      auth.profile.userId,
      f.dateFrom,
      f.dateTo,
      f.suppliers || undefined,
      f.buyers || undefined,
      f.verticals || undefined
    )

    return NextResponse.json({ data: data ?? null, error: null })
  } catch (error) {
    console.error('Error in /api/financials:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

