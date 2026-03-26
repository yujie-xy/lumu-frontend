<template>
  <div class="world-admin">

    <!-- ══ 世界 tag 管理 ══ -->
    <div class="section-card">
      <div class="section-head">
        <div class="section-label">🌍 世界 Tag 管理</div>
        <div class="label-add-row">
          <input class="label-input" v-model="newWorldTagName" placeholder="标签名" @keyup.enter="addWorldTag" />
          <input class="label-input" v-model="newWorldTagSlug" placeholder="slug" @keyup.enter="addWorldTag" style="width:100px" />
          <button class="btn-label-add" @click="addWorldTag">添加</button>
        </div>
      </div>
      <div v-if="worldTags.length" class="label-list">
        <div v-for="t in worldTags" :key="t.id" class="label-item">
          <template v-if="editingWorldTagId === t.id">
            <input class="label-edit-input" v-model="editingWorldTagName" placeholder="名称" @keyup.enter="saveWorldTagEdit(t)" />
            <input class="label-edit-input" v-model="editingWorldTagSlug" placeholder="slug" style="width:90px" @keyup.enter="saveWorldTagEdit(t)" />
            <button class="btn-label-save"   @click="saveWorldTagEdit(t)">保存</button>
            <button class="btn-label-cancel" @click="editingWorldTagId = null">取消</button>
          </template>
          <template v-else>
            <span class="label-name">{{ t.name }}</span>
            <span class="label-slug">{{ t.slug }}</span>
            <button class="btn-label-edit" @click="startWorldTagEdit(t)">编辑</button>
            <button class="btn-label-del"  @click="removeWorldTag(t.id)">删除</button>
          </template>
        </div>
      </div>
      <div v-else class="section-empty">暂无世界 Tag</div>
    </div>

    <!-- ══ 类别 tag 管理 ══ -->
    <div class="section-card" style="margin-top: 16px;">
      <div class="section-head">
        <div class="section-label">🗂 类别 Tag 管理</div>
        <div class="label-add-row">
          <input class="label-input" v-model="newCatTagName" placeholder="标签名" @keyup.enter="addCatTag" />
          <input class="label-input" v-model="newCatTagSlug" placeholder="slug" @keyup.enter="addCatTag" style="width:100px" />
          <button class="btn-label-add" @click="addCatTag">添加</button>
        </div>
      </div>
      <div v-if="categoryTags.length" class="label-list">
        <div v-for="t in categoryTags" :key="t.id" class="label-item">
          <template v-if="editingCatTagId === t.id">
            <input class="label-edit-input" v-model="editingCatTagName" placeholder="名称" @keyup.enter="saveCatTagEdit(t)" />
            <input class="label-edit-input" v-model="editingCatTagSlug" placeholder="slug" style="width:90px" @keyup.enter="saveCatTagEdit(t)" />
            <button class="btn-label-save"   @click="saveCatTagEdit(t)">保存</button>
            <button class="btn-label-cancel" @click="editingCatTagId = null">取消</button>
          </template>
          <template v-else>
            <span class="label-name">{{ t.name }}</span>
            <span class="label-slug">{{ t.slug }}</span>
            <button class="btn-label-edit" @click="startCatTagEdit(t)">编辑</button>
            <button class="btn-label-del"  @click="removeCatTag(t.id)">删除</button>
          </template>
        </div>
      </div>
      <div v-else class="section-empty">暂无类别 Tag</div>
    </div>

    <!-- ══ 世界内容管理 ══ -->
    <div class="section-card" style="margin-top: 16px;">
      <div class="section-head">
        <div class="section-label">📖 世界内容管理</div>
        <button class="btn-add" @click="openAdd">＋ 添加内容</button>
      </div>

      <div v-if="loadingPosts" class="section-loading">加载中...</div>
      <div v-else-if="!posts.length" class="section-empty">暂无内容</div>

      <div v-else class="post-list">
        <div v-for="p in posts" :key="p.id" class="post-row">
          <img v-if="p.coverImageUrl || p.firstImageUrl" :src="resolveMediaUrl(p.coverImageUrl || p.firstImageUrl)" class="thumb" alt="" />
          <div v-else class="thumb-placeholder">🌍</div>
          <div class="row-body">
            <div class="row-title">
              <span v-if="p.isPinned" class="pin-badge">置顶</span>
              {{ p.title }}
            </div>
            <div class="row-meta">
              <span v-if="p.worldTag"    class="row-tag row-tag-world">{{ p.worldTag.name }}</span>
              <span v-if="p.categoryTag" class="row-tag row-tag-cat">{{ p.categoryTag.name }}</span>
              <span v-if="p.authorName"  class="row-author">{{ p.authorName }}</span>
            </div>
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

            <div class="form-row">
              <div class="fg fg-half">
                <label class="fl">世界 Tag</label>
                <select class="fi" v-model="form.worldTagId">
                  <option :value="null">-- 不选 --</option>
                  <option v-for="t in worldTags" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div class="fg fg-half">
                <label class="fl">类别 Tag</label>
                <select class="fi" v-model="form.categoryTagId">
                  <option :value="null">-- 不选 --</option>
                  <option v-for="t in categoryTags" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
            </div>

            <!-- 封面图 -->
            <div class="fg">
              <label class="fl">封面图</label>
              <div class="upload-row">
                <input class="fi" v-model="form.coverImageUrl" placeholder="https://... 或点击上传" />
                <button type="button" class="btn-upload" :disabled="coverUploading" @click="$refs.coverFileInput.click()">
                  {{ coverUploading ? '上传中…' : '📎 上传' }}
                </button>
                <input ref="coverFileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" @change="handleCoverUpload" />
              </div>
              <img v-if="form.coverImageUrl" :src="resolveMediaUrl(form.coverImageUrl)" class="img-preview" alt="封面预览" />
            </div>

            <!-- 多图上传 -->
            <div class="fg">
              <label class="fl">图片集（可多张，按顺序展示）</label>
              <div class="multi-img-toolbar">
                <button type="button" class="btn-upload" :disabled="multiUploading" @click="$refs.multiFileInput.click()">
                  {{ multiUploading ? '上传中…' : '＋ 添加图片' }}
                </button>
                <input ref="multiFileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                       multiple style="display:none" @change="handleMultiUpload" />
                <span class="multi-hint">{{ form.imageUrls.length }} 张</span>
              </div>

              <!-- 已上传图片预览列表 -->
              <div v-if="form.imageUrls.length" class="multi-img-list">
                <div v-for="(url, idx) in form.imageUrls" :key="idx" class="multi-img-item">
                  <img :src="resolveMediaUrl(url)" class="multi-img-thumb" alt="" />
                  <div class="multi-img-order">{{ idx + 1 }}</div>
                  <button class="multi-img-del" @click="removeImage(idx)" title="删除">✕</button>
                </div>
              </div>
              <div v-else class="multi-img-empty">暂未添加图片</div>
            </div>

            <div class="fg">
              <label class="fl">正文内容</label>
              <textarea class="fi fi-textarea" v-model="form.content" placeholder="内容正文（可选）" rows="4"></textarea>
            </div>

            <div class="fg">
              <label class="fl">外链地址（可选）</label>
              <input class="fi" v-model="form.externalUrl" placeholder="https://..." />
            </div>

            <div class="fg">
              <label class="fl">作者（可选）</label>
              <input class="fi" v-model="form.authorName" placeholder="作者名" />
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
import {
  fetchWorldTagsAdmin, createWorldTag, updateWorldTag, deleteWorldTag,
  fetchCategoryTagsAdmin, createCategoryTag, updateCategoryTag, deleteCategoryTag,
  fetchWorldPosts, fetchWorldPost, createWorldPost, updateWorldPost, deleteWorldPost, pinWorldPost,
} from '@/api/world.js'
import { uploadImage } from '@/api/upload.js'
import { resolveMediaUrl } from '@/utils/media.js'

// ── 世界 tag ──────────────────────────────────────────────────
const worldTags          = ref([])
const newWorldTagName    = ref('')
const newWorldTagSlug    = ref('')
const editingWorldTagId  = ref(null)
const editingWorldTagName = ref('')
const editingWorldTagSlug = ref('')

// ── 类别 tag ──────────────────────────────────────────────────
const categoryTags       = ref([])
const newCatTagName      = ref('')
const newCatTagSlug      = ref('')
const editingCatTagId    = ref(null)
const editingCatTagName  = ref('')
const editingCatTagSlug  = ref('')

// ── 内容 ──────────────────────────────────────────────────────
const posts         = ref([])
const loadingPosts  = ref(true)
const showModal     = ref(false)
const editId        = ref(null)
const submitting    = ref(false)
const formErr       = ref('')
const coverUploading  = ref(false)
const multiUploading  = ref(false)

const emptyForm = () => ({
  title: '', content: '', coverImageUrl: '', externalUrl: '',
  authorName: '', worldTagId: null, categoryTagId: null,
  imageUrls: [],   // 图片集 URL 数组
})
const form = ref(emptyForm())

onMounted(async () => {
  await Promise.all([loadWorldTags(), loadCategoryTags(), loadPosts()])
})

// ── 世界 tag 操作 ──────────────────────────────────────────────
async function loadWorldTags() {
  try { worldTags.value = await fetchWorldTagsAdmin() } catch {}
}

async function addWorldTag() {
  const name = newWorldTagName.value.trim()
  const slug = newWorldTagSlug.value.trim()
  if (!name || !slug) return
  try {
    await createWorldTag(name, slug)
    newWorldTagName.value = ''; newWorldTagSlug.value = ''
    await loadWorldTags()
  } catch (e) { alert('添加失败：' + e.message) }
}

function startWorldTagEdit(t) {
  editingWorldTagId.value = t.id; editingWorldTagName.value = t.name; editingWorldTagSlug.value = t.slug
}

async function saveWorldTagEdit(t) {
  const name = editingWorldTagName.value.trim()
  const slug = editingWorldTagSlug.value.trim()
  if (!name || !slug) return
  try {
    await updateWorldTag(t.id, name, slug)
    editingWorldTagId.value = null
    await loadWorldTags()
  } catch (e) { alert('保存失败：' + e.message) }
}

async function removeWorldTag(id) {
  if (!confirm('删除后，使用该世界 Tag 的内容将失去关联。确定继续？')) return
  try { await deleteWorldTag(id); await loadWorldTags() }
  catch (e) { alert('删除失败：' + e.message) }
}

// ── 类别 tag 操作 ──────────────────────────────────────────────
async function loadCategoryTags() {
  try { categoryTags.value = await fetchCategoryTagsAdmin() } catch {}
}

async function addCatTag() {
  const name = newCatTagName.value.trim()
  const slug = newCatTagSlug.value.trim()
  if (!name || !slug) return
  try {
    await createCategoryTag(name, slug)
    newCatTagName.value = ''; newCatTagSlug.value = ''
    await loadCategoryTags()
  } catch (e) { alert('添加失败：' + e.message) }
}

function startCatTagEdit(t) {
  editingCatTagId.value = t.id; editingCatTagName.value = t.name; editingCatTagSlug.value = t.slug
}

async function saveCatTagEdit(t) {
  const name = editingCatTagName.value.trim()
  const slug = editingCatTagSlug.value.trim()
  if (!name || !slug) return
  try {
    await updateCategoryTag(t.id, name, slug)
    editingCatTagId.value = null
    await loadCategoryTags()
  } catch (e) { alert('保存失败：' + e.message) }
}

async function removeCatTag(id) {
  if (!confirm('删除后，使用该类别 Tag 的内容将失去关联。确定继续？')) return
  try { await deleteCategoryTag(id); await loadCategoryTags() }
  catch (e) { alert('删除失败：' + e.message) }
}

// ── 内容操作 ──────────────────────────────────────────────────
async function loadPosts() {
  loadingPosts.value = true
  try { posts.value = await fetchWorldPosts() }
  catch {}
  finally { loadingPosts.value = false }
}

function openAdd() {
  editId.value = null; form.value = emptyForm(); formErr.value = ''; showModal.value = true
}

async function openEdit(p) {
  editId.value = p.id
  formErr.value = ''
  // 必须拉取详情才能获得 images；若失败则不开弹窗，避免图片被误删
  let full
  try {
    full = await fetchWorldPost(p.id)
  } catch (e) {
    alert('加载内容详情失败，请重试：' + e.message)
    return
  }
  form.value = {
    title:         full.title         || '',
    content:       full.content       || '',
    coverImageUrl: full.coverImageUrl || '',
    externalUrl:   full.externalUrl   || '',
    authorName:    full.authorName    || '',
    worldTagId:    full.worldTagId    || null,
    categoryTagId: full.categoryTagId || null,
    imageUrls:     (full.images || []).map(img => img.imageUrl),
  }
  showModal.value = true
}

async function submit() {
  formErr.value = ''
  if (!form.value.title.trim()) { formErr.value = '标题不能为空'; return }
  const body = {
    title:          form.value.title.trim(),
    content:        form.value.content.trim() || null,
    coverImageUrl:  form.value.coverImageUrl.trim() || null,
    externalUrl:    form.value.externalUrl.trim() || null,
    authorName:     form.value.authorName.trim() || null,
    worldTagId:     form.value.worldTagId,
    categoryTagId:  form.value.categoryTagId,
    imageUrls:      form.value.imageUrls.filter(u => u.trim()),
  }
  submitting.value = true
  try {
    if (editId.value) await updateWorldPost(editId.value, body)
    else              await createWorldPost(body)
    showModal.value = false
    await loadPosts()
  } catch (e) {
    formErr.value = e.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

// 封面图上传
async function handleCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  coverUploading.value = true
  try {
    form.value.coverImageUrl = await uploadImage(file)
  } catch (err) {
    alert('上传失败：' + (err.message || '未知错误'))
  } finally {
    coverUploading.value = false
  }
}

// 多图上传（支持 multiple）
async function handleMultiUpload(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  e.target.value = ''
  multiUploading.value = true
  try {
    for (const file of files) {
      const url = await uploadImage(file)
      form.value.imageUrls.push(url)
    }
  } catch (err) {
    alert('上传失败：' + (err.message || '未知错误'))
  } finally {
    multiUploading.value = false
  }
}

function removeImage(idx) {
  form.value.imageUrls.splice(idx, 1)
}

async function togglePin(p) {
  try { await pinWorldPost(p.id); await loadPosts() }
  catch (e) { alert('操作失败：' + e.message) }
}

async function removePost(id) {
  if (!confirm('确定删除此内容？')) return
  try { await deleteWorldPost(id); await loadPosts() }
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

.label-add-row { display: flex; gap: 8px; flex-wrap: wrap; }
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
.label-slug { font-size: 10px; color: var(--t3); letter-spacing: 1px; }
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
.row-tag {
  font-size: 10px; padding: 1px 7px; border-radius: 8px; letter-spacing: 1px;
}
.row-tag-world { background: rgba(100,200,255,.1); color: #7dd3fc; }
.row-tag-cat   { background: rgba(167,139,250,.1); color: #c4b5fd; }
.row-author { font-size: 10px; color: var(--t3); letter-spacing: 1px; }
.row-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.btn-pin {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(212,170,112,.3); background: rgba(212,170,112,.06); color: var(--gold); transition: all .2s;
}
.btn-edit {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(100,180,255,.3); background: rgba(100,180,255,.06); color: var(--blue); transition: all .2s;
}
.btn-del {
  padding: 5px 11px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid rgba(255,100,130,.3); background: rgba(255,100,130,.06); color: #ff8aaa; transition: all .2s;
}

/* 多图上传 */
.multi-img-toolbar {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.multi-hint {
  font-size: 11px; color: var(--t3); letter-spacing: 1px;
}
.multi-img-list {
  display: flex; flex-wrap: wrap; gap: 10px;
}
.multi-img-item {
  position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.1); flex-shrink: 0;
}
.multi-img-thumb {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.multi-img-order {
  position: absolute; bottom: 3px; left: 3px;
  font-size: 10px; background: rgba(0,0,0,.6); color: #fff;
  padding: 1px 5px; border-radius: 6px; letter-spacing: 1px;
}
.multi-img-del {
  position: absolute; top: 3px; right: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(255,60,60,.75); border: none; color: #fff;
  font-size: 10px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; transition: background .2s;
}
.multi-img-del:hover { background: rgba(255,60,60,1); }
.multi-img-empty {
  font-size: 11px; color: var(--t3); letter-spacing: 1px; padding: 6px 0;
}

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
.fg-half { flex: 1; min-width: 0; }
.form-row { display: flex; gap: 12px; }
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