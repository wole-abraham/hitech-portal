'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PageShell, T, inp, FieldLabel, SaveBtn } from '@/components/PageShell'
import Select from '@/components/Select'

interface Profile {
  id: number
  name: string
  role: string
  status: string
  phone_number: string
  email: string
  project_name: string
  section_name: string
  notes: string
  profile_picture: string | null
  fingerprint_id: string | null
  date_of_birth: string | null
  nationality: string | null
  gender: string | null
  date_added: string | null
}

const GENDERS = ['Male', 'Female', 'Other']
type FpState = 'idle' | 'scanning' | 'verifying' | 'done'

function FingerprintScanner({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [state, setState]       = useState<FpState>(value ? 'done' : 'idle')
  const [progress, setProgress] = useState(value ? 100 : 0)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setState(value ? 'done' : 'idle')
    setProgress(value ? 100 : 0)
  }, [value])

  function startScan() {
    setState('scanning'); setProgress(0)
    let p = 0
    intervalRef.current = setInterval(() => {
      p += Math.random() * 6 + 2
      if (p >= 100) { p = 100; clearInterval(intervalRef.current!) }
      setProgress(Math.floor(p))
    }, 60)
    timerRef.current = setTimeout(() => {
      setState('verifying')
      setTimeout(() => {
        const bytes = new Uint8Array(4)
        crypto.getRandomValues(bytes)
        const id = 'FP-' + Array.from(bytes).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join('')
        onChange(id); setState('done'); setProgress(100)
      }, 700)
    }, 2400)
  }

  function rescan() {
    if (timerRef.current)    clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    onChange(''); setState('idle'); setProgress(0)
  }

  const scanning  = state === 'scanning'
  const verifying = state === 'verifying'
  const done      = state === 'done'
  const active    = scanning || verifying
  const ridgeColor  = done ? '#34d399' : '#f59e0b'
  const borderColor = done ? '#34d399' : active ? '#f59e0b' : 'rgba(242,237,227,0.18)'
  const bgColor     = done ? 'rgba(52,211,153,0.06)' : active ? 'rgba(245,158,11,0.06)' : 'rgba(242,237,227,0.03)'
  const statusMsg   = done ? 'Identity confirmed' : verifying ? 'Verifying…' : scanning ? `Scanning… ${progress}%` : 'Place finger on sensor'
  const RINGS = [
    { rx:5,ry:3,trim:0 },{ rx:10,ry:7,trim:15 },{ rx:15,ry:11,trim:20 },
    { rx:20,ry:15,trim:25 },{ rx:25,ry:19,trim:28 },{ rx:30,ry:23,trim:30 },
    { rx:35,ry:27,trim:32 },{ rx:39,ry:31,trim:34 },{ rx:43,ry:35,trim:36 },
  ]
  const clipH = (progress / 100) * 96

  return (
    <div style={{
      background:'rgba(242,237,227,0.03)', border:`1px solid ${borderColor}`,
      borderRadius:16, padding:'20px 16px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      transition:'border-color 0.4s',
      boxShadow: active ? `0 0 18px ${T.amber}18` : done ? '0 0 18px rgba(52,211,153,0.12)' : 'none',
    }}>
      <div style={{
        position:'relative', width:108, height:108, borderRadius:'50%',
        background:bgColor, border:`2px solid ${borderColor}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden', transition:'all 0.4s',
        boxShadow: active ? `0 0 0 4px ${T.amber}18` : done ? '0 0 0 4px rgba(52,211,153,0.12)' : 'none',
      }}>
        <svg viewBox="0 0 96 96" width="86" height="86" style={{ position:'absolute', top:11, left:11 }}>
          <defs><clipPath id="fp-p-reveal"><rect x="0" y="0" width="96" height={clipH} /></clipPath></defs>
          {RINGS.map((r,i) => (
            <ellipse key={`d${i}`} cx="48" cy="52" rx={r.rx} ry={r.ry}
              fill="none" stroke="rgba(242,237,227,0.10)" strokeWidth="1.4"
              strokeDasharray={`${Math.max(0,Math.PI*2*r.rx-r.trim*2)} ${r.trim*2}`}
              strokeDashoffset={r.trim} />
          ))}
          <g clipPath="url(#fp-p-reveal)">
            {RINGS.map((r,i) => (
              <ellipse key={`l${i}`} cx="48" cy="52" rx={r.rx} ry={r.ry}
                fill="none" stroke={ridgeColor} strokeWidth="1.4"
                strokeDasharray={`${Math.max(0,Math.PI*2*r.rx-r.trim*2)} ${r.trim*2}`}
                strokeDashoffset={r.trim}
                style={{ filter:`drop-shadow(0 0 3px ${ridgeColor}80)`, transition:'stroke 0.4s' }} />
            ))}
          </g>
        </svg>
        {scanning && (
          <div style={{
            position:'absolute', left:0, right:0, height:3,
            background:`linear-gradient(90deg,transparent 0%,${T.amber} 40%,#fff8 50%,${T.amber} 60%,transparent 100%)`,
            top:`${progress}%`, boxShadow:`0 0 10px ${T.amber},0 0 20px ${T.amber}60`,
            transition:'top 0.06s linear', zIndex:4,
          }} />
        )}
        {verifying && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(17,15,12,0.55)', zIndex:5 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid rgba(245,158,11,0.2)`, borderTopColor:T.amber, animation:'spin 0.7s linear infinite' }} />
          </div>
        )}
        {done && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(52,211,153,0.08)', zIndex:5 }}>
            <svg viewBox="0 0 40 40" width="38" height="38">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#34d399" strokeWidth="2.5" opacity="0.6"/>
              <path d="M11 21 L17 27 L29 14" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {active && (
        <div style={{ width:'100%', height:3, background:'rgba(242,237,227,0.08)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:4, width:`${progress}%`, background:`linear-gradient(90deg,${T.amber}80,${T.amber})`, transition:'width 0.06s linear', boxShadow:`0 0 6px ${T.amber}` }} />
        </div>
      )}

      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:4 }}>
        {done && value && (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', fontWeight:700, color:'#34d399', letterSpacing:'0.12em', background:'rgba(52,211,153,0.08)', padding:'4px 12px', borderRadius:6 }}>
            {value}
          </div>
        )}
        <div style={{ fontSize:'0.72rem', fontWeight:600, color: done ? '#34d399' : active ? T.amber : T.sub, letterSpacing:'0.04em', transition:'color 0.3s' }}>
          {statusMsg}
        </div>
      </div>

      {!active && (
        <button type="button" onClick={done ? rescan : startScan} style={{
          padding:'9px 24px', borderRadius:10,
          background: done ? 'transparent' : T.amber,
          color: done ? T.muted : '#1a1410',
          border: done ? `1px solid ${T.border}` : 'none',
          fontWeight:700, fontSize:'0.78rem', fontFamily:'var(--font-display)',
          letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.18s',
        }}>
          {done ? '↺ Re-scan' : '⬡ Scan Fingerprint'}
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = { Active: '#34d399', Inactive: '#f87171', 'On Leave': '#f5c800' }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  /* editable fields */
  const [phone,       setPhone]       = useState('')
  const [dob,         setDob]         = useState('')
  const [gender,      setGender]      = useState('')
  const [nationality, setNationality] = useState('')
  const [notes,       setNotes]       = useState('')
  const [fpId,        setFpId]        = useState('')
  const [avatar,      setAvatar]      = useState<string | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/profile')
    if (!res.ok) { setLoading(false); return }
    const d: Profile = await res.json()
    setProfile(d)
    setPhone(d.phone_number || '')
    setDob(d.date_of_birth || '')
    setGender(d.gender || '')
    setNationality(d.nationality || '')
    setNotes(d.notes || '')
    setFpId(d.fingerprint_id || '')
    setAvatar(d.profile_picture || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/employees/upload-photo', { method: 'POST', body: fd })
    const d = await res.json()
    setUploading(false)
    if (d.url) { setAvatar(d.url); toast.success('Photo uploaded') }
    else toast.error('Upload failed')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phone,
        date_of_birth: dob || null,
        gender: gender || null,
        nationality: nationality || null,
        notes,
        profile_picture: avatar,
        fingerprint_id: fpId || null,
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Profile saved'); load() }
    else toast.error('Save failed')
  }

  if (loading) return (
    <PageShell title="My Profile">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[120,60,60,60,80].map((h,i) => (
          <div key={i} style={{ height:h, borderRadius:12, background:'rgba(242,237,227,0.05)', animation:'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    </PageShell>
  )

  if (!profile) return (
    <PageShell title="My Profile">
      <div style={{ textAlign:'center', padding:'60px 0', color:T.muted, fontSize:'0.9rem' }}>
        Profile not found — contact your administrator.
      </div>
    </PageShell>
  )

  const initials = profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)

  return (
    <PageShell title="My Profile" subtitle={profile.role}>
      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:520 }}>

        {/* Avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:80, height:80, borderRadius:'50%', overflow:'hidden',
              border:`2px solid ${T.amber}60`,
              background:'rgba(245,158,11,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:'1.6rem', fontWeight:800, color:T.amber, fontFamily:'var(--font-display)' }}>{initials}</span>
              }
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              position:'absolute', bottom:0, right:0,
              width:26, height:26, borderRadius:'50%',
              background:T.amber, border:'2px solid #110f0c',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:'0.7rem',
            }}>
              {uploading ? '…' : '✎'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:'1.1rem', color:T.text, fontFamily:'var(--font-display)' }}>
              {profile.name}
            </div>
            <div style={{ fontSize:'0.78rem', color:T.muted, marginTop:3 }}>{profile.email}</div>
            <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{
                fontSize:'0.65rem', fontWeight:700, padding:'3px 9px', borderRadius:5,
                background:`${STATUS_COLOR[profile.status] || T.muted}18`,
                color: STATUS_COLOR[profile.status] || T.muted,
                border:`1px solid ${STATUS_COLOR[profile.status] || T.muted}40`,
              }}>{profile.status}</span>
              {profile.date_added && (
                <span style={{ fontSize:'0.65rem', color:T.sub }}>
                  Joined {new Date(profile.date_added).toLocaleDateString('en-NG', { month:'short', year:'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Read-only info */}
        <div style={{ background:'rgba(242,237,227,0.03)', border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:'0.66rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.10em', color:T.sub, marginBottom:2 }}>Work Info</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
            {[
              { label:'Role',    value: profile.role    || '—' },
              { label:'Project', value: profile.project_name || '—' },
              { label:'Section', value: profile.section_name || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:T.sub, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:'0.82rem', color:T.text, fontWeight:500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable personal info */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:'0.66rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.10em', color:T.sub }}>Personal Info</div>

          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 000 000 0000"
              onFocus={e => { e.target.style.borderColor=T.amber; e.target.style.boxShadow=`0 0 0 3px ${T.amber}20` }}
              onBlur={e => { e.target.style.borderColor='rgba(242,237,227,0.18)'; e.target.style.boxShadow='none' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <FieldLabel>Date of Birth</FieldLabel>
              <input type="date" style={inp} value={dob} onChange={e => setDob(e.target.value)}
                onFocus={e => { e.target.style.borderColor=T.amber; e.target.style.boxShadow=`0 0 0 3px ${T.amber}20` }}
                onBlur={e => { e.target.style.borderColor='rgba(242,237,227,0.18)'; e.target.style.boxShadow='none' }} />
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              <Select value={gender} onChange={setGender} placeholder="Select"
                options={GENDERS.map(g => ({ value:g, label:g }))} />
            </div>
          </div>

          <div>
            <FieldLabel>Nationality</FieldLabel>
            <input style={inp} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Nigerian"
              onFocus={e => { e.target.style.borderColor=T.amber; e.target.style.boxShadow=`0 0 0 3px ${T.amber}20` }}
              onBlur={e => { e.target.style.borderColor='rgba(242,237,227,0.18)'; e.target.style.boxShadow='none' }} />
          </div>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea style={{ ...inp, minHeight:72, resize:'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about yourself…"
              onFocus={e => { e.target.style.borderColor=T.amber; e.target.style.boxShadow=`0 0 0 3px ${T.amber}20` }}
              onBlur={e => { e.target.style.borderColor='rgba(242,237,227,0.18)'; e.target.style.boxShadow='none' }} />
          </div>
        </div>

        <SaveBtn loading={saving} label="Save Profile" />

        {/* Fingerprint */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:'0.66rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.10em', color:T.sub }}>Biometrics</div>
          <FingerprintScanner value={fpId} onChange={id => {
            setFpId(id)
            if (id) {
              fetch('/api/profile', {
                method:'PATCH', headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify({ fingerprint_id: id }),
              }).then(() => toast.success('Fingerprint saved'))
            }
          }} />
        </div>

      </form>
    </PageShell>
  )
}
