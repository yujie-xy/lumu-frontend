const BASE = '/api/auth'

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

function unwrapData(res, data, fallbackMessage) {
  if (!res.ok) {
    const msg = data?.msg || data?.message || fallbackMessage || `请求失败 (${res.status})`
    throw new Error(msg)
  }

  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) throw new Error(data.msg || data.message || fallbackMessage || '请求失败')
    return data.data
  }

  if (data && typeof data === 'object' && 'data' in data && Object.keys(data).length <= 3) {
    return data.data
  }

  return data
}

async function post(path, body, fallbackMessage) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }

  if (body !== undefined) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, options)
  const data = await parseBody(res)
  return unwrapData(res, data, fallbackMessage)
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

function normalizeRole(...values) {
  const raw = pickString(...values)
  if (!raw) return ''

  const role = raw.trim().toLowerCase()
  if (role === 'admin') return 'admin'
  if (role === 'super_admin') return 'super_admin'
  if (role === 'fan') return 'fan'
  if (role === 'guest') return 'guest'
  if (role === 'user') return 'user'
  return role
}

function normalizeUserInfo(payload) {
  const data = pickObject(payload) || {}
  const user = pickObject(data.user, data.profile, data.account, data.member)

  const username = pickString(
    data.username,
    data.userName,
    data.loginName,
    user?.username,
    user?.userName,
    user?.name,
  )

  const role = normalizeRole(
    data.role,
    Array.isArray(data.roles) ? data.roles[0] : '',
    user?.role,
    Array.isArray(user?.roles) ? user.roles[0] : '',
  )

  const badge = pickString(
    data.badge,
    data.badgeName,
    user?.badge,
    user?.badgeName,
  )

  const token = pickString(
    data.token,
    data.accessToken,
    data.jwt,
    data.access_token,
    user?.token,
    user?.accessToken,
  )

  const userUuid = pickString(
    data.userUuid,
    data.uuid,
    user?.userUuid,
    user?.uuid,
  )

  return {
    ...data,
    ...user,
    username,
    role,
    badge,
    token,
    userUuid,
  }
}

function normalizeQuizQuestions(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.questions)
      ? payload.questions
      : Array.isArray(payload?.items)
        ? payload.items
        : []

  return list.map((item) => {
    if (!item || typeof item !== 'object') return item
    return {
      ...item,
      questionId: item.questionId ?? item.id ?? null,
      stem: pickString(item.stem, item.question, item.title),
      questionType: pickString(item.questionType, item.type),
      options: Array.isArray(item.options) ? item.options : [],
    }
  })
}

/**
 * 登录，返回 UserInfo { username, role, badge, token }
 */
export async function login(username, password) {
  const data = await post('/login', { username, password }, '账号或密码错误，再试一次')
  return normalizeUserInfo(data)
}

/**
 * 开始答题注册流程，返回题目列表
 * POST /auth/register/quiz/start
 */
export async function startQuizRegistration() {
  const data = await post('/register/quiz/start', undefined, '获取题目失败，请重试')
  return normalizeQuizQuestions(data)
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
  const data = await post('/register/quiz/submit', {
    username,
    password,
    weiboName,
    answers,
  }, '注册失败，请重试')
  return normalizeUserInfo(data)
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
  const data = await post('/register/invite', {
    username,
    password,
    weiboName,
    inviteCode,
  }, '邀请码注册失败，请检查邀请码是否有效')
  return normalizeUserInfo(data)
}
