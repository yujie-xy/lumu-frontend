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

// ── 视频标签（独立，不与相册共享）─────────────────────────────
export function fetchVideoLabels()                        { return req('GET',    '/api/video-labels') }
export function createVideoLabel(name, sortOrder)         { return req('POST',   '/api/video-labels', { name, sortOrder: sortOrder ?? 0 }) }
export function updateVideoLabel(id, name, sortOrder)     { return req('PUT',    `/api/video-labels/${id}`, { name, sortOrder: sortOrder ?? 0 }) }
export function deleteVideoLabel(id)                      { return req('DELETE', `/api/video-labels/${id}`) }

// ── 视频 ──────────────────────────────────────────────────────
export function fetchVideos(labelId)    { return req('GET',    labelId ? `/api/videos?labelId=${labelId}` : '/api/videos') }
export function createVideo(body)       { return req('POST',   '/api/videos', body) }
export function updateVideo(id, body)   { return req('PUT',    `/api/videos/${id}`, body) }
export function deleteVideo(id)         { return req('DELETE', `/api/videos/${id}`) }

// ── 封面自动解析（B站）────────────────────────────────────────
// 返回封面图 URL 字符串，无法解析时返回空字符串
export async function fetchVideoCoverUrl(videoUrl) {
  const data = await req('GET', `/api/resolve-cover?videoUrl=${encodeURIComponent(videoUrl)}`)
  return (data && data.coverUrl) || ''
}