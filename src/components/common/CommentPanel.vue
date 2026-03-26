<template>
  <div class="comment-panel">
    <!-- 切换按钮 -->
    <button class="comment-toggle" @click="open = !open">
      <span>💬</span>
      <span>{{ open ? '收起评论' : `评论 (${comments.length})` }}</span>
    </button>

    <!-- 展开区 -->
    <div v-if="open" class="comment-body">

      <!-- 评论列表 -->
      <div v-if="comments.length" class="comment-list">
        <div v-for="c in comments" :key="c.id" class="comment-item">
          <div class="comment-meta">
            <span class="comment-author">{{ c.username }}</span>
            <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
            <button
              v-if="isAdmin()"
              class="comment-delete"
              @click="handleDelete(c.id)"
            >删除</button>
          </div>
          <div class="comment-content">{{ c.content }}</div>
        </div>
      </div>
      <div v-else class="comment-empty">暂无评论，来说点什么吧</div>

      <!-- 输入区 -->
      <div v-if="isGuest()" class="comment-login-hint">
        登录后才能发表评论 ✨
      </div>
      <div v-else class="comment-input-wrap">
        <textarea
          v-model="draft"
          class="comment-input"
          placeholder="说点什么…（最多 500 字）"
          maxlength="500"
          rows="3"
        ></textarea>
        <div class="comment-input-footer">
          <span class="comment-char">{{ draft.length }} / 500</span>
          <button
            class="comment-submit"
            :disabled="!draft.trim() || submitting"
            @click="handleSubmit"
          >{{ submitting ? '发送中…' : '发送' }}</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchComments, postComment, deleteComment } from '@/api/interaction.js'
import { useAuth } from '@/composables/useAuth.js'

const props = defineProps({
  contentType: { type: String, required: true },
  targetId:    { type: Number, required: true },
})

const { isGuest, isAdmin } = useAuth()

const open      = ref(false)
const comments  = ref([])
const draft     = ref('')
const submitting = ref(false)

onMounted(load)

async function load() {
  try {
    comments.value = await fetchComments(props.contentType, props.targetId)
  } catch (_) {}
}

async function handleSubmit() {
  if (!draft.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const vo = await postComment(props.contentType, props.targetId, draft.value.trim())
    comments.value.push(vo)
    draft.value = ''
  } catch (e) {
    alert(e.message || '发送失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  if (!confirm('确认删除该评论？')) return
  try {
    await deleteComment(id)
    comments.value = comments.value.filter(c => c.id !== id)
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.slice(0, 16).replace('T', ' ')
}
</script>

<style scoped>
.comment-panel {
  margin-top: 12px;
}

/* ── 切换按钮 ── */
.comment-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  color: rgba(255,255,255,.45);
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
}
.comment-toggle:hover {
  border-color: rgba(168,212,245,.4);
  color: var(--blue);
  background: rgba(168,212,245,.06);
}

/* ── 展开区 ── */
.comment-body {
  margin-top: 12px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.06);
}

/* ── 列表 ── */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.05);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.comment-author {
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--pink);
}

.comment-time {
  font-size: 10px;
  color: rgba(255,255,255,.25);
  letter-spacing: 1px;
}

.comment-delete {
  margin-left: auto;
  font-size: 10px;
  letter-spacing: 1px;
  color: rgba(255,77,109,.5);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
}
.comment-delete:hover { color: #ff4d6d; }

.comment-content {
  font-size: 13px;
  color: rgba(255,255,255,.65);
  line-height: 1.6;
  letter-spacing: 0.5px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-empty {
  font-size: 12px;
  color: rgba(255,255,255,.25);
  letter-spacing: 2px;
  text-align: center;
  padding: 12px 0 16px;
}

/* ── 登录提示 ── */
.comment-login-hint {
  font-size: 12px;
  color: rgba(255,255,255,.3);
  letter-spacing: 2px;
  text-align: center;
  padding: 8px 0;
}

/* ── 输入区 ── */
.comment-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-input {
  width: 100%;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: rgba(255,255,255,.8);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px;
  letter-spacing: 0.5px;
  resize: none;
  outline: none;
  transition: border-color .2s;
  box-sizing: border-box;
}
.comment-input::placeholder { color: rgba(255,255,255,.2); }
.comment-input:focus { border-color: rgba(168,212,245,.35); }

.comment-input-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.comment-char {
  font-size: 10px;
  color: rgba(255,255,255,.2);
  letter-spacing: 1px;
}

.comment-submit {
  padding: 6px 18px;
  border-radius: 14px;
  border: 1px solid rgba(168,212,245,.35);
  background: rgba(168,212,245,.06);
  color: var(--blue);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .2s;
}
.comment-submit:hover:not(:disabled) {
  border-color: var(--blue);
  background: rgba(168,212,245,.12);
}
.comment-submit:disabled { opacity: 0.35; cursor: not-allowed; }
</style>