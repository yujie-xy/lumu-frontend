import { ref, computed } from 'vue'
import { fetchNotices } from '@/api/content.js'

// ── Module-level singleton state ─────────────────────────────
// All components share the same notices list and read-set.
const STORAGE_KEY = 'lumu_notices_read'

const notices = ref([])
const readIds = ref(new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')))

function saveReadIds() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds.value]))
}

// ── Public composable ─────────────────────────────────────────
export function useNoticeRead() {
  const unreadCount = computed(() =>
    notices.value.filter(n => !readIds.value.has(n.id)).length
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  // Fetch from server and update the shared notices ref.
  // Throws on error — callers decide how to handle it.
  async function loadNotices() {
    notices.value = await fetchNotices()
  }

  // Mark every currently-loaded notice as read and persist to localStorage.
  function markAllRead() {
    notices.value.forEach(n => readIds.value.add(n.id))
    saveReadIds()
  }

  return { notices, readIds, unreadCount, hasUnread, loadNotices, markAllRead }
}