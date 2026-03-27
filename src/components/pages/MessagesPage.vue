<template>
  <div class="messages-page">

    <!-- 路人：不可见，引导登录 -->
    <div v-if="isGuest()" class="msg-gate">
      <div class="gate-icon">💌</div>
      <div class="gate-title">留言板</div>
      <div class="gate-sub">登录后才能查看和发布留言</div>
    </div>

    <template v-else>

      <!-- 发布留言 -->
      <div class="msg-compose">
        <div class="compose-label">发布留言</div>
        <textarea
          class="compose-input"
          v-model="draft"
          placeholder="说点什么吧...（最多 500 字）"
          :maxlength="500"
          rows="3"
        ></textarea>
        <div class="compose-footer">
          <span class="compose-count">{{ draft.length }} / 500</span>
          <button class="compose-btn" :disabled="!draft.trim() || posting" @click="post">
            {{ posting ? '发送中...' : '发布 ✦' }}
          </button>
        </div>
        <div v-if="postError" class="compose-err">{{ postError }}</div>
      </div>

      <!-- 列表 -->
      <div v-if="loading" class="msg-loading"><div class="loading-ring"></div></div>
      <div v-else-if="error" class="msg-error">{{ error }}</div>
      <div v-else-if="!messages.length" class="msg-empty">还没有留言，来第一个说说话吧 💙</div>
      <div v-else class="msg-list">
        <div v-for="m in messages" :key="m.id" class="msg-card">
          <div class="msg-card-left">
            <div class="msg-avatar">{{ m.username.slice(0, 1) }}</div>
          </div>
          <div class="msg-card-body">
            <div class="msg-meta">
              <span class="msg-name">{{ m.username }}</span>
              <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
            </div>
            <div class="msg-content">{{ m.content }}</div>
          </div>
          <button v-if="isAdmin()" class="msg-del" @click="remove(m.id)" title="删除">🗑</button>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { fetchThreads } from '@/api/messages.js'

const { isGuest, isAdmin } = useAuth()

const messages  = ref([])
const loading   = ref(true)
const error     = ref('')
const draft     = ref('')
const posting   = ref(false)
const postError = ref('')

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const threads = await fetchThreads()
    messages.value = Array.isArray(threads) ? threads : []
  }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function post() {
  postError.value = '私信功能需要指定接收方，请通过用户资料页发起私信。'
}

async function remove() {
  alert('当前后端版本暂不支持删除消息')
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}

onMounted(() => {
  if (!isGuest()) load()
})
</script>

<style scoped>
.messages-page {
  height: 100%;
  overflow-y: auto;
  padding: 32px 48px;
  scrollbar-width: thin;
  scrollbar-color: rgba(245,184,208,.2) transparent;
}

/* ── 路人引导 ── */
.msg-gate {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 60%; gap: 14px;
}
.gate-icon  { font-size: 48px; }
.gate-title { font-family: 'ZCOOL XiaoWei', serif; font-size: 24px; letter-spacing: 6px; color: var(--pink); }
.gate-sub   { font-size: 13px; color: var(--t3); letter-spacing: 2px; }

/* ── 发布框 ── */
.msg-compose {
  max-width: 720px; margin: 0 auto 28px;
  background: rgba(245,184,208,.04); border: 1px solid rgba(245,184,208,.15);
  border-radius: 14px; padding: 20px;
}
.compose-label {
  font-size: 10px; letter-spacing: 3px; color: var(--pink); margin-bottom: 10px;
}
.compose-input {
  width: 100%; padding: 12px; background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1); border-radius: 8px;
  color: var(--t1); font-family: 'Noto Sans SC', sans-serif; font-size: 13px;
  line-height: 1.7; resize: vertical; outline: none; box-sizing: border-box;
  transition: border-color .2s;
}
.compose-input:focus { border-color: rgba(245,184,208,.4); }
.compose-input::placeholder { color: rgba(255,255,255,.2); }
.compose-footer {
  display: flex; align-items: center; justify-content: space-between; margin-top: 10px;
}
.compose-count { font-size: 11px; color: var(--t3); }
.compose-btn {
  padding: 7px 20px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #e07aab, var(--pink));
  color: var(--night); font-size: 12px; font-weight: 700; letter-spacing: 3px;
  cursor: pointer; transition: all .25s;
}
.compose-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,184,208,.3); }
.compose-btn:disabled { opacity: .45; cursor: not-allowed; }
.compose-err { font-size: 11px; color: #ff8aaa; margin-top: 8px; letter-spacing: 1px; }

/* ── 加载/空/错 ── */
.msg-loading { display: flex; justify-content: center; padding: 60px 0; }
.loading-ring {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid rgba(245,184,208,.15); border-top-color: var(--pink);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.msg-error, .msg-empty {
  text-align: center; color: var(--t3); padding: 60px 0;
  font-size: 13px; letter-spacing: 2px;
}
.msg-error { color: #ff8aaa; }

/* ── 留言列表 ── */
.msg-list {
  max-width: 720px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 12px;
}
.msg-card {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 16px; border-radius: 12px;
  background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06);
  transition: border-color .2s;
}
.msg-card:hover { border-color: rgba(245,184,208,.15); }

.msg-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(245,184,208,.3), rgba(168,212,245,.2));
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: var(--pink); font-family: 'Noto Serif SC', serif;
}
.msg-card-body { flex: 1; min-width: 0; }
.msg-meta {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.msg-name { font-size: 12px; color: var(--pink); letter-spacing: 1px; }
.msg-time { font-size: 10px; color: var(--t3); letter-spacing: 1px; }
.msg-content {
  font-size: 13px; color: var(--t1); line-height: 1.8;
  letter-spacing: 1px; white-space: pre-wrap; word-break: break-word;
}
.msg-del {
  flex-shrink: 0; background: transparent; border: none; cursor: pointer;
  font-size: 14px; opacity: .3; transition: opacity .2s; padding: 4px;
}
.msg-del:hover { opacity: .9; }

.msg-like-row {
  margin-top: 8px;
}
</style>