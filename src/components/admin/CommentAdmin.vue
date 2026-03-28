<template>
  <div class="comment-admin">

    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">类型</label>
        <select v-model="filter.contentType" class="filter-select">
          <option value="">全部</option>
          <option value="story">故事线</option>
          <option value="timeline">时间线</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">目标 ID</label>
        <input
          v-model.number="filter.targetId"
          class="filter-input filter-input-sm"
          type="number"
          min="1"
          placeholder="章节/事件 ID"
        />
      </div>
      <div class="filter-group filter-grow">
        <label class="filter-label">关键词</label>
        <input
          v-model="filter.keyword"
          class="filter-input"
          type="text"
          placeholder="搜索评论内容..."
          @keyup.enter="load"
        />
      </div>
      <button class="btn-search" @click="load">搜索</button>
      <button class="btn-reset"  @click="reset">重置</button>
    </div>

    <!-- 状态 -->
    <div class="admin-section-bar">
      <span class="admin-count" v-if="!loading">共 {{ comments.length }} 条评论</span>
    </div>

    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else-if="!comments.length" class="admin-empty">暂无符合条件的评论</div>

    <!-- 评论表格 -->
    <div v-else class="comment-table-wrap">
      <table class="comment-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th class="col-type">类型</th>
            <th class="col-target">目标 ID</th>
            <th class="col-user">用户</th>
            <th class="col-content">评论内容</th>
            <th class="col-time">时间</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in comments" :key="c.id" class="comment-row">
            <td class="col-id">{{ c.id }}</td>
            <td class="col-type">
              <span class="type-badge" :class="c.contentType">
                {{ c.contentType === 'story' ? '故事线' : '时间线' }}
              </span>
            </td>
            <td class="col-target">{{ c.targetId }}</td>
            <td class="col-user">{{ c.username }}</td>
            <td class="col-content">{{ c.content }}</td>
            <td class="col-time">{{ formatTime(c.createdAt) }}</td>
            <td class="col-action">
              <button class="btn-del" @click="remove(c.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const comments = ref([])
const loading  = ref(false)
const error    = ref('')

const filter = reactive({
  contentType: '',
  keyword:     '',
  targetId:    null,
})

onMounted(load)

async function load() {
  loading.value = true
  error.value   = ''
  comments.value = []
  loading.value = false
}

function reset() {
  filter.contentType = ''
  filter.keyword     = ''
  filter.targetId    = null
  load()
}

async function remove(id) {
  return
  if (!confirm('确认删除这条评论？删除后无法恢复。')) return
  try {
    await deleteAdminComment(id)
    comments.value = comments.value.filter(c => c.id !== id)
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
.comment-admin {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 筛选区 ── */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 20px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.filter-grow { flex: 1; min-width: 180px; }

.filter-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.35);
}

.filter-select,
.filter-input {
  height: 34px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  padding: 0 10px;
  color: rgba(255,255,255,.8);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  outline: none;
  transition: border-color .2s;
}
.filter-select { padding-right: 4px; cursor: pointer; }
.filter-input-sm { width: 110px; }
.filter-select:focus,
.filter-input:focus  { border-color: rgba(212,170,112,.4); }
.filter-input::placeholder { color: rgba(255,255,255,.2); }

/* remove number input spinners */
.filter-input[type=number]::-webkit-inner-spin-button,
.filter-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
.filter-input[type=number] { -moz-appearance: textfield; }

.btn-search {
  height: 34px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid rgba(212,170,112,.35);
  background: rgba(212,170,112,.07);
  color: var(--gold);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .2s;
  align-self: flex-end;
}
.btn-search:hover { background: rgba(212,170,112,.14); border-color: var(--gold); }

.btn-reset {
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  color: rgba(255,255,255,.35);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
  align-self: flex-end;
}
.btn-reset:hover { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.6); }

/* ── 计数行 ── */
.admin-section-bar { padding: 0 2px; }
.admin-count  { font-size: 11px; color: rgba(255,255,255,.3); letter-spacing: 2px; }
.admin-loading,
.admin-error,
.admin-empty  { font-size: 13px; color: rgba(255,255,255,.3); letter-spacing: 2px; padding: 40px 0; text-align: center; }
.admin-error  { color: #ff8aaa; }

/* ── 表格 ── */
.comment-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07);
}

.comment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.comment-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.3);
  border-bottom: 1px solid rgba(255,255,255,.07);
  white-space: nowrap;
  background: rgba(255,255,255,.02);
}

.comment-row td {
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  color: rgba(255,255,255,.7);
  vertical-align: top;
}
.comment-row:last-child td { border-bottom: none; }
.comment-row:hover td { background: rgba(255,255,255,.02); }

.col-id     { width: 60px; color: rgba(255,255,255,.3) !important; }
.col-type   { width: 80px; }
.col-target { width: 80px; }
.col-user   { width: 100px; }
.col-content{ max-width: 360px; white-space: pre-wrap; word-break: break-word; line-height: 1.6; }
.col-time   { width: 130px; white-space: nowrap; color: rgba(255,255,255,.35) !important; font-size: 11px; }
.col-action { width: 60px; }

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  letter-spacing: 1px;
}
.type-badge.story    { background: rgba(245,184,208,.12); color: var(--pink); }
.type-badge.timeline { background: rgba(168,212,245,.12); color: var(--blue); }

.btn-del {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,77,109,.3);
  background: transparent;
  color: rgba(255,77,109,.6);
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.btn-del:hover {
  border-color: #ff4d6d;
  color: #ff4d6d;
  background: rgba(255,77,109,.06);
}
</style>
