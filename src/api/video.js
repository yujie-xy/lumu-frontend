import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function parseBody(res) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    if (!res.ok) return { msg: text }
    throw new Error('请求失败')
  }
}

function unwrapData(res, data) {
  if (!res.ok) {
    const msg = data?.msg || data?.message || ((res.status === 401 || res.status === 403)
      ? '无权限，请重新登录'
      : `请求失败 (${res.status})`)
    throw new Error(msg)
  }

  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || data.message || '请求失败')
    return data.data
  }

  if (data && typeof data === 'object' && 'data' in data && Object.keys(data).length <= 3) {
    return data.data
  }

  return data
}

async function req(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(path, opts)
  const data = await parseBody(res)
  return unwrapData(res, data)
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function normalizeVideoItem(item) {
  if (!item || typeof item !== 'object') return item

  const images = Array.isArray(item.images)
    ? item.images.filter((image) => typeof image === 'string' && image.trim())
    : []

  return {
    ...item,
    id: item.id ?? item.videoId ?? item.uuid ?? null,
    title: pickString(item.title, item.name),
    body: pickString(item.body, item.content, item.description),
    resourceUrl: pickString(
      item.resourceUrl,
      item.videoUrl,
      item.url,
      item.link,
    ),
    imageUrl: pickString(
      item.imageUrl,
      item.coverImageUrl,
      item.firstImageUrl,
      images[0],
    ),
    coverImageUrl: pickString(
      item.coverImageUrl,
      item.imageUrl,
      item.firstImageUrl,
      images[0],
    ),
    firstImageUrl: pickString(
      item.firstImageUrl,
      item.coverImageUrl,
      item.imageUrl,
      images[0],
    ),
    images,
    isPinned: Boolean(item.isPinned ?? item.pinned),
    status: pickString(item.status) || 'PUBLISHED',
    createdAt: pickString(item.createdAt, item.updatedAt),
  }
}

function normalizeVideoList(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.videos)
      ? data.videos
      : Array.isArray(data?.items)
        ? data.items
        : []

  return list.map(normalizeVideoItem)
}

// ContentRequest: { title, body, resourceUrl, status }
export async function fetchVideos() {
  return normalizeVideoList(await req('GET', '/api/videos'))
}

export async function createVideo(body) {
  return normalizeVideoItem(await req('POST', '/api/videos', body))
}

export async function updateVideo(id, body) {
  return normalizeVideoItem(await req('PUT', `/api/videos/${id}`, body))
}

export function deleteVideo(id) {
  return req('DELETE', `/api/videos/${id}`)
}

// VoteRequest: { voteType: "LIKE" | "DISLIKE" }
export function voteVideo(id, voteType = 'LIKE') {
  return req('POST', `/api/videos/${id}/vote`, { voteType })
}

export function pinVideo(id) {
  return req('POST', `/api/videos/${id}/pin`)
}

export function unpinVideo(id) {
  return req('DELETE', `/api/videos/${id}/pin`)
}
