<template>
  <div class="home-page">
    <div class="home-inner">
      <!-- 欢迎语 -->
      <div class="home-hero">
        <div class="hero-title">橹穆宇宙</div>
        <div class="hero-sub">欢迎来到这里，选择你想探索的空间</div>
      </div>

      <!-- 导航卡片网格 -->
      <div class="card-grid">
        <button
          v-for="item in boardItems"
          :key="item.key"
          class="board-card"
          :class="{ locked: item.fanOnly && isGuest() }"
          :disabled="item.fanOnly && isGuest()"
          @click="item.fanOnly && isGuest() ? null : $emit('navigate', item.key)"
        >
          <span class="card-icon">{{ item.icon }}</span>
          <span class="card-title">{{ item.label }}</span>
          <span class="card-desc">{{ item.desc }}</span>
          <span v-if="item.fanOnly && isGuest()" class="card-lock">🔒 登录后可见</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth.js'

const emit = defineEmits(['navigate'])
const { isGuest } = useAuth()

const boardItems = [
  { key: 'story',    icon: '📖', label: '故事',   desc: '橹穆的故事与日常',   fanOnly: false },
  { key: 'timeline', icon: '✨', label: '时间线', desc: '成长轨迹与重要时刻', fanOnly: false },
  { key: 'events',   icon: '📢', label: '活动',   desc: '公告与近期大事件',   fanOnly: false },
  { key: 'photos',   icon: '🌸', label: '相册',   desc: '珍贵的照片合集',     fanOnly: false },
  { key: 'videos',   icon: '🎬', label: '视频',   desc: '精选视频与回顾',     fanOnly: false },
  { key: 'world',    icon: '🌍', label: '世界',   desc: '橹穆的世界观',       fanOnly: false },
  { key: 'messages', icon: '💌', label: '留言',   desc: '给橹穆留下你的话',   fanOnly: true  },
]
</script>

<style scoped>
.home-page {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.1) transparent;
}
.home-page::-webkit-scrollbar { width: 4px; }
.home-page::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

.home-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

/* ── Hero ── */
.home-hero {
  text-align: center;
  margin-bottom: 48px;
}
.hero-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 36px;
  letter-spacing: 10px;
  background: linear-gradient(135deg, var(--blue), var(--pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}
.hero-sub {
  font-size: 13px;
  letter-spacing: 3px;
  color: var(--t3);
}

/* ── Grid ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.board-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 24px 22px 20px;
  border-radius: 16px;
  border: 1px solid rgba(245, 184, 208, 0.1);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  text-align: left;
  transition: all .25s;
  position: relative;
  overflow: hidden;
}
.board-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(120, 100, 220, 0.06), rgba(245, 184, 208, 0.04));
  opacity: 0;
  transition: opacity .25s;
}
.board-card:hover:not(:disabled)::before { opacity: 1; }
.board-card:hover:not(:disabled) {
  border-color: rgba(245, 184, 208, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
}
.board-card:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.card-icon {
  font-size: 28px;
  margin-bottom: 4px;
}
.card-title {
  font-size: 15px;
  letter-spacing: 3px;
  color: var(--t1);
  font-family: 'ZCOOL XiaoWei', serif;
}
.card-desc {
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--t3);
  line-height: 1.5;
}
.card-lock {
  margin-top: 4px;
  font-size: 10px;
  letter-spacing: 1px;
  color: rgba(245, 184, 208, 0.4);
}
</style>