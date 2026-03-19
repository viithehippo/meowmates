'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  twitch_login: string
  twitch_display_name: string
  move_style: string
  idle_url: string | null
  walk_url: string | null
  dance_url: string | null
}

type UploadKind = 'idle' | 'walk' | 'dance'

type AssetCardProps = {
  label: string
  hint: string
  previewUrl: string | null
  onFileChange: (file: File | null) => void
}

const MOVE_STYLES = [
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

function AssetCard({ label, hint, previewUrl, onFileChange }: AssetCardProps) {
  const inputId = `upload-${label.toLowerCase()}`

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
      <div className="mb-4 aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-[#10172b]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-white/40">
            Upload a square-friendly {label.toLowerCase()} image to preview it here.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="text-lg font-bold">{label}</h3>
          <p className="text-sm leading-6 text-white/58">{hint}</p>
        </div>

        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/14 bg-white/7 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
        >
          Choose image
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/gif,image/png,image/webp"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [moveStyle, setMoveStyle] = useState('normal')
  const [idleFile, setIdleFile] = useState<File | null>(null)
  const [walkFile, setWalkFile] = useState<File | null>(null)
  const [danceFile, setDanceFile] = useState<File | null>(null)

  useEffect(() => {
    void loadProfile()
  }, [])

  useEffect(() => {
    if (statusMessage) {
      const timeout = window.setTimeout(() => setStatusMessage(null), 2600)
      return () => window.clearTimeout(timeout)
    }
  }, [statusMessage])

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('meowmate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setProfile(data)
    setMoveStyle(data?.move_style ?? 'normal')
    setLoading(false)
  }

  async function uploadFile(file: File, type: UploadKind) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not logged in')
    }

    if (file.size > 4 * 1024 * 1024) {
      throw new Error('Please keep files under 4MB.')
    }

    const fileExt = file.name.split('.').pop() || 'gif'
    const filePath = `${user.id}/${type}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('meowmates-assets')
      .upload(filePath, file, {
        upsert: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data } = supabase.storage
      .from('meowmates-assets')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSave() {
    if (!profile) {
      return
    }

    setSaving(true)
    setStatusMessage(null)

    try {
      const updates: Partial<Profile> & { move_style?: string } = {}

      if (idleFile) {
        updates.idle_url = await uploadFile(idleFile, 'idle')
      }

      if (walkFile) {
        updates.walk_url = await uploadFile(walkFile, 'walk')
      }

      if (danceFile) {
        updates.dance_url = await uploadFile(danceFile, 'dance')
      }

      if (profile.move_style !== moveStyle) {
        updates.move_style = moveStyle
      }

      if (Object.keys(updates).length === 0) {
        setStatusMessage('Nothing changed yet.')
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('meowmate_profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) {
        throw new Error(error.message)
      }

      setIdleFile(null)
      setWalkFile(null)
      setDanceFile(null)
      setStatusMessage('Changes saved.')
      await loadProfile()
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Something went wrong.'
      )
    } finally {
      setSaving(false)
    }
  }

  const idlePreview = useMemo(() => {
    return idleFile ? URL.createObjectURL(idleFile) : profile?.idle_url ?? null
  }, [idleFile, profile?.idle_url])

  const walkPreview = useMemo(() => {
    return walkFile ? URL.createObjectURL(walkFile) : profile?.walk_url ?? null
  }, [walkFile, profile?.walk_url])

  const dancePreview = useMemo(() => {
    return danceFile ? URL.createObjectURL(danceFile) : profile?.dance_url ?? null
  }, [danceFile, profile?.dance_url])

  useEffect(() => {
    return () => {
      if (idleFile && idlePreview) URL.revokeObjectURL(idlePreview)
      if (walkFile && walkPreview) URL.revokeObjectURL(walkPreview)
      if (danceFile && dancePreview) URL.revokeObjectURL(dancePreview)
    }
  }, [danceFile, dancePreview, idleFile, idlePreview, walkFile, walkPreview])

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/12 bg-white/6 p-6 text-white/78 backdrop-blur-xl">
          Loading your Meowmate...
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/12 bg-white/6 p-6 text-white/78 backdrop-blur-xl">
          We couldn&apos;t load your profile right now.
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col gap-5 rounded-[34px] border border-white/12 bg-white/6 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-3">
            <img
              src="/meowmates-logo.png"
              alt="Meowmates"
              className="w-full max-w-[320px]"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/42">
                My Meowmate
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                {profile.twitch_display_name}
              </h1>
              <p className="mt-2 text-sm leading-7 text-white/64 sm:text-base">
                Pick your style, preview each square image, and save when it all
                looks right.
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#10172b]/95 p-4 sm:min-w-[250px]">
            <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.26em] text-white/45">
              Move Style
            </label>
            <select
              value={moveStyle}
              onChange={(event) => setMoveStyle(event.target.value)}
              className="w-full rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-white outline-none transition focus:border-sky-300/55"
            >
              {MOVE_STYLES.map((style) => (
                <option key={style} value={style} className="bg-[#111827]">
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <AssetCard
            label="Idle"
            hint="How your pet looks while resting."
            previewUrl={idlePreview}
            onFileChange={setIdleFile}
          />
          <AssetCard
            label="Walk"
            hint="Used when your pet is moving around."
            previewUrl={walkPreview}
            onFileChange={setWalkFile}
          />
          <AssetCard
            label="Dance"
            hint="Used for fun moments and celebrations."
            previewUrl={dancePreview}
            onFileChange={setDanceFile}
          />
        </section>

        <section className="flex flex-col gap-4 rounded-[30px] border border-white/12 bg-white/6 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-bold">Save your changes</h2>
            <p className="mt-1 text-sm leading-7 text-white/64">
              Your viewers only need the clean version — no raw links, no codes,
              no clutter.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {statusMessage ? (
              <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/80">
                {statusMessage}
              </span>
            ) : null}

            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex min-w-[170px] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 via-amber-300 to-sky-400 px-6 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
