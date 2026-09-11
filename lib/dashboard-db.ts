import { getConnection, mssql } from './db/mssql'

export async function getDashboardKpis(
  userId: string,
  dateFrom: string,
  dateTo: string,
  supplierIds?: string[],
  buyerIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('SupplierIds', mssql.NVarChar, supplierIds ? JSON.stringify(supplierIds) : null)
      .input('BuyerIds', mssql.NVarChar, buyerIds ? JSON.stringify(buyerIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetKpis')

    return result.recordset[0] || null
  } catch (error) {
    console.error('Error getting dashboard KPIs:', error)
    throw error
  }
}

export async function getDashboardFinancials(
  userId: string,
  dateFrom: string,
  dateTo: string,
  supplierIds?: string[],
  buyerIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('SupplierIds', mssql.NVarChar, supplierIds ? JSON.stringify(supplierIds) : null)
      .input('BuyerIds', mssql.NVarChar, buyerIds ? JSON.stringify(buyerIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetFinancials')

    return result.recordset[0] || null
  } catch (error) {
    console.error('Error getting dashboard financials:', error)
    throw error
  }
}

export async function getDashboardTrends(
  userId: string,
  dateFrom: string,
  dateTo: string,
  granularity: 'day' | 'week' | 'month' = 'day',
  supplierIds?: string[],
  buyerIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('Granularity', mssql.VarChar, granularity)
      .input('SupplierIds', mssql.NVarChar, supplierIds ? JSON.stringify(supplierIds) : null)
      .input('BuyerIds', mssql.NVarChar, buyerIds ? JSON.stringify(buyerIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetTrends')

    return result.recordset
  } catch (error) {
    console.error('Error getting dashboard trends:', error)
    throw error
  }
}

export async function getDashboardSuppliers(
  userId: string,
  dateFrom: string,
  dateTo: string,
  page = 1,
  pageSize = 20,
  sortBy = 'total_leads',
  sortDir: 'asc' | 'desc' = 'desc',
  buyerIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('Page', mssql.Int, page)
      .input('PageSize', mssql.Int, Math.min(pageSize, 200))
      .input('SortBy', mssql.VarChar, sortBy)
      .input('SortDir', mssql.VarChar, sortDir)
      .input('BuyerIds', mssql.NVarChar, buyerIds ? JSON.stringify(buyerIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetSuppliers')

    return {
      data: result.recordset.filter((r: any) => r.total_count === undefined),
      totalCount: (result.recordset[0]?.total_count as number) || 0,
    }
  } catch (error) {
    console.error('Error getting dashboard suppliers:', error)
    throw error
  }
}

export async function getDashboardBuyers(
  userId: string,
  dateFrom: string,
  dateTo: string,
  page = 1,
  pageSize = 20,
  sortBy = 'total_leads',
  sortDir: 'asc' | 'desc' = 'desc',
  supplierIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('Page', mssql.Int, page)
      .input('PageSize', mssql.Int, Math.min(pageSize, 200))
      .input('SortBy', mssql.VarChar, sortBy)
      .input('SortDir', mssql.VarChar, sortDir)
      .input('SupplierIds', mssql.NVarChar, supplierIds ? JSON.stringify(supplierIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetBuyers')

    return {
      data: result.recordset.filter((r: any) => r.total_count === undefined),
      totalCount: (result.recordset[0]?.total_count as number) || 0,
    }
  } catch (error) {
    console.error('Error getting dashboard buyers:', error)
    throw error
  }
}

export async function getDashboardGeo(
  userId: string,
  dateFrom: string,
  dateTo: string,
  supplierIds?: string[],
  buyerIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('SupplierIds', mssql.NVarChar, supplierIds ? JSON.stringify(supplierIds) : null)
      .input('BuyerIds', mssql.NVarChar, buyerIds ? JSON.stringify(buyerIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetGeo')

    return result.recordset
  } catch (error) {
    console.error('Error getting dashboard geo:', error)
    throw error
  }
}

export async function getDashboardLeads(
  userId: string,
  dateFrom: string,
  dateTo: string,
  page = 1,
  pageSize = 50,
  sortBy = 'lead_at',
  sortDir: 'asc' | 'desc' = 'desc',
  supplierIds?: string[],
  buyerIds?: string[],
  productCodes?: string[]
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .input('DateFrom', mssql.Date, new Date(dateFrom))
      .input('DateTo', mssql.Date, new Date(dateTo))
      .input('Page', mssql.Int, page)
      .input('PageSize', mssql.Int, Math.min(pageSize, 200))
      .input('SortBy', mssql.VarChar, sortBy)
      .input('SortDir', mssql.VarChar, sortDir)
      .input('SupplierIds', mssql.NVarChar, supplierIds ? JSON.stringify(supplierIds) : null)
      .input('BuyerIds', mssql.NVarChar, buyerIds ? JSON.stringify(buyerIds) : null)
      .input('ProductCodes', mssql.NVarChar, productCodes ? JSON.stringify(productCodes) : null)
      .execute('dbo.Dashboard_GetLeads')

    return {
      data: result.recordset.filter((r: any) => r.total_count === undefined),
      totalCount: (result.recordset[0]?.total_count as number) || 0,
    }
  } catch (error) {
    console.error('Error getting dashboard leads:', error)
    throw error
  }
}

export async function getDashboardFilterOptions(userId: string) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('UserId', mssql.UniqueIdentifier, userId)
      .execute('dbo.Dashboard_GetFilterOptions')

    const recordsets = result.recordsets as any[]
    return {
      suppliers: recordsets[0] || [],
      buyers: recordsets[1] || [],
      products: recordsets[2] || [],
      dateRange: recordsets[3]?.[0] || { minDate: null, maxDate: null },
    }
  } catch (error) {
    console.error('Error getting filter options:', error)
    throw error
  }
}
