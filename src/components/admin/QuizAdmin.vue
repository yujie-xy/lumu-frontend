<template>
  <div class="quiz-admin">
    <div class="admin-section-bar">
      <div class="admin-section-title">📝 题库管理</div>
      <button class="btn-add" @click="openAdd">＋ 添加题目</button>
    </div>

    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else-if="!questions.length" class="admin-empty">暂无题目数据</div>

    <div v-else class="data-list">
      <div v-for="(q, idx) in questions" :key="q.id" class="data-row" :class="{ disabled: !q.enabled }">
        <div class="data-bar" :style="q.enabled ? '' : 'background:rgba(255,255,255,.1)'"></div>
        <div class="data-body">
          <div class="data-title">
            <span class="q-id">{{ idx + 1 }}</span>
            <span class="q-type">{{ q.questionType }}</span>
            {{ q.stem }}
            <span v-if="!q.enabled" class="tag-disabled">已停用</span>
          </div>
          <div class="data-answer">答案：{{ q.answerText }}</div>
        </div>
        <div class="data-actions">
          <button class="btn-toggle" @click="toggleEnabled(q)">
            {{ q.enabled ? '停用' : '启用' }}
          </button>
          <button class="btn-edit" @click="openEdit(q)">✏️ 编辑</button>
          <button class="btn-del" @click="remove(q.id)">🗑 删除</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-gold-bar"></div>
          <div class="modal-inner">
            <button class="modal-close" @click="showModal = false">✕</button>
            <div class="modal-title">{{ editId ? '编辑题目' : '添加题目' }}</div>
            <div class="modal-sub">{{ editId ? '修改粉丝验证题目' : '新增粉丝验证题目' }}</div>

            <div class="fg">
              <label class="fl">题目类型</label>
              <input class="fi" v-model="form.questionType" placeholder="例如：知识题、图片题">
            </div>
            <div class="fg">
              <label class="fl">题目内容 (stem)</label>
              <textarea class="fi" v-model="form.stem" rows="3" placeholder="请输入题目..."></textarea>
            </div>
            <div class="fg">
              <label class="fl">正确答案</label>
              <input class="fi" v-model="form.answerText" placeholder="输入答案文本">
            </div>
            <div class="fg" style="display:flex;align-items:center;gap:10px">
              <label class="fl" style="margin-bottom:0">启用题目</label>
              <input type="checkbox" v-model="form.enabled" style="width:16px;height:16px;cursor:pointer">
            </div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存题目 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  fetchAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  setQuestionEnabled,
} from '@/api/quiz.js'

const questions  = ref([])
const loading    = ref(true)
const error      = ref('')
const showModal  = ref(false)
const editId     = ref(null)
const submitting = ref(false)
const formErr    = ref('')

const emptyForm = () => ({
  questionType: '', stem: '', answerText: '', enabled: true,
})
const form = ref(emptyForm())

async function load() {
  loading.value = true; error.value = ''
  try { questions.value = await fetchAdminQuestions() }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
}

function openAdd() {
  editId.value = null; form.value = emptyForm(); formErr.value = ''; showModal.value = true
}

function openEdit(q) {
  editId.value = q.id
  form.value = {
    questionType: q.questionType || '',
    stem:         q.stem || '',
    answerText:   q.answerText || '',
    enabled:      q.enabled ?? true,
  }
  formErr.value = ''; showModal.value = true
}

async function submit() {
  formErr.value = ''
  const f = form.value
  if (!f.stem.trim())       { formErr.value = '题目内容不能为空'; return }
  if (!f.answerText.trim()) { formErr.value = '答案不能为空'; return }

  const body = {
    questionType: f.questionType.trim() || 'general',
    stem:         f.stem.trim(),
    answerText:   f.answerText.trim(),
    enabled:      f.enabled,
  }
  submitting.value = true
  try {
    if (editId.value) await updateQuestion(editId.value, body)
    else              await createQuestion(body)
    showModal.value = false
    await load()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function remove(id) {
  if (!confirm('确定删除此题目？此操作不可恢复。')) return
  try { await deleteQuestion(id); await load() }
  catch (e) { alert('删除失败：' + e.message) }
}

async function toggleEnabled(q) {
  try {
    await setQuestionEnabled(q)
    await load()
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

onMounted(load)
</script>

<style scoped>
.quiz-admin { padding: 0 0 40px; }

.admin-section-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding: 14px 18px;
  background: rgba(212,170,112,.04); border: 1px dashed rgba(212,170,112,.25);
  border-radius: 12px;
}
.admin-section-title { font-family: 'ZCOOL XiaoWei',serif; font-size:13px; letter-spacing:4px; color:var(--gold); }
.btn-add {
  padding: 6px 16px; border-radius: 8px;
  border: 1px solid rgba(212,170,112,.4); background: rgba(212,170,112,.06);
  color: var(--gold); font-size: 12px; letter-spacing: 2px; cursor: pointer; transition: all .2s;
}
.btn-add:hover { background: rgba(212,170,112,.14); }

.admin-loading, .admin-error, .admin-empty {
  text-align:center; color:rgba(255,255,255,.3); padding:40px 0; font-size:13px; letter-spacing:2px;
}
.admin-error { color:#ff8aaa; }

.data-list { display:flex; flex-direction:column; gap:8px; }
.data-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border-radius: 10px;
  background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06);
  transition: border-color .2s;
}
.data-row:hover { border-color: rgba(212,170,112,.15); }
.data-row.disabled { opacity: .5; }

.data-bar { width: 3px; min-height: 40px; border-radius: 2px; background: var(--gold); flex-shrink: 0; margin-top: 2px; }
.data-body { flex: 1; min-width: 0; }
.data-title {
  font-size: 13px; color: rgba(255,255,255,.85);
  letter-spacing: 1px; line-height: 1.6; margin-bottom: 6px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.q-id {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(212,170,112,.15); color: var(--gold);
  font-size: 11px; flex-shrink: 0;
}
.q-type {
  font-size: 10px; padding: 1px 7px; border-radius: 8px;
  background: rgba(168,212,245,.1); color: var(--blue); letter-spacing: 1px;
}
.data-answer {
  font-size: 12px; color: rgba(150,240,180,.7); letter-spacing: 1px;
}
.tag-disabled { font-size: 10px; padding: 1px 7px; border-radius: 8px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.3); letter-spacing: 1px; }

.data-actions { display: flex; gap: 6px; flex-shrink: 0; align-items: center; }

.btn-toggle {
  padding: 3px 10px; border-radius: 6px; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all .2s;
  border: 1px solid rgba(212,170,112,.3); background: transparent; color: rgba(212,170,112,.6);
}
.btn-toggle:hover { border-color: var(--gold); color: var(--gold); }
.btn-edit {
  padding: 3px 10px; border-radius: 6px; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all .2s;
  border: 1px solid rgba(168,212,245,.2); background: transparent; color: rgba(168,212,245,.6);
}
.btn-edit:hover { border-color: var(--blue); color: var(--blue); }
.btn-del {
  padding: 3px 10px; border-radius: 6px; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all .2s;
  border: 1px solid rgba(255,77,109,.2); background: transparent; color: rgba(255,77,109,.5);
}
.btn-del:hover { border-color: #ff4d6d; color: #ff4d6d; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(6px);
  z-index: 900; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
  background: #0f0921; border: 1px solid rgba(212,170,112,.25); border-radius: 16px;
  scrollbar-width: thin; scrollbar-color: rgba(212,170,112,.2) transparent;
}
.modal-gold-bar { height: 3px; background: linear-gradient(90deg,#d4aa70,rgba(212,170,112,.1)); border-radius: 16px 16px 0 0; }
.modal-inner { padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-close {
  background: none; border: none; color: rgba(255,255,255,.3); font-size: 14px; cursor: pointer;
  align-self: flex-end; padding: 2px 6px; border-radius: 4px; transition: color .2s;
}
.modal-close:hover { color: rgba(255,255,255,.7); }
.modal-title { font-family: 'ZCOOL XiaoWei',serif; font-size: 18px; letter-spacing: 4px; color: var(--gold); text-align: center; }
.modal-sub { font-size: 11px; color: rgba(255,255,255,.3); letter-spacing: 2px; text-align: center; margin-top: -6px; }
.fg { display: flex; flex-direction: column; gap: 5px; }
.fl { font-size: 11px; color: rgba(255,255,255,.35); letter-spacing: 2px; }
.fi {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px;
  padding: 9px 12px; color: rgba(255,255,255,.85); font-family: 'Noto Sans SC',sans-serif;
  font-size: 13px; outline: none; transition: border-color .2s; resize: vertical;
}
.fi:focus { border-color: rgba(212,170,112,.4); }
.fi::placeholder { color: rgba(255,255,255,.2); }
.ferr { font-size: 12px; color: #ff8aaa; letter-spacing: 1px; min-height: 16px; }
.btn-submit {
  padding: 12px; border-radius: 10px; border: none;
  background: linear-gradient(135deg,#8a6430,var(--gold)); color: #1a0e30;
  font-family: 'Noto Sans SC',sans-serif; font-size: 13px; font-weight: 700;
  letter-spacing: 3px; cursor: pointer; transition: all .25s;
}
.btn-submit:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(212,170,112,.3); }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }
</style>