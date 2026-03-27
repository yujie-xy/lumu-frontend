import { getToken } from '@/composables/useAuth.js'

async function parseJson(res) {
  const text = await res.text()
  if (!text || !text.trim()) throw new Error(`服务器无响应 (${res.status})`)
  let data
  try { data = JSON.parse(text) } catch { throw new Error('服务器返回了非法数据，请检查后端日志') }
  return data
}

async function apiFetch(path) {
  const res  = await fetch(path)
  const data = await parseJson(res)
  if (data.code !== 200) throw new Error(data.msg || '请求失败')
  return data.data
}

async function apiWrite(method, path, body) {
  const token   = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res  = await fetch(path, opts)
  const data = await parseJson(res)
  if (data.code !== 200) throw new Error(data.msg || '操作失败')
  return data.data
}

// ── Stories ───────────────────────────────────────────────────
export function fetchStories()            { return apiFetch('/api/stories') }
export function fetchStoryById(id)        { return apiFetch(`/api/stories/${id}`) }
export function createStory(body)         { return apiWrite('POST',   '/api/stories',        body) }
export function updateStory(id, body)     { return apiWrite('PUT',    `/api/stories/${id}`,   body) }
export function deleteStory(id)           { return apiWrite('DELETE',  `/api/stories/${id}`) }
export function pinStory(id)              { return apiWrite('POST',   `/api/stories/${id}/pin`) }
export function unpinStory(id)            { return apiWrite('DELETE', `/api/stories/${id}/pin`) }

// Legacy alias
export { fetchStories as fetchStory }

// ── Timelines ─────────────────────────────────────────────────
export function fetchTimelines()              { return apiFetch('/api/timelines') }
export function fetchTimelineById(id)         { return apiFetch(`/api/timelines/${id}`) }
export function createTimeline(body)          { return apiWrite('POST',   '/api/timelines',        body) }
export function updateTimeline(id, body)      { return apiWrite('PUT',    `/api/timelines/${id}`,   body) }
export function deleteTimeline(id)            { return apiWrite('DELETE',  `/api/timelines/${id}`) }
export function pinTimeline(id)               { return apiWrite('POST',   `/api/timelines/${id}/pin`) }
export function unpinTimeline(id)             { return apiWrite('DELETE', `/api/timelines/${id}/pin`) }

// Legacy alias
export { fetchTimelines as fetchTimeline }

// ── Events (formerly notices) ─────────────────────────────────
export function fetchEvents()             { return apiFetch('/api/events') }
export function fetchEventById(id)        { return apiFetch(`/api/events/${id}`) }
export function createEvent(body)         { return apiWrite('POST',   '/api/events',        body) }
export function updateEvent(id, body)     { return apiWrite('PUT',    `/api/events/${id}`,   body) }
export function deleteEvent(id)           { return apiWrite('DELETE',  `/api/events/${id}`) }
export function pinEvent(id)              { return apiWrite('POST',   `/api/events/${id}/pin`) }
export function unpinEvent(id)            { return apiWrite('DELETE', `/api/events/${id}/pin`) }

// Legacy aliases (notices → events)
export { fetchEvents as fetchNotices, fetchEventById as fetchNoticeById }
export { createEvent as createNotice, updateEvent as updateNotice, deleteEvent as deleteNotice }