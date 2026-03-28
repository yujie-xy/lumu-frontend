<template>
  <div class="world-page">
    <!-- 第一排：世界 tag -->
    <div class="world-tabs world-tabs-row1">
      <button
        class="world-tab"
        :class="{ active: activeWorldTagId === null }"
        @click="selectWorldTag(null)"
      >全部</button>
      <button
        v-for="tag in worldTags"
        :key="tag.id"
        class="world-tab"
        :class="{ active: activeWorldTagId === tag.id }"
        @click="selectWorldTag(tag.id)"
      >{{ tag.name }}</button>
    </div>

    <!-- 第二排：类别 tag -->
    <div class="world-tabs world-tabs-row2">
      <button
        class="world-tab world-tab-sm"
        :class="{ active: activeCategoryTagId === null }"
        @click="selectCategoryTag(null)"
      >全部</button>
      <button
        v-for="tag in categoryTags"
        :key="tag.id"
        class="world-tab world-tab-sm"
        :class="{ active: activeCategoryTagId === tag.id }"
        @click="selectCategoryTag(tag.id)"
      >{{ tag.name }}</button>
    </div>

    <!-- 内容区 -->
    <div class="world-body">
      <div v-if="loading" class="world-loading">
        <div class="loading-ring"></div>
      </div>

      <div v-else-if="error" class="world-empty">{{ error }}</div>
      <div v-else-if="!posts.length" class="world-empty">暂无内容</div>

      <div v-else class="world-grid">
        <div
          v-for="post in posts"
          :key="post.id"
          class="world-card"
          @click="openDetail(post)"
        >
          <div v-if="post.isPinned" class="card-pin">置顶</div>
          <div v-if="post.coverImageUrl || post.firstImageUrl" class="card-cover">
            <img :src="resolveMediaUrl(post.coverImageUrl || post.firstImageUrl)" :alt="post.title" loading="lazy" />
          </div>
          <div class="card-body">
            <div class="card-tags">
              <span v-if="post.worldTag" class="card-tag card-tag-world">{{ post.worldTag.name }}</span>
              <span v-if="post.categoryTag" class="card-tag card-tag-cat">{{ post.categoryTag.name }}</span>
            </div>
            <div class="card-title">{{ post.title }}</div>
            <div v-if="post.content" class="card-content">{{ post.content }}</div>
            <div class="card-footer">
              <span v-if="post.authorName" class="card-author">{{ post.authorName }}</span>
              <span class="card-date">{{ formatDate(post.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹层 -->
    <Teleport to="body">
      <div v-if="detail" class="detail-overlay" @click.self="closeDetail">
        <button class="detail-close" @click="closeDetail">✕</button>
        <div class="detail-box">
          <div v-if="detailLoading" class="detail-loading">
            <div class="loading-ring"></div>
          </div>
          <template v-else>
            <!-- 封面图（只有无图集时显示，或图集为空时显示） -->
            <div v-if="detail.coverImageUrl && !detail.images?.length" class="detail-cover">
              <img :src="resolveMediaUrl(detail.coverImageUrl)" :alt="detail.title" />
            </div>

            <!-- 图片集（有 images 时展示轮播/网格） -->
            <div v-if="detail.images?.length" class="detail-gallery">
              <!-- 大图预览 -->
              <div class="gallery-main" @click="nextImage">
                <img :src="resolveMediaUrl(detail.images[activeImageIdx].imageUrl)" :alt="detail.title" class="gallery-main-img" />
                <div v-if="detail.images.length > 1" class="gallery-nav">
                  <button class="gallery-prev" @click.stop="prevImage">‹</button>
                  <span class="gallery-counter">{{ activeImageIdx + 1 }} / {{ detail.images.length }}</span>
                  <button class="gallery-next" @click.stop="nextImage">›</button>
                </div>
              </div>
              <!-- 缩略图条 -->
              <div v-if="detail.images.length > 1" class="gallery-thumbs">
                <img
                  v-for="(img, idx) in detail.images"
                  :key="img.id"
                  :src="resolveMediaUrl(img.imageUrl)"
                  class="gallery-thumb"
                  :class="{ active: idx === activeImageIdx }"
                  @click="activeImageIdx = idx"
                  loading="lazy"
                />
              </div>
            </div>

            <div class="detail-inner">
              <div class="detail-tags">
                <span v-if="detail.worldTag" class="card-tag card-tag-world">{{ detail.worldTag.name }}</span>
                <span v-if="detail.categoryTag" class="card-tag card-tag-cat">{{ detail.categoryTag.name }}</span>
              </div>
              <div class="detail-title">{{ detail.title }}</div>
              <div v-if="detail.content" class="detail-content">{{ detail.content }}</div>
              <div v-if="detail.externalUrl" class="detail-link">
                <a :href="detail.externalUrl" target="_blank" rel="noopener">查看原文 →</a>
              </div>
              <div class="detail-meta">
                <span v-if="detail.authorName" class="card-author">{{ detail.authorName }}</span>
                <span class="card-date">{{ formatDate(detail.createdAt) }}</span>
              </div>
              <div class="detail-actions">
                <LikeButton content-type="world_post" :target-id="detail.id" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchWorldPosts } from '@/api/world.js'
import { resolveMediaUrl } from '@/utils/media.js'
import LikeButton from '@/components/common/LikeButton.vue'

const worldTags       = ref([])
const categoryTags    = ref([])
const posts           = ref([])
const loading         = ref(true)
const error           = ref(null)
const activeWorldTagId    = ref(null)
const activeCategoryTagId = ref(null)

const detail          = ref(null)
const detailLoading   = ref(false)
const activeImageIdx  = ref(0)

function normalizeWorldImages(images) {
  if (!Array.isArray(images)) return []
  return images
    .map((img, idx) => {
      const imageUrl = img?.imageUrl || img?.resourceUrl || img?.url || ''
      if (!imageUrl) return null
      return { ...img, id: img.id ?? idx, imageUrl }
    })
    .filter(Boolean)
}

function normalizeWorldPost(post) {
  if (!post || typeof post !== 'object') return post

  const resourceUrl = post.resourceUrl || post.imageUrl || post.coverImageUrl || post.firstImageUrl || ''
  const coverImageUrl = post.coverImageUrl || resourceUrl || ''
  const firstImageUrl = post.firstImageUrl || post.imageUrl || coverImageUrl || resourceUrl || ''

  return {
    ...post,
    title: post.title || '',
    body: post.body ?? post.content ?? post.description ?? '',
    content: post.content ?? post.body ?? post.description ?? '',
    description: post.description ?? post.body ?? post.content ?? '',
    resourceUrl,
    imageUrl: post.imageUrl || resourceUrl || firstImageUrl || '',
    coverImageUrl,
    firstImageUrl,
    images: normalizeWorldImages(post.images),
    isPinned: Boolean(post.isPinned),
    status: post.status || '',
    createdAt: post.createdAt || '',
  }
}

onMounted(async () => {
  worldTags.value = []
  categoryTags.value = []
  await loadPosts()
})

async function loadPosts() {
  loading.value = true
  error.value   = null
  try {
    const list = await fetchWorldPosts()
    posts.value = Array.isArray(list) ? list.map(normalizeWorldPost) : []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function selectWorldTag(id) {
  activeWorldTagId.value = id
  loadPosts()
}

function selectCategoryTag(id) {
  activeCategoryTagId.value = id
  loadPosts()
}

function openDetail(post) {
  // 先用列表数据预显示，再拉取完整详情（含 images）
  detail.value = normalizeWorldPost(post)
  activeImageIdx.value = 0
  detailLoading.value = false
}

function closeDetail() {
  detail.value = null
  activeImageIdx.value = 0
}

function nextImage() {
  if (!detail.value?.images?.length) return
  activeImageIdx.value = (activeImageIdx.value + 1) % detail.value.images.length
}

function prevImage() {
  if (!detail.value?.images?.length) return
  const len = detail.value.images.length
  activeImageIdx.value = (activeImageIdx.value - 1 + len) % len
}

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}
</script>

<style scoped>
.world-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.world-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 24px 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.world-tabs-row1 {
  border-bottom: 1px solid rgba(255,255,255,.06);
  padding-bottom: 10px;
}
.world-tabs-row2 {
  padding-top: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,.04);
}

.world-tab {
  padding: 5px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  color: rgba(255,255,255,.4);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
}
.world-tab:hover { color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.2); }
.world-tab.active {
  background: rgba(100,200,255,.08);
  color: #7dd3fc;
  border-color: rgba(100,200,255,.25);
}

.world-tab-sm {
  padding: 4px 12px;
  font-size: 11px;
}
.world-tab-sm.active {
  background: rgba(167,139,250,.08);
  color: #c4b5fd;
  border-color: rgba(167,139,250,.25);
}

.world-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(100,200,255,.15) transparent;
}

.world-loading { display: flex; justify-content: center; padding: 80px 0; }
.loading-ring {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid rgba(100,200,255,.15);
  border-top-color: #7dd3fc;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.world-empty {
  text-align: center; color: rgba(255,255,255,.3);
  padding: 80px 0; font-size: 14px;
}

.world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.world-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  cursor: pointer;
  transition: transform .2s, border-color .2s;
}
.world-card:hover { transform: translateY(-3px); border-color: rgba(100,200,255,.2); }

.card-pin {
  position: absolute; top: 10px; right: 10px;
  font-size: 10px; padding: 2px 7px; border-radius: 8px;
  background: rgba(212,170,112,.15); color: var(--gold); letter-spacing: 1px;
  z-index: 1;
}

.card-cover { width: 100%; height: 160px; overflow: hidden; }
.card-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }

.card-body { padding: 12px 14px 14px; }

.card-tags { display: flex; gap: 6px; margin-bottom: 7px; flex-wrap: wrap; }
.card-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 8px; letter-spacing: 1px;
}
.card-tag-world { background: rgba(100,200,255,.1); color: #7dd3fc; }
.card-tag-cat   { background: rgba(167,139,250,.1); color: #c4b5fd; }

.card-title {
  font-size: 14px; color: rgba(255,255,255,.88);
  letter-spacing: 1px; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.card-content {
  font-size: 12px; color: rgba(255,255,255,.4);
  line-height: 1.6; letter-spacing: .5px;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  margin-bottom: 8px;
}

.card-footer { display: flex; justify-content: space-between; align-items: center; }
.card-author { font-size: 11px; color: rgba(255,255,255,.35); letter-spacing: 1px; }
.card-date   { font-size: 10px; color: rgba(255,255,255,.25); letter-spacing: 1px; }

/* 详情弹层 */
.detail-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(5,2,12,.9); backdrop-filter: blur(20px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.detail-close {
  position: fixed; top: 20px; right: 24px; width: 36px; height: 36px;
  border-radius: 50%; border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.06); color: rgba(255,255,255,.6);
  font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .2s; z-index: 901;
}
.detail-close:hover { background: rgba(255,255,255,.12); color: #fff; }

.detail-box {
  width: 100%; max-width: 640px; max-height: 88vh;
  background: linear-gradient(145deg, rgba(20,10,40,.97), rgba(12,6,24,.99));
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.07);
  overflow-y: auto;
}

.detail-loading {
  display: flex; justify-content: center; padding: 60px 0;
}

.detail-cover { width: 100%; max-height: 300px; overflow: hidden; }
.detail-cover img { width: 100%; object-fit: cover; display: block; }

/* 图片集 */
.detail-gallery { width: 100%; background: rgba(0,0,0,.3); }

.gallery-main {
  position: relative; width: 100%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.4); min-height: 200px; max-height: 400px; overflow: hidden;
}
.gallery-main-img {
  width: 100%; max-height: 400px; object-fit: contain; display: block;
}
.gallery-nav {
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background: rgba(0,0,0,.5); border-radius: 20px; padding: 4px 14px;
}
.gallery-prev, .gallery-next {
  background: none; border: none; color: rgba(255,255,255,.8);
  font-size: 20px; cursor: pointer; line-height: 1; padding: 0 4px;
  transition: color .2s;
}
.gallery-prev:hover, .gallery-next:hover { color: #fff; }
.gallery-counter { font-size: 11px; color: rgba(255,255,255,.7); letter-spacing: 1px; }

.gallery-thumbs {
  display: flex; gap: 6px; padding: 8px 12px; overflow-x: auto;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;
}
.gallery-thumb {
  width: 52px; height: 52px; border-radius: 6px; object-fit: cover;
  flex-shrink: 0; cursor: pointer; opacity: .55; transition: opacity .2s, border-color .2s;
  border: 2px solid transparent;
}
.gallery-thumb.active { opacity: 1; border-color: #7dd3fc; }
.gallery-thumb:hover  { opacity: .85; }

.detail-inner { padding: 18px 22px 22px; }
.detail-tags { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.detail-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 20px; letter-spacing: 3px; color: rgba(255,255,255,.9); margin-bottom: 12px;
}
.detail-content {
  font-size: 13px; color: rgba(255,255,255,.6);
  line-height: 1.8; letter-spacing: .5px; white-space: pre-wrap; margin-bottom: 14px;
}
.detail-link { margin-bottom: 14px; }
.detail-link a {
  font-size: 12px; color: #7dd3fc; text-decoration: none; letter-spacing: 1px;
  border-bottom: 1px solid rgba(100,200,255,.3); padding-bottom: 1px;
}
.detail-link a:hover { color: #bae6fd; }
.detail-meta {
  display: flex; gap: 12px; align-items: center; margin-bottom: 14px;
  padding-top: 12px; border-top: 1px solid rgba(255,255,255,.06);
}
.detail-actions { display: flex; }
</style>
