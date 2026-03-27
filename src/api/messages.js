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

/** GET /messages/threads — 获取当前用户的消息线程列表 */
export function fetchThreads()               { return req('GET', '/api/messages/threads') }

/** GET /messages/threads/{threadId} — 获取某个线程的消息列表 */
export function fetchThread(threadId)        { return req('GET', `/api/messages/threads/${threadId}`) }

/** POST /messages/to/{userUuid} — 向指定用户发送私信 */
export function sendMessage(userUuid, content) {
  return req('POST', `/api/messages/to/${userUuid}`, { content })
}

// Legacy alias — used by components that called fetchMessages() as a general list
export { fetchThreads as fetchMessages }