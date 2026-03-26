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
      <div v-for="(q, idx) in questions" :key="q.id" class="data-row" :class="{ disabled: !q.isActive }">
        <div class="data-bar" :style="q.isActive ? '' : 'background:rgba(255,255,255,.1)'"></div>
        <div class="data-body">
          <div class="data-title">
            <span class="q-id">{{ idx + 1 }}</span>
            {{ q.questionText }}
            <span v-if="!q.isActive" class="tag-disabled">已停用</span>
          </div>
          <div class="data-opts">
            <span v-for="(opt, i) in [q.optionA, q.optionB, q.optionC, q.optionD]" :key="i"
              class="opt-chip" :class="{ correct: i === q.correctOption }">
              {{ ['A','B','C','D'][i] }}. {{ opt }}
            </span>
          </div>
        </div>
        <div class="data-actions">
          <button class="btn-toggle" @click="toggleEnabled(q)">
            {{ q.isActive ? '停用' : '启用' }}
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
              <label class="fl">题目内容</label>
              <textarea class="fi" v-model="form.questionText" rows="3" placeholder="请输入题目..."></textarea>
            </div>
            <div class="fg">
              <label class="fl">选项 A</label>
              <input class="fi" v-model="form.optionA" placeholder="选项 A">
            </div>
            <div class="fg">
              <label class="fl">选项 B</label>
              <input class="fi" v-model="form.optionB" placeholder="选项 B">
            </div>
            <div class="fg">
              <label class="fl">选项 C</label>
              <input class="fi" v-model="form.optionC" placeholder="选项 C">
            </div>
            <div class="fg">
              <label class="fl">选项 D</label>
              <input class="fi" v-model="form.optionD" placeholder="选项 D">
            </div>
            <div class="fg">
              <label class="fl">正确答案</label>
              <select class="fi" v-model="form.correctOption">
                <option :value="0">A</option>
                <option :value="1">B</option>
                <option :value="2">C</option>
                <option :value="3">D</option>
              </select>
            </div>
            <div class="fg" style="display:flex;align-items:center;gap:10px">
              <label class="fl" style="margin-bottom:0">启用题目</label>
              <input type="checkbox" v-model="form.isActive" style="width:16px;height:16px;cursor:pointer">
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
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 0, isActive: true,
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
    questionText:  q.questionText,
    optionA:       q.optionA,
    optionB:       q.optionB,
    optionC:       q.optionC,
    optionD:       q.optionD,
    correctOption: q.correctOption,
    isActive:      q.isActive ?? true,
  }
  formErr.value = ''; showModal.value = true
}

async function submit() {
  formErr.value = ''
  const f = form.value
  if (!f.questionText.trim() || !f.optionA.trim() || !f.optionB.trim() ||
      !f.optionC.trim() || !f.optionD.trim()) {
    formErr.value = '题目和四个选项不能为空'; return
  }
  if (f.correctOption === null || f.correctOption === undefined) {
    formErr.value = '请选择正确答案'; return
  }
  const body = {
    questionText:  f.questionText.trim(),
    optionA:       f.optionA.trim(),
    optionB:       f.optionB.trim(),
    optionC:       f.optionC.trim(),
    optionD:       f.optionD.trim(),
    correctOption: Number(f.correctOption),
    isActive:      f.isActive,
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
    await setQuestionEnabled(q.id, !q.isActive)
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
.admin-section-title { font-size: 12px; letter-spacing: 3px; color: var(--gold); }
.btn-add {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 50px;
  border: 1px dashed rgba(212,170,112,.4); background: transparent;
  color: var(--gold); font-size: 11px; letter-spacing: 2px; cursor: pointer; transition: all .25s;
}
.btn-add:hover { background: rgba(212,170,112,.08); border-color: var(--gold); }

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
.data-row.disabled { opacity: .55; }
.data-bar {
  width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0;
  background: linear-gradient(180deg, var(--gold), rgba(212,170,112,.2));
}
.data-body { flex: 1; min-width: 0; }
.data-title {
  font-size: 13px; letter-spacing: 1px; color: var(--t1);
  margin-bottom: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.q-id { font-size: 10px; color: var(--t3); letter-spacing: 1px; flex-shrink: 0; }
.tag-disabled {
  font-size: 9px; padding: 1px 7px; border-radius: 6px;
  background: rgba(255,255,255,.06); color: var(--t3); border: 1px solid var(--border);
  flex-shrink: 0;
}
.data-opts { display: flex; gap: 8px; flex-wrap: wrap; }
.opt-chip {
  font-size: 11px; padding: 3px 10px; border-radius: 20px;
  border: 1px solid var(--border); color: var(--t2);
  background: rgba(255,255,255,.03);
}
.opt-chip.correct {
  border-color: rgba(125,232,176,.5); color: #7de8b0;
  background: rgba(125,232,176,.08);
}

.data-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.btn-toggle {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; letter-spacing: 1px; cursor: pointer;
  border: 1px solid rgba(212,170,112,.3); background: rgba(212,170,112,.06); color: var(--gold);
  transition: all .2s;
}
.btn-toggle:hover { background: rgba(212,170,112,.12); }
.btn-edit {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; letter-spacing: 1px; cursor: pointer;
  border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue);
  transition: all .2s;
}
.btn-edit:hover { background: rgba(100,180,255,.12); }
.btn-del {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; letter-spacing: 1px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa;
  transition: all .2s;
}
.btn-del:hover { background: rgba(255,100,130,.12); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 800;
  background: rgba(8,4,18,.88); backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  width: 100%; max-width: 520px;
  background: linear-gradient(145deg, rgba(26,12,50,.97), rgba(14,7,28,.99));
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.07);
}
.modal-gold-bar { height: 2px; background: linear-gradient(90deg, #a8783a, var(--gold), #a8783a); }
.modal-inner { padding: 28px 26px 24px; max-height: 80vh; overflow-y: auto; position: relative; }
.modal-close {
  position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
  border-radius: 50%; border: 1px solid var(--border); background: var(--card);
  color: var(--t3); cursor: pointer; font-size: 12px; display: flex;
  align-items: center; justify-content: center; transition: all .2s; z-index: 2;
}
.modal-close:hover { background: var(--card2); color: var(--t1); }
.modal-title { font-family: 'ZCOOL XiaoWei', serif; font-size: 20px; letter-spacing: 4px; color: var(--gold); margin-bottom: 3px; }
.modal-sub   { font-size: 11px; color: var(--t3); letter-spacing: 2px; margin-bottom: 20px; }
.fg { margin-bottom: 13px; }
.fl { display: block; font-size: 10px; letter-spacing: 3px; color: var(--t3); margin-bottom: 7px; }
.fi {
  width: 100%; padding: 10px 13px;
  background: rgba(255,255,255,.05); border: 1px solid var(--border);
  border-radius: 8px; color: var(--t1); font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px; outline: none; transition: border-color .3s, background .3s;
  box-sizing: border-box;
}
.fi:focus { border-color: rgba(212,170,112,.5); background: rgba(255,255,255,.08); }
.fi::placeholder { color: rgba(255,255,255,.18); }
textarea.fi { resize: vertical; line-height: 1.7; }
select.fi option { background: #1a0c32; color: var(--t1); }
.ferr { font-size: 11px; color: #ff8aaa; letter-spacing: 1px; min-height: 18px; margin-bottom: 4px; }
.btn-submit {
  width: 100%; padding: 13px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #a8783a, var(--gold));
  color: var(--night); font-size: 12px; font-weight: 700; letter-spacing: 4px;
  cursor: pointer; transition: all .3s;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,170,112,.3); }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }
</style>