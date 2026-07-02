// src/app/api/nutrition/scan/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchProductByBarcode } from '@/lib/open-food-facts'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const memberId = cookieStore.get('gymmaster_member_id')?.value
  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')?.trim()

  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 })
  }

  const product = await fetchProductByBarcode(barcode)

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ product })
}
