<template>
  <div class="timeline-admin">
    <div class="admin-section-bar">
      <div class="admin-section-title">👑 时间线事件管理</div>
      <button class="btn-add" @click="openAdd">＋ 添加事件</button>
    </div>

    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else-if="!events.length" class="admin-empty">暂无时间线事件</div>

    <div v-else class="data-list">
      <div v-for="ev in events" :key="ev.id" class="data-row">
        <div class="data-bar" :style="ev.color === 'blue' ? 'background:linear-gradient(180deg,#a855f7,rgba(168,85,247,.2))' : ''"></div>
        <div class="data-body">
          <div class="data-title">{{ ev.emoji || '✦' }} {{ ev.title }}</div>
          <div class="data-meta">
            <span :class="ev.color === 'blue' ? 'tag-blue' : 'tag-gold'">
              {{ ev.color === 'blue' ? '🌸 日常' : '★ 重要' }}
            </span>
            &nbsp;·&nbsp; {{ ev.date }}
            <span v-if="ev.isBig" class="tag-big">&nbsp;★ 重大</span>
          </div>
          <div v-if="ev.description" class="data-preview">{{ ev.description }}</div>
        </div>
        <div class="data-actions">
          <button class="btn-edit" @click="openEdit(ev)">✏️ 编辑</button>
          <button class="btn-del"  @click="remove(ev.id)">🗑 删除</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-gold-bar"></div>
          <div class="modal-inner">
            <button class="modal-close" @click="showModal = false">✕</button>
            <div class="modal-title">{{ editId ? '编辑时间线事件' : '添加时间线事件' }}</div>
            <div class="modal-sub">{{ editId ? '修改时间线记录' : '新增时间线记录' }}</div>

            <div class="fg"><label class="fl">类型</label>
              <select class="fi" v-model="form.color">
                <option value="pink">★ 重要日期（蓝粉轴）</option>
                <option value="blue">🌸 日常记录（紫色轴）</option>
              </select></div>
            <div class="fg"><label class="fl">日期</label>
              <input class="fi" type="date" v-model="form.date"></div>
            <div class="fg"><label class="fl">标题</label>
              <input class="fi" v-model="form.title" placeholder="例如：初次相遇"></div>
            <div class="fg"><label class="fl">标签 | 描述（可选，用 | 分隔标签和描述）</label>
              <textarea class="fi" v-model="form.description" placeholder="例如：同台演出|两人首次同台！"></textarea></div>
            <div class="fg"><label class="fl">表情</label>
              <input class="fi" v-model="form.emoji" placeholder="✨"></div>
            <div class="fg">
              <label class="fl">封面图（可选）</label>
              <div class="upload-row">
                <input class="fi upload-input" v-model="form.imageUrl" placeholder="https://图片直链… 或点击上传" />
                <button type="button" class="btn-upload" :disabled="imgUploading" @click="$refs.imgFile.click()">
                  {{ imgUploading ? '上传中…' : '📎 上传' }}
                </button>
                <input ref="imgFile" type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="handleImgUpload" />
              </div>
              <img v-if="form.imageUrl" :src="form.imageUrl" class="img-preview" alt="" />
            </div>

            <!-- 图片集 -->
            <div class="fg">
              <label class="fl">图片集（可选，多图）</label>
              <div class="upload-row">
                <input class="fi upload-input" v-model="newImageUrl" placeholder="输入图片直链后按添加" />
                <button type="button" class="btn-upload" @click="addImageUrl">添加</button>
              </div>
              <div class="upload-row" style="margin-top:6px;">
                <button type="button" class="btn-upload" :disabled="multiUploading" @click="$refs.multiFile.click()">
                  {{ multiUploading ? '上传中…' : '📎 批量上传' }}
                </button>
                <input ref="multiFile" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" @change="handleMultiUpload" />
              </div>
              <div v-if="imageUrls.length" class="thumb-strip">
                <div v-for="(url, i) in imageUrls" :key="i" class="thumb-item">
                  <img :src="url" class="thumb-img" alt="" />
                  <button class="thumb-del" @click="imageUrls.splice(i, 1)">✕</button>
                </div>
              </div>
            </div>

            <div class="fg"><label class="fl">视频链接（可选）</label>
              <input class="fi" v-model="form.videoUrl" placeholder="https://b23.tv/..."></div>
            <div class="fg" style="display:flex;align-items:center;gap:10px;">
              <input type="checkbox" id="tl-big" v-model="form.isBig" style="width:16px;height:16px;accent-color:var(--gold);">
              <label for="tl-big" style="font-size:12px;color:var(--t2);letter-spacing:1px;cursor:pointer;">标记为重大时刻（节点放大）</label>
            </div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存事件 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchTimeline, fetchTimelineById, createTimeline, updateTimeline, deleteTimeline } from '@/api/content.js'
import { uploadImage } from '@/api/upload.js'

const events    = ref([])
const loading   = ref(true)
const error     = ref('')
const showModal = ref(false)
const editId    = ref(null)
const submitting   = ref(false)
const formErr      = ref('')
const imgUploading    = ref(false)
const multiUploading  = ref(false)
const newImageUrl     = ref('')
const imageUrls       = ref([])

const emptyForm = () => ({
  color: 'pink', date: '', title: '', description: '',
  emoji: '', imageUrl: '', videoUrl: '', isBig: false
})
const form = ref(emptyForm())

async function load() {
  loading.value = true; error.value = ''
  try { events.value = await fetchTimeline() }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
}

function openAdd() {
  editId.value = null; form.value = emptyForm(); imageUrls.value = []; newImageUrl.value = ''; formErr.value = ''; showModal.value = true
}

async function openEdit(ev) {
  let detail
  try {
    detail = await fetchTimelineById(ev.id)
  } catch (e) {
    alert('获取事件详情失败：' + e.message)
    return
  }
  editId.value = detail.id
  form.value = {
    color:       detail.color || 'pink',
    date:        detail.date || '',
    title:       detail.title || '',
    description: detail.description || '',
    emoji:       detail.emoji || '',
    imageUrl:    detail.imageUrl || '',
    videoUrl:    detail.videoUrl || '',
    isBig:       !!detail.isBig,
  }
  imageUrls.value = (detail.images || []).map(img => img.imageUrl)
  newImageUrl.value = ''
  formErr.value = ''
  showModal.value = true
}

function addImageUrl() {
  const url = newImageUrl.value.trim()
  if (!url) return
  imageUrls.value.push(url)
  newImageUrl.value = ''
}

async function handleImgUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  imgUploading.value = true
  try {
    form.value.imageUrl = await uploadImage(file)
  } catch (err) {
    alert('上传失败：' + err.message)
  } finally {
    imgUploading.value = false
    e.target.value = ''
  }
}

async function handleMultiUpload(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  multiUploading.value = true
  try {
    for (const file of files) {
      const url = await uploadImage(file)
      imageUrls.value.push(url)
    }
  } catch (err) {
    alert('上传失败：' + err.message)
  } finally {
    multiUploading.value = false
    e.target.value = ''
  }
}

async function submit() {
  formErr.value = ''
  if (!form.value.date || !form.value.title.trim()) {
    formErr.value = '日期和标题不能为空'; return
  }
  const existingKey = editId.value ? events.value.find(e => e.id === editId.value)?.eventKey : null
  const eventKey = existingKey || (form.value.date + '-' + Date.now())
  const body = {
    date:        form.value.date,
    title:       form.value.title.trim(),
    description: form.value.description.trim(),
    emoji:       form.value.emoji.trim() || '✦',
    imageUrl:    form.value.imageUrl.trim(),
    videoUrl:    form.value.videoUrl.trim(),
    color:       form.value.color,
    isBig:       form.value.isBig,
    eventKey,
    imageUrls:   imageUrls.value.filter(u => u.trim()),
  }
  submitting.value = true
  try {
    if (editId.value) await updateTimeline(editId.value, body)
    else              await createTimeline(body)
    showModal.value = false
    await load()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function remove(id) {
  if (!confirm('确定删除此时间线事件？')) return
  try { await deleteTimeline(id); await load() }
  catch (e) { alert('删除失败：' + e.message) }
}

onMounted(load)
</script>

<style scoped>
.timeline-admin { padding: 0 0 40px; }

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
  background: linear-gradient(180deg, var(--gold), rgba(212,170,112,.2));
}
.data-body { flex: 1; min-width: 0; }
.data-title { font-size: 14px; letter-spacing: 1px; color: var(--t1); margin-bottom: 5px; }
.data-meta  { font-size: 11px; color: var(--t3); letter-spacing: 1px; margin-bottom: 5px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.tag-gold   { color: var(--gold); font-size: 10px; letter-spacing: 1px; }
.tag-blue   { color: #a855f7; font-size: 10px; letter-spacing: 1px; }
.tag-big    { color: var(--gold); font-size: 9px; }
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
textarea.fi { resize: vertical; min-height: 70px; line-height: 1.7; }
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