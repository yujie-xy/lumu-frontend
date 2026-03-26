<template>
  <button
    class="like-btn"
    :class="{ liked, loading }"
    :title="isGuest() ? '登录后可点赞' : liked ? '取消点赞' : '点赞'"
    @click="handleClick"
  >
    <span class="like-icon">{{ liked ? '❤️' : '🤍' }}</span>
    <span class="like-count">{{ count }}</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchLikeSummary, toggleLike } from '@/api/interaction.js'
import { useAuth } from '@/composables/useAuth.js'

const props = defineProps({
  contentType: { type: String, required: true },
  targetId:    { type: Number, required: true },
})

const { isGuest, isFan } = useAuth()

const count   = ref(0)
const liked   = ref(false)
const loading = ref(false)

onMounted(async () => {
  try {
    const list = await fetchLikeSummary(props.contentType, [props.targetId])
    if (list.length) {
      count.value = list[0].likeCount
      liked.value = list[0].liked
    }
  } catch (_) {}
})

async function handleClick() {
  if (isGuest()) {
    alert('请先登录后再点赞 ✨')
    return
  }
  if (loading.value) return
  loading.value = true
  try {
    const updated = await toggleLike(props.contentType, props.targetId)
    count.value = updated.likeCount
    liked.value = updated.liked
  } catch (_) {} finally {
    loading.value = false
  }
}
</script>

<style scoped>
.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  cursor: pointer;
  transition: all .2s;
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(255,255,255,.45);
}
.like-btn:hover:not(.loading) {
  border-color: rgba(245,184,208,.4);
  color: var(--pink);
  background: rgba(245,184,208,.06);
}
.like-btn.liked {
  border-color: rgba(245,184,208,.35);
  color: var(--pink);
  background: rgba(245,184,208,.08);
}
.like-btn.loading { opacity: 0.6; cursor: wait; }
.like-icon { font-size: 14px; line-height: 1; }
.like-count { font-size: 12px; }
</style>