// Module-level store — survives client-side navigation within the same session

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

let _state: UploadState = 'idle'
let _total = 0
let _done = 0
let _errors: string[] = []
let _listeners: Array<() => void> = []

function notify() { _listeners.forEach(fn => fn()) }

export function subscribeMediaQueue(fn: () => void) {
  _listeners.push(fn)
  return () => { _listeners = _listeners.filter(l => l !== fn) }
}

export function getMediaQueueState() {
  return { state: _state, total: _total, done: _done, errors: _errors }
}

async function uploadOne(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/reports/upload', { method: 'POST', body: fd })
  if (!r.ok) {
    let msg = `Upload failed (${r.status})`
    try { const d = await r.json(); if (d.error) msg = d.error } catch {}
    throw new Error(msg)
  }
  const d = await r.json()
  if (!d.url) throw new Error('No URL returned from upload')
  return d.url
}

export function startMediaUpload(reportId: number, photos: File[], videoFile: File | null) {
  const allFiles: { file: File; type: 'photo' | 'video' }[] = [
    ...photos.map(f => ({ file: f, type: 'photo' as const })),
    ...(videoFile ? [{ file: videoFile, type: 'video' as const }] : []),
  ]
  if (allFiles.length === 0) return

  _state = 'uploading'
  _total = allFiles.length
  _done = 0
  _errors = []
  notify()

  // Upload each file independently — a video failure won't block photos
  const uploads = allFiles.map(({ file, type }) =>
    uploadOne(file)
      .then(url => { _done++; notify(); return { url, type } })
      .catch((err: Error) => {
        _done++
        _errors.push(`${type}: ${err.message}`)
        notify()
        return { url: '', type }
      })
  )

  Promise.all(uploads)
    .then(async results => {
      const photoUrls = results.filter(r => r.type === 'photo').map(r => r.url).filter(Boolean)
      const videoUrl  = results.find(r => r.type === 'video')?.url || null

      if (photoUrls.length > 0 || videoUrl) {
        await fetch(`/api/reports/${reportId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_urls: photoUrls, video_url: videoUrl }),
        })
      }

      _state = _errors.length > 0 ? 'error' : 'done'
      notify()
    })
    .catch(() => {
      _state = 'error'
      notify()
    })
}
