import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() }
}

async function apiReq(method, path, body) {
  const opts = { method, headers: body !== undefined ? jsonHeaders() : authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res  = await fetch(path, opts)
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '操作失败')
  return data.data
}

/**
 * 将 contentType 映射到 REST 路径前缀
 * 支持: world, video, photo, forum_post (用于 forum posts 投票)
 */
function contentBasePath(contentType) {
  const map = {
    world:      '/api/worlds',
    video:      '/api/videos',
    photo:      '/api/photos',
    forum_post: '/api/forum/posts',
  }
  const base = map[contentType]
  if (!base) throw new Error(`不支持的内容类型: ${contentType}`)
  return base
}

/**
 * 对内容投票
 * POST /{type}/{id}/vote
 * @param {string} contentType  - 'world' | 'video' | 'photo' | 'forum_post'
 * @param {number} id
 * @param {'LIKE'|'DISLIKE'} voteType
 */
export function voteContent(contentType, id, voteType = 'LIKE') {
  const base = contentBasePath(contentType)
  return apiReq('POST', `${base}/${id}/vote`, { voteType })
}

// ── Forum Comments ────────────────────────────────────────────

/** GET /forum/posts/{postId}/comments */
export async function fetchPostComments(postId) {
  const res  = await fetch(`/api/forum/posts/${postId}/comments`)
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '获取评论失败')
  return data.data   // CommentVo[]
}

/** POST /forum/posts/{postId}/comments */
export async function postForumComment(postId, content) {
  const res  = await fetch(`/api/forum/posts/${postId}/comments`, {
    method:  'POST',
    headers: jsonHeaders(),
    body:    JSON.stringify({ content }),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '发送评论失败')
  return data.data   // CommentVo
}

// ── Legacy shims (for components not yet migrated) ────────────

/**
 * @deprecated  不再有通用 like summary 接口，改用 voteContent
 */
export async function fetchLikeSummary() {
  return []
}

/**
 * @deprecated  改用 voteContent(contentType, id, 'LIKE')
 */
export async function toggleLike(contentType, targetId) {
  return voteContent(contentType, targetId, 'LIKE')
}

/**
 * @deprecated  评论仅支持 forum posts，改用 fetchPostComments(postId)
 */
export async function fetchComments(contentType, targetId) {
  if (contentType === 'forum_post') return fetchPostComments(targetId)
  return []
}

/**
 * @deprecated  改用 postForumComment(postId, content)
 */
export async function postComment(contentType, targetId, content) {
  if (contentType === 'forum_post') return postForumComment(targetId, content)
  throw new Error('评论功能仅支持论坛帖子')
}

/**
 * @deprecated  后端暂无通用删除评论接口
 */
export async function deleteComment() {
  throw new Error('后端暂不支持删除评论')
}

/**
 * @deprecated  后端暂无管理员评论列表接口
 */
export async function fetchAdminComments() {
  return []
}

/**
 * @deprecated  后端暂无管理员删除评论接口
 */
export async function deleteAdminComment() {
  throw new Error('后端暂不支持该操作')
}