'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [idleFile, setIdleFile] = useState<File | null>(null)
  const [walkFile, setWalkFile] = useState<File | null>(null)
  const [danceFile, setDanceFile] = useState<File | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('meowmate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }

 async function uploadFile(file: File, type: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    alert('Not logged in')
    return null
  }

  const fileExt = file.name.split('.').pop() || 'gif'
  const filePath = `${user.id}/${type}-${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('meowmates-assets')
    .upload(filePath, file, {
      upsert: false,
    })

  if (error) {
    alert(error.message)
    return null
  }

  const { data } = supabase.storage
    .from('meowmates-assets')
    .getPublicUrl(filePath)

  return data.publicUrl
}

  async function handleSave() {
    let updates: any = {}

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

    if (Object.keys(updates).length === 0) {
      alert('Nothing to update')
      return
    }

    const { error } = await supabase
      .from('meowmate_profiles')
      .update(updates)
      .eq('id', profile.id)

    if (error) {
      alert(error.message)
      return
    }

    alert('Saved!')
    loadProfile()
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="rounded-xl border p-4">
          <h2 className="font-bold mb-2">Profile</h2>
          <p><strong>User:</strong> {profile.twitch_login}</p>
          <p><strong>Code:</strong> {profile.share_code}</p>
        </div>

        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="font-bold">Upload Animations</h2>

          <div>
            <p>Idle</p>
            <input type="file" onChange={(e) => setIdleFile(e.target.files?.[0] || null)} />
          </div>

          <div>
            <p>Walk</p>
            <input type="file" onChange={(e) => setWalkFile(e.target.files?.[0] || null)} />
          </div>

          <div>
            <p>Dance</p>
            <input type="file" onChange={(e) => setDanceFile(e.target.files?.[0] || null)} />
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 border rounded-lg"
          >
            Save Changes
          </button>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-bold mb-2">Current URLs</h2>
          <p>Idle: {profile.idle_url || 'None'}</p>
          <p>Walk: {profile.walk_url || 'None'}</p>
          <p>Dance: {profile.dance_url || 'None'}</p>
        </div>

        <div className="rounded-xl border p-4">
  <h2 className="font-bold mb-2">Public Links</h2>
  <p className="break-all">
    <strong>Profile Page:</strong>{' '}
    {typeof window !== 'undefined'
      ? `${window.location.origin}/user/${profile.twitch_login}/${profile.share_code}`
      : ''}
  </p>
  <p className="break-all mt-2">
    <strong>API URL:</strong>{' '}
    {typeof window !== 'undefined'
      ? `${window.location.origin}/api/user/${profile.twitch_login}/${profile.share_code}`
      : ''}
  </p>
</div>

      </div>
    </main>
  )
}