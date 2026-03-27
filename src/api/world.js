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

// ── 世界内容 CRUD ────────────────────────────────────────────
// ContentRequest: { title, body, resourceUrl, status }
export function fetchWorlds()              { return req('GET',    '/api/worlds') }
export function fetchWorldById(id)         { return req('GET',    `/api/worlds/${id}`) }
export function createWorld(body)          { return req('POST',   '/api/worlds', body) }
export function updateWorld(id, body)      { return req('PUT',    `/api/worlds/${id}`, body) }
export function deleteWorld(id)            { return req('DELETE', `/api/worlds/${id}`) }

// ── 投票 & 置顶 ───────────────────────────────────────────────
// VoteRequest: { voteType: "LIKE" | "DISLIKE" }
export function voteWorld(id, voteType = 'LIKE') { return req('POST',   `/api/worlds/${id}/vote`, { voteType }) }
export function pinWorld(id)               { return req('POST',   `/api/worlds/${id}/pin`) }
export function unpinWorld(id)             { return req('DELETE', `/api/worlds/${id}/pin`) }

// ── Legacy aliases for components using old world-posts naming ─
export { fetchWorlds as fetchWorldPosts }
export { fetchWorldById as fetchWorldPost }
export { createWorld as createWorldPost }
export { updateWorld as updateWorldPost }
export { deleteWorld as deleteWorldPost }
export { pinWorld as pinWorldPost }