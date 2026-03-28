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

function normalizePhoto(item) {
  if (!item || typeof item !== 'object') return item
  const resourceUrl = item.resourceUrl || item.imageUrl || item.coverImageUrl || item.firstImageUrl || ''
  const imageUrl = item.imageUrl || item.coverImageUrl || item.firstImageUrl || resourceUrl || ''
  const pinned = Boolean(item.pinned ?? item.isPinned ?? false)

  return {
    ...item,
    title: item.title ?? '',
    body: item.body ?? item.source ?? '',
    resourceUrl,
    status: item.status ?? '',
    pinned,
    isPinned: pinned,
    createdAt: item.createdAt ?? '',
    imageUrl,
    coverImageUrl: item.coverImageUrl || imageUrl || '',
    firstImageUrl: item.firstImageUrl || imageUrl || '',
    source: item.source ?? '',
    content: item.content ?? item.body ?? item.source ?? '',
    description: item.description ?? '',
    date: item.date ?? '',
    dateLabel: item.dateLabel ?? '',
    images: normalizeImages(item.images),
    labels: Array.isArray(item.labels) ? item.labels : [],
    worldTag: item.worldTag ?? null,
    categoryTag: item.categoryTag ?? null,
    eventKey: item.eventKey ?? '',
  }
}

function normalizePhotoList(data) {
  return Array.isArray(data) ? data.map(normalizePhoto) : []
}

async function req(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return unwrapData(res, data)
}

export async function fetchPhotos() {
  return normalizePhotoList(await req('GET', '/api/photos'))
}

export async function fetchPhotoLabels() {
  return []
}

export function createPhoto(body) {
  return req('POST', '/api/photos', body).then(normalizePhoto)
}

export function updatePhoto(id, body) {
  return req('PUT', `/api/photos/${id}`, body).then(normalizePhoto)
}

export function deletePhoto(id) {
  return req('DELETE', `/api/photos/${id}`)
}

export function votePhoto(id, voteType = 'LIKE') {
  return req('POST', `/api/photos/${id}/vote`, { voteType })
}

export function pinPhoto(id) {
  return req('POST', `/api/photos/${id}/pin`).then(normalizePhoto)
}

export function unpinPhoto(id) {
  return req('DELETE', `/api/photos/${id}/pin`).then(normalizePhoto)
}
