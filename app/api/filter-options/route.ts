import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-sql'
import { getDashboardFilterOptions } from '@/lib/dashboard-db'
import type { ApiResponse, FilterOptions } from '@/types/api'

export async function GET(): Promise<NextResponse<ApiResponse<FilterOptions>>> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response as NextResponse<ApiResponse<FilterOptions>>

    const options = await getDashboardFilterOptions(auth.profile.userId)

    return NextResponse.json({
      data: {
        suppliers: options.suppliers,
        buyers: options.buyers,
        verticals: options.products,
        date_range: options.dateRange,
      },
      error: null,
    })
  } catch (error) {
    console.error('Error in /api/filter-options:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

