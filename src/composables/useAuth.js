import { reactive } from 'vue'

const state = reactive({
  user: null, // { username, role, badge, token }
})

function _load() {
  if (state.user) return
  try {
    const raw = localStorage.getItem('lumu_session')
    if (raw) state.user = JSON.parse(raw)
  } catch {
    state.user = null
  }
}

export function useAuth() {
  _load()

  function setUser(data) {
    state.user = data
    localStorage.setItem('lumu_session', JSON.stringify(data))
  }

  function setGuest() {
    const guest = { username: '路人', role: 'guest', badge: '路人', token: null }
    state.user = guest
    localStorage.setItem('lumu_session', JSON.stringify(guest))
  }

  function clearUser() {
    state.user = null
    localStorage.removeItem('lumu_session')
  }

  function isLoggedIn()   { return !!state.user }
  function isSuperAdmin() { return state.user?.role === 'super_admin' }
  function isAdmin()      { return state.user?.role === 'admin' || isSuperAdmin() }
  function isFan()        { return state.user?.role === 'fan'   || isAdmin() }
  function isGuest()      { return state.user?.role === 'guest' }

  return { state, setUser, setGuest, clearUser, isLoggedIn, isSuperAdmin, isAdmin, isFan, isGuest }
}

/**
 * 独立工具函数：从 localStorage 直接读取 token。
 * 不依赖 Vue 响应式，可在 api/*.js 中直接导入使用。
 */
export function getToken() {
  try {
    const raw = localStorage.getItem('lumu_session')
    if (raw) return JSON.parse(raw).token || null
  } catch {}
  return null
}