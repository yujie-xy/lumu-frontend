import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function req(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  if (!res.ok) {
    const text = await res.text()
    let msg = (res.status === 401 || res.status === 403) ? '无权限，请重新登录' : `请求失败 (${res.status})`
    if (text) { try { const d = JSON.parse(text); if (d.msg) msg = d.msg } catch {} }
    throw new Error(msg)
  }
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '请求失败')
  return data.data
}

// ── 相册标签（独立，不与视频共享）─────────────────────────────
export function fetchPhotoLabels()                        { return req('GET',    '/api/photo-labels') }
export function createPhotoLabel(name, sortOrder)         { return req('POST',   '/api/photo-labels', { name, sortOrder: sortOrder ?? 0 }) }
export function updatePhotoLabel(id, name, sortOrder)     { return req('PUT',    `/api/photo-labels/${id}`, { name, sortOrder: sortOrder ?? 0 }) }
export function deletePhotoLabel(id)                      { return req('DELETE', `/api/photo-labels/${id}`) }

// ── 照片 ──────────────────────────────────────────────────────
export function fetchPhotos(labelId)    { return req('GET',    labelId ? `/api/photos?labelId=${labelId}` : '/api/photos') }
export function createPhoto(body)       { return req('POST',   '/api/photos', body) }
export function updatePhoto(id, body)   { return req('PUT',    `/api/photos/${id}`, body) }
export function deletePhoto(id)         { return req('DELETE', `/api/photos/${id}`) }