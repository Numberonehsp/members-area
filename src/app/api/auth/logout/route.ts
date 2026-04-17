import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear all auth cookies
  response.cookies.delete('gymmaster_token')
  response.cookies.delete('gymmaster_member_id')
  response.cookies.delete('gymmaster_first_name')

  return response
}
