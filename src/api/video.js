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

// ── 视频 CRUD ────────────────────────────────────────────────
// ContentRequest: { title, body, resourceUrl, status }
export function fetchVideos()             { return req('GET',    '/api/videos') }
export function createVideo(body)         { return req('POST',   '/api/videos', body) }
export function updateVideo(id, body)     { return req('PUT',    `/api/videos/${id}`, body) }
export function deleteVideo(id)           { return req('DELETE', `/api/videos/${id}`) }

// ── 投票 & 置顶 ───────────────────────────────────────────────
// VoteRequest: { voteType: "LIKE" | "DISLIKE" }
export function voteVideo(id, voteType = 'LIKE') { return req('POST',   `/api/videos/${id}/vote`, { voteType }) }
export function pinVideo(id)              { return req('POST',   `/api/videos/${id}/pin`) }
export function unpinVideo(id)            { return req('DELETE', `/api/videos/${id}/pin`) }