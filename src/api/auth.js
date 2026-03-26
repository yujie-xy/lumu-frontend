const BASE = '/api/auth'

async function _post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

/**
 * 仅检查用户名是否可用（不写库）
 * 抛出 Error 表示用户名已存在或网络错误
 */
export async function checkUsername(username, password, email) {
  const { ok, status, data } = await _post(`${BASE}/register`, {
    username, password, email, precheck: true,
  })
  if (status === 409) throw new Error(data.msg || '用户名已存在，请换一个')
  if (!ok) throw new Error(data.msg || '检查失败，请重试')
}

/**
 * 实际注册，返回 UserInfo { username, role, badge }
 */
export async function register(username, password, email) {
  const { ok, status, data } = await _post(`${BASE}/register`, {
    username, password, email,
  })
  if (status === 409) throw new Error(data.msg || '用户名已存在，请换一个')
  if (!ok) throw new Error(data.msg || '注册失败，请重试')
  return data.data // { username, role, badge }
}

/**
 * 登录，返回 UserInfo { username, role, badge }
 */
export async function login(username, password) {
  const { ok, data } = await _post(`${BASE}/login`, { username, password })
  if (!ok) throw new Error(data.msg || '账号或密码错误，再试一次')
  return data.data // { username, role, badge }
}