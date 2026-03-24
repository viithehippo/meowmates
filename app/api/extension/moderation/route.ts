import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyExtensionJwt } from '@/lib/twitch-extension-auth'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('x-extension-jwt') || ''
    const claims = verifyExtensionJwt(token)
    if (!['broadcaster', 'moderator'].includes(claims.role || 'viewer')) {
      return bad('Not allowed', 403)
    }

    const body = await request.json()
    if (body.channelId !== claims.channel_id) {
      return bad('Channel mismatch', 403)
    }

    const action = body.action as 'approve' | 'reject' | 'remove'
    if (!['approve', 'reject', 'remove'].includes(action)) {
      return bad('Invalid action')
    }

    const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'removed'
    const supabase = await createClient()

    const { error } = await supabase
      .from('extension_pet_submissions')
      .update({ status: nextStatus, moderation_note: null })
      .eq('id', body.submissionId)
      .eq('channel_id', body.channelId)

    if (error) return bad(error.message, 500)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return bad(error instanceof Error ? error.message : 'Unknown error', 500)
  }
}
