import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonAuthHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() }
}

async function apiReq(method, path, body) {
  const opts = {
    method,
    headers: body !== undefined ? jsonAuthHeaders() : authHeaders(),
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res  = await fetch(path, opts)
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '操作失败')
  return data.data
}

// ── 当前用户自助操作 ────────────────────────────────────────

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

// ── 管理员用户治理接口 ───────────────────────────────────────

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