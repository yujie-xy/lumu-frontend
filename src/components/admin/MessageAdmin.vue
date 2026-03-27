<template>
  <div class="msg-admin">
    <div class="admin-section-bar">
      <div class="admin-section-title">💌 留言管理</div>
      <div class="admin-count" v-if="!loading">共 {{ messages.length }} 条留言</div>
    </div>

    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else-if="!messages.length" class="admin-empty">暂无留言</div>

    <div v-else class="data-list">
      <div v-for="m in messages" :key="m.id" class="data-row">
        <div class="data-bar"></div>
        <div class="data-body">
          <div class="data-meta">
            <span class="meta-name">{{ m.username }}</span>
            <span class="meta-time">{{ formatTime(m.createdAt) }}</span>
          </div>
          <div class="data-content">{{ m.content }}</div>
        </div>
        <div class="data-actions">
          <button class="btn-del" @click="remove(m.id)">🗑 删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchThreads } from '@/api/messages.js'

const messages = ref([])
const loading  = ref(true)
const error    = ref('')

async function load() {
  loading.value = true
  error.value   = ''
  try {
    // fetchThreads returns a list of message threads
    const threads = await fetchThreads()
    // Flatten threads into a display list
    messages.value = Array.isArray(threads) ? threads : []
  }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function remove() {
  alert('当前后端版本暂不支持删除消息')
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}

onMounted(load)
</script>

<style scoped>
.msg-admin { padding: 0 0 40px; }

.admin-section-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding: 14px 18px;
  background: rgba(212,170,112,.04); border: 1px dashed rgba(212,170,112,.25);
  border-radius: 12px;
}
.admin-section-title { font-size: 12px; letter-spacing: 3px; color: var(--gold); }
.admin-count { font-size: 11px; color: var(--t3); letter-spacing: 1px; }

.admin-loading, .admin-error, .admin-empty {
  padding: 40px; text-align: center; color: var(--t3); font-size: 12px; letter-spacing: 2px;
}
.admin-error { color: #ff8aaa; }

.data-list { display: flex; flex-direction: column; gap: 10px; }

.data-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border-radius: 10px;
  background: var(--card); border: 1px solid var(--border); transition: border-color .2s;
}
.data-row:hover { border-color: var(--border2); }

.data-bar {
  width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0;
  background: linear-gradient(180deg, rgba(245,184,208,.7), rgba(245,184,208,.15));
}

.data-body { flex: 1; min-width: 0; }

.data-meta {
  display: flex; align-items: center; gap: 12px; margin-bottom: 6px;
}
.meta-name { font-size: 12px; color: var(--pink); letter-spacing: 1px; }
.meta-time { font-size: 10px; color: var(--t3); letter-spacing: 1px; }

.data-content {
  font-size: 13px; color: var(--t1); line-height: 1.8;
  letter-spacing: 1px; white-space: pre-wrap; word-break: break-word;
}

.data-actions { flex-shrink: 0; display: flex; align-items: flex-start; }

.btn-del {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; letter-spacing: 1px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa;
  transition: all .2s;
}
.btn-del:hover { background: rgba(255,100,130,.12); }
</style>