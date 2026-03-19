'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AssetType = 'idle' | 'walk' | 'dance'
type MoveStyle =
  | 'normal'
  | 'bird'
  | 'spider'
  | 'rocket'
  | 'gremlin'
  | 'penguin'
  | 'jelly'
  | 'orbit'
  | 'train'
  | 'boss'
  | 'ninja'
  | 'slinky'

type Profile = {
  id: string
  user_id: string
  twitch_login: string
  twitch_display_name: string
  move_style: MoveStyle
  idle_url: string | null
  walk_url: string | null
  dance_url: string | null
}

const MOVE_STYLES: MoveStyle[] = [
  'normal',
  'bird',
  'spider',
  'rocket',
  'gremlin',
  'penguin',
  'jelly',
  'orbit',
  'train',
  'boss',
  'ninja',
  'slinky',
]

export default function DashboardPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const [idleFile, setIdleFile] = useState<File | null>(null)
  const [walkFile, setWalkFile] = useState<File | null>(null)
  const [danceFile, setDanceFile] = useState<File | null>(null)

  const [moveStyle, setMoveStyle] = useState<MoveStyle>('normal')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setStatus('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setLoading(false)
      setStatus('Could not load your account.')
      return
    }

    const { data, error } = await supabase
      .from('meowmate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      setLoading(false)
      setStatus(error?.message || 'Could not load your profile.')
      return
    }

    setProfile(data as Profile)
    setMoveStyle((data.move_style as MoveStyle) || 'normal')
    setLoading(false)
  }

  async function deleteExistingFiles(userId: string, type: AssetType) {
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('meowmates-assets')
      .list(userId)

    if (listError || !existingFiles) {
      return
    }

    const toDelete = existingFiles
      .filter((file) => file.name.startsWith(type))
      .map((file) => `${userId}/${file.name}`)

    if (toDelete.length > 0) {
      await supabase.storage.from('meowmates-assets').remove(toDelete)
    }
  }

  async function uploadFile(file: File, type: AssetType) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setStatus('You are not logged in.')
      return null
    }

    await deleteExistingFiles(user.id, type)

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'gif'
    const filePath = `${user.id}/${type}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('meowmates-assets')
      .upload(filePath, file)

    if (uploadError) {
      setStatus(uploadError.message)
      return null
    }

    const { data } = supabase.storage
      .from('meowmates-assets')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSave() {
    if (!profile) return

    setSaving(true)
    setStatus('Saving changes...')

    const updates: Partial<Profile> & { move_style: MoveStyle } = {
      move_style: moveStyle,
    }

    if (idleFile) {
      const url = await uploadFile(idleFile, 'idle')
      if (url) updates.idle_url = url
    }

    if (walkFile) {
      const url = await uploadFile(walkFile, 'walk')
      if (url) updates.walk_url = url
    }

    if (danceFile) {
      const url = await uploadFile(danceFile, 'dance')
      if (url) updates.dance_url = url
    }

    const { error } = await supabase
      .from('meowmate_profiles')
      .update(updates)
      .eq('id', profile.id)

    if (error) {
      setSaving(false)
      setStatus(error.message)
      return
    }

    setIdleFile(null)
    setWalkFile(null)
    setDanceFile(null)
    setStatus('Changes saved.')
    await loadProfile()
    setSaving(false)
  }

  async function handleClear(type: AssetType) {
    if (!profile) return

    const confirmed = window.confirm(
      `Remove your ${type} animation? This cannot be undone.`
    )

    if (!confirmed) return

    setSaving(true)
    setStatus(`Removing ${type} animation...`)

    const columnMap: Record<AssetType, keyof Profile> = {
      idle: 'idle_url',
      walk: 'walk_url',
      dance: 'dance_url',
    }

    const column = columnMap[type]

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('meowmate_profiles')
      .update({ [column]: null })
      .eq('id', profile.id)

    if (error) {
      setSaving(false)
      setStatus(error.message)
      return
    }

    if (user) {
      await deleteExistingFiles(user.id, type)
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            [column]: null,
          }
        : prev
    )

    if (type === 'idle') setIdleFile(null)
    if (type === 'walk') setWalkFile(null)
    if (type === 'dance') setDanceFile(null)

    setSaving(false)
    setStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} removed.`)
  }

  function renderPreview(type: AssetType, url: string | null) {
    return (
      <div className="bg-white/5 rounded-2xl p-4 text-center space-y-3 border border-white/10">
        <p className="capitalize text-sm font-medium tracking-wide">{type}</p>

        <div className="w-full aspect-square bg-black/40 rounded-xl flex items-center justify-center overflow-hidden border border-white/10">
          {url ? (
            <img
              src={url}
              alt={`${type} preview`}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs text-white/45">No image</span>
          )}
        </div>

        <label className="block">
          <span className="sr-only">Choose {type} image</span>
          <input
            type="file"
            accept="image/gif,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              if (type === 'idle') setIdleFile(file)
              if (type === 'walk') setWalkFile(file)
              if (type === 'dance') setDanceFile(file)
            }}
            className="block w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black hover:file:opacity-90"
          />
        </label>

        {url ? (
          <button
            type="button"
            onClick={() => handleClear(type)}
            disabled={saving}
            className="text-xs rounded-lg px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            Remove
          </button>
        ) : (
          <div className="h-[34px]" />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-6">
        <div className="text-white/70">Loading your Meowmate...</div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Could not load your Meowmate.</p>
          {status ? <p className="text-sm text-white/60">{status}</p> : null}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-4 pt-4">
          <img
            src="/meowmates-logo.png"
            alt="Meowmates"
            className="mx-auto w-48 max-w-full"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              Customize Your Meowmate
            </h1>
            <p className="text-sm text-white/60 mt-2">
              Upload your animations, pick a move style, and save your changes.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/60 mb-2">Move Style</p>
          <select
            value={moveStyle}
            onChange={(e) => setMoveStyle(e.target.value as MoveStyle)}
            disabled={saving}
            className="w-full rounded-xl bg-black/50 border border-white/10 p-3 text-white outline-none"
          >
            {MOVE_STYLES.map((style) => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderPreview('idle', profile.idle_url)}
          {renderPreview('walk', profile.walk_url)}
          {renderPreview('dance', profile.dance_url)}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">
            Supported formats: GIF, PNG, WEBP
          </p>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {status ? (
          <p className="text-center text-sm text-white/65">{status}</p>
        ) : null}
      </div>
    </main>
  )
}