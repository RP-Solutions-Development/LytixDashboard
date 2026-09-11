import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-sql'
import { getDashboardSuppliers } from '@/lib/dashboard-db'
import { parseFilters } from '@/lib/parse-filters'
import type { ApiResponse, SuppliersData } from '@/types/api'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<SuppliersData>>> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response as NextResponse<ApiResponse<SuppliersData>>

    const f = parseFilters(req)
    const result = await getDashboardSuppliers(
      auth.profile.userId,
      f.dateFrom,
      f.dateTo,
      f.page,
      f.pageSize,
      f.sortBy,
      (f.sortDir ?? 'desc') as 'asc' | 'desc',
      f.buyers || undefined,
      f.verticals || undefined
    )

    return NextResponse.json({
      data: { rows: result.data, total: result.totalCount, page: f.page, page_size: f.pageSize },
      error: null,
    })
  } catch (error) {
    console.error('Error in /api/suppliers:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

