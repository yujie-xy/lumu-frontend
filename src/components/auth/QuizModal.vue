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
          <div v-for="i in totalCount" :key="i" class="qdot" :style="dotStyle(i-1)"></div>
        </div>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="quiz-loading">题目加载中...</div>

        <!-- Question body -->
        <template v-if="phase === 'quiz'">
          <div class="quiz-question" :key="currentIndex">{{ currentIndex + 1 }}. {{ currentQ.stem }}</div>
          <textarea
            class="quiz-answer-input"
            v-model="answers[currentIndex]"
            placeholder="请输入你的答案..."
            rows="3"
          ></textarea>
          <button
            class="form-submit"
            style="margin-top:16px"
            :disabled="!answers[currentIndex]?.trim()"
            @click="nextQuestion"
          >
            {{ currentIndex + 1 < totalCount ? '下一题 →' : '提交验证 ✦' }}
          </button>
        </template>

        <!-- Fail -->
        <div v-if="phase === 'fail'" class="result-panel">
          <span class="result-icon">💔</span>
          <div class="result-title" style="-webkit-text-fill-color:#ff8aaa;color:#ff8aaa">验证失败</div>
          <div class="result-sub">{{ failMsg }}</div>
          <button class="form-submit" style="margin-top:18px;background:linear-gradient(135deg,#6a3a5a,#a85a8a)" @click="retry">
            重新验证
          </button>
        </div>

        <!-- Success -->
        <div v-if="phase === 'success'" class="result-panel">
          <span class="result-icon">🎉</span>
          <div class="result-title">验证通过！</div>
          <div class="result-sub">欢迎加入橹穆宇宙，青梅果！</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { startQuizRegistration, submitQuizRegistration } from '@/api/auth.js'

const props = defineProps({
  open:    Boolean,
  regData: Object, // { username, password, weiboName }
})
const emit = defineEmits(['close', 'success'])

const boxRef = ref(null)

// ── Quiz state ─────────────────────────────
const questions    = ref([])
const answers      = ref([])   // string[] — one answer per question
const currentIndex = ref(0)
const dotColors    = ref([])
const phase        = ref('loading') // loading | quiz | fail | success
const failMsg      = ref('')

const totalCount = computed(() => questions.value.length || 5)

const currentQ = computed(() => questions.value[currentIndex.value] || { stem: '' })

function resolveQuestionId(question) {
  if (!question || typeof question !== 'object') return null
  return question.questionId ?? question.id ?? null
}

const progressText = computed(() => {
  if (phase.value === 'loading')  return '加载题目中...'
  if (phase.value === 'success')  return '验证通过 🎉'
  if (phase.value === 'fail')     return '验证失败 💔'
  return `第 ${currentIndex.value + 1} 题 / 共 ${questions.value.length} 题`
})

function dotStyle(i) {
  const s    = dotColors.value[i] || 'idle'
  const base = 'width:8px;height:8px;border-radius:50%;transition:all .3s;'
  if (s === 'done')    return base + 'background:#7de8b0;box-shadow:0 0 8px rgba(125,232,176,.6);'
  if (s === 'current') return base + 'background:var(--blue);box-shadow:0 0 6px var(--glow-blue);transform:scale(1.4);'
  return base + 'background:rgba(255,255,255,.15);'
}

async function startQuiz() {
  phase.value   = 'loading'
  failMsg.value = ''

  try {
    questions.value = await startQuizRegistration()
  } catch (e) {
    failMsg.value = e.message || '题目加载失败，请关闭后重试'
    phase.value   = 'fail'
    return
  }

  currentIndex.value = 0
  answers.value      = Array(questions.value.length).fill('')
  dotColors.value    = Array(questions.value.length).fill('idle')
  dotColors.value[0] = 'current'
  phase.value        = 'quiz'
}

function nextQuestion() {
  if (!answers.value[currentIndex.value]?.trim()) return

  dotColors.value[currentIndex.value] = 'done'
  currentIndex.value++

  if (currentIndex.value >= questions.value.length) {
    submitAll()
  } else {
    dotColors.value[currentIndex.value] = 'current'
  }
}

async function submitAll() {
  if (!props.regData) return
  phase.value = 'loading'

  const payload = questions.value.map((q, i) => ({
    questionId: resolveQuestionId(q),
    answer:     answers.value[i]?.trim() || '',
  })).filter((item) => item.questionId != null)

  try {
    const info = await submitQuizRegistration(
      props.regData.username,
      props.regData.password,
      props.regData.weiboName,
      payload,
    )
    phase.value = 'success'
    emit('success', info)
  } catch (e) {
    failMsg.value = e.message || '验证失败，请重试'
    phase.value   = 'fail'
    shake()
  }
}

function retry() {
  startQuiz()
}

function shake() {
  if (!boxRef.value) return
  boxRef.value.style.animation = 'none'
  void boxRef.value.offsetHeight
  boxRef.value.style.animation = 'shake .4s ease'
}

watch(() => props.open, (v) => {
  if (v) startQuiz()
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
  margin-bottom: 16px;
  min-height: 60px;
  color: var(--text-light);
  animation: fade-in .4s ease both;
}

.quiz-answer-input {
  width: 100%;
  padding: 12px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;
  color: rgba(255,255,255,.9);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px;
  letter-spacing: 1px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color .2s;
}
.quiz-answer-input:focus {
  border-color: rgba(168,212,245,.4);
}
.quiz-answer-input::placeholder {
  color: rgba(255,255,255,.2);
}
</style>
