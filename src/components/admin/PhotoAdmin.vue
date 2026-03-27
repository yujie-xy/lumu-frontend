<template>
  <div class="photo-admin">

    <!-- ══ 照片管理 ══ -->
    <div class="section-card">
      <div class="section-head">
        <div class="section-label">🖼 照片管理</div>
        <button class="btn-add" @click="openAdd">＋ 添加照片</button>
      </div>

      <div v-if="loadingPhotos" class="section-loading">加载中...</div>
      <div v-else-if="!photos.length" class="section-empty">暂无照片</div>

      <div v-else class="photo-list">
        <div v-for="p in photos" :key="p.id" class="photo-row">
          <img v-if="p.resourceUrl" :src="resolveMediaUrl(p.resourceUrl)" class="thumb" alt="" />
          <div v-else class="thumb" style="background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.2);">🖼</div>
          <div class="row-body">
            <div class="row-title">{{ p.title || '（无标题）' }}</div>
            <div class="row-meta">
              <span v-if="p.body" class="row-source">{{ p.body }}</span>
              <span class="row-label" :class="p.status">{{ p.status }}</span>
            </div>
          </div>
          <div class="row-actions">
            <button class="btn-edit" @click="openEdit(p)">✏️ 编辑</button>
            <button class="btn-del"  @click="removePhoto(p.id)">🗑 删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-gold-bar"></div>
          <div class="modal-inner">
            <button class="modal-close" @click="showModal = false">✕</button>
            <div class="modal-title">{{ editId ? '编辑照片' : '添加照片' }}</div>
            <div class="modal-sub">{{ editId ? '修改照片信息' : '新增一张照片' }}</div>

            <div class="fg">
              <label class="fl">图片地址 (resourceUrl) *</label>
              <div class="upload-row">
                <input class="fi" v-model="form.resourceUrl" placeholder="https://example.com/photo.jpg 或点击上传" />
                <button type="button" class="btn-upload" :disabled="imgUploading" @click="$refs.imgFileInput.click()">
                  {{ imgUploading ? '上传中…' : '📎 上传' }}
                </button>
                <input ref="imgFileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="handleImgUpload" />
              </div>
              <img v-if="form.resourceUrl" :src="resolveMediaUrl(form.resourceUrl)" class="img-preview" alt="预览" />
            </div>
            <div class="fg"><label class="fl">标题 *</label>
              <input class="fi" v-model="form.title" placeholder="例如：演唱会现场" /></div>
            <div class="fg"><label class="fl">描述（body，可选）</label>
              <input class="fi" v-model="form.body" placeholder="例如：来源 微博 @xxx" /></div>
            <div class="fg"><label class="fl">状态 (status) *</label>
              <select class="fi" v-model="form.status">
                <option value="PUBLISHED">PUBLISHED（已发布）</option>
                <option value="DRAFT">DRAFT（草稿）</option>
              </select>
            </div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存照片 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchPhotos, createPhoto, updatePhoto, deletePhoto } from '@/api/photo.js'
import { uploadImage } from '@/api/upload.js'
import { resolveMediaUrl } from '@/utils/media.js'

const photos         = ref([])
const loadingPhotos  = ref(true)
const showModal      = ref(false)
const editId         = ref(null)
const submitting     = ref(false)
const formErr        = ref('')

const imgUploading = ref(false)
// ContentRequest: { title, body, resourceUrl, status }
const emptyForm = () => ({ resourceUrl: '', title: '', body: '', status: 'PUBLISHED' })
const form = ref(emptyForm())

onMounted(loadPhotos)

async function loadPhotos() {
  loadingPhotos.value = true
  try { photos.value = await fetchPhotos() }
  catch {}
  finally { loadingPhotos.value = false }
}

function openAdd() {
  editId.value = null; form.value = emptyForm(); formErr.value = ''; showModal.value = true
}

function openEdit(p) {
  editId.value = p.id
  form.value = {
    resourceUrl: p.resourceUrl || '',
    title:       p.title       || '',
    body:        p.body        || '',
    status:      p.status      || 'PUBLISHED',
  }
  formErr.value = ''; showModal.value = true
}

async function submit() {
  formErr.value = ''
  if (!form.value.resourceUrl.trim()) { formErr.value = '图片地址不能为空'; return }
  if (!form.value.title.trim())       { formErr.value = '标题不能为空'; return }
  const body = {
    resourceUrl: form.value.resourceUrl.trim(),
    title:       form.value.title.trim(),
    body:        form.value.body.trim() || null,
    status:      form.value.status,
  }
  submitting.value = true
  try {
    if (editId.value) await updatePhoto(editId.value, body)
    else              await createPhoto(body)
    showModal.value = false
    await loadPhotos()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function handleImgUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  imgUploading.value = true
  try {
    const url = await uploadImage(file)
    form.value.resourceUrl = url
  } catch (err) {
    alert('上传失败：' + (err.message || '未知错误'))
  } finally {
    imgUploading.value = false
  }
}

async function removePhoto(id) {
  if (!confirm('确定删除此照片？')) return
  try { await deletePhoto(id); await loadPhotos() }
  catch (e) { alert('删除失败：' + e.message) }
}
</script>

<style scoped>
.photo-admin { padding: 0 0 40px; }

.section-card {
  background: rgba(212,170,112,.03);
  border: 1px dashed rgba(212,170,112,.2);
  border-radius: 14px;
  padding: 18px;
}
.section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; flex-wrap: wrap; gap: 10px;
}
.section-label { font-size: 12px; letter-spacing: 3px; color: var(--gold); }
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
.label-input:focus { border-color: rgba(212,170,112,.5); }
.btn-label-add {
  padding: 6px 14px; border-radius: 8px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(212,170,112,.4); background: rgba(212,170,112,.08); color: var(--gold); transition: all .2s;
}
.btn-label-add:hover { background: rgba(212,170,112,.15); }

.label-list { display: flex; flex-wrap: wrap; gap: 8px; }
.label-item {
  display: flex; align-items: center; gap: 6px; padding: 5px 10px;
  border-radius: 20px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
}
.label-name { font-size: 12px; color: var(--t1); letter-spacing: 1px; }
.label-edit-input {
  padding: 3px 8px; border-radius: 6px; width: 100px;
  border: 1px solid rgba(212,170,112,.3); background: rgba(255,255,255,.06);
  color: var(--t1); font-size: 12px; outline: none;
}
.btn-label-edit, .btn-label-save, .btn-label-cancel {
  padding: 2px 8px; border-radius: 8px; font-size: 10px; cursor: pointer; transition: all .2s;
}
.btn-label-edit   { border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue); }
.btn-label-save   { border: 1px solid rgba(212,170,112,.4); background: rgba(212,170,112,.08); color: var(--gold); }
.btn-label-cancel { border: 1px solid var(--border); background: transparent; color: var(--t3); }
.btn-label-del {
  padding: 2px 8px; border-radius: 8px; font-size: 10px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa; transition: all .2s;
}

.btn-add {
  padding: 7px 16px; border-radius: 50px; font-size: 11px; letter-spacing: 2px; cursor: pointer;
  border: 1px dashed rgba(212,170,112,.4); background: transparent; color: var(--gold); transition: all .25s;
}
.btn-add:hover { background: rgba(212,170,112,.08); border-color: var(--gold); }

.photo-list { display: flex; flex-direction: column; gap: 10px; }
.photo-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 10px; background: var(--card); border: 1px solid var(--border); transition: border-color .2s;
}
.photo-row:hover { border-color: var(--border2); }
.thumb { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.row-body { flex: 1; min-width: 0; }
.row-title { font-size: 13px; color: var(--t1); margin-bottom: 5px; letter-spacing: 1px; }
.row-meta  { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.row-source { font-size: 10px; color: var(--t3); letter-spacing: 1px; }
.row-label {
  font-size: 10px; padding: 1px 7px; border-radius: 8px;
  background: rgba(245,184,208,.1); color: var(--pink); letter-spacing: 1px;
}
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
  width: 100%; max-width: 480px;
  background: linear-gradient(145deg, rgba(26,12,50,.97), rgba(14,7,28,.99));
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.07);
}
.modal-gold-bar { height: 2px; background: linear-gradient(90deg, #a8783a, var(--gold), #a8783a); }
.modal-inner { padding: 26px 24px 22px; max-height: 80vh; overflow-y: auto; position: relative; }
.modal-close {
  position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
  border-radius: 50%; border: 1px solid var(--border); background: var(--card);
  color: var(--t3); cursor: pointer; font-size: 12px; display: flex;
  align-items: center; justify-content: center; transition: all .2s;
}
.modal-close:hover { background: var(--card2); color: var(--t1); }
.modal-title { font-family: 'ZCOOL XiaoWei', serif; font-size: 20px; letter-spacing: 4px; color: var(--gold); margin-bottom: 3px; }
.modal-sub   { font-size: 11px; color: var(--t3); letter-spacing: 2px; margin-bottom: 18px; }
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
.label-checks { display: flex; flex-wrap: wrap; gap: 8px; }
.label-check-item {
  padding: 5px 13px; border-radius: 20px; font-size: 12px; letter-spacing: 1px; cursor: pointer;
  border: 1px solid var(--border); background: rgba(255,255,255,.03); color: var(--t2);
  transition: all .15s; user-select: none;
}
.label-check-item.checked { background: rgba(245,184,208,.12); color: var(--pink); border-color: rgba(245,184,208,.3); }
.no-labels-hint { font-size: 11px; color: var(--t3); letter-spacing: 1px; }
.ferr { font-size: 11px; color: #ff8aaa; letter-spacing: 1px; min-height: 18px; margin-bottom: 4px; }
.btn-submit {
  width: 100%; padding: 12px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #a8783a, var(--gold));
  color: var(--night); font-size: 12px; font-weight: 700; letter-spacing: 4px; cursor: pointer; transition: all .3s;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,170,112,.3); }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }

.upload-row { display: flex; gap: 8px; align-items: center; }
.upload-row .fi { flex: 1; }
.btn-upload {
  flex-shrink: 0; padding: 10px 14px; border-radius: 8px; font-size: 11px;
  letter-spacing: 1px; cursor: pointer; white-space: nowrap;
  border: 1px solid rgba(212,170,112,.4); background: rgba(212,170,112,.08);
  color: var(--gold); transition: all .2s;
}
.btn-upload:hover:not(:disabled) { background: rgba(212,170,112,.15); }
.btn-upload:disabled { opacity: .5; cursor: not-allowed; }
.img-preview {
  margin-top: 8px; max-width: 100%; max-height: 160px;
  border-radius: 8px; object-fit: contain; display: block;
  border: 1px solid rgba(255,255,255,.08);
}
</style>