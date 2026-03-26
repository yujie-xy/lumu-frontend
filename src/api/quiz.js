import { getToken } from '@/composables/useAuth.js'

// 公开接口（注册答题流程，不需要 token）
async function apiFetch(path) {
  const res  = await fetch(path)
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '请求失败')
  return data.data
}

// 带 token 的写操作（管理员接口）
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

/** 随机拿 count 道题，不含正确答案 */
export function fetchRandomQuiz(count = 5) {
  return apiFetch(`/api/quiz/random?count=${count}`)
}

/**
 * 逐题校验：每答一题调用一次。
 * @param {number} id      题目 id
 * @param {number} choice  0=A 1=B 2=C 3=D
 * @returns {{ correct: boolean }}
 */
export function checkAnswer(id, choice) {
  return apiWrite('POST', '/api/quiz/check', { id, choice })
}

/** 批量判分（保留，主流程不再使用） */
export function gradeQuiz(answers) {
  return apiWrite('POST', '/api/quiz/grade', { answers })
}

// ── 管理员接口（均需要 ADMIN token）────────────────────────────────
export function fetchAdminQuestions()           { return apiWrite('GET',    '/api/admin/quiz/questions') }
export function createQuestion(body)            { return apiWrite('POST',   '/api/admin/quiz/questions',         body) }
export function updateQuestion(id, body)        { return apiWrite('PUT',    `/api/admin/quiz/questions/${id}`,   body) }
export function deleteQuestion(id)              { return apiWrite('DELETE',  `/api/admin/quiz/questions/${id}`) }
export function setQuestionEnabled(id, enabled) {
  return apiWrite('PATCH', `/api/admin/quiz/questions/${id}/enabled`, { enabled })
}