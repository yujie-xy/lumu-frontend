<template>
  <div class="main-view">
    <!-- 背景 -->
    <div class="bg-cosmos-main"></div>

    <!-- 导航栏 -->
    <TopNavBar :currentPage="currentPage" @navigate="navigate" @logout="logout" />

    <!-- 内容区 -->
    <div class="main-content">
      <HomePage     v-if="currentPage === 'home'"     @navigate="navigate" />
      <StoryPage    v-else-if="currentPage === 'story'"    />
      <TimelinePage v-else-if="currentPage === 'timeline'" />
      <NoticePage   v-else-if="currentPage === 'events'"   />
      <PhotoPage       v-else-if="currentPage === 'photos'"   />
      <VideoPage       v-else-if="currentPage === 'videos'"   />
      <WorldPage       v-else-if="currentPage === 'world'"    />
      <MessagesPage    v-else-if="currentPage === 'messages'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'

import TopNavBar       from '@/components/layout/TopNavBar.vue'
import HomePage        from '@/components/pages/HomePage.vue'
import StoryPage       from '@/components/pages/StoryPage.vue'
import TimelinePage    from '@/components/pages/TimelinePage.vue'
import NoticePage      from '@/components/pages/NoticePage.vue'
import MessagesPage    from '@/components/pages/MessagesPage.vue'
import PhotoPage       from '@/components/pages/PhotoPage.vue'
import VideoPage       from '@/components/pages/VideoPage.vue'
import PlaceholderPage from '@/components/pages/PlaceholderPage.vue'
import WorldPage       from '@/components/pages/WorldPage.vue'

const router = useRouter()
const { clearUser } = useAuth()

const currentPage = ref('home')

function navigate(page) {
  currentPage.value = page
}

function logout() {
  clearUser()
  router.push('/')
}
</script>

<style scoped>
.main-view {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.bg-cosmos-main {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 110% 55% at 50% 0%, #1a0d3a 0%, transparent 55%),
    linear-gradient(180deg, #0d0818 0%, #100a20 100%);
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 1;
  margin-top: 56px; /* nav height */
  height: calc(100vh - 56px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>