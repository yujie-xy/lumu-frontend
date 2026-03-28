import { getToken } from '@/composables/useAuth.js'

export const SUPPORTED_VOTE_CONTENT_TYPES = ['world', 'video', 'photo', 'forum_post']
export const SUPPORTED_COMMENT_CONTENT_TYPES = ['forum_post']

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() }
}

function unwrapData(res, data, fallbackMsg) {
  if (!res.ok) {
    throw new Error(data?.msg || fallbackMsg || `操作失败 (${res.status})`)
  }
  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || fallbackMsg || '操作失败')
    return data.data
  }
  return data
}

async function apiReq(method, path, body) {
  const opts = { method, headers: body !== undefined ? jsonHeaders() : authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return unwrapData(res, data, '操作失败')
}

function contentBasePath(contentType) {
  const map = {
    world: '/api/worlds',
    video: '/api/videos',
    photo: '/api/photos',
    forum_post: '/api/forum/posts',
  }
  const base = map[contentType]
  if (!base) throw new Error(`不支持的内容类型: ${contentType}`)
  return base
}

export function voteContent(contentType, id, voteType = 'LIKE') {
  const base = contentBasePath(contentType)
  return apiReq('POST', `${base}/${id}/vote`, { voteType })
}

export async function fetchPostComments(postId) {
  const res = await fetch(`/api/forum/posts/${postId}/comments`)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return unwrapData(res, data, '获取评论失败') || []
}

export async function postForumComment(postId, content) {
  const res = await fetch(`/api/forum/posts/${postId}/comments`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ content }),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return unwrapData(res, data, '发送评论失败')
}

export async function fetchLikeSummary() {
  return []
}

export async function toggleLike(contentType, targetId) {
  return voteContent(contentType, targetId, 'LIKE')
}

export async function fetchComments(contentType, targetId) {
  if (contentType === 'forum_post') return fetchPostComments(targetId)
  return []
}

export async function postComment(contentType, targetId, content) {
  if (contentType === 'forum_post') return postForumComment(targetId, content)
  throw new Error('评论功能仅支持论坛帖子')
}

export async function deleteComment() {
  throw new Error('后端暂不支持删除评论')
}

export async function fetchAdminComments() {
  return []
}

export async function deleteAdminComment() {
  throw new Error('后端暂不支持该操作')
}
