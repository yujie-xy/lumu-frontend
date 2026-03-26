<template>
  <div class="story-page">

    <!-- ── 左侧目录 ── -->
    <aside class="toc">
      <div class="toc-title">章节目录</div>
      <div v-if="loading" class="toc-loading">加载中…</div>
      <ul v-else class="toc-list">
        <li
          v-for="(ch, idx) in chapters"
          :key="ch.id"
          class="toc-item"
          :class="{ active: activeIdx === idx }"
          @click="jumpTo(idx)"
        >
          <span class="toc-emoji">{{ ch.emoji }}</span>
          <span class="toc-label">{{ ch.chapterNum }}. {{ ch.title }}</span>
        </li>
      </ul>
    </aside>

    <!-- ── 右侧书页区 ── -->
    <main class="book-area">

      <div v-if="loading" class="book-loading">
        <div class="loading-ring"></div>
      </div>
      <div v-else-if="error" class="book-error">{{ error }}</div>
      <div v-else-if="!chapters.length" class="book-error">暂无内容</div>

      <template v-else>
        <!-- 书页内容（可滚动） -->
        <div class="book-wrap">
          <Transition :name="transDir" mode="out-in">
            <div class="book-page" :key="activeIdx">

              <!-- 章节封面 -->
              <div
                class="page-chapter-header"
                :style="{ background: `linear-gradient(${current.gradient || '135deg, #1a0d3a, #0d0818'})` }"
              >
                <span class="hdr-emoji">{{ current.emoji }}</span>
                <div class="hdr-meta">
                  <span class="hdr-num">第 {{ current.chapterNum }} 章</span>
                  <span class="hdr-date">{{ current.dateLabel }}</span>
                </div>
                <h2 class="hdr-title">{{ current.title }}</h2>
              </div>

              <!-- 图片：子表多图 > 旧单图，互斥展示 -->
              <template v-if="chapterImages.length">
                <div class="page-gallery">
                  <img
                    :src="resolveMediaUrl(chapterImages[galleryIdx]?.imageUrl)"
                    class="page-img"
                    alt=""
                    @click="fullscreenImg = chapterImages[galleryIdx]?.imageUrl"
                  />
                  <div v-if="chapterImages.length > 1" class="gallery-nav">
                    <button class="gnav-btn" :disabled="galleryIdx === 0" @click="galleryIdx--">‹</button>
                    <div class="gallery-thumbs">
                      <img
                        v-for="(img, i) in chapterImages"
                        :key="i"
                        :src="resolveMediaUrl(img.imageUrl)"
                        class="gallery-thumb"
                        :class="{ active: galleryIdx === i }"
                        @click="galleryIdx = i"
                        alt=""
                      />
                    </div>
                    <button class="gnav-btn" :disabled="galleryIdx === chapterImages.length - 1" @click="galleryIdx++">›</button>
                  </div>
                </div>
              </template>
              <img
                v-else-if="current.imageUrl || current.firstImageUrl"
                :src="resolveMediaUrl(current.imageUrl || current.firstImageUrl)"
                class="page-img"
                alt=""
              />

              <!-- 正文 -->
              <div class="page-body story-html" v-html="current.content"></div>

              <!-- 互动区 -->
              <div class="page-interactions">
                <LikeButton content-type="story" :target-id="current.id" />
                <CommentPanel content-type="story" :target-id="current.id" />
              </div>

            </div>
          </Transition>
        </div>

        <!-- 底部翻章按钮 -->
        <div class="book-footer">
          <button class="btn-turn" :disabled="activeIdx === 0" @click="goPrev">
            ← 上一章
          </button>

          <div class="page-indicator">
            第 {{ activeIdx + 1 }} 章 / 共 {{ chapters.length }} 章
          </div>

          <button class="btn-turn" :disabled="activeIdx === chapters.length - 1" @click="goNext">
            下一章 →
          </button>
        </div>
      </template>

    </main>

    <!-- 全屏大图 -->
    <Teleport to="body">
      <div v-if="fullscreenImg" class="fullscreen-overlay" @click="fullscreenImg = null">
        <img :src="resolveMediaUrl(fullscreenImg)" class="fullscreen-img" alt="" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { fetchStory, fetchStoryById } from '@/api/content.js'
import { resolveMediaUrl } from '@/utils/media.js'
import LikeButton   from '@/components/common/LikeButton.vue'
import CommentPanel from '@/components/common/CommentPanel.vue'

const chapters      = ref([])
const loading       = ref(true)
const error         = ref(null)
const activeIdx     = ref(0)
const transDir      = ref('page-next')
const chapterImages = ref([])
const galleryIdx    = ref(0)
const fullscreenImg = ref(null)

onMounted(async () => {
  try {
    chapters.value = await fetchStory()
    if (chapters.value.length) loadChapterImages(chapters.value[0].id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function loadChapterImages(id) {
  galleryIdx.value = 0
  try {
    const detail = await fetchStoryById(id)
    chapterImages.value = detail.images || []
  } catch {
    chapterImages.value = []
  }
}

watch(activeIdx, (newIdx) => {
  const ch = chapters.value[newIdx]
  if (ch) loadChapterImages(ch.id)
})

const current = computed(() => chapters.value[activeIdx.value] ?? {})

function goNext() {
  if (activeIdx.value >= chapters.value.length - 1) return
  transDir.value = 'page-next'
  activeIdx.value++
}

function goPrev() {
  if (activeIdx.value <= 0) return
  transDir.value = 'page-prev'
  activeIdx.value--
}

function jumpTo(idx) {
  if (idx === activeIdx.value) return
  transDir.value = idx > activeIdx.value ? 'page-next' : 'page-prev'
  activeIdx.value = idx
}
</script>

<style scoped>
/* ── 整体布局 ── */
.story-page {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── 左侧目录 ── */
.toc {
  width: 220px;
  flex-shrink: 0;
  padding: 24px 16px;
  border-right: 1px solid rgba(255,255,255,.06);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(245,184,208,.2) transparent;
}

.toc-title {
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(255,255,255,.3);
  margin-bottom: 16px;
  text-transform: uppercase;
}

.toc-loading {
  font-size: 12px;
  color: rgba(255,255,255,.3);
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all .2s;
  color: rgba(255,255,255,.45);
  font-size: 12px;
  letter-spacing: 1px;
}
.toc-item:hover  { background: rgba(255,255,255,.05); color: rgba(255,255,255,.75); }
.toc-item.active { background: rgba(245,184,208,.1);  color: var(--pink); }
.toc-emoji { font-size: 14px; flex-shrink: 0; }
.toc-label { line-height: 1.4; }

/* ── 右侧书页区 ── */
.book-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 28px 32px 0;
}

.book-loading,
.book-error {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.book-error {
  font-size: 14px;
  color: rgba(255,255,255,.3);
  letter-spacing: 2px;
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

/* ── 书页滚动容器 ── */
.book-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(245,184,208,.2) transparent;
  padding-bottom: 8px;
}
.book-wrap::-webkit-scrollbar { width: 4px; }
.book-wrap::-webkit-scrollbar-thumb { background: rgba(245,184,208,.15); border-radius: 2px; }

/* ── 书页卡片 ── */
.book-page {
  width: 100%;
  max-width: 660px;
  margin: 0 auto;
  background: rgba(255,255,255,.035);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 16px 40px rgba(0,0,0,.45);
}

/* ── 章节封面 ── */
.page-chapter-header {
  padding: 32px 36px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hdr-emoji { font-size: 32px; line-height: 1; }

.hdr-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hdr-num, .hdr-date {
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.5);
}

.hdr-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(20px, 2.5vw, 26px);
  letter-spacing: 4px;
  color: #fff;
  font-weight: 400;
  line-height: 1.5;
}

/* ── 章节图片 ── */
.page-img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
}

/* ── 多图画廊 ── */
.page-gallery { position: relative; }
.gallery-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0,0,0,.3);
}
.gnav-btn {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.7); font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .2s;
}
.gnav-btn:hover:not(:disabled) { background: rgba(255,255,255,.15); }
.gnav-btn:disabled { opacity: .3; cursor: not-allowed; }
.gallery-thumbs {
  flex: 1; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
}
.gallery-thumb {
  width: 40px; height: 40px; border-radius: 5px; object-fit: cover;
  flex-shrink: 0; cursor: pointer; border: 1px solid rgba(255,255,255,.1);
  transition: border-color .2s; opacity: .6;
}
.gallery-thumb.active { border-color: var(--pink); opacity: 1; }
.gallery-thumb:hover  { opacity: .85; }

/* ── 正文 ── */
.page-body {
  padding: 28px 36px 36px;
}

.story-html :deep(p) {
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  line-height: 2;
  color: rgba(255,255,255,.72);
  margin: 0 0 18px;
  letter-spacing: 1px;
}
.story-html :deep(p:last-child) { margin-bottom: 0; }
.story-html :deep(br)           { display: block; content: ''; margin-bottom: 8px; }
.story-html :deep(strong), .story-html :deep(b) { color: rgba(255,255,255,.92); font-weight: 600; }
.story-html :deep(em), .story-html :deep(i)     { color: var(--pink); font-style: italic; }
.story-html :deep(h1), .story-html :deep(h2), .story-html :deep(h3) {
  font-family: 'Noto Serif SC', serif;
  color: rgba(255,255,255,.85);
  margin: 16px 0 8px;
  letter-spacing: 3px;
  font-weight: 400;
}

/* ── 底部翻章栏 ── */
.book-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 18px;
  border-top: 1px solid rgba(255,255,255,.05);
  margin-top: 4px;
}

.btn-turn {
  padding: 8px 22px;
  border-radius: 20px;
  border: 1px solid rgba(245,184,208,.4);
  background: rgba(245,184,208,.05);
  color: rgba(245,184,208,.85);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.btn-turn:hover:not(:disabled) {
  border-color: var(--pink);
  color: var(--pink);
  background: rgba(245,184,208,.1);
}
.btn-turn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.3);
}

/* ── 互动区 ── */
.page-interactions {
  padding: 0 36px 28px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── 全屏大图 ── */
.fullscreen-overlay {
  position: fixed; inset: 0; z-index: 950;
  background: rgba(5,2,12,.95); backdrop-filter: blur(20px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  cursor: zoom-out;
}
.fullscreen-img {
  max-width: 92vw; max-height: 90vh; border-radius: 8px;
  object-fit: contain; box-shadow: 0 24px 80px rgba(0,0,0,.7);
}

/* ── 切章节过渡动画 ── */
.page-next-enter-active,
.page-next-leave-active,
.page-prev-enter-active,
.page-prev-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.page-next-enter-from { opacity: 0; transform: translateX(20px); }
.page-next-leave-to   { opacity: 0; transform: translateX(-20px); }
.page-prev-enter-from { opacity: 0; transform: translateX(-20px); }
.page-prev-leave-to   { opacity: 0; transform: translateX(20px); }
</style>