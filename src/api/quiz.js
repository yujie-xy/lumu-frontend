import { getToken } from '@/composables/useAuth.js'

// 带 token 的操作（管理员接口）
async function apiWrite(method, path, body) {
  const token   = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res  = await fetch(path, opts)
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '操作失败')
  return data.data
}

// ── 管理员题库接口 ────────────────────────────────────────────

/** GET /admin/quiz/questions — 获取所有题目 */
export function fetchAdminQuestions() { return apiWrite('GET', '/api/admin/quiz/questions') }

/** POST /admin/quiz/questions — 新建题目
 *  QuizQuestionRequest: { questionType, stem, answerText, enabled }
 */
export function createQuestion(body)  { return apiWrite('POST',  '/api/admin/quiz/questions', body) }

/** PUT /admin/quiz/questions/{id} — 更新题目
 *  QuizQuestionRequest: { questionType, stem, answerText, enabled }
 */
export function updateQuestion(id, body) { return apiWrite('PUT', `/api/admin/quiz/questions/${id}`, body) }

/** DELETE /admin/quiz/questions/{id} — 删除题目 */
export function deleteQuestion(id)    { return apiWrite('DELETE', `/api/admin/quiz/questions/${id}`) }

/**
 * 切换题目启用状态（通过 PUT 更新完整对象）
 * @param {{ id, questionType, stem, answerText, enabled }} question  当前题目完整数据
 */
export function setQuestionEnabled(question) {
  const { id, ...rest } = question
  return apiWrite('PUT', `/api/admin/quiz/questions/${id}`, {
    ...rest,
    enabled: !question.enabled,
  })
}

/** PUT /admin/quiz/config — 更新答题配置
 *  QuizConfigRequest: { questionCount, passScore }
 */
export function updateQuizConfig(questionCount, passScore) {
  return apiWrite('PUT', '/api/admin/quiz/config', { questionCount, passScore })
}