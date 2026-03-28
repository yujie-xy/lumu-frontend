import { getToken } from '@/composables/useAuth.js'

async function parseJson(res) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('服务器返回了非法数据，请检查后端日志')
  }
  return data
}

function unwrapData(res, data, fallbackMsg) {
  if (!res.ok) {
    throw new Error(data?.msg || fallbackMsg || `请求失败 (${res.status})`)
  }
  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || fallbackMsg || '请求失败')
    return data.data
  }
  return data
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

function normalizeContentItem(item) {
  if (!item || typeof item !== 'object') return item

  const resourceUrl = item.resourceUrl || item.imageUrl || item.firstImageUrl || item.coverImageUrl || ''
  const imageUrl = item.imageUrl || item.coverImageUrl || item.firstImageUrl || resourceUrl || ''
  const body = item.body ?? item.content ?? item.description ?? ''
  const pinned = Boolean(item.pinned ?? item.isPinned ?? false)

  return {
    ...item,
    title: item.title ?? '',
    body,
    resourceUrl,
    status: item.status ?? '',
    pinned,
    isPinned: pinned,
    createdAt: item.createdAt ?? '',
    imageUrl,
    firstImageUrl: item.firstImageUrl || imageUrl || '',
    coverImageUrl: item.coverImageUrl || imageUrl || '',
    content: item.content ?? body,
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

function normalizeContentList(data) {
  return Array.isArray(data) ? data.map(normalizeContentItem) : []
}

async function apiFetch(path) {
  const res = await fetch(path)
  const data = await parseJson(res)
  return unwrapData(res, data, '请求失败')
}

async function apiWrite(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(path, opts)
  const data = await parseJson(res)
  return unwrapData(res, data, '操作失败')
}

async function fetchDetailFromList(fetchList, id, label) {
  const list = await fetchList()
  const target = list.find((item) => String(item.id) === String(id))
  if (!target) throw new Error(`${label}不存在`)
  return target
}

export async function fetchStories() {
  return normalizeContentList(await apiFetch('/api/stories'))
}

export function fetchStoryById(id) {
  return fetchDetailFromList(fetchStories, id, '故事')
}

export function createStory(body) {
  return apiWrite('POST', '/api/stories', body).then(normalizeContentItem)
}

export function updateStory(id, body) {
  return apiWrite('PUT', `/api/stories/${id}`, body).then(normalizeContentItem)
}

export function deleteStory(id) {
  return apiWrite('DELETE', `/api/stories/${id}`)
}

export function pinStory(id) {
  return apiWrite('POST', `/api/stories/${id}/pin`).then(normalizeContentItem)
}

export function unpinStory(id) {
  return apiWrite('DELETE', `/api/stories/${id}/pin`).then(normalizeContentItem)
}

export { fetchStories as fetchStory }

export async function fetchTimelines() {
  return normalizeContentList(await apiFetch('/api/timelines'))
}

export function fetchTimelineById(id) {
  return fetchDetailFromList(fetchTimelines, id, '时间线事件')
}

export function createTimeline(body) {
  return apiWrite('POST', '/api/timelines', body).then(normalizeContentItem)
}

export function updateTimeline(id, body) {
  return apiWrite('PUT', `/api/timelines/${id}`, body).then(normalizeContentItem)
}

export function deleteTimeline(id) {
  return apiWrite('DELETE', `/api/timelines/${id}`)
}

export function pinTimeline(id) {
  return apiWrite('POST', `/api/timelines/${id}/pin`).then(normalizeContentItem)
}

export function unpinTimeline(id) {
  return apiWrite('DELETE', `/api/timelines/${id}/pin`).then(normalizeContentItem)
}

export { fetchTimelines as fetchTimeline }

export async function fetchEvents() {
  return normalizeContentList(await apiFetch('/api/events'))
}

export function fetchEventById(id) {
  return fetchDetailFromList(fetchEvents, id, '公告')
}

export function createEvent(body) {
  return apiWrite('POST', '/api/events', body).then(normalizeContentItem)
}

export function updateEvent(id, body) {
  return apiWrite('PUT', `/api/events/${id}`, body).then(normalizeContentItem)
}

export function deleteEvent(id) {
  return apiWrite('DELETE', `/api/events/${id}`)
}

export function pinEvent(id) {
  return apiWrite('POST', `/api/events/${id}/pin`).then(normalizeContentItem)
}

export function unpinEvent(id) {
  return apiWrite('DELETE', `/api/events/${id}/pin`).then(normalizeContentItem)
}

export { fetchEvents as fetchNotices, fetchEventById as fetchNoticeById }
export { createEvent as createNotice, updateEvent as updateNotice, deleteEvent as deleteNotice }
