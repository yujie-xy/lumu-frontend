<template>
  <nav class="top-nav">
    <div class="nav-logo">橹穆宇宙</div>

    <div class="nav-links">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav-link"
        :class="{ active: currentPage === item.key, 'fan-only': item.fanOnly }"
        :disabled="item.fanOnly && isGuest()"
        :title="item.fanOnly && isGuest() ? '登录后可见' : ''"
        @click="!item.fanOnly || !isGuest() ? $emit('navigate', item.key) : null"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="item.key === 'events' && hasUnread" class="tab-unread-dot"></span>
        <span v-if="item.fanOnly && isGuest()" class="lock-icon">🔒</span>
      </button>
    </div>

    <div class="nav-right">
      <button v-if="isAdmin()" class="btn-back-admin" @click="router.push('/admin')">⚙ 管理后台</button>
      <div class="nav-user">
        <span class="user-badge" :class="{ 'admin-badge': isAdmin() }">{{ state.user?.badge }}</span>
        <span class="user-name">{{ state.user?.username }}</span>
      </div>

      <!-- Bell with dropdown -->
      <div class="bell-wrap" ref="bellWrapRef">
        <button class="nav-bell" title="通知" @click="toggleBell">
          🔔
          <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>
        <div v-if="bellOpen" class="bell-dropdown">
          <div class="bell-header">
            <span class="bell-header-title">通知</span>
            <button v-if="unreadCount > 0" class="bell-read-all" @click="markAllRead">全部已读</button>
          </div>
          <div v-if="notices.length === 0" class="bell-empty">暂无通知</div>
          <div v-else class="bell-list">
            <div
              v-for="n in notices"
              :key="n.id"
              class="bell-item"
              :class="{ unread: !readIds.has(n.id) }"
              @click="clickNotice(n)"
            >
              <div class="bell-item-dot" :class="{ 'dot-unread': !readIds.has(n.id) }"></div>
              <div class="bell-item-body">
                <div class="bell-item-title">{{ n.title }}</div>
                <div class="bell-item-date">{{ n.dateLabel || formatDate(n.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button v-if="!isGuest()" class="btn-pwd" @click="showChangePwd = true">改密码</button>
      <button class="nav-logout" @click="$emit('logout')">退出</button>
    </div>
  </nav>

  <ChangePasswordModal v-if="showChangePwd" @close="showChangePwd = false" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useNoticeRead } from '@/composables/useNoticeRead.js'
import ChangePasswordModal from '@/components/admin/ChangePasswordModal.vue'

const router = useRouter()
const { state, isGuest, isAdmin } = useAuth()

const showChangePwd = ref(false)

const props = defineProps({
  currentPage: { type: String, default: 'story' }
})
const emit = defineEmits(['navigate', 'logout'])

const navItems = [
  { key: 'home',     icon: '🏠', label: '首页',   fanOnly: false },
  { key: 'story',    icon: '📖', label: '故事',   fanOnly: false },
  { key: 'timeline', icon: '✨', label: '时间线', fanOnly: false },
  { key: 'events',   icon: '📢', label: '活动',   fanOnly: false },
  { key: 'photos',   icon: '🌸', label: '相册',   fanOnly: false },
  { key: 'videos',   icon: '🎬', label: '视频',   fanOnly: false },
  { key: 'world',    icon: '🌍', label: '世界',   fanOnly: false },
  { key: 'messages', icon: '💌', label: '留言',   fanOnly: true  },
]

// ── Shared notice read state ───────────────────────────────
const { notices, readIds, unreadCount, hasUnread, loadNotices, markAllRead } = useNoticeRead()

const bellOpen    = ref(false)
const bellWrapRef = ref(null)

function toggleBell() {
  if (!bellOpen.value) {
    // Opening the bell counts as "seen all notices"
    markAllRead()
  }
  bellOpen.value = !bellOpen.value
}

function clickNotice(n) {
  bellOpen.value = false
  emit('navigate', 'events')
}

function formatDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function onDocClick(e) {
  if (bellWrapRef.value && !bellWrapRef.value.contains(e.target)) {
    bellOpen.value = false
  }
}

onMounted(async () => {
  try { await loadNotices() } catch (_) {}
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 24px;
  background: rgba(13, 8, 24, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(245, 184, 208, 0.12);
}

.nav-logo {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 18px;
  letter-spacing: 6px;
  background: linear-gradient(135deg, var(--blue), var(--pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  margin-right: 24px;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav-links::-webkit-scrollbar { display: none; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,.45);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .25s;
  white-space: nowrap;
  position: relative;
}
.nav-link:hover:not(:disabled) {
  color: rgba(255,255,255,.85);
  background: rgba(255,255,255,.06);
}
.nav-link.active {
  color: var(--pink);
  background: rgba(245, 184, 208, 0.1);
}
.nav-link:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.nav-icon { font-size: 14px; }
.lock-icon { font-size: 10px; margin-left: 2px; }
.tab-unread-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #ff4d6d; flex-shrink: 0;
  box-shadow: 0 0 5px rgba(255,77,109,.8);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 16px;
}

.nav-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}
.user-badge {
  font-size: 10px;
  color: var(--pink);
  letter-spacing: 1px;
}
.user-name {
  font-size: 12px;
  color: rgba(255,255,255,.6);
  letter-spacing: 1px;
}

.bell-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-bell {
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.5;
  transition: opacity .2s;
  padding: 4px;
}
.nav-bell:hover { opacity: 1; }

.bell-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ff4d6d;
  color: #fff;
  font-size: 9px;
  font-style: normal;
  line-height: 16px;
  text-align: center;
  letter-spacing: 0;
  box-shadow: 0 0 6px rgba(255,77,109,.5);
  pointer-events: none;
}

.bell-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  background: linear-gradient(145deg, rgba(26,12,50,.97), rgba(14,7,28,.99));
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,.7);
  z-index: 500;
  overflow: hidden;
}

.bell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.bell-header-title {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--pink);
}
.bell-read-all {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--t3);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
}
.bell-read-all:hover { color: var(--t1); }

.bell-empty {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--t3);
  letter-spacing: 2px;
}

.bell-list {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.1) transparent;
}
.bell-list::-webkit-scrollbar { width: 4px; }
.bell-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

.bell-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  transition: background .2s;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.bell-item:last-child { border-bottom: none; }
.bell-item:hover { background: rgba(255,255,255,.04); }
.bell-item.unread { background: rgba(245,184,208,.04); }

.bell-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.15);
  flex-shrink: 0;
  margin-top: 5px;
}
.bell-item-dot.dot-unread {
  background: var(--pink);
  box-shadow: 0 0 6px rgba(245,184,208,.6);
}

.bell-item-body { flex: 1; min-width: 0; }
.bell-item-title {
  font-size: 12px;
  color: var(--t1);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}
.bell-item-date {
  font-size: 10px;
  color: var(--t3);
  letter-spacing: 1px;
}

.nav-logout {
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.12);
  background: transparent;
  color: rgba(255,255,255,.35);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .25s;
}
.nav-logout:hover { border-color: var(--pink); color: var(--pink); }

.btn-pwd {
  padding: 5px 11px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
  flex-shrink: 0;
}
.btn-pwd:hover { border-color: rgba(212, 170, 112, 0.4); color: rgba(212, 170, 112, 0.8); }

.btn-back-admin {
  padding: 5px 13px;
  border-radius: 20px;
  border: 1px solid rgba(212, 170, 112, 0.35);
  background: rgba(212, 170, 112, 0.06);
  color: var(--gold);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .25s;
}
.btn-back-admin:hover {
  background: rgba(212, 170, 112, 0.14);
  border-color: var(--gold);
}

.admin-badge { color: var(--gold) !important; }
</style>