<template>
  <div class="world-admin">

    <!-- ══ 世界内容管理 ══ -->
    <div class="section-card">
      <div class="section-head">
        <div class="section-label">📖 世界内容管理</div>
        <button class="btn-add" @click="openAdd">＋ 添加内容</button>
      </div>

      <div v-if="loadingPosts" class="section-loading">加载中...</div>
      <div v-else-if="!posts.length" class="section-empty">暂无内容</div>

      <div v-else class="post-list">
        <div v-for="p in posts" :key="p.id" class="post-row">
          <img v-if="p.resourceUrl" :src="resolveMediaUrl(p.resourceUrl)" class="thumb" alt="" />
          <div v-else class="thumb-placeholder">🌍</div>
          <div class="row-body">
            <div class="row-title">
              <span v-if="p.isPinned" class="pin-badge">置顶</span>
              {{ p.title }}
            </div>
            <div class="row-meta">
              <span class="row-status" :class="p.status">{{ p.status }}</span>
            </div>
            <div v-if="p.body" class="row-preview">{{ p.body }}</div>
          </div>
          <div class="row-actions">
            <button class="btn-pin"  @click="togglePin(p)">{{ p.isPinned ? '取消置顶' : '置顶' }}</button>
            <button class="btn-edit" @click="openEdit(p)">✏️ 编辑</button>
            <button class="btn-del"  @click="removePost(p.id)">🗑 删除</button>
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
            <div class="modal-title">{{ editId ? '编辑内容' : '添加内容' }}</div>
            <div class="modal-sub">{{ editId ? '修改世界内容' : '新增一篇世界内容' }}</div>

            <div class="fg">
              <label class="fl">标题 *</label>
              <input class="fi" v-model="form.title" placeholder="内容标题" />
            </div>

            <!-- 封面 / 资源 URL -->
            <div class="fg">
              <label class="fl">资源地址 (resourceUrl)</label>
              <div class="upload-row">
                <input class="fi" v-model="form.resourceUrl" placeholder="https://... 或点击上传" />
                <button type="button" class="btn-upload" :disabled="coverUploading" @click="$refs.coverFileInput.click()">
                  {{ coverUploading ? '上传中…' : '📎 上传' }}
                </button>
                <input ref="coverFileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" @change="handleCoverUpload" />
              </div>
              <img v-if="form.resourceUrl" :src="resolveMediaUrl(form.resourceUrl)" class="img-preview" alt="封面预览" />
            </div>

            <div class="fg">
              <label class="fl">正文内容 (body)</label>
              <textarea class="fi fi-textarea" v-model="form.body" placeholder="内容正文（可选）" rows="4"></textarea>
            </div>

            <div class="fg"><label class="fl">状态 (status) *</label>
              <select class="fi" v-model="form.status">
                <option value="PUBLISHED">PUBLISHED（已发布）</option>
                <option value="DRAFT">DRAFT（草稿）</option>
              </select>
            </div>

            <div class="ferr">{{ formErr }}</div>
            <button class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? '保存中...' : '保存内容 ✦' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchWorlds, createWorld, updateWorld, deleteWorld, pinWorld, unpinWorld } from '@/api/world.js'
import { uploadImage } from '@/api/upload.js'
import { resolveMediaUrl } from '@/utils/media.js'

const posts         = ref([])
const loadingPosts  = ref(true)
const showModal     = ref(false)
const editId        = ref(null)
const submitting    = ref(false)
const formErr       = ref('')
const coverUploading = ref(false)

// ContentRequest: { title, body, resourceUrl, status }
const emptyForm = () => ({ title: '', body: '', resourceUrl: '', status: 'PUBLISHED' })
const form = ref(emptyForm())

function normalizeWorldPost(post) {
  if (!post || typeof post !== 'object') return post

  const resourceUrl = post.resourceUrl || post.imageUrl || post.coverImageUrl || post.firstImageUrl || ''
  const imageUrl = post.imageUrl || post.coverImageUrl || post.firstImageUrl || resourceUrl || ''

  return {
    ...post,
    title: post.title || '',
    body: post.body ?? post.content ?? post.description ?? '',
    content: post.content ?? post.body ?? post.description ?? '',
    description: post.description ?? post.body ?? post.content ?? '',
    resourceUrl,
    imageUrl,
    coverImageUrl: post.coverImageUrl || resourceUrl || imageUrl || '',
    firstImageUrl: post.firstImageUrl || imageUrl || resourceUrl || '',
    images: Array.isArray(post.images) ? post.images : [],
    isPinned: Boolean(post.isPinned),
    status: post.status || 'PUBLISHED',
    createdAt: post.createdAt || '',
  }
}

onMounted(loadPosts)

async function loadPosts() {
  loadingPosts.value = true
  try {
    const list = await fetchWorlds()
    posts.value = Array.isArray(list) ? list.map(normalizeWorldPost) : []
  }
  catch {}
  finally { loadingPosts.value = false }
}

function openAdd() {
  editId.value = null; form.value = emptyForm(); formErr.value = ''; showModal.value = true
}

async function openEdit(p) {
  editId.value = p.id
  formErr.value = ''
  const full = normalizeWorldPost(p)
  form.value = {
    title:       full.title       || '',
    body:        full.body        || '',
    resourceUrl: full.resourceUrl || '',
    status:      full.status      || 'PUBLISHED',
  }
  showModal.value = true
  return
  let full
  try {
    full = await fetchWorldById(p.id)
  } catch (e) {
    alert('加载内容详情失败：' + e.message)
    return
  }
  form.value = {
    title:       full.title       || '',
    body:        full.body        || '',
    resourceUrl: full.resourceUrl || '',
    status:      full.status      || 'PUBLISHED',
  }
  showModal.value = true
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
    if (editId.value) await updateWorld(editId.value, body)
    else              await createWorld(body)
    showModal.value = false
    await loadPosts()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

async function handleCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  coverUploading.value = true
  try {
    form.value.resourceUrl = await uploadImage(file)
  } catch (err) {
    alert('上传失败：' + (err.message || '未知错误'))
  } finally {
    coverUploading.value = false
  }
}

async function togglePin(p) {
  try {
    if (p.isPinned) await unpinWorld(p.id)
    else            await pinWorld(p.id)
    await loadPosts()
  } catch (e) { alert('操作失败：' + e.message) }
}

async function removePost(id) {
  if (!confirm('确定删除此内容？')) return
  try { await deleteWorld(id); await loadPosts() }
  catch (e) { alert('删除失败：' + e.message) }
}
</script>

<style scoped>
.world-admin { padding: 0 0 40px; }

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

.btn-add {
  padding: 7px 16px; border-radius: 50px; font-size: 11px; letter-spacing: 2px; cursor: pointer;
  border: 1px dashed rgba(212,170,112,.4); background: transparent; color: var(--gold); transition: all .25s;
}
.btn-add:hover { background: rgba(212,170,112,.08); border-color: var(--gold); }

.post-list { display: flex; flex-direction: column; gap: 10px; }
.post-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 10px; background: var(--card); border: 1px solid var(--border); transition: border-color .2s;
}
.post-row:hover { border-color: var(--border2); }
.thumb { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.thumb-placeholder {
  width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); font-size: 24px;
}
.row-body { flex: 1; min-width: 0; }
.row-title { font-size: 13px; color: var(--t1); margin-bottom: 5px; letter-spacing: 1px; }
.pin-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 6px;
  background: rgba(212,170,112,.15); color: var(--gold); letter-spacing: 1px; margin-right: 6px;
}
.row-meta  { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.row-status { font-size: 10px; padding: 1px 7px; border-radius: 8px; letter-spacing: 1px; background: rgba(150,240,180,.1); color: rgba(150,240,180,.8); }
.row-preview { font-size: 11px; color: var(--t3); letter-spacing: 1px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-top: 3px; }
.row-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.btn-pin  { padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer; border: 1px solid rgba(212,170,112,.3); background: rgba(212,170,112,.06); color: var(--gold); transition: all .2s; }
.btn-edit { padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer; border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue); transition: all .2s; }
.btn-del  { padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer; border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa; transition: all .2s; }

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
.modal-inner { padding: 26px 24px 22px; max-height: 82vh; overflow-y: auto; position: relative; }
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
  font-size: 13px; outline: none; transition: border-color .3s; box-sizing: border-box;
}
.fi:focus { border-color: rgba(212,170,112,.5); background: rgba(255,255,255,.08); }
.fi::placeholder { color: rgba(255,255,255,.18); }
.fi-textarea { resize: vertical; min-height: 90px; }

.upload-row { display: flex; gap: 8px; align-items: center; }
.upload-row .fi { flex: 1; }
.btn-upload {
  flex-shrink: 0; padding: 8px 14px; border-radius: 8px; font-size: 11px;
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

.ferr { font-size: 11px; color: #ff8aaa; letter-spacing: 1px; min-height: 18px; margin-bottom: 4px; }
.btn-submit {
  width: 100%; padding: 12px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #a8783a, var(--gold));
  color: var(--night); font-size: 12px; font-weight: 700; letter-spacing: 4px; cursor: pointer; transition: all .3s;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,170,112,.3); }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }
</style>
