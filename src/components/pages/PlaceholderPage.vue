<template>
  <div class="placeholder-page">
    <div class="ph-icon">{{ icon }}</div>
    <div class="ph-title">{{ title }}</div>
    <div class="ph-hint">正在建设中，敬请期待 ✦</div>
  </div>
</template>

<script setup>
defineProps({
  icon:  { type: String, default: '🌸' },
  title: { type: String, default: '功能开发中' }
})
</script>

<style scoped>
.placeholder-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.ph-icon {
  font-size: 56px;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.ph-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  letter-spacing: 4px;
  color: rgba(255,255,255,.4);
}

.ph-hint {
  font-size: 12px;
  letter-spacing: 3px;
  color: rgba(255,255,255,.2);
}
</style>