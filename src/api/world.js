import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function normalizeImages(images) {
  if (!Array.isArray(images) || !images.length) return []
  return images
    .map((img, idx) => {
      const imageUrl = img?.imageUrl || img?.resourceUrl || img?.url || ''
      if (!imageUrl) return null
      return { ...img, id: img.id ?? idx, imageUrl }
    })
    .filter(Boolean)
}

function normalizeWorldItem(item) {
  if (!item || typeof item !== 'object') return item

  const resourceUrl = item.resourceUrl || item.coverImageUrl || item.firstImageUrl || item.imageUrl || ''
  const imageUrl = item.imageUrl || item.coverImageUrl || item.firstImageUrl || resourceUrl || ''
  const pinned = Boolean(item.pinned ?? item.isPinned ?? false)

  return {
    ...item,
    title: item.title ?? '',
    body: item.body ?? item.content ?? '',
    resourceUrl,
    status: item.status ?? '',
    pinned,
    isPinned: pinned,
    createdAt: item.createdAt ?? '',
    imageUrl,
    coverImageUrl: item.coverImageUrl || imageUrl || '',
    firstImageUrl: item.firstImageUrl || imageUrl || '',
    content: item.content ?? item.body ?? '',
    images: normalizeImages(item.images),
    labels: Array.isArray(item.labels) ? item.labels : [],
    worldTag: item.worldTag ?? null,
    categoryTag: item.categoryTag ?? null,
    eventKey: item.eventKey ?? '',
    date: item.date ?? '',
    dateLabel: item.dateLabel ?? '',
  }
}

function normalizeWorldList(data) {
  return Array.isArray(data) ? data.map(normalizeWorldItem) : []
}

function unwrapData(res, data) {
  if (!res.ok) {
    throw new Error(data?.msg || ((res.status === 401 || res.status === 403) ? '无权限，请重新登录' : `请求失败 (${res.status})`))
  }
  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || '请求失败')
    return data.data
  }
  return data
}

async function req(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return unwrapData(res, data)
}

export async function fetchWorlds() {
  return normalizeWorldList(await req('GET', '/api/worlds'))
}

export async function fetchWorldById(id) {
  const list = await fetchWorlds()
  const target = list.find((item) => String(item.id) === String(id))
  if (!target) throw new Error('内容不存在')
  return target
}

export function createWorld(body) {
  return req('POST', '/api/worlds', body).then(normalizeWorldItem)
}

export function updateWorld(id, body) {
  return req('PUT', `/api/worlds/${id}`, body).then(normalizeWorldItem)
}

export function deleteWorld(id) {
  return req('DELETE', `/api/worlds/${id}`)
}

export function voteWorld(id, voteType = 'LIKE') {
  return req('POST', `/api/worlds/${id}/vote`, { voteType })
}

export function pinWorld(id) {
  return req('POST', `/api/worlds/${id}/pin`).then(normalizeWorldItem)
}

export function unpinWorld(id) {
  return req('DELETE', `/api/worlds/${id}/pin`).then(normalizeWorldItem)
}

export async function fetchWorldTags() {
  return []
}

export async function fetchCategoryTags() {
  return []
}

export function fetchWorldPosts() {
  return fetchWorlds()
}

export function fetchWorldPost(id) {
  return fetchWorldById(id)
}

export { createWorld as createWorldPost }
export { updateWorld as updateWorldPost }
export { deleteWorld as deleteWorldPost }
export { pinWorld as pinWorldPost }
