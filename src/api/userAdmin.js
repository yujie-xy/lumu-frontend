import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonAuthHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() }
}

async function parseBody(res) {
  const text = await res.text()
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    if (!res.ok) return { msg: text }
    throw new Error('操作失败')
  }
}

function unwrapData(res, data) {
  if (!res.ok) {
    const msg = data?.msg || data?.message || ((res.status === 401 || res.status === 403)
      ? '无权限，请重新登录'
      : `操作失败 (${res.status})`)
    throw new Error(msg)
  }

  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || data.message || '操作失败')
    return data.data
  }

  if (data && typeof data === 'object' && 'data' in data && Object.keys(data).length <= 3) {
    return data.data
  }

  return data
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function normalizeUserPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload

  const user = payload.user && typeof payload.user === 'object' && !Array.isArray(payload.user)
    ? payload.user
    : null

  return {
    ...payload,
    ...user,
    userUuid: pickString(
      payload.userUuid,
      payload.uuid,
      payload.id != null ? String(payload.id) : '',
      user?.userUuid,
      user?.uuid,
      user?.id != null ? String(user.id) : '',
    ),
    username: pickString(
      payload.username,
      payload.userName,
      payload.name,
      user?.username,
      user?.userName,
      user?.name,
    ),
    role: pickString(
      payload.role,
      Array.isArray(payload.roles) ? payload.roles[0] : '',
      user?.role,
      Array.isArray(user?.roles) ? user.roles[0] : '',
    ),
    badge: pickString(
      payload.badge,
      payload.badgeName,
      user?.badge,
      user?.badgeName,
    ),
    banned: Boolean(payload.banned ?? user?.banned),
    muted: Boolean(payload.muted ?? user?.muted),
    createdAt: pickString(
      payload.createdAt,
      payload.updatedAt,
      user?.createdAt,
      user?.updatedAt,
    ),
  }
}

async function apiReq(method, path, body) {
  const opts = {
    method,
    headers: body !== undefined ? jsonAuthHeaders() : authHeaders(),
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(path, opts)
  const data = await parseBody(res)
  return normalizeUserPayload(unwrapData(res, data))
}

// —— 当前用户自助操作 ————————————————————————————————————————————————

/** PUT /users/me/password — 修改自己的密码
 *  ChangePasswordRequest: { newPassword }
 */
export async function changeMyPassword({ newPassword }) {
  return apiReq('PUT', '/api/users/me/password', { newPassword })
}

/** PUT /users/me/username — 修改自己的用户名
 *  ChangeUsernameRequest: { newUsername }
 */
export async function changeMyUsername({ newUsername }) {
  return apiReq('PUT', '/api/users/me/username', { newUsername })
}

/** DELETE /users/me — 注销账户 */
export async function deactivateAccount() {
  return apiReq('DELETE', '/api/users/me')
}

// —— 管理员用户治理接口 ————————————————————————————————————————————————

/** PUT /admin/users/{userUuid}/ban — 封禁/解封用户
 *  BanRequest: { banned: boolean }
 */
export async function banUser(userUuid, banned) {
  return apiReq('PUT', `/api/admin/users/${userUuid}/ban`, { banned })
}

/** PUT /admin/users/{userUuid}/mute — 禁言/解禁用户
 *  MuteRequest: { muted: boolean }
 */
export async function muteUser(userUuid, muted) {
  return apiReq('PUT', `/api/admin/users/${userUuid}/mute`, { muted })
}

/** PUT /admin/users/{userUuid}/reset-password — 重置用户密码
 *  ResetPasswordRequest: { newPassword }
 */
export async function adminResetPassword(userUuid, newPassword) {
  return apiReq('PUT', `/api/admin/users/${userUuid}/reset-password`, { newPassword })
}

/** PUT /admin/users/{userUuid}/reset-username — 重置用户名
 *  ResetUsernameRequest: { newUsername }
 */
export async function adminResetUsername(userUuid, newUsername) {
  return apiReq('PUT', `/api/admin/users/${userUuid}/reset-username`, { newUsername })
}
