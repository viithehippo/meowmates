import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  context: { params: Promise<{ login: string }> }
) {
  const { login } = await context.params
  const normalizedLogin = login.toLowerCase()

  const { data: profile, error } = await adminSupabase
    .from('meowmate_profiles')
    .select('twitch_login, move_style')
    .eq('twitch_login', normalizedLogin)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const baseUrl = new URL(request.url).origin

  return NextResponse.json({
    twitchLogin: profile.twitch_login,
    moveStyle: profile.move_style,

    idleUrl: `${baseUrl}/api/asset/${profile.twitch_login}/idle`,
    walkUrl: `${baseUrl}/api/asset/${profile.twitch_login}/walk`,
    danceUrl: `${baseUrl}/api/asset/${profile.twitch_login}/dance`,
  })
}