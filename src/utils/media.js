/**
 * 统一媒体地址解析
 *
 * 规则：
 *  - http(s):// 开头的外部直链 → 原样返回
 *  - /uploads/... 等相对路径   → 拼接 VITE_API_BASE（开发时为 http://localhost:8080，生产为空）
 *  - 空值 → 返回空字符串
 */
const API_BASE = import.meta.env.VITE_API_BASE || ''

export function resolveMediaUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return API_BASE + url
}

/**
 * 根据视频链接自动推断封面图 URL
 *
 * 支持平台：
 *  - YouTube：直接使用 YouTube 官方缩略图 CDN，无需 API Key，无 CORS 限制
 *    支持格式：youtube.com/watch?v=ID、youtu.be/ID、youtube.com/embed/ID
 *
 * 暂不支持（需要后端代理或 API Key）：
 *  - Bilibili（B站）：需要调用 API 获取 cover_url，有 CORS 限制
 *  - Vimeo：需要 API Key
 *  - 其他平台
 *
 * 返回值：封面图 URL 字符串，或 null（无法解析时）
 */
export function resolveVideoCover(videoUrl) {
  if (!videoUrl) return null

  // YouTube: watch?v=ID、youtu.be/ID、youtube.com/embed/ID、youtube.com/shorts/ID
  const ytMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
  }

  return null
}