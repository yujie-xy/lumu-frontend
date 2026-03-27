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
 * 登录，返回 UserInfo { username, role, badge, token }
 */
export async function login(username, password) {
  const { ok, data } = await _post(`${BASE}/login`, { username, password })
  if (!ok) throw new Error(data.msg || '账号或密码错误，再试一次')
  return data.data
}

/**
 * 开始答题注册流程，返回题目列表
 * POST /auth/register/quiz/start
 */
export async function startQuizRegistration() {
  const { ok, data } = await _post(`${BASE}/register/quiz/start`, {})
  if (!ok) throw new Error(data.msg || '获取题目失败，请重试')
  return data.data // QuizQuestion[]
}

/**
 * 提交答题结果并注册账号
 * POST /auth/register/quiz/submit
 * @param {string} username
 * @param {string} password
 * @param {string} weiboName  微博名
 * @param {{ questionId: number, answer: string }[]} answers
 */
export async function submitQuizRegistration(username, password, weiboName, answers) {
  const { ok, data } = await _post(`${BASE}/register/quiz/submit`, {
    username, password, weiboName, answers,
  })
  if (!ok) throw new Error(data.msg || '注册失败，请重试')
  return data.data // UserInfo { username, role, badge, token }
}

/**
 * 通过邀请码注册
 * POST /auth/register/invite
 * @param {string} username
 * @param {string} password
 * @param {string} weiboName  微博名
 * @param {string} inviteCode 邀请码
 */
export async function registerByInvite(username, password, weiboName, inviteCode) {
  const { ok, data } = await _post(`${BASE}/register/invite`, {
    username, password, weiboName, inviteCode,
  })
  if (!ok) throw new Error(data.msg || '邀请码注册失败，请检查邀请码是否有效')
  return data.data // UserInfo
}