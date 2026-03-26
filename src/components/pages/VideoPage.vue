<template>
  <div class="video-page">
    <!-- 标签栏 -->
    <div class="video-tabs">
      <button
        class="video-tab"
        :class="{ active: activeLabelId === null }"
        @click="selectLabel(null)"
      >全部</button>
      <button
        v-for="label in labels"
        :key="label.id"
        class="video-tab"
        :class="{ active: activeLabelId === label.id }"
        @click="selectLabel(label.id)"
      >{{ label.name }}</button>
    </div>

    <!-- 视频列表 -->
    <div class="video-body">
      <div v-if="loading" class="video-loading">
        <div class="loading-ring"></div>
      </div>

      <div v-else-if="error" class="video-empty">{{ error }}</div>
      <div v-else-if="!videos.length" class="video-empty">暂无视频</div>

      <div v-else class="video-grid">
        <a
          v-for="v in videos"
          :key="v.id"
          :href="v.videoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="video-card"
        >
          <div class="video-cover-wrap">
            <img v-if="getVideoCover(v)" :src="getVideoCover(v)" :alt="v.title" class="video-cover" loading="lazy" />
            <div v-else class="video-cover-placeholder">
              <span class="play-icon-lg">▶</span>
            </div>
            <div class="play-btn">▶</div>
          </div>
          <div class="video-info">
            <div class="video-title">{{ v.title }}</div>
            <div v-if="v.description" class="video-desc">{{ v.description }}</div>
            <div class="video-meta">
              <span v-if="v.source" class="video-source">{{ v.source }}</span>
              <span v-for="l in v.labels" :key="l.id" class="video-label-badge">{{ l.name }}</span>
            </div>
            <div class="video-like-row" @click.stop.prevent>
              <LikeButton content-type="video" :target-id="v.id" />
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchVideoLabels, fetchVideos } from '@/api/video.js'
import { resolveMediaUrl, resolveVideoCover } from '@/utils/media.js'
import LikeButton from '@/components/common/LikeButton.vue'

function getVideoCover(v) {
  if (v.coverUrl) return resolveMediaUrl(v.coverUrl)
  return resolveVideoCover(v.videoUrl) || ''
}

const labels       = ref([])
const videos       = ref([])
const loading      = ref(true)
const error        = ref(null)
const activeLabelId = ref(null)

onMounted(async () => {
  try { labels.value = await fetchVideoLabels() } catch {}
  await loadVideos()
})

async function loadVideos() {
  loading.value = true
  error.value   = null
  try {
    videos.value = await fetchVideos(activeLabelId.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function selectLabel(labelId) {
  activeLabelId.value = labelId
  loadVideos()
}
</script>

<style scoped>
.video-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.video-tabs {
  display: flex; gap: 8px; padding: 16px 24px 12px;
  border-bottom: 1px solid rgba(255,255,255,.06); flex-shrink: 0; flex-wrap: wrap;
}
.video-tab {
  padding: 5px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,.1);
  background: transparent; color: rgba(255,255,255,.4);
  font-family: 'Noto Sans SC', sans-serif; font-size: 12px; letter-spacing: 1px;
  cursor: pointer; transition: all .2s;
}
.video-tab:hover { color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.2); }
.video-tab.active { background: rgba(168,212,245,.1); color: var(--blue); border-color: rgba(168,212,245,.3); }

.video-body {
  flex: 1; overflow-y: auto; padding: 24px 32px;
  scrollbar-width: thin; scrollbar-color: rgba(168,212,245,.2) transparent;
}
.video-loading { display: flex; justify-content: center; padding: 80px 0; }
.loading-ring {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid rgba(168,212,245,.15); border-top-color: var(--blue);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.video-empty { text-align: center; color: rgba(255,255,255,.3); padding: 80px 0; font-size: 14px; }

.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

.video-card {
  display: block; text-decoration: none; border-radius: 14px; overflow: hidden;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  transition: transform .2s, border-color .2s;
}
.video-card:hover { transform: translateY(-4px); border-color: rgba(168,212,245,.25); }
.video-card:hover .play-btn { opacity: 1; transform: translate(-50%, -50%) scale(1); }

.video-cover-wrap { position: relative; width: 100%; aspect-ratio: 16/9; background: rgba(255,255,255,.04); overflow: hidden; }
.video-cover { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
.video-card:hover .video-cover { transform: scale(1.04); }
.video-cover-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(168,212,245,.06), rgba(245,184,208,.04));
}
.play-icon-lg { font-size: 32px; color: rgba(255,255,255,.2); }
.play-btn {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(168,212,245,.18); border: 1.5px solid rgba(168,212,245,.4);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #fff; opacity: 0; transition: opacity .2s, transform .2s;
  pointer-events: none; padding-left: 3px;
}

.video-info { padding: 14px 16px 16px; }
.video-title {
  font-size: 14px; color: rgba(255,255,255,.85); letter-spacing: 1px; margin-bottom: 5px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.video-desc {
  font-size: 12px; color: rgba(255,255,255,.4); line-height: 1.6; letter-spacing: 1px; margin-bottom: 8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.video-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.video-source { font-size: 10px; color: rgba(255,255,255,.35); letter-spacing: 1px; }
.video-label-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 8px;
  background: rgba(168,212,245,.1); color: var(--blue); letter-spacing: 1px;
}

.video-like-row {
  margin-top: 10px;
}
</style>