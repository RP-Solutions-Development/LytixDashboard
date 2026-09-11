import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-sql'
import { getDashboardGeo } from '@/lib/dashboard-db'
import { parseFilters } from '@/lib/parse-filters'
import type { ApiResponse, GeoData } from '@/types/api'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<GeoData>>> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response as NextResponse<ApiResponse<GeoData>>

    const f = parseFilters(req)
    const data = await getDashboardGeo(
      auth.profile.userId,
      f.dateFrom,
      f.dateTo,
      f.suppliers || undefined,
      f.buyers || undefined,
      f.verticals || undefined
    )

    return NextResponse.json({ data: data as GeoData, error: null })
  } catch (error) {
    console.error('Error in /api/geo:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

