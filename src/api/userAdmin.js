import { getToken } from '@/composables/useAuth.js'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** GET /api/admin/users */
export async function fetchUsers() {
  const res  = await fetch('/api/admin/users', { headers: authHeaders() })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // UserAdminVo[]
}

/** POST /api/admin/users/{id}/status — 切换禁用/启用 */
export async function toggleUserStatus(id) {
  const res  = await fetch(`/api/admin/users/${id}/status`, {
    method:  'POST',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // UserAdminVo (updated)
}

/** POST /api/admin/users/{id}/role — 切换 fan ↔ admin（仅 super_admin） */
export async function toggleUserRole(id) {
  const res  = await fetch(`/api/admin/users/${id}/role`, {
    method:  'POST',
    headers: authHeaders(),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // UserAdminVo (updated)
}

/** PUT /api/users/me/password — 修改自己的密码 */
export async function changeMyPassword({ oldPassword, newPassword, confirmPassword }) {
  const res  = await fetch('/api/users/me/password', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ oldPassword, newPassword, confirmPassword }),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
}

/** POST /api/admin/users/create-admin — 新建管理员（仅 super_admin） */
export async function createAdmin({ username, password }) {
  const res  = await fetch('/api/admin/users/create-admin', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg)
  return data.data   // UserAdminVo
}