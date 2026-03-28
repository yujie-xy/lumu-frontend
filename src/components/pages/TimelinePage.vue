<template>
  <div class="timeline-page">
    <!-- 标签栏 -->
    <div class="tl-tabs">
      <button
        class="tl-tab"
        :class="{ active: activeTab === 'rose' }"
        @click="activeTab = 'rose'"
      >🌸 重要时间线</button>
      <button
        class="tl-tab"
        :class="{ active: activeTab === 'blue' }"
        @click="activeTab = 'blue'"
      >💙 日常时间线</button>
    </div>

    <div class="tl-body">
      <!-- 日历侧边栏 -->
      <aside class="tl-sidebar">
        <div class="sidebar-title">时间轴</div>
        <div v-if="loading" class="sidebar-loading">加载中...</div>
        <div v-else class="year-groups">
          <div
            v-for="(evts, year) in groupedByYear"
            :key="year"
            class="year-group"
          >
            <div class="year-label">{{ year }}</div>
            <div class="month-dots">
              <span
                v-for="e in evts"
                :key="e.id"
                class="month-dot"
                :class="e.color"
                :title="e.title"
                @click="scrollToEvent(e.id)"
              ></span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 时间线主区域 -->
      <main class="tl-main" ref="scrollRef">
        <div v-if="loading" class="tl-loading">
          <div class="loading-ring"></div>
        </div>

        <div v-else-if="error" class="tl-error">{{ error }}</div>

        <div v-else class="tl-track">
          <div class="tl-line"></div>

          <div
            v-for="(event, idx) in filteredEvents"
            :key="event.id"
            :id="`event-${event.id}`"
            class="tl-row"
            :class="[event.color, idx % 2 === 0 ? 'left' : 'right', { big: event.isBig }]"
          >
            <!-- 节点 -->
            <div class="tl-node">
              <span class="node-emoji">{{ event.emoji }}</span>
            </div>

            <!-- 卡片 -->
            <div class="tl-card">
              <div class="card-date">{{ formatDate(event.date) }}</div>
              <h3 class="card-title">{{ event.title }}</h3>
              <p v-if="event.description" class="card-desc">{{ event.description }}</p>

              <!-- 图片区域：有图才渲染 -->
              <div v-if="cardCurrent(event)" class="card-img-wrap">
                <img
                  :src="resolveMediaUrl(cardCurrent(event))"
                  class="card-img"
                  alt=""
                  @click="openGallery(event)"
                />
                <!-- 左右箭头：仅多图时显示 -->
                <button
                  v-if="cardCount(event) > 1"
                  class="card-arrow card-arrow-left"
                  @click.stop="prevCard(event)"
                >‹</button>
                <button
                  v-if="cardCount(event) > 1"
                  class="card-arrow card-arrow-right"
                  @click.stop="nextCard(event)"
                >›</button>
                <!-- 页码指示 -->
                <div v-if="cardCount(event) > 1" class="card-indicator">
                  {{ getCardState(event.id).idx + 1 }} / {{ cardCount(event) }}
                </div>
              </div>

              <div v-if="event.admin" class="card-admin">by {{ event.admin }}</div>
              <div class="card-interactions">
                <LikeButton content-type="timeline" :target-id="event.id" />
                <CommentPanel content-type="timeline" :target-id="event.id" />
              </div>
            </div>
          </div>

          <div v-if="!filteredEvents.length" class="tl-empty">暂无记录</div>
        </div>
      </main>
    </div>
  </div>

  <!-- 图片画廊 lightbox -->
  <Teleport to="body">
    <div v-if="gallery.open" class="gallery-overlay" @click.self="gallery.open = false">
      <div class="gallery-box">
        <button class="gallery-close" @click="gallery.open = false">✕</button>
        <div v-if="gallery.loading" class="gallery-spin"><div class="loading-ring"></div></div>
        <template v-else>
          <img
            :src="resolveMediaUrl(gallery.images[gallery.idx])"
            class="gallery-main-img"
            alt=""
          />
          <div v-if="gallery.images.length > 1" class="gallery-nav">
            <button class="gnav-btn" :disabled="gallery.idx === 0" @click="gallery.idx--">‹</button>
            <div class="gallery-thumbs">
              <img
                v-for="(url, i) in gallery.images"
                :key="i"
                :src="resolveMediaUrl(url)"
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
import { ref, computed, reactive, onMounted } from 'vue'
import { fetchTimeline } from '@/api/content.js'
import { resolveMediaUrl } from '@/utils/media.js'
import LikeButton   from '@/components/common/LikeButton.vue'
import CommentPanel from '@/components/common/CommentPanel.vue'

const events = ref([])
const loading = ref(true)
const error = ref(null)
const activeTab = ref('rose')
const scrollRef = ref(null)

function normalizeTimelineImages(images) {
  if (!Array.isArray(images)) return []
  return images
    .map((img, idx) => {
      const imageUrl = img?.imageUrl || img?.resourceUrl || img?.url || ''
      if (!imageUrl) return null
      return { ...img, id: img.id ?? idx, imageUrl }
    })
    .filter(Boolean)
}

function normalizeTimelineEvent(event) {
  if (!event || typeof event !== 'object') return {}

  const resourceUrl = event.resourceUrl || event.imageUrl || event.firstImageUrl || event.coverImageUrl || ''
  const imageUrl = event.imageUrl || event.firstImageUrl || event.coverImageUrl || resourceUrl || ''
  const date = event.date || event.createdAt || ''

  return {
    ...event,
    title: event.title || '',
    body: event.body ?? event.content ?? event.description ?? '',
    content: event.content ?? event.body ?? event.description ?? '',
    description: event.description ?? event.body ?? event.content ?? '',
    resourceUrl,
    imageUrl,
    firstImageUrl: event.firstImageUrl || imageUrl || resourceUrl || '',
    coverImageUrl: event.coverImageUrl || resourceUrl || imageUrl || '',
    images: normalizeTimelineImages(event.images),
    date,
    dateLabel: event.dateLabel || (date ? String(date).slice(0, 10) : ''),
    isPinned: Boolean(event.isPinned),
    status: event.status || '',
    createdAt: event.createdAt || '',
  }
}

// ── Per-card image state ───────────────────────────────────────
// { [event.id]: { images: string[], idx: number, loaded: boolean } }
const cardState = reactive({})

function getCardState(id) {
  if (!cardState[id]) cardState[id] = { images: [], idx: 0, loaded: false }
  return cardState[id]
}

/** Returns the URL currently shown in this card's image slot. */
function cardCurrent(event) {
  const s = getCardState(event.id)
  if (s.images.length) return s.images[s.idx]
  return event.imageUrl || event.firstImageUrl || event.coverImageUrl || event.resourceUrl || null
}

/** Returns how many images are available for in-card cycling. */
function cardCount(event) {
  return getCardState(event.id).images.length
}

function prevCard(event) {
  const s = getCardState(event.id)
  if (!s.images.length) return
  s.idx = (s.idx - 1 + s.images.length) % s.images.length
}

function nextCard(event) {
  const s = getCardState(event.id)
  if (!s.images.length) return
  s.idx = (s.idx + 1) % s.images.length
}

/** Fetch full image list for one event and store in cardState. */
function lazyLoadImages(event) {
  const s = getCardState(event.id)
  if (s.loaded) return
  s.loaded = true
  const normalized = normalizeTimelineEvent(event)
  if (normalized.images.length) {
    s.images = normalized.images.map(img => img.imageUrl)
    return
  }
  const single = normalized.imageUrl || normalized.firstImageUrl || normalized.coverImageUrl || normalized.resourceUrl
  if (single) s.images = [single]
}

// ── Gallery lightbox ───────────────────────────────────────────
const gallery = reactive({ open: false, loading: false, images: [], idx: 0 })

async function openGallery(event) {
  gallery.open = true
  gallery.idx = 0
  const s = getCardState(event.id)
  if (s.loaded && s.images.length) {
    gallery.images = [...s.images]
    gallery.idx = s.idx
    gallery.loading = false
    return
  }
  gallery.loading = true
  gallery.images = []
  lazyLoadImages(event)
  gallery.images = [...getCardState(event.id).images]
  gallery.idx = getCardState(event.id).idx
  gallery.loading = false
}

onMounted(async () => {
  try {
    const list = await fetchTimeline()
    events.value = Array.isArray(list) ? list.map(normalizeTimelineEvent) : []
    // Background-load detail images for all events that have any image.
    // Not awaited — Vue reactivity updates arrows as each resolves.
    for (const e of events.value) {
      if (e.images?.length || e.imageUrl || e.firstImageUrl || e.coverImageUrl || e.resourceUrl) lazyLoadImages(e)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const filteredEvents = computed(() => {
  const colorMap = { rose: 'pink', blue: 'blue' }
  const target = colorMap[activeTab.value]
  return events.value.filter(e => e.color === target || activeTab.value === 'rose' && e.color === 'pink' || activeTab.value === 'blue' && e.color === 'blue')
})

const groupedByYear = computed(() => {
  const groups = {}
  for (const e of filteredEvents.value) {
    const year = e.date ? e.date.substring(0, 4) : '未知'
    if (!groups[year]) groups[year] = []
    groups[year].push(e)
  }
  return groups
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function scrollToEvent(id) {
  const el = document.getElementById(`event-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<style scoped>
.timeline-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tl-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}

.tl-tab {
  padding: 8px 20px;
  border-radius: 20px 20px 0 0;
  border: 1px solid rgba(255,255,255,.08);
  border-bottom: none;
  background: transparent;
  color: rgba(255,255,255,.4);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .2s;
}
.tl-tab.active {
  background: rgba(245,184,208,.08);
  color: var(--pink);
  border-color: rgba(245,184,208,.2);
}
.tl-tab:nth-child(2).active {
  background: rgba(168,212,245,.08);
  color: var(--blue);
  border-color: rgba(168,212,245,.2);
}

.tl-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ---- Sidebar ---- */
.tl-sidebar {
  width: 160px;
  flex-shrink: 0;
  padding: 24px 16px;
  border-right: 1px solid rgba(255,255,255,.06);
  overflow-y: auto;
  scrollbar-width: none;
}

.sidebar-title {
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(255,255,255,.25);
  margin-bottom: 16px;
}

.sidebar-loading {
  font-size: 12px;
  color: rgba(255,255,255,.25);
}

.year-groups { display: flex; flex-direction: column; gap: 16px; }

.year-label {
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.35);
  margin-bottom: 6px;
}

.month-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.month-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,.2);
  cursor: pointer;
  transition: transform .15s;
}
.month-dot:hover { transform: scale(1.4); }
.month-dot.pink { background: var(--pink); }
.month-dot.blue { background: var(--blue); }

/* ---- Main ---- */
.tl-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px 48px;
  scrollbar-width: thin;
  scrollbar-color: rgba(245,184,208,.2) transparent;
}

.tl-loading {
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

.tl-error, .tl-empty {
  text-align: center;
  color: rgba(255,255,255,.3);
  padding: 80px 0;
  font-size: 14px;
}

/* ---- Track ---- */
.tl-track {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 0 48px;
}

.tl-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(245,184,208,.3) 10%, rgba(245,184,208,.3) 90%, transparent);
  transform: translateX(-50%);
}

.tl-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 40px;
  position: relative;
}

/* left/right alternating */
.tl-row.left { flex-direction: row; }
.tl-row.right { flex-direction: row-reverse; }
.tl-row.left .tl-card { margin-right: calc(50% + 16px); }
.tl-row.right .tl-card { margin-left: calc(50% + 16px); }

.tl-node {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(13,8,24,.9);
  border: 1px solid rgba(245,184,208,.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 2;
}

.tl-row.blue .tl-node { border-color: rgba(168,212,245,.3); }
.tl-row.big .tl-node {
  width: 44px;
  height: 44px;
  font-size: 20px;
  border-color: var(--pink);
  box-shadow: 0 0 16px rgba(245,184,208,.3);
}

.tl-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  padding: 20px;
  flex: 1;
  max-width: calc(50% - 40px);
  transition: border-color .2s;
}
.tl-card:hover { border-color: rgba(245,184,208,.2); }
.tl-row.blue .tl-card:hover { border-color: rgba(168,212,245,.2); }

.card-date {
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--pink);
  margin-bottom: 6px;
}
.tl-row.blue .card-date { color: var(--blue); }

.card-title {
  margin: 0 0 8px;
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.85);
  font-weight: 400;
}

.card-desc {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255,255,255,.5);
  letter-spacing: 1px;
}

/* ---- Card image wrapper ---- */
.card-img-wrap {
  position: relative;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.card-img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
}

/* ---- In-card arrows ---- */
.card-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  width: 26px;
  height: 44px;
  border: none;
  background: rgba(0,0,0,.45);
  color: rgba(255,255,255,.85);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
}
.card-arrow:hover { background: rgba(0,0,0,.68); }
.card-arrow-left  { left: 0;  border-radius: 0 4px 4px 0; }
.card-arrow-right { right: 0; border-radius: 4px 0 0 4px; }

/* ---- Page indicator ---- */
.card-indicator {
  position: absolute;
  bottom: 7px;
  right: 9px;
  z-index: 4;
  background: rgba(0,0,0,.55);
  color: rgba(255,255,255,.85);
  font-size: 10px;
  letter-spacing: 1px;
  padding: 2px 7px;
  border-radius: 8px;
  pointer-events: none;
}

.card-admin {
  font-size: 11px;
  color: rgba(255,255,255,.25);
  letter-spacing: 1px;
  margin-bottom: 2px;
}

.card-interactions {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
