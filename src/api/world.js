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

// ── 世界 tag（公开读 / 后台写）─────────────────────────────────
export function fetchWorldTags()                              { return req('GET',    '/api/world/tags') }
export function fetchWorldTagsAdmin()                        { return req('GET',    '/api/admin/world-tags') }
export function createWorldTag(name, slug, sortOrder)        { return req('POST',   '/api/admin/world-tags', { name, slug, sortOrder: sortOrder ?? 0 }) }
export function updateWorldTag(id, name, slug, sortOrder)    { return req('PUT',    `/api/admin/world-tags/${id}`, { name, slug, sortOrder: sortOrder ?? 0 }) }
export function deleteWorldTag(id)                           { return req('DELETE', `/api/admin/world-tags/${id}`) }

// ── 类别 tag（公开读 / 后台写）─────────────────────────────────
export function fetchCategoryTags()                              { return req('GET',    '/api/world/category-tags') }
export function fetchCategoryTagsAdmin()                         { return req('GET',    '/api/admin/world-category-tags') }
export function createCategoryTag(name, slug, sortOrder)         { return req('POST',   '/api/admin/world-category-tags', { name, slug, sortOrder: sortOrder ?? 0 }) }
export function updateCategoryTag(id, name, slug, sortOrder)     { return req('PUT',    `/api/admin/world-category-tags/${id}`, { name, slug, sortOrder: sortOrder ?? 0 }) }
export function deleteCategoryTag(id)                            { return req('DELETE', `/api/admin/world-category-tags/${id}`) }

// ── 世界内容（公开读 / 后台写）─────────────────────────────────
export function fetchWorldPosts(worldTagId, categoryTagId) {
  const params = new URLSearchParams()
  if (worldTagId)    params.set('worldTagId',    worldTagId)
  if (categoryTagId) params.set('categoryTagId', categoryTagId)
  const qs = params.toString()
  return req('GET', qs ? `/api/world/posts?${qs}` : '/api/world/posts')
}
export function fetchWorldPost(id)        { return req('GET',    `/api/world/posts/${id}`) }
export function createWorldPost(body)     { return req('POST',   '/api/admin/world/posts', body) }
export function updateWorldPost(id, body) { return req('PUT',    `/api/admin/world/posts/${id}`, body) }
export function deleteWorldPost(id)       { return req('DELETE', `/api/admin/world/posts/${id}`) }
export function pinWorldPost(id)          { return req('POST',   `/api/admin/world/posts/${id}/pin`) }