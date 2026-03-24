import crypto from 'crypto'

export type TwitchExtensionClaims = {
  channel_id?: string
  opaque_user_id?: string
  role?: 'viewer' | 'moderator' | 'broadcaster' | 'external'
  user_id?: string
  pubsub_perms?: {
    send?: string[]
  }
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

export function verifyExtensionJwt(token: string) {
  const secret = process.env.TWITCH_EXTENSION_SECRET
  if (!secret) {
    throw new Error('Missing TWITCH_EXTENSION_SECRET')
  }

  const [headerB64, payloadB64, signatureB64] = token.split('.')
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid extension JWT')
  }

  const signedPart = `${headerB64}.${payloadB64}`
  const expected = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(signedPart)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  if (expected !== signatureB64) {
    throw new Error('Extension JWT signature check failed')
  }

  const claims = JSON.parse(base64UrlDecode(payloadB64).toString('utf8')) as TwitchExtensionClaims
  return claims
}
