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

async function apiWrite(method, path, body) {
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

function normalizeQuestion(item) {
  if (!item || typeof item !== 'object') return item

  return {
    ...item,
    id: item.id ?? item.questionId ?? item.uuid ?? null,
    questionType: pickString(item.questionType, item.type) || 'general',
    stem: pickString(item.stem, item.question, item.title),
    answerText: pickString(item.answerText, item.answer, item.correctAnswer),
    enabled: Boolean(item.enabled ?? item.isEnabled ?? true),
  }
}

function normalizeQuestionList(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.questions)
      ? data.questions
      : Array.isArray(data?.items)
        ? data.items
        : []

  return list.map(normalizeQuestion)
}

function normalizeQuestionPayload(data) {
  if (Array.isArray(data)) return normalizeQuestionList(data)
  if (!data || typeof data !== 'object') return data

  const hasQuestionFields = [
    data.id,
    data.questionId,
    data.questionType,
    data.type,
    data.stem,
    data.question,
    data.title,
    data.answerText,
    data.answer,
    data.correctAnswer,
  ].some((value) => value !== undefined && value !== null && value !== '')

  if (!hasQuestionFields) return data
  return normalizeQuestion(data)
}

// —— 管理员题库接口 ————————————————————————————————————————————————

/** GET /admin/quiz/questions — 获取所有题目 */
export async function fetchAdminQuestions() {
  return normalizeQuestionList(await apiWrite('GET', '/api/admin/quiz/questions'))
}

/** POST /admin/quiz/questions — 新建题目
 *  QuizQuestionRequest: { questionType, stem, answerText, enabled }
 */
export async function createQuestion(body) {
  return normalizeQuestionPayload(await apiWrite('POST', '/api/admin/quiz/questions', body))
}

/** PUT /admin/quiz/questions/{id} — 更新题目
 *  QuizQuestionRequest: { questionType, stem, answerText, enabled }
 */
export async function updateQuestion(id, body) {
  return normalizeQuestionPayload(await apiWrite('PUT', `/api/admin/quiz/questions/${id}`, body))
}

/** DELETE /admin/quiz/questions/{id} — 删除题目 */
export function deleteQuestion(id) {
  return apiWrite('DELETE', `/api/admin/quiz/questions/${id}`)
}

/**
 * 切换题目启用状态（通过 PUT 更新完整对象）
 * @param {{ id, questionType, stem, answerText, enabled }} question  当前题目完整数据
 */
export function setQuestionEnabled(question) {
  const normalized = normalizeQuestion(question)
  const { id, ...rest } = normalized
  return apiWrite('PUT', `/api/admin/quiz/questions/${id}`, {
    ...rest,
    enabled: !normalized.enabled,
  })
}

/** PUT /admin/quiz/config — 更新答题配置
 *  QuizConfigRequest: { questionCount, passScore }
 */
export function updateQuizConfig(questionCount, passScore) {
  return apiWrite('PUT', '/api/admin/quiz/config', { questionCount, passScore })
}
