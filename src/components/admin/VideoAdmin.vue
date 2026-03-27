<template>
  <div class="video-admin">

    <!-- ══ 视频管理 ══ -->
    <div class="section-card">
      <div class="section-head">
        <div class="section-label">🎬 视频管理</div>
        <button class="btn-add" @click="openAdd">＋ 添加视频</button>
      </div>

      <div v-if="loadingVideos" class="section-loading">加载中...</div>
      <div v-else-if="!videos.length" class="section-empty">暂无视频</div>

      <div v-else class="video-list">
        <div v-for="v in videos" :key="v.id" class="video-row">
          <img v-if="v.resourceUrl && !v.resourceUrl.includes('bilibili')" :src="resolveMediaUrl(v.resourceUrl)" class="thumb" alt="" />
          <div v-else class="thumb-placeholder">▶</div>
          <div class="row-body">
            <div class="row-title">{{ v.title }}</div>
            <div class="row-meta">
              <span v-if="v.resourceUrl" class="row-source">{{ v.resourceUrl }}</span>
              <span class="row-label">{{ v.status }}</span>
            </div>
            <div v-if="v.body" class="row-preview">{{ v.body }}</div>
          </div>
          <div class="row-actions">
            <button class="btn-edit" @click="openEdit(v)">✏️ 编辑</button>
            <button class="btn-del"  @click="removeVideo(v.id)">🗑 删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-blue-bar"></div>
          <div class="modal-inner">
            <button class="modal-close" @click="showModal = false">✕</button>
            <div class="modal-title">{{ editId ? '编辑视频' : '添加视频' }}</div>
            <div class="modal-sub">{{ editId ? '修改视频信息' : '新增一条视频记录' }}</div>

            <div class="fg"><label class="fl">视频标题 *</label>
              <input class="fi" v-model="form.title" placeholder="例如：2024 北京演唱会" /></div>
            <div class="fg"><label class="fl">视频链接 (resourceUrl) *</label>
              <input class="fi" v-model="form.resourceUrl" placeholder="https://b23.tv/xxxxx" /></div>
            <div class="fg"><label class="fl">简介 (body，可选）</label>
              <textarea class="fi" v-model="form.body" rows="3" placeholder="视频简介..."></textarea></div>
            <div class="fg"><label class="fl">状态 (status) *</label>
              <select class="fi" v-model="form.status">
                <option value="PUBLISHED">PUBLISHED（已发布）</option>
                <option value="DRAFT">DRAFT（草稿）</option>
              </select>
            </div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存视频 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchVideos, createVideo, updateVideo, deleteVideo } from '@/api/video.js'
import { resolveMediaUrl } from '@/utils/media.js'

const videos         = ref([])
const loadingVideos  = ref(true)
const showModal      = ref(false)
const editId         = ref(null)
const submitting     = ref(false)
const formErr        = ref('')

// ContentRequest: { title, body, resourceUrl, status }
const emptyForm = () => ({ title: '', resourceUrl: '', body: '', status: 'PUBLISHED' })
const form = ref(emptyForm())

onMounted(loadVideos)

async function loadVideos() {
  loadingVideos.value = true
  try { videos.value = await fetchVideos() }
  catch {}
  finally { loadingVideos.value = false }
}

function openAdd() {
  editId.value = null; form.value = emptyForm(); formErr.value = ''; showModal.value = true
}

function openEdit(v) {
  editId.value = v.id
  form.value = {
    title:       v.title       || '',
    resourceUrl: v.resourceUrl || '',
    body:        v.body        || '',
    status:      v.status      || 'PUBLISHED',
  }
  formErr.value = ''; showModal.value = true
}

async function submit() {
  formErr.value = ''
  if (!form.value.title.trim())       { formErr.value = '标题不能为空'; return }
  if (!form.value.resourceUrl.trim()) { formErr.value = '视频链接不能为空'; return }
  const body = {
    title:       form.value.title.trim(),
    resourceUrl: form.value.resourceUrl.trim(),
    body:        form.value.body.trim() || null,
    status:      form.value.status,
  }
  submitting.value = true
  try {
    if (editId.value) await updateVideo(editId.value, body)
    else              await createVideo(body)
    showModal.value = false
    await loadVideos()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function removeVideo(id) {
  if (!confirm('确定删除此视频？')) return
  try { await deleteVideo(id); await loadVideos() }
  catch (e) { alert('删除失败：' + e.message) }
}
</script>

<style scoped>
.video-admin { padding: 0 0 40px; }

.section-card {
  background: rgba(168,212,245,.03);
  border: 1px dashed rgba(168,212,245,.2);
  border-radius: 14px;
  padding: 18px;
}
.section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; flex-wrap: wrap; gap: 10px;
}
.section-label { font-size: 12px; letter-spacing: 3px; color: var(--blue); }
.section-loading, .section-empty {
  padding: 24px; text-align: center; color: var(--t3); font-size: 12px; letter-spacing: 2px;
}

.label-add-row { display: flex; gap: 8px; }
.label-input {
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--border); background: rgba(255,255,255,.05);
  color: var(--t1); font-family: 'Noto Sans SC', sans-serif; font-size: 12px;
  outline: none; width: 140px;
}
.label-input:focus { border-color: rgba(168,212,245,.5); }
.btn-label-add {
  padding: 6px 14px; border-radius: 8px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(168,212,245,.4); background: rgba(168,212,245,.08); color: var(--blue); transition: all .2s;
}

.label-list { display: flex; flex-wrap: wrap; gap: 8px; }
.label-item {
  display: flex; align-items: center; gap: 6px; padding: 5px 10px;
  border-radius: 20px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
}
.label-name { font-size: 12px; color: var(--t1); letter-spacing: 1px; }
.label-edit-input {
  padding: 3px 8px; border-radius: 6px; width: 100px;
  border: 1px solid rgba(168,212,245,.3); background: rgba(255,255,255,.06);
  color: var(--t1); font-size: 12px; outline: none;
}
.btn-label-edit, .btn-label-save, .btn-label-cancel {
  padding: 2px 8px; border-radius: 8px; font-size: 10px; cursor: pointer; transition: all .2s;
}
.btn-label-edit   { border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue); }
.btn-label-save   { border: 1px solid rgba(168,212,245,.4); background: rgba(168,212,245,.08); color: var(--blue); }
.btn-label-cancel { border: 1px solid var(--border); background: transparent; color: var(--t3); }
.btn-label-del {
  padding: 2px 8px; border-radius: 8px; font-size: 10px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa; transition: all .2s;
}

.btn-add {
  padding: 7px 16px; border-radius: 50px; font-size: 11px; letter-spacing: 2px; cursor: pointer;
  border: 1px dashed rgba(168,212,245,.4); background: transparent; color: var(--blue); transition: all .25s;
}
.btn-add:hover { background: rgba(168,212,245,.08); }

.video-list { display: flex; flex-direction: column; gap: 10px; }
.video-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 10px; background: var(--card); border: 1px solid var(--border); transition: border-color .2s;
}
.video-row:hover { border-color: var(--border2); }
.thumb { width: 80px; height: 45px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.thumb-placeholder {
  width: 80px; height: 45px; border-radius: 6px; flex-shrink: 0;
  background: rgba(168,212,245,.06); border: 1px solid rgba(168,212,245,.1);
  display: flex; align-items: center; justify-content: center; color: rgba(168,212,245,.3); font-size: 18px;
}
.row-body { flex: 1; min-width: 0; }
.row-title { font-size: 13px; color: var(--t1); margin-bottom: 4px; letter-spacing: 1px; }
.row-meta  { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px; }
.row-preview { font-size: 11px; color: var(--t3); letter-spacing: 1px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.row-source { font-size: 10px; color: var(--t3); letter-spacing: 1px; }
.row-label { font-size: 10px; padding: 1px 7px; border-radius: 8px; background: rgba(168,212,245,.1); color: var(--blue); letter-spacing: 1px; }
.row-nolabel { font-size: 10px; color: rgba(255,255,255,.2); letter-spacing: 1px; }
.row-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-edit {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue); transition: all .2s;
}
.btn-del {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa; transition: all .2s;
}

.modal-overlay {
  position: fixed; inset: 0; z-index: 800;
  background: rgba(8,4,18,.88); backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  width: 100%; max-width: 500px;
  background: linear-gradient(145deg, rgba(16,18,40,.97), rgba(8,10,28,.99));
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(168,212,245,.08);
}
.modal-blue-bar { height: 2px; background: linear-gradient(90deg, #4a8ab5, var(--blue), #4a8ab5); }
.modal-inner { padding: 26px 24px 22px; max-height: 82vh; overflow-y: auto; position: relative; }
.modal-close {
  position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
  border-radius: 50%; border: 1px solid var(--border); background: var(--card);
  color: var(--t3); cursor: pointer; font-size: 12px; display: flex;
  align-items: center; justify-content: center; transition: all .2s;
}
.modal-close:hover { background: var(--card2); color: var(--t1); }
.modal-title { font-family: 'ZCOOL XiaoWei', serif; font-size: 20px; letter-spacing: 4px; color: var(--blue); margin-bottom: 3px; }
.modal-sub   { font-size: 11px; color: var(--t3); letter-spacing: 2px; margin-bottom: 18px; }
.fg { margin-bottom: 13px; }
.fl { display: block; font-size: 10px; letter-spacing: 3px; color: var(--t3); margin-bottom: 7px; }
.fi {
  width: 100%; padding: 10px 13px;
  background: rgba(255,255,255,.05); border: 1px solid var(--border);
  border-radius: 8px; color: var(--t1); font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px; outline: none; transition: border-color .3s;
}
.fi:focus { border-color: rgba(168,212,245,.5); background: rgba(255,255,255,.08); }
.fi::placeholder { color: rgba(255,255,255,.18); }
textarea.fi { resize: vertical; line-height: 1.7; }
.label-checks { display: flex; flex-wrap: wrap; gap: 8px; }
.label-check-item {
  padding: 5px 13px; border-radius: 20px; font-size: 12px; letter-spacing: 1px; cursor: pointer;
  border: 1px solid var(--border); background: rgba(255,255,255,.03); color: var(--t2);
  transition: all .15s; user-select: none;
}
.label-check-item.checked { background: rgba(168,212,245,.12); color: var(--blue); border-color: rgba(168,212,245,.3); }
.no-labels-hint { font-size: 11px; color: var(--t3); letter-spacing: 1px; }
.ferr { font-size: 11px; color: #ff8aaa; letter-spacing: 1px; min-height: 18px; margin-bottom: 4px; }
.btn-submit {
  width: 100%; padding: 12px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #3a6a8f, var(--blue));
  color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 4px; cursor: pointer; transition: all .3s;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(168,212,245,.25); }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }

.upload-row { display: flex; gap: 8px; align-items: center; }
.upload-row .fi { flex: 1; }
.btn-upload {
  flex-shrink: 0; padding: 10px 14px; border-radius: 8px; font-size: 11px;
  letter-spacing: 1px; cursor: pointer; white-space: nowrap;
  border: 1px solid rgba(168,212,245,.4); background: rgba(168,212,245,.08);
  color: var(--blue); transition: all .2s;
}
.btn-upload:hover:not(:disabled) { background: rgba(168,212,245,.15); }
.btn-upload:disabled { opacity: .5; cursor: not-allowed; }

.cover-preview-wrap {
  margin-top: 8px; position: relative; display: inline-block;
}
.cover-preview {
  max-width: 100%; max-height: 120px; border-radius: 8px; object-fit: cover; display: block;
  border: 1px solid rgba(255,255,255,.08);
}
.auto-cover-hint {
  position: absolute; bottom: 6px; left: 6px;
  font-size: 10px; letter-spacing: 1px; padding: 2px 7px; border-radius: 6px;
  background: rgba(168,212,245,.2); color: var(--blue); backdrop-filter: blur(4px);
}
.cover-resolving {
  margin-top: 8px; font-size: 11px; color: var(--blue); letter-spacing: 1px; opacity: .7;
}
</style>