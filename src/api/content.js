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

export function fetchStory()           { return apiFetch('/api/story') }
export function fetchStoryById(id)     { return apiFetch(`/api/story/${id}`) }
export function fetchTimeline()           { return apiFetch('/api/timeline') }
export function fetchTimelineById(id)     { return apiFetch(`/api/timeline/${id}`) }
export function fetchNotices()            { return apiFetch('/api/notices') }
export function fetchNoticeById(id)       { return apiFetch(`/api/notices/${id}`) }

export function createStory(body)       { return apiWrite('POST',   '/api/story',         body) }
export function updateStory(id, body)   { return apiWrite('PUT',    `/api/story/${id}`,   body) }
export function deleteStory(id)         { return apiWrite('DELETE',  `/api/story/${id}`) }

export function createTimeline(body)     { return apiWrite('POST',   '/api/timeline',       body) }
export function updateTimeline(id, body) { return apiWrite('PUT',    `/api/timeline/${id}`, body) }
export function deleteTimeline(id)       { return apiWrite('DELETE',  `/api/timeline/${id}`) }

export function createNotice(body)      { return apiWrite('POST',   '/api/notices',        body) }
export function updateNotice(id, body)  { return apiWrite('PUT',    `/api/notices/${id}`,  body) }
export function deleteNotice(id)        { return apiWrite('DELETE',  `/api/notices/${id}`) }