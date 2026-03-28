<template>
  <div class="notice-admin">
    <div class="admin-section-bar">
      <div class="admin-section-title">👑 大事件公告管理</div>
      <button class="btn-add" @click="openAdd">＋ 发布公告</button>
    </div>

    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else-if="!notices.length" class="admin-empty">暂无公告</div>

    <div v-else class="data-list">
      <div v-for="n in notices" :key="n.id" class="data-row">
        <div class="data-bar"></div>
        <div class="data-body">
          <div class="event-tag">📣 大 事 件</div>
          <div class="data-title">{{ n.title }}</div>
          <div class="data-meta">{{ n.status }} {{ n.createdAt ? '· ' + n.createdAt.slice(0, 10) : '' }}</div>
          <div class="data-preview">{{ n.body }}</div>
        </div>
        <div class="data-actions">
          <button class="btn-edit" @click="openEdit(n)">✏️ 编辑</button>
          <button class="btn-del"  @click="remove(n.id)">🗑 删除</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-gold-bar"></div>
          <div class="modal-inner">
            <button class="modal-close" @click="showModal = false">✕</button>
            <div class="modal-title">{{ editId ? '编辑公告' : '发布公告' }}</div>
            <div class="modal-sub">{{ editId ? '修改大事件公告' : '新增大事件公告' }}</div>

            <div class="fg"><label class="fl">公告标题 *</label>
              <input class="fi" v-model="form.title" placeholder="输入公告标题"></div>

            <div class="fg">
              <label class="fl">封面图 (resourceUrl)</label>
              <div class="upload-row">
                <input class="fi upload-input" v-model="form.resourceUrl" placeholder="https://... 或点击上传" />
                <button type="button" class="btn-upload" :disabled="coverUploading" @click="$refs.coverFile.click()">
                  {{ coverUploading ? '上传中…' : '📎 上传' }}
                </button>
                <input ref="coverFile" type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="handleCoverUpload" />
              </div>
              <img v-if="form.resourceUrl" :src="form.resourceUrl" class="img-preview" alt="" />
            </div>

            <div class="fg"><label class="fl">公告内容 (body)</label>
              <textarea class="fi" v-model="form.body" rows="5" placeholder="输入公告内容..."></textarea></div>

            <div class="fg"><label class="fl">状态 (status) *</label>
              <select class="fi" v-model="form.status">
                <option value="PUBLISHED">PUBLISHED（已发布）</option>
                <option value="DRAFT">DRAFT（草稿）</option>
              </select>
            </div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '发布中...' : '发布公告 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/api/content.js'
import { uploadImage } from '@/api/upload.js'

const notices        = ref([])
const loading        = ref(true)
const error          = ref('')
const showModal      = ref(false)
const editId         = ref(null)
const submitting     = ref(false)
const formErr        = ref('')
const coverUploading = ref(false)

// ContentRequest: { title, body, resourceUrl, status }
const emptyForm = () => ({ title: '', body: '', resourceUrl: '', status: 'PUBLISHED' })
const form = ref(emptyForm())

function normalizeNoticeItem(notice) {
  if (!notice || typeof notice !== 'object') return notice

  const resourceUrl = notice.resourceUrl || notice.imageUrl || notice.coverImageUrl || notice.firstImageUrl || ''
  const imageUrl = notice.imageUrl || notice.coverImageUrl || notice.firstImageUrl || resourceUrl || ''
  const date = notice.date || notice.createdAt || ''

  return {
    ...notice,
    title: notice.title || '',
    body: notice.body ?? notice.content ?? notice.description ?? '',
    content: notice.content ?? notice.body ?? notice.description ?? '',
    description: notice.description ?? notice.body ?? notice.content ?? '',
    resourceUrl,
    imageUrl,
    coverImageUrl: notice.coverImageUrl || resourceUrl || imageUrl || '',
    firstImageUrl: notice.firstImageUrl || imageUrl || resourceUrl || '',
    images: Array.isArray(notice.images) ? notice.images : [],
    date,
    dateLabel: notice.dateLabel || (date ? String(date).slice(0, 10) : ''),
    isPinned: Boolean(notice.isPinned),
    status: notice.status || 'PUBLISHED',
    createdAt: notice.createdAt || '',
  }
}

async function load() {
  loading.value = true; error.value = ''
  try {
    const list = await fetchEvents()
    notices.value = Array.isArray(list) ? list.map(normalizeNoticeItem) : []
  }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
}

function openAdd() {
  editId.value = null
  form.value = emptyForm()
  formErr.value = ''
  showModal.value = true
}

async function openEdit(n) {
  const detail = normalizeNoticeItem(n)
  editId.value = detail.id
  form.value = {
    title:       detail.title       || '',
    body:        detail.body        || '',
    resourceUrl: detail.resourceUrl || '',
    status:      detail.status      || 'PUBLISHED',
  }
  formErr.value = ''
  showModal.value = true
  return
  let detail
  try {
    detail = await fetchEventById(n.id)
  } catch (e) {
    alert('获取公告详情失败：' + e.message)
    return
  }
  editId.value = detail.id
  form.value = {
    title:       detail.title       || '',
    body:        detail.body        || '',
    resourceUrl: detail.resourceUrl || '',
    status:      detail.status      || 'PUBLISHED',
  }
  formErr.value = ''
  showModal.value = true
}

async function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  coverUploading.value = true
  try {
    form.value.resourceUrl = await uploadImage(file)
  } catch (err) {
    alert('上传失败：' + err.message)
  } finally {
    coverUploading.value = false
    e.target.value = ''
  }
}

async function submit() {
  formErr.value = ''
  if (!form.value.title.trim()) { formErr.value = '标题不能为空'; return }
  const body = {
    title:       form.value.title.trim(),
    body:        form.value.body.trim() || null,
    resourceUrl: form.value.resourceUrl.trim() || null,
    status:      form.value.status,
  }
  submitting.value = true
  try {
    if (editId.value) await updateEvent(editId.value, body)
    else              await createEvent(body)
    showModal.value = false
    await load()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function remove(id) {
  if (!confirm('确定删除此公告？')) return
  try { await deleteEvent(id); await load() }
  catch (e) { alert('删除失败：' + e.message) }
}

onMounted(load)
</script>

<style scoped>
.notice-admin { padding: 0 0 40px; }

.admin-section-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding: 14px 18px;
  background: rgba(212,170,112,.04); border: 1px dashed rgba(212,170,112,.25); border-radius: 12px;
}
.admin-section-title { font-size: 12px; letter-spacing: 3px; color: var(--gold); }
.btn-add {
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
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  border-radius: 10px; background: var(--card); border: 1px solid var(--border); transition: border-color .2s;
}
.data-row:hover { border-color: var(--border2); }
.data-bar {
  width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0;
  background: linear-gradient(180deg, var(--pink-deep), rgba(232,122,171,.2));
}
.data-body { flex: 1; min-width: 0; }
.event-tag {
  display: inline-flex; align-items: center; gap: 4px; font-size: 9px; letter-spacing: 3px;
  padding: 2px 8px; border-radius: 6px; background: rgba(245,184,208,.1); color: var(--pink);
  margin-bottom: 6px;
}
.data-title { font-size: 14px; letter-spacing: 1px; color: var(--t1); margin-bottom: 4px; }
.data-meta  { font-size: 11px; color: var(--t3); letter-spacing: 1px; margin-bottom: 5px; }
.data-preview {
  font-size: 12px; color: var(--t2); line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.data-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-edit {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue); transition: all .2s;
}
.btn-edit:hover { background: rgba(100,180,255,.12); }
.btn-del {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa; transition: all .2s;
}
.btn-del:hover { background: rgba(255,100,130,.12); }

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
.modal-inner { padding: 28px 26px 24px; max-height: 82vh; overflow-y: auto; position: relative; }
.modal-close {
  position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid var(--border); background: var(--card); color: var(--t3);
  cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; z-index: 2;
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
  font-size: 13px; outline: none; transition: border-color .3s;
}
.fi:focus { border-color: rgba(212,170,112,.5); background: rgba(255,255,255,.08); }
.fi::placeholder { color: rgba(255,255,255,.18); }
textarea.fi { resize: vertical; line-height: 1.7; }
.upload-row { display: flex; gap: 8px; align-items: center; }
.upload-input { flex: 1; }
.btn-upload {
  flex-shrink: 0; padding: 8px 14px; border-radius: 8px; font-size: 11px;
  letter-spacing: 1px; cursor: pointer; white-space: nowrap;
  border: 1px solid rgba(212,170,112,.4); background: rgba(212,170,112,.08); color: var(--gold);
  transition: all .2s;
}
.btn-upload:hover:not(:disabled) { background: rgba(212,170,112,.15); }
.btn-upload:disabled { opacity: .5; cursor: not-allowed; }
.img-preview {
  margin-top: 8px; width: 100%; max-height: 120px; object-fit: cover;
  border-radius: 8px; border: 1px solid rgba(255,255,255,.08);
}
.thumb-strip {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
}
.thumb-item { position: relative; }
.thumb-img {
  width: 60px; height: 60px; object-fit: cover; border-radius: 6px;
  border: 1px solid rgba(255,255,255,.1); display: block;
}
.thumb-del {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
  border-radius: 50%; border: none; background: rgba(255,80,100,.8); color: #fff;
  font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;
}
.ferr { font-size: 11px; color: #ff8aaa; letter-spacing: 1px; min-height: 18px; margin-bottom: 4px; }
.btn-submit {
  width: 100%; padding: 13px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #a8783a, var(--gold));
  color: var(--night); font-size: 12px; font-weight: 700; letter-spacing: 4px; cursor: pointer; transition: all .3s;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,170,112,.3); }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }
</style>
