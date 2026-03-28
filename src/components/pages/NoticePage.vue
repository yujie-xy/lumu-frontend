<template>
  <div class="notice-page">
    <div v-if="loading" class="notice-loading">
      <div class="loading-ring"></div>
    </div>

    <div v-else-if="error" class="notice-error">{{ error }}</div>

    <template v-else>
      <!-- 置顶大卡 -->
      <div v-if="notices.length" class="featured-card">
        <div class="featured-badge">最新公告</div>

        <div v-if="cardCurrent(notices[0])" class="featured-img-wrap">
          <img
            :src="cardCurrent(notices[0])"
            class="featured-img"
            alt=""
            @click="openGallery(notices[0])"
          />
          <!-- 左右箭头：仅多图时显示 -->
          <button
            v-if="cardCount(notices[0]) > 1"
            class="card-arrow card-arrow-left"
            @click.stop="prevCard(notices[0])"
          >‹</button>
          <button
            v-if="cardCount(notices[0]) > 1"
            class="card-arrow card-arrow-right"
            @click.stop="nextCard(notices[0])"
          >›</button>
          <!-- 页码指示 -->
          <div v-if="cardCount(notices[0]) > 1" class="card-indicator">
            {{ getCardState(notices[0].id).idx + 1 }} / {{ cardCount(notices[0]) }}
          </div>
        </div>

        <div class="featured-body">
          <div class="notice-meta">
            <span class="notice-date">{{ notices[0].dateLabel }}</span>
            <span v-if="notices[0].eventKey" class="notice-tag">{{ notices[0].eventKey }}</span>
          </div>
          <h2 class="notice-title featured">{{ notices[0].title }}</h2>
          <p class="notice-content">{{ notices[0].content }}</p>
          <div v-if="notices[0].admin" class="notice-admin">发布：{{ notices[0].admin }}</div>
        </div>
      </div>

      <!-- 普通卡片列表 -->
      <div class="notice-list">
        <div
          v-for="notice in notices.slice(1)"
          :key="notice.id"
          class="notice-card"
        >
          <div class="notice-left">
            <div class="notice-meta">
              <span class="notice-date">{{ notice.dateLabel }}</span>
              <span v-if="notice.eventKey" class="notice-tag">{{ notice.eventKey }}</span>
            </div>
            <h3 class="notice-title">{{ notice.title }}</h3>
            <p class="notice-content">{{ notice.content }}</p>
            <div v-if="notice.admin" class="notice-admin">发布：{{ notice.admin }}</div>
          </div>

          <div v-if="cardCurrent(notice)" class="notice-thumb-wrap">
            <img
              :src="cardCurrent(notice)"
              class="notice-thumb"
              alt=""
              @click="openGallery(notice)"
            />
            <!-- 左右箭头：仅多图时显示 -->
            <button
              v-if="cardCount(notice) > 1"
              class="card-arrow card-arrow-left thumb-arrow"
              @click.stop="prevCard(notice)"
            >‹</button>
            <button
              v-if="cardCount(notice) > 1"
              class="card-arrow card-arrow-right thumb-arrow"
              @click.stop="nextCard(notice)"
            >›</button>
            <!-- 页码指示 -->
            <div v-if="cardCount(notice) > 1" class="thumb-indicator">
              {{ getCardState(notice.id).idx + 1 }}/{{ cardCount(notice) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!notices.length" class="notice-empty">暂无公告</div>
    </template>
  </div>

  <!-- 图片画廊 lightbox -->
  <Teleport to="body">
    <div v-if="gallery.open" class="gallery-overlay" @click.self="gallery.open = false">
      <div class="gallery-box">
        <button class="gallery-close" @click="gallery.open = false">✕</button>
        <div v-if="gallery.loading" class="gallery-spin"><div class="loading-ring"></div></div>
        <template v-else>
          <img
            :src="gallery.images[gallery.idx]"
            class="gallery-main-img"
            alt=""
          />
          <div v-if="gallery.images.length > 1" class="gallery-nav">
            <button class="gnav-btn" :disabled="gallery.idx === 0" @click="gallery.idx--">‹</button>
            <div class="gallery-thumbs">
              <img
                v-for="(url, i) in gallery.images"
                :key="i"
                :src="url"
                class="gallery-thumb"
                :class="{ active: gallery.idx === i }"
                @click="gallery.idx = i"
                alt=""
              />
            </div>
            <button class="gnav-btn" :disabled="gallery.idx === gallery.images.length - 1" @click="gallery.idx++">›</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useNoticeRead } from '@/composables/useNoticeRead.js'

const { notices, loadNotices, markAllRead } = useNoticeRead()
const loading = ref(true)
const error   = ref(null)

function normalizeNoticeImages(images) {
  if (!Array.isArray(images)) return []
  return images
    .map((img, idx) => {
      const imageUrl = img?.imageUrl || img?.resourceUrl || img?.url || ''
      if (!imageUrl) return null
      return { ...img, id: img.id ?? idx, imageUrl }
    })
    .filter(Boolean)
}

function normalizeNoticeItem(notice) {
  if (!notice || typeof notice !== 'object') return {}

  const resourceUrl = notice.resourceUrl || notice.imageUrl || notice.coverImageUrl || notice.firstImageUrl || ''
  const imageUrl = notice.imageUrl || notice.firstImageUrl || notice.coverImageUrl || resourceUrl || ''
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
    images: normalizeNoticeImages(notice.images),
    date,
    dateLabel: notice.dateLabel || (date ? String(date).slice(0, 10) : ''),
    isPinned: Boolean(notice.isPinned),
    status: notice.status || '',
    createdAt: notice.createdAt || '',
  }
}

// ── Per-card image state ───────────────────────────────────────
// { [notice.id]: { images: string[], idx: number, loaded: boolean } }
const cardState = reactive({})

function getCardState(id) {
  if (!cardState[id]) cardState[id] = { images: [], idx: 0, loaded: false }
  return cardState[id]
}

/** Returns the URL currently shown in this card's image slot. */
function cardCurrent(notice) {
  const s = getCardState(notice.id)
  if (s.images.length) return s.images[s.idx]
  return notice.imageUrl || notice.firstImageUrl || notice.coverImageUrl || notice.resourceUrl || null
}

/** Returns how many images are available for in-card cycling. */
function cardCount(notice) {
  return getCardState(notice.id).images.length
}

function prevCard(notice) {
  const s = getCardState(notice.id)
  if (!s.images.length) return
  s.idx = (s.idx - 1 + s.images.length) % s.images.length
}

function nextCard(notice) {
  const s = getCardState(notice.id)
  if (!s.images.length) return
  s.idx = (s.idx + 1) % s.images.length
}

/** Fetch full image list for one notice and store in cardState. */
function lazyLoadImages(notice) {
  const s = getCardState(notice.id)
  if (s.loaded) return
  s.loaded = true
  const normalized = normalizeNoticeItem(notice)
  if (normalized.images.length) {
    s.images = normalized.images.map(img => img.imageUrl)
    return
  }
  const single = normalized.imageUrl || normalized.firstImageUrl || normalized.coverImageUrl || normalized.resourceUrl
  if (single) s.images = [single]
}

// ── Gallery lightbox ───────────────────────────────────────────
const gallery = reactive({ open: false, loading: false, images: [], idx: 0 })

async function openGallery(notice) {
  gallery.open = true
  gallery.idx = 0
  const s = getCardState(notice.id)
  if (s.loaded && s.images.length) {
    gallery.images = [...s.images]
    gallery.idx = s.idx
    gallery.loading = false
    return
  }
  gallery.loading = true
  gallery.images = []
  lazyLoadImages(notice)
  gallery.images = [...getCardState(notice.id).images]
  gallery.idx = getCardState(notice.id).idx
  gallery.loading = false
}

onMounted(async () => {
  try {
    await loadNotices()
    notices.value = Array.isArray(notices.value) ? notices.value.map(normalizeNoticeItem) : []
    // Background-load detail images for all cards that have any image.
    // Not awaited — Vue reactivity will update arrows as each resolves.
    for (const n of notices.value) {
      if (n.images?.length || n.imageUrl || n.firstImageUrl || n.coverImageUrl || n.resourceUrl) lazyLoadImages(n)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
  markAllRead()
})
</script>

<style scoped>
.notice-page {
  height: 100%;
  overflow-y: auto;
  padding: 32px 48px;
  scrollbar-width: thin;
  scrollbar-color: rgba(245,184,208,.2) transparent;
}

.notice-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.loading-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(245,184,208,.15);
  border-top-color: var(--pink);
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.notice-error, .notice-empty {
  text-align: center;
  color: rgba(255,255,255,.3);
  padding: 80px 0;
  font-size: 14px;
}

/* ---- Featured ---- */
.featured-card {
  max-width: 760px;
  margin: 0 auto 32px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(245,184,208,.04);
  border: 1px solid rgba(245,184,208,.15);
  position: relative;
}

.featured-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--pink);
  color: var(--night);
  font-size: 10px;
  letter-spacing: 2px;
  font-family: 'Noto Sans SC', sans-serif;
  z-index: 3;
}

.featured-img-wrap {
  height: 240px;
  overflow: hidden;
  position: relative;
}
.featured-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
  transition: transform .3s;
}
.featured-img-wrap:hover .featured-img { transform: scale(1.02); }

.featured-body {
  padding: 24px 28px 28px;
}

/* ---- List ---- */
.notice-list {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px 24px;
  border-radius: 12px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  transition: border-color .2s;
}
.notice-card:hover { border-color: rgba(245,184,208,.15); }

.notice-left { flex: 1; }

.notice-thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 80px;
}
.notice-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  cursor: zoom-in;
}

/* ---- In-card arrows (shared for featured + thumb) ---- */
.card-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  width: 32px;
  height: 48px;
  border: none;
  background: rgba(0,0,0,.45);
  color: rgba(255,255,255,.85);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
  /* no border-radius — flush to edge */
}
.card-arrow:hover { background: rgba(0,0,0,.68); }
.card-arrow-left  { left: 0;  border-radius: 0 4px 4px 0; }
.card-arrow-right { right: 0; border-radius: 4px 0 0 4px; }

/* Smaller variant for list thumbnails */
.thumb-arrow {
  width: 18px;
  height: 100%;
  top: 0;
  transform: none;
  font-size: 14px;
  border-radius: 0;
}
.thumb-arrow.card-arrow-left  { border-radius: 8px 0 0 8px; }
.thumb-arrow.card-arrow-right { border-radius: 0 8px 8px 0; }

/* ---- Page indicator overlays ---- */
.card-indicator {
  position: absolute;
  bottom: 10px;
  right: 12px;
  z-index: 4;
  background: rgba(0,0,0,.55);
  color: rgba(255,255,255,.85);
  font-size: 11px;
  letter-spacing: 1px;
  padding: 3px 9px;
  border-radius: 10px;
  pointer-events: none;
}

.thumb-indicator {
  position: absolute;
  bottom: 4px;
  right: 5px;
  z-index: 4;
  background: rgba(0,0,0,.6);
  color: rgba(255,255,255,.85);
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  pointer-events: none;
}

/* ---- Common notice fields ---- */
.notice-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.notice-date {
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--pink);
}

.notice-tag {
  font-size: 10px;
  letter-spacing: 1px;
  color: rgba(255,255,255,.3);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.1);
}

.notice-title {
  margin: 0 0 8px;
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.85);
  font-weight: 400;
}
.notice-title.featured {
  font-size: 22px;
  margin-bottom: 12px;
}

.notice-content {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.9;
  color: rgba(255,255,255,.5);
  letter-spacing: 1px;
  white-space: pre-line;
}

.notice-admin {
  font-size: 11px;
  color: rgba(255,255,255,.25);
  letter-spacing: 1px;
}

/* ---- Gallery Lightbox ---- */
.gallery-overlay {
  position: fixed; inset: 0; z-index: 950;
  background: rgba(5,2,12,.95); backdrop-filter: blur(20px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.gallery-box {
  position: relative;
  max-width: 92vw;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.gallery-close {
  position: absolute; top: -14px; right: -14px; width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.1); color: rgba(255,255,255,.8);
  font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2;
  transition: background .2s;
}
.gallery-close:hover { background: rgba(255,255,255,.2); }
.gallery-spin {
  display: flex; align-items: center; justify-content: center; padding: 60px;
}
.gallery-main-img {
  max-width: 88vw; max-height: 78vh; border-radius: 8px;
  object-fit: contain; box-shadow: 0 24px 80px rgba(0,0,0,.7);
}
.gallery-nav {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,.4); padding: 8px 12px; border-radius: 10px;
}
.gnav-btn {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.7); font-size: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .2s;
}
.gnav-btn:hover:not(:disabled) { background: rgba(255,255,255,.18); }
.gnav-btn:disabled { opacity: .3; cursor: not-allowed; }
.gallery-thumbs {
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; max-width: 60vw;
}
.gallery-thumb {
  width: 44px; height: 44px; border-radius: 5px; object-fit: cover;
  flex-shrink: 0; cursor: pointer; border: 1px solid rgba(255,255,255,.1);
  transition: border-color .2s; opacity: .6;
}
.gallery-thumb.active { border-color: var(--pink); opacity: 1; }
.gallery-thumb:hover  { opacity: .85; }
</style>
