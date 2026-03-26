import { getToken } from '@/composables/useAuth.js'

/**
 * 上传图片到 /api/upload/image
 * 返回后端分配的访问 URL（如 /uploads/2026-03/xxx.jpg）
 *
 * @param {File} file
 * @returns {Promise<string>} url
 */
export async function uploadImage(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  // Content-Type 不设置，让浏览器自动填 multipart/form-data boundary

  const res = await fetch('/api/upload/image', { method: 'POST', headers, body: formData })

  if (!res.ok) {
    const text = await res.text()
    let msg = (res.status === 401 || res.status === 403) ? '无权限，请重新登录' : `上传失败 (${res.status})`
    if (text) { try { const d = JSON.parse(text); if (d.msg) msg = d.msg } catch {} }
    throw new Error(msg)
  }

  const data = await res.json()
  if (data.code !== 200) throw new Error(data.msg || '上传失败')
  return data.data.url
}