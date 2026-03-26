<template>
  <div class="modal-overlay" :class="{ open: props.open }">
    <div class="modal-bg"></div>
    <div class="modal-box" ref="boxRef" style="max-width:500px">
      <div class="modal-top-line"></div>
      <div class="modal-inner">
        <button class="modal-close" @click="emit('close')">✕</button>
        <div class="modal-title">🌸 粉丝验证</div>
        <div class="modal-sub">{{ progressText }}</div>

        <!-- Progress dots -->
        <div class="quiz-dots">
          <div v-for="i in (questions.length || 5)" :key="i" class="qdot" :style="dotStyle(i-1)"></div>
        </div>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="quiz-loading">题目加载中...</div>

        <!-- Question body -->
        <template v-if="phase === 'quiz'">
          <div class="quiz-question" :key="currentIndex">{{ currentIndex + 1 }}. {{ currentQ.question }}</div>
          <div class="quiz-options">
            <button
              v-for="(opt, i) in currentQ.opts"
              :key="i"
              class="quiz-opt"
              :style="optStyle(i)"
              :disabled="answered"
              @click="answer(i)"
            >
              {{ ['A','B','C','D'][i] }}. {{ opt }}
            </button>
          </div>
        </template>

        <!-- Fail -->
        <div v-if="phase === 'fail'" class="result-panel">
          <span class="result-icon">💔</span>
          <div class="result-title" style="-webkit-text-fill-color:#ff8aaa;color:#ff8aaa">回答错误</div>
          <div class="result-sub">{{ failMsg }}</div>
          <div class="result-sub" style="margin-top:8px;font-size:11px;color:var(--t3)">即将为你重新出题...</div>
          <button class="form-submit" style="margin-top:18px;background:linear-gradient(135deg,#6a3a5a,#a85a8a)" @click="retry">
            立即重新验证
          </button>
        </div>

        <!-- Success：仅 5 题全部由后端校验通过后才显示 -->
        <div v-if="phase === 'success'" class="result-panel">
          <span class="result-icon">🎉</span>
          <div class="result-title">验证通过！</div>
          <div class="result-sub">欢迎加入橹穆宇宙，青梅果！</div>
          <div class="form-error">{{ registerError }}</div>
          <button class="form-submit" style="margin-top:20px" :disabled="completing" @click="completeRegister">
            {{ completing ? '注册中...' : '进入橹穆宇宙 ✦' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { register as apiRegister } from '@/api/auth.js'
import { fetchRandomQuiz, checkAnswer } from '@/api/quiz.js'

const props = defineProps({
  open: Boolean,
  regData: Object, // { username, password, email }
})
const emit = defineEmits(['close', 'success'])

const boxRef = ref(null)

// ── Quiz state ─────────────────────────────
// questions 来自后端，不含 correctOption 字段
const questions    = ref([])
const currentIndex = ref(0)
const answered     = ref(false)
const dotColors    = ref(Array(5).fill('idle')) // idle | current | checking | correct | wrong
const phase        = ref('loading')             // loading | quiz | fail | success
const failMsg      = ref('')
const registerError = ref('')
const completing   = ref(false)
const selectedOpt  = ref(null)   // 当前选中项（视觉高亮）

let retryTimer = null

const currentQ = computed(() => {
  const q = questions.value[currentIndex.value]
  if (!q) return { question: '', opts: [], id: null }
  return { ...q, opts: [q.optionA, q.optionB, q.optionC, q.optionD] }
})

const progressText = computed(() => {
  if (phase.value === 'loading')  return '加载题目中...'
  if (phase.value === 'success')  return '验证通过 🎉'
  if (phase.value === 'fail')     return '回答错误 💔'
  return `第 ${currentIndex.value + 1} 题 / 共 ${questions.value.length} 题`
})

function dotStyle(i) {
  const s    = dotColors.value[i]
  const base = 'width:8px;height:8px;border-radius:50%;transition:all .3s;'
  if (s === 'correct')  return base + 'background:#7de8b0;box-shadow:0 0 8px rgba(125,232,176,.6);'
  if (s === 'wrong')    return base + 'background:#ff8aaa;box-shadow:0 0 6px rgba(255,138,170,.6);'
  if (s === 'checking') return base + 'background:rgba(212,170,112,.6);animation:pulse .8s infinite;'
  if (s === 'current')  return base + 'background:var(--blue);box-shadow:0 0 6px var(--glow-blue);transform:scale(1.4);'
  return base + 'background:rgba(255,255,255,.15);'
}

function optStyle(i) {
  if (selectedOpt.value === i)
    return 'background:rgba(168,212,245,.18);border-color:rgba(168,212,245,.6);color:#a8d4f5;'
  return ''
}

async function startQuiz() {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }

  phase.value         = 'loading'
  failMsg.value       = ''
  registerError.value = ''

  try {
    questions.value = await fetchRandomQuiz(5)
  } catch (e) {
    failMsg.value = '题目加载失败，请关闭后重试'
    phase.value   = 'fail'
    return
  }

  currentIndex.value = 0
  answered.value     = false
  selectedOpt.value  = null
  dotColors.value    = Array(questions.value.length).fill('idle')
  dotColors.value[0] = 'current'
  phase.value        = 'quiz'
}

/**
 * 用户点击选项后：
 * 1. 立即锁定按钮（answered=true），高亮选中项
 * 2. 调 POST /api/quiz/check 逐题校验
 * 3. correct=false → 立即停止，进入 fail，2 秒后自动重出题
 * 4. correct=true  → 500ms 后进入下一题（或 success）
 */
async function answer(choice) {
  if (answered.value || phase.value !== 'quiz') return

  answered.value    = true
  selectedOpt.value = choice
  dotColors.value[currentIndex.value] = 'checking'

  try {
    const result = await checkAnswer(currentQ.value.id, choice)

    if (!result.correct) {
      // ── 答错：立即停止，不进入下一题 ──────────────────
      dotColors.value[currentIndex.value] = 'wrong'
      shake()
      selectedOpt.value = null
      failMsg.value = '回答错误，请重新验证'
      phase.value   = 'fail'
      // 2 秒后自动拉取新题，中间不允许任何操作
      retryTimer = setTimeout(() => startQuiz(), 2000)
    } else {
      // ── 答对：短暂显示正确状态，再推进 ──────────────────
      dotColors.value[currentIndex.value] = 'correct'
      setTimeout(() => {
        selectedOpt.value = null
        currentIndex.value++
        if (currentIndex.value >= questions.value.length) {
          // 5 题全部由后端校验通过 → 才允许进入 success
          phase.value = 'success'
        } else {
          dotColors.value[currentIndex.value] = 'current'
          answered.value = false
        }
      }, 500)
    }
  } catch (e) {
    // 网络异常等同于答错，立即停止
    dotColors.value[currentIndex.value] = 'wrong'
    selectedOpt.value = null
    failMsg.value = '网络异常，请重新验证'
    phase.value   = 'fail'
    retryTimer = setTimeout(() => startQuiz(), 2000)
  }
}

function retry() {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  startQuiz()
}

async function completeRegister() {
  // 硬性守卫：必须是 success phase
  if (phase.value !== 'success') return
  if (!props.regData) return

  completing.value    = true
  registerError.value = ''
  try {
    const info = await apiRegister(
      props.regData.username,
      props.regData.password,
      props.regData.email,
    )
    emit('success', info)
  } catch (e) {
    registerError.value = e.message
  } finally {
    completing.value = false
  }
}

function shake() {
  if (!boxRef.value) return
  boxRef.value.style.animation = 'none'
  void boxRef.value.offsetHeight
  boxRef.value.style.animation = 'shake .4s ease'
}

watch(() => props.open, (v) => {
  if (v) {
    startQuiz()
  } else {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  }
})
</script>

<style scoped>
@import './modal-shared.css';

.quiz-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}

.quiz-loading {
  text-align: center;
  color: var(--t3);
  font-size: 12px;
  letter-spacing: 2px;
  padding: 30px 0;
}

.quiz-question {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  letter-spacing: 1px;
  line-height: 1.8;
  margin-bottom: 20px;
  min-height: 60px;
  color: var(--text-light);
  animation: fade-in .4s ease both;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-opt {
  padding: 12px 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;
  color: rgba(255,255,255,.8);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  text-align: left;
  transition: all .25s;
}
.quiz-opt:hover:not(:disabled) {
  background: rgba(168,212,245,.12);
  border-color: rgba(168,212,245,.4);
}
.quiz-opt:disabled { cursor: default; }
</style>