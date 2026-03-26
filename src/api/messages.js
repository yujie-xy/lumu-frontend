import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token   = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function req(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(path, opts)

  // 非 2xx：先读文本，再尝试解析 JSON，避免空 body 时 res.json() 崩溃
  if (!res.ok) {
    const text = await res.text()
    let msg = (res.status === 401 || res.status === 403)
      ? '无权限，请重新登录'
      : `请求失败 (${res.status})`
    if (text) {
      try { const d = JSON.parse(text); if (d.msg) msg = d.msg } catch {}
    }
    throw new Error(msg)
  }

  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '请求失败')
  return data.data
}

export function fetchMessages()         { return req('GET',    '/api/messages') }
export function createMessage(content)  { return req('POST',   '/api/messages', { content }) }
export function deleteMessage(id)       { return req('DELETE', `/api/messages/${id}`) }