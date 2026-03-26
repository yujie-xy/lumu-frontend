import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** GET /api/likes/summary?contentType=x&targetIds=1,2,3 */
export async function fetchLikeSummary(contentType, targetIds) {
  const ids = targetIds.join(',')
  const res  = await fetch(`/api/likes/summary?contentType=${contentType}&targetIds=${ids}`, {
    headers: authHeaders(),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // LikeSummaryVo[]
}

/** POST /api/likes/toggle */
export async function toggleLike(contentType, targetId) {
  const res  = await fetch('/api/likes/toggle', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ contentType, targetId }),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // LikeSummaryVo (updated state)
}

/** GET /api/comments?contentType=x&targetId=1 */
export async function fetchComments(contentType, targetId) {
  const res  = await fetch(`/api/comments?contentType=${contentType}&targetId=${targetId}`)
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // CommentVo[]
}

/** POST /api/comments */
export async function postComment(contentType, targetId, content) {
  const res  = await fetch('/api/comments', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ contentType, targetId, content }),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // CommentVo
}

/** DELETE /api/comments/{id} */
export async function deleteComment(id) {
  const res  = await fetch(`/api/comments/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
}

// ── 后台管理接口 ──────────────────────────────────────────────

/**
 * GET /api/admin/comments?contentType=&keyword=&targetId=
 * 支持任意组合，空值不传
 */
export async function fetchAdminComments({ contentType, keyword, targetId } = {}) {
  const params = new URLSearchParams()
  if (contentType) params.set('contentType', contentType)
  if (keyword)     params.set('keyword',     keyword)
  if (targetId)    params.set('targetId',    targetId)
  const qs  = params.toString() ? `?${params}` : ''
  const res = await fetch(`/api/admin/comments${qs}`, { headers: authHeaders() })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data
}

/** DELETE /api/admin/comments/{id} */
export async function deleteAdminComment(id) {
  const res  = await fetch(`/api/admin/comments/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
}