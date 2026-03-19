import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

const TYPE_TO_COLUMN = {
  idle: 'idle_url',
  walk: 'walk_url',
  dance: 'dance_url',
} as const

export async function GET(
  _request: Request,
  context: { params: Promise<{ login: string; type: string }> }
) {
  const { login, type } = await context.params
  const normalizedLogin = login.toLowerCase()
  const normalizedType = type.toLowerCase() as keyof typeof TYPE_TO_COLUMN

  if (!TYPE_TO_COLUMN[normalizedType]) {
    return new NextResponse('Invalid asset type', { status: 400 })
  }

  const column = TYPE_TO_COLUMN[normalizedType]

  const { data: profile, error } = await adminSupabase
    .from('meowmate_profiles')
    .select(`twitch_login, ${column}`)
    .eq('twitch_login', normalizedLogin)
    .maybeSingle()

  if (error) {
    return new NextResponse(error.message, { status: 500 })
  }

  if (!profile) {
    return new NextResponse('User not found', { status: 404 })
  }

  const assetUrl = profile[column as keyof typeof profile] as string | null

  if (!assetUrl) {
    return new NextResponse('Asset not set', { status: 404 })
  }

  const upstream = await fetch(assetUrl, {
    cache: 'no-store',
  })

  if (!upstream.ok) {
    return new NextResponse('Failed to fetch upstream asset', { status: 502 })
  }

  const contentType =
    upstream.headers.get('content-type') || 'application/octet-stream'

  const arrayBuffer = await upstream.arrayBuffer()

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}