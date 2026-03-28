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
    const msg = data?.msg || ((res.status === 401 || res.status === 403)
      ? '无权限，请重新登录'
      : `请求失败 (${res.status})`)
    throw new Error(msg)
  }

  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || '请求失败')
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

function pickObject(...values) {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
  }
  return null
}

function currentSessionUserUuid() {
  try {
    const raw = localStorage.getItem('lumu_session')
    if (!raw) return ''
    const session = JSON.parse(raw)
    return typeof session?.userUuid === 'string' ? session.userUuid.trim() : ''
  } catch {
    return ''
  }
}

function resolvePeerUserUuid(...values) {
  const currentUserUuid = currentSessionUserUuid()
  const candidates = values
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)

  if (!candidates.length) return ''
  if (!currentUserUuid) return candidates[0]

  const peer = candidates.find((value) => value !== currentUserUuid)
  return peer || candidates[0]
}

function normalizeThreadItem(item) {
  if (!item || typeof item !== 'object') return item

  const threadId = item.threadId ?? item.id ?? item.uuid ?? null
  const userAUuid = pickString(item.userAUuid, item.user_a_uuid)
  const userBUuid = pickString(item.userBUuid, item.user_b_uuid)
  const preview = pickString(
    item.lastMessagePreview,
    item.preview,
    item.lastContent,
    item.latestContent,
    item.content,
  )

  return {
    ...item,
    id: threadId,
    threadId,
    userAUuid,
    userBUuid,
    userUuid: resolvePeerUserUuid(
      item.userUuid,
      item.otherUserUuid,
      item.peerUserUuid,
      item.targetUserUuid,
      userAUuid,
      userBUuid,
    ),
    username: pickString(
      item.username,
      item.otherUsername,
      item.peerUsername,
      item.targetUsername,
    ),
    preview,
    lastMessagePreview: preview,
    content: preview,
    createdAt: pickString(
      item.lastMessageAt,
      item.createdAt,
      item.updatedAt,
    ),
    lastMessageAt: pickString(item.lastMessageAt, item.createdAt, item.updatedAt),
  }
}

function normalizeThreadList(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.threads)
      ? data.threads
      : Array.isArray(data?.items)
        ? data.items
        : []

  return list.map(normalizeThreadItem)
}

function normalizeMessageItem(item) {
  if (!item || typeof item !== 'object') return item

  const fromUuid = pickString(item.fromUuid, item.senderUuid)
  const toUuid = pickString(item.toUuid, item.receiverUuid, item.targetUserUuid)

  return {
    ...item,
    id: item.id ?? item.messageId ?? item.uuid ?? null,
    threadId: item.threadId ?? item.conversationId ?? item.sessionId ?? null,
    fromUuid,
    toUuid,
    userUuid: resolvePeerUserUuid(item.userUuid, fromUuid, toUuid),
    username: pickString(
      item.username,
      item.senderName,
      item.senderUsername,
    ),
    content: pickString(item.content, item.body, item.text),
    createdAt: pickString(item.createdAt, item.sentAt, item.updatedAt),
  }
}

function normalizeThreadMessages(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
      ? data.messages
      : Array.isArray(data?.items)
        ? data.items
        : []

  return list.map(normalizeMessageItem)
}

/** GET /messages/threads — 获取当前用户的消息线程列表 */
export async function fetchThreads() {
  return normalizeThreadList(await req('GET', '/api/messages/threads'))
}

/** GET /messages/threads/{threadId} — 获取某个线程的消息列表 */
export async function fetchThread(threadId) {
  return normalizeThreadMessages(await req('GET', `/api/messages/threads/${threadId}`))
}

/** POST /messages/to/{userUuid} — 向指定用户发送私信 */
export async function sendMessage(userUuid, content) {
  const target = typeof userUuid === 'string' ? userUuid.trim() : String(userUuid || '').trim()
  const bodyContent = typeof content === 'string' ? content.trim() : String(content || '').trim()
  if (!target || !bodyContent) throw new Error('请求失败')
  return normalizeMessageItem(await req('POST', `/api/messages/to/${target}`, { content: bodyContent }))
}

// Legacy alias — used by components that called fetchMessages() as a general list
export { fetchThreads as fetchMessages }
