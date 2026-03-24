import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyExtensionJwt } from '@/lib/twitch-extension-auth'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function uploadAsset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  submissionId: string,
  type: 'idle' | 'walk' | 'dance',
  file: { data: string; type: string; name: string }
) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `extension-submissions/${submissionId}/${type}.${ext}`
  const buffer = Buffer.from(file.data, 'base64')

  const { error } = await supabase.storage
    .from('meowmates-assets')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('meowmates-assets').getPublicUrl(path)
  return data.publicUrl
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-extension-jwt') || ''
    const claims = verifyExtensionJwt(token)
    const channelId = request.nextUrl.searchParams.get('channelId')
    const view = request.nextUrl.searchParams.get('view') || 'me'

    if (!channelId || channelId !== claims.channel_id) {
      return bad('Channel mismatch', 403)
    }

    const supabase = await createClient()

    const { data: published, error: publishedError } = await supabase
      .from('extension_pet_submissions')
      .select('*')
      .eq('channel_id', channelId)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false })

    if (publishedError) return bad(publishedError.message, 500)

    if (view === 'moderation') {
      if (!['broadcaster', 'moderator'].includes(claims.role || 'viewer')) {
        return bad('Not allowed', 403)
      }

      const { data: queue, error: queueError } = await supabase
        .from('extension_pet_submissions')
        .select('*')
        .eq('channel_id', channelId)
        .eq('status', 'pending')
        .order('updated_at', { ascending: false })

      if (queueError) return bad(queueError.message, 500)
      return NextResponse.json({ queue: queue || [], published: published || [] })
    }

    const viewerUserId = claims.user_id || claims.opaque_user_id
    const { data: me, error: meError } = await supabase
      .from('extension_pet_submissions')
      .select('*')
      .eq('channel_id', channelId)
      .eq('twitch_user_id', viewerUserId)
      .maybeSingle()

    if (meError) return bad(meError.message, 500)
    return NextResponse.json({ me: me || null, published: published || [] })
  } catch (error) {
    return bad(error instanceof Error ? error.message : 'Unknown error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-extension-jwt') || ''
    const claims = verifyExtensionJwt(token)
    const body = await request.json()
    const channelId = body.channelId

    if (!channelId || channelId !== claims.channel_id) {
      return bad('Channel mismatch', 403)
    }
    if (!claims.user_id && !claims.opaque_user_id) {
      return bad('Missing Twitch user identity', 403)
    }

    const supabase = await createClient()
    const twitchUserId = claims.user_id || claims.opaque_user_id

    // IMPORTANT:
    // Resolve the linked Twitch user's login/display name on the server before production release.
    // The extension helper gives you the stable linked Twitch user ID after requestIdShare, but not the login/display name.
    // Use your server-side Twitch app credentials plus helix/users?id=<viewer_id> or your existing linked-account table.
    const login = body.twitch_login || twitchUserId
    const displayName = body.twitch_display_name || login

    const row = {
      channel_id: channelId,
      twitch_user_id: twitchUserId,
      twitch_login: login,
      twitch_display_name: displayName,
      move_style: body.move_style || 'normal',
      status: 'pending',
      moderation_note: null,
    }

    const { data: existing } = await supabase
      .from('extension_pet_submissions')
      .select('*')
      .eq('channel_id', channelId)
      .eq('twitch_user_id', twitchUserId)
      .maybeSingle()

    const { data: saved, error: upsertError } = existing
      ? await supabase
          .from('extension_pet_submissions')
          .update(row)
          .eq('id', existing.id)
          .select('*')
          .single()
      : await supabase
          .from('extension_pet_submissions')
          .insert(row)
          .select('*')
          .single()

    if (upsertError || !saved) return bad(upsertError?.message || 'Could not save submission', 500)

    const files = body.files || {}
    const assetUpdates: Record<string, string> = {}
    for (const type of ['idle', 'walk', 'dance'] as const) {
      if (!files[type]) continue
      assetUpdates[`${type}_url`] = await uploadAsset(supabase, saved.id, type, files[type])
    }

    if (Object.keys(assetUpdates).length) {
      const { error: assetError } = await supabase
        .from('extension_pet_submissions')
        .update(assetUpdates)
        .eq('id', saved.id)

      if (assetError) return bad(assetError.message, 500)
    }

    return NextResponse.json({ ok: true, id: saved.id })
  } catch (error) {
    return bad(error instanceof Error ? error.message : 'Unknown error', 500)
  }
}
