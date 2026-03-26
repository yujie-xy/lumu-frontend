<template>
  <div class="photo-page">
    <!-- 标签栏 -->
    <div class="photo-tabs">
      <button
        class="photo-tab"
        :class="{ active: activeLabelId === null }"
        @click="selectLabel(null)"
      >全部</button>
      <button
        v-for="label in labels"
        :key="label.id"
        class="photo-tab"
        :class="{ active: activeLabelId === label.id }"
        @click="selectLabel(label.id)"
      >{{ label.name }}</button>
    </div>

    <!-- 照片区 -->
    <div class="photo-body">
      <div v-if="loading" class="photo-loading">
        <div class="loading-ring"></div>
      </div>

      <div v-else-if="error" class="photo-empty">{{ error }}</div>
      <div v-else-if="!photos.length" class="photo-empty">暂无照片</div>

      <div v-else class="photo-grid">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="photo-cell"
          @click="openLightbox(photo)"
        >
          <img :src="resolveMediaUrl(photo.imageUrl)" :alt="photo.title || ''" class="photo-img" loading="lazy" />
          <div class="photo-overlay">
            <div v-if="photo.title" class="photo-title">{{ photo.title }}</div>
            <div v-if="photo.source" class="photo-source">来源：{{ photo.source }}</div>
            <div v-if="photo.labels?.length" class="photo-label-row">
              <span v-for="l in photo.labels" :key="l.id" class="photo-label-badge">{{ l.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 灯箱 -->
    <Teleport to="body">
      <div v-if="lightbox" class="lightbox-overlay" @click.self="lightbox = null">
        <button class="lightbox-close" @click="lightbox = null">✕</button>
        <img :src="resolveMediaUrl(lightbox.imageUrl)" :alt="lightbox.title || ''" class="lightbox-img" />
        <div class="lightbox-meta">
          <span v-if="lightbox.title" class="lightbox-title">{{ lightbox.title }}</span>
          <span v-if="lightbox.source" class="lightbox-source">来源：{{ lightbox.source }}</span>
          <LikeButton content-type="photo" :target-id="lightbox.id" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchPhotoLabels, fetchPhotos } from '@/api/photo.js'
import { resolveMediaUrl } from '@/utils/media.js'
import LikeButton from '@/components/common/LikeButton.vue'

const labels       = ref([])
const photos       = ref([])
const loading      = ref(true)
const error        = ref(null)
const activeLabelId = ref(null)
const lightbox     = ref(null)

onMounted(async () => {
  try { labels.value = await fetchPhotoLabels() } catch {}
  await loadPhotos()
})

async function loadPhotos() {
  loading.value = true
  error.value   = null
  try {
    photos.value = await fetchPhotos(activeLabelId.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function selectLabel(labelId) {
  activeLabelId.value = labelId
  loadPhotos()
}

function openLightbox(photo) {
  lightbox.value = photo
}
</script>

<style scoped>
.photo-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.photo-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px 12px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.photo-tab {
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
.photo-tab:hover { color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.2); }
.photo-tab.active {
  background: rgba(245,184,208,.1);
  color: var(--pink);
  border-color: rgba(245,184,208,.3);
}

.photo-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  scrollbar-width: thin;
  scrollbar-color: rgba(245,184,208,.2) transparent;
}

.photo-loading { display: flex; justify-content: center; padding: 80px 0; }
.loading-ring {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid rgba(245,184,208,.15);
  border-top-color: var(--pink);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.photo-empty {
  text-align: center;
  color: rgba(255,255,255,.3);
  padding: 80px 0;
  font-size: 14px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.photo-cell {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  aspect-ratio: 1 / 1;
  transition: transform .2s, border-color .2s;
}
.photo-cell:hover { transform: translateY(-3px); border-color: rgba(245,184,208,.25); }
.photo-cell:hover .photo-overlay { opacity: 1; }

.photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(8,4,18,.85) 0%, transparent 55%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  opacity: 0;
  transition: opacity .2s;
}

.photo-title { font-size: 13px; color: rgba(255,255,255,.9); letter-spacing: 1px; margin-bottom: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.photo-source { font-size: 10px; color: rgba(255,255,255,.45); letter-spacing: 1px; margin-bottom: 5px; }
.photo-label-row { display: flex; flex-wrap: wrap; gap: 4px; }
.photo-label-badge { font-size: 10px; padding: 2px 7px; border-radius: 8px; background: rgba(245,184,208,.15); color: var(--pink); letter-spacing: 1px; }

/* 灯箱 */
.lightbox-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(5,2,12,.93); backdrop-filter: blur(20px);
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px;
}
.lightbox-close {
  position: fixed; top: 20px; right: 24px; width: 36px; height: 36px;
  border-radius: 50%; border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.06); color: rgba(255,255,255,.6);
  font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .2s; z-index: 901;
}
.lightbox-close:hover { background: rgba(255,255,255,.12); color: #fff; }
.lightbox-img { max-width: 90vw; max-height: 82vh; border-radius: 10px; object-fit: contain; box-shadow: 0 24px 80px rgba(0,0,0,.6); }
.lightbox-meta { margin-top: 14px; display: flex; gap: 16px; align-items: center; }
.lightbox-title { font-size: 14px; color: rgba(255,255,255,.75); letter-spacing: 2px; }
.lightbox-source { font-size: 12px; color: rgba(255,255,255,.35); letter-spacing: 1px; }
</style>