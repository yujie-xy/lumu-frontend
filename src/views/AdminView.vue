<template>
  <div class="admin-view">
    <div class="bg-cosmos-admin"></div>

    <!-- 导航栏 -->
    <nav class="admin-nav">
      <div class="nav-logo">橹穆宇宙<span class="nav-logo-sub">管理后台</span></div>

      <div class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-tab"
          :class="{ active: currentTab === tab.key }"
          @click="currentTab = tab.key"
        >{{ tab.label }}</button>
      </div>

      <div class="nav-right">
        <button class="btn-fan" @click="router.push('/main')">← 粉丝页</button>
        <div class="nav-user">
          <span class="nav-badge">{{ state.user?.badge || '管理员' }}</span>
          <span class="nav-name">{{ state.user?.username }}</span>
        </div>
        <button class="btn-pwd" @click="showChangePwd = true">改密码</button>
        <button class="nav-logout" @click="logout">退出</button>
      </div>
    </nav>

    <ChangePasswordModal v-if="showChangePwd" @close="showChangePwd = false" />

    <!-- 内容区 -->
    <div class="admin-body">
      <div class="admin-section-header">
        <h2 class="section-title">{{ currentTabLabel }}</h2>
        <div class="section-line"></div>
        <span class="section-tag">{{ currentTabTag }}</span>
      </div>

      <StoryAdmin    v-if="currentTab === 'story'" />
      <TimelineAdmin v-else-if="currentTab === 'timeline'" />
      <NoticeAdmin   v-else-if="currentTab === 'notice'" />
      <QuizAdmin     v-else-if="currentTab === 'quiz'" />
      <MessageAdmin  v-else-if="currentTab === 'message'" />
      <PhotoAdmin    v-else-if="currentTab === 'photo'" />
      <VideoAdmin    v-else-if="currentTab === 'video'" />
      <CommentAdmin  v-else-if="currentTab === 'comment'" />
      <WorldAdmin    v-else-if="currentTab === 'world'" />
      <UserAdmin     v-else-if="currentTab === 'users'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import StoryAdmin    from '@/components/admin/StoryAdmin.vue'
import TimelineAdmin from '@/components/admin/TimelineAdmin.vue'
import NoticeAdmin   from '@/components/admin/NoticeAdmin.vue'
import QuizAdmin     from '@/components/admin/QuizAdmin.vue'
import MessageAdmin  from '@/components/admin/MessageAdmin.vue'
import PhotoAdmin    from '@/components/admin/PhotoAdmin.vue'
import VideoAdmin    from '@/components/admin/VideoAdmin.vue'
import CommentAdmin  from '@/components/admin/CommentAdmin.vue'
import WorldAdmin           from '@/components/admin/WorldAdmin.vue'
import UserAdmin            from '@/components/admin/UserAdmin.vue'
import ChangePasswordModal  from '@/components/admin/ChangePasswordModal.vue'

const router = useRouter()
const { state, isAdmin, isSuperAdmin, clearUser } = useAuth()

// Guard: must be admin
onMounted(() => {
  if (!isAdmin()) {
    alert('无权限访问管理后台，请先登录管理员账号')
    router.push('/')
  }
})

const allTabs = [
  { key: 'story',    label: '故事线',   title: '故 事 线 管 理',    tag: 'STORY',    superOnly: false },
  { key: 'timeline', label: '时间线',   title: '时 间 线 管 理',    tag: 'TIMELINE', superOnly: false },
  { key: 'notice',   label: '大事件',   title: '大 事 件 管 理',    tag: 'EVENTS',   superOnly: false },
  { key: 'quiz',     label: '题库',     title: '粉 丝 验 证 题 库', tag: 'QUIZ',     superOnly: false },
  { key: 'message',  label: '留言',     title: '留 言 管 理',       tag: 'MESSAGES', superOnly: false },
  { key: 'photo',    label: '相册',     title: '相 册 管 理',       tag: 'PHOTOS',   superOnly: false },
  { key: 'video',    label: '视频',     title: '视 频 管 理',       tag: 'VIDEOS',   superOnly: false },
  { key: 'world',    label: '世界',     title: '世 界 管 理',       tag: 'WORLD',    superOnly: false },
  { key: 'comment',  label: '评论',     title: '评 论 管 理',       tag: 'COMMENTS', superOnly: false },
  { key: 'users',    label: '用户',     title: '用 户 管 理',       tag: 'USERS',    superOnly: false },
]

const tabs = computed(() => allTabs.filter(t => !t.superOnly || isSuperAdmin()))

const currentTab    = ref('story')
const showChangePwd = ref(false)

const currentTabLabel = computed(() => tabs.value.find(t => t.key === currentTab.value)?.title || '')
const currentTabTag   = computed(() => tabs.value.find(t => t.key === currentTab.value)?.tag  || '')

function logout() {
  clearUser()
  router.push('/')
}
</script>

<style scoped>
.admin-view {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.bg-cosmos-admin {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 110% 55% at 50% 0%, #1a0d3a 0%, transparent 55%),
    radial-gradient(ellipse 45% 28% at 15% 35%, rgba(212,170,112,.04) 0%, transparent 60%),
    linear-gradient(180deg, #0d0818 0%, #100a20 100%);
  z-index: 0;
  pointer-events: none;
}

/* NAV */
.admin-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 0;
  background: rgba(13, 8, 24, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(212, 170, 112, 0.15);
}

.nav-logo {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 17px;
  letter-spacing: 4px;
  color: var(--gold);
  white-space: nowrap;
  margin-right: 24px;
  flex-shrink: 0;
}
.nav-logo-sub {
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--t3);
  margin-left: 8px;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-tab {
  padding: 6px 14px;
  border-radius: 20px;
  border: none;
  background: transparent;
  color: var(--t3);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.nav-tab:hover { color: var(--t2); background: rgba(255,255,255,.05); }
.nav-tab.active {
  color: var(--gold);
  background: rgba(212, 170, 112, 0.1);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 16px;
}

.btn-fan {
  padding: 5px 13px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--t3);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
}
.btn-fan:hover { border-color: var(--pink); color: var(--pink); }

.nav-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}
.nav-badge {
  font-size: 9px;
  color: var(--gold);
  letter-spacing: 2px;
  background: rgba(212,170,112,.12);
  padding: 1px 6px;
  border-radius: 6px;
}
.nav-name {
  font-size: 11px;
  color: rgba(255,255,255,.55);
  letter-spacing: 1px;
}

.btn-pwd {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(212,170,112,.25);
  background: transparent;
  color: rgba(212,170,112,.5);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  cursor: pointer;
  transition: all .2s;
}
.btn-pwd:hover { border-color: rgba(212,170,112,.6); color: var(--gold); }

.nav-logout {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  color: var(--t3);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  cursor: pointer;
  transition: all .2s;
}
.nav-logout:hover { border-color: #ff8aaa; color: #ff8aaa; }

/* BODY */
.admin-body {
  margin-top: 56px;
  flex: 1;
  padding: 28px 24px 60px;
  max-width: 900px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 1;
}

.admin-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}
.section-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 20px;
  letter-spacing: 4px;
  color: var(--t1);
  white-space: nowrap;
}
.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(212,170,112,.4), transparent);
}
.section-tag {
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--gold);
  border: 1px solid rgba(212,170,112,.3);
  padding: 2px 9px;
  border-radius: 8px;
  flex-shrink: 0;
}
</style>
