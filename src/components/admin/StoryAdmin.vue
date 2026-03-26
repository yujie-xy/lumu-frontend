<template>
  <div class="story-admin">
    <div class="admin-section-bar">
      <div class="admin-section-title">👑 故事线章节管理</div>
      <button class="btn-add" @click="openAdd">＋ 添加章节</button>
    </div>

    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else-if="!chapters.length" class="admin-empty">暂无章节数据</div>

    <div v-else class="data-list">
      <div v-for="ch in chapters" :key="ch.id" class="data-row">
        <div class="data-bar"></div>
        <div class="data-body">
          <div class="data-title">{{ ch.emoji || '📖' }} 第{{ ch.chapterNum }}章 · {{ ch.title }}</div>
          <div class="data-meta">{{ ch.dateLabel || '——' }}</div>
          <div class="data-preview">{{ stripHtml(ch.content) }}</div>
        </div>
        <div class="data-actions">
          <button class="btn-edit" @click="openEdit(ch)">✏️ 编辑</button>
          <button class="btn-del" @click="remove(ch.id)">🗑 删除</button>
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
            <div class="modal-title">{{ editId ? '编辑章节' : '添加章节' }}</div>
            <div class="modal-sub">{{ editId ? '修改故事线章节内容' : '新增故事线章节' }}</div>

            <div class="fg"><label class="fl">章节序号</label>
              <input class="fi" type="number" v-model="form.chapterNum" placeholder="留空自动排序"></div>
            <div class="fg"><label class="fl">章节标题</label>
              <input class="fi" v-model="form.title" placeholder="例如：初 见"></div>
            <div class="fg"><label class="fl">时间标注</label>
              <input class="fi" v-model="form.dateLabel" placeholder="例如：2023.01"></div>
            <div class="fg"><label class="fl">章节表情</label>
              <input class="fi" v-model="form.emoji" placeholder="🌱"></div>
            <div class="fg"><label class="fl">渐变背景（可选）</label>
              <input class="fi" v-model="form.gradient" placeholder="例如：135deg,rgba(168,212,245,.2),rgba(245,184,208,.15)"></div>

            <!-- 封面图（旧字段，保持兼容） -->
            <div class="fg">
              <label class="fl">封面图（可选）</label>
              <div class="upload-row">
                <input class="fi upload-input" v-model="form.imageUrl" placeholder="https://example.com/image.jpg 或点击上传" />
                <button type="button" class="btn-upload" :disabled="coverUploading" @click="$refs.coverFile.click()">
                  {{ coverUploading ? '上传中…' : '📎 上传' }}
                </button>
                <input ref="coverFile" type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="handleCoverUpload" />
              </div>
              <img v-if="form.imageUrl" :src="form.imageUrl" class="img-preview" alt="" />
            </div>

            <!-- 图片集（多图，子表） -->
            <div class="fg">
              <label class="fl">图片集（可多张）</label>

              <!-- 方式A：本地上传 -->
              <div class="upload-bar">
                <button type="button" class="btn-upload" :disabled="imgUploading" @click="$refs.imgFiles.click()">
                  {{ imgUploading ? '上传中…' : '📎 上传图片（可多选）' }}
                </button>
                <input ref="imgFiles" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                       multiple style="display:none" @change="handleImgUpload" />
              </div>

              <!-- 方式B：直接填 URL -->
              <div class="url-add-row">
                <input class="fi url-add-input" v-model="urlInput" placeholder="粘贴图片 URL，回车添加" @keyup.enter="addUrlToImages" />
                <button type="button" class="btn-url-add" @click="addUrlToImages">添加</button>
              </div>

              <!-- 缩略图预览 -->
              <div v-if="imageUrls.length" class="img-thumb-list">
                <div v-for="(url, i) in imageUrls" :key="i" class="img-thumb-item">
                  <img :src="url" class="thumb-img" alt="" />
                  <span class="thumb-idx">{{ i + 1 }}</span>
                  <button class="thumb-del" @click="removeImage(i)">✕</button>
                </div>
              </div>
              <div v-else class="imgs-empty">暂无图片集，可通过上传或填写 URL 添加</div>
            </div>

            <div class="fg"><label class="fl">章节内容（段落间空一行）</label>
              <textarea class="fi" v-model="form.content" rows="8" placeholder="在这里写章节内容..."></textarea></div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存章节 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchStory, fetchStoryById, createStory, updateStory, deleteStory } from '@/api/content.js'
import { uploadImage } from '@/api/upload.js'

const chapters   = ref([])
const loading    = ref(true)
const error      = ref('')
const showModal  = ref(false)
const editId     = ref(null)
const submitting = ref(false)
const formErr    = ref('')

const coverUploading = ref(false)
const imgUploading   = ref(false)
const imageUrls      = ref([])
const urlInput       = ref('')

const emptyForm = () => ({
  chapterNum: '', title: '', dateLabel: '', emoji: '',
  gradient: '', content: '', imageUrl: ''
})
const form = ref(emptyForm())

async function load() {
  loading.value = true; error.value = ''
  try { chapters.value = await fetchStory() }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
}

function openAdd() {
  editId.value = null
  form.value = emptyForm()
  imageUrls.value = []
  urlInput.value = ''
  formErr.value = ''
  showModal.value = true
}

async function openEdit(ch) {
  formErr.value = ''
  let detail
  try {
    detail = await fetchStoryById(ch.id)
  } catch (e) {
    alert('加载章节详情失败：' + e.message)
    return
  }
  editId.value = ch.id
  const tmp = document.createElement('div')
  tmp.innerHTML = detail.content || ''
  form.value = {
    chapterNum: detail.chapterNum ?? '',
    title:      detail.title     || '',
    dateLabel:  detail.dateLabel || '',
    emoji:      detail.emoji     || '',
    gradient:   detail.gradient  || '',
    content:    tmp.innerText || tmp.textContent || '',
    imageUrl:   detail.imageUrl  || '',
  }
  imageUrls.value = (detail.images || []).map(img => img.imageUrl)
  urlInput.value = ''
  showModal.value = true
}

async function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  coverUploading.value = true
  try {
    form.value.imageUrl = await uploadImage(file)
  } catch (err) {
    alert('上传失败：' + err.message)
  } finally {
    coverUploading.value = false
    e.target.value = ''
  }
}

async function handleImgUpload(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  imgUploading.value = true
  try {
    for (const file of files) {
      const url = await uploadImage(file)
      imageUrls.value.push(url)
    }
  } catch (err) {
    alert('上传失败：' + err.message)
  } finally {
    imgUploading.value = false
    e.target.value = ''
  }
}

function addUrlToImages() {
  const url = urlInput.value.trim()
  if (!url) return
  imageUrls.value.push(url)
  urlInput.value = ''
}

function removeImage(i) {
  imageUrls.value.splice(i, 1)
}

async function submit() {
  formErr.value = ''
  if (!form.value.title.trim() || !form.value.content.trim()) {
    formErr.value = '标题和内容不能为空'; return
  }
  const rawContent = form.value.content.trim()
  const content = rawContent.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
  const body = {
    title:     form.value.title.trim(),
    dateLabel: form.value.dateLabel.trim(),
    emoji:     form.value.emoji.trim() || '✨',
    content,
    imageUrls: imageUrls.value,
  }
  if (form.value.chapterNum !== '' && form.value.chapterNum !== null) {
    body.chapterNum = Number(form.value.chapterNum)
  }
  if (form.value.gradient.trim()) body.gradient = form.value.gradient.trim()
  if (form.value.imageUrl.trim()) body.imageUrl = form.value.imageUrl.trim()

  submitting.value = true
  try {
    if (editId.value) await updateStory(editId.value, body)
    else              await createStory(body)
    showModal.value = false
    await load()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function remove(id) {
  if (!confirm('确定删除此章节？此操作不可恢复。')) return
  try { await deleteStory(id); await load() }
  catch (e) { alert('删除失败：' + e.message) }
}

function stripHtml(s) {
  const d = document.createElement('div'); d.innerHTML = s || ''; return d.textContent || d.innerText || ''
}

onMounted(load)
</script>

<style scoped>
.story-admin { padding: 0 0 40px; }

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
.data-bar {
  width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0;
  background: linear-gradient(180deg, var(--gold), rgba(212,170,112,.2));
}
.data-body { flex: 1; min-width: 0; }
.data-title { font-size: 14px; letter-spacing: 1px; color: var(--t1); margin-bottom: 4px; }
.data-meta  { font-size: 11px; color: var(--t3); letter-spacing: 1px; margin-bottom: 5px; }
.data-preview {
  font-size: 12px; color: var(--t2); line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.data-actions { display: flex; gap: 6px; flex-shrink: 0; }
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
.modal-inner { padding: 28px 26px 24px; max-height: 82vh; overflow-y: auto; position: relative; }
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
  margin-top: 8px; width: 100%; max-height: 140px; object-fit: cover;
  border-radius: 8px; border: 1px solid rgba(255,255,255,.08);
}
.upload-bar { margin-bottom: 8px; }
.url-add-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.url-add-input { flex: 1; }
.btn-url-add {
  flex-shrink: 0; padding: 8px 14px; border-radius: 8px; font-size: 11px;
  cursor: pointer; white-space: nowrap;
  border: 1px solid rgba(168,212,245,.3); background: rgba(168,212,245,.06); color: var(--blue);
  transition: all .2s;
}
.btn-url-add:hover { background: rgba(168,212,245,.12); }
.img-thumb-list { display: flex; flex-wrap: wrap; gap: 8px; }
.img-thumb-item {
  position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.1); flex-shrink: 0;
}
.thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-idx {
  position: absolute; top: 3px; left: 5px; font-size: 10px; font-weight: 700;
  color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.8);
}
.thumb-del {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%;
  border: none; background: rgba(255,60,80,.8); color: #fff; font-size: 9px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s;
}
.thumb-del:hover { background: rgba(255,60,80,1); }
.imgs-empty { font-size: 11px; color: var(--t3); letter-spacing: 1px; }
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