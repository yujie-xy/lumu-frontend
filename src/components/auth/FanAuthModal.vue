<template>
  <div class="modal-overlay" :class="{ open: props.open }">
    <div class="modal-bg" @click="emit('close')"></div>
    <div class="modal-box" ref="boxRef">
      <div class="modal-top-line"></div>
      <div class="modal-inner">
        <button class="modal-close" @click="emit('close')">✕</button>
        <div class="modal-title">🌸 青梅果入口</div>
        <div class="modal-sub">欢迎回家 · 新人需要注册验证</div>

        <!-- Tabs -->
        <div class="modal-tabs">
          <button class="m-tab" :class="{ active: tab === 'login' }" @click="tab = 'login'">已有账号</button>
          <button class="m-tab" :class="{ active: tab === 'register' }" @click="tab = 'register'">新人注册</button>
        </div>

        <!-- Login Form -->
        <div v-if="tab === 'login'">
          <div class="form-group">
            <label class="form-label">账号</label>
            <input class="form-input" type="text" v-model="login.username"
              placeholder="输入用户名或邮箱" @keydown.enter="doLogin">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input class="form-input" type="password" v-model="login.password"
              placeholder="输入密码" @keydown.enter="doLogin">
          </div>
          <div class="form-error">{{ login.error }}</div>
          <button class="form-submit" :disabled="login.loading" @click="doLogin">
            {{ login.loading ? '登录中...' : '进入橹穆宇宙 ✦' }}
          </button>
          <div class="form-note">
            还没有账号？<a @click="tab = 'register'">去注册</a>
          </div>
        </div>

        <!-- Register Form -->
        <div v-if="tab === 'register'">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input class="form-input" type="text" v-model="reg.username" placeholder="起一个可爱的名字">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input class="form-input" type="password" v-model="reg.password" placeholder="设置密码（至少6位）">
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input class="form-input" type="email" v-model="reg.email" placeholder="可选，用于找回账号">
          </div>
          <div class="form-error">{{ reg.error }}</div>
          <button class="form-submit" :disabled="reg.loading" @click="goToQuiz">
            {{ reg.loading ? '检查中...' : '下一步：验证身份 ✦' }}
          </button>
          <div class="form-note">注册需通过随机5题粉丝验证<br>只有真正了解橹穆的人才能加入 💙</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { login as apiLogin, checkUsername } from '@/api/auth.js'

const props = defineProps({ open: Boolean })
const emit  = defineEmits(['close', 'success', 'go-quiz'])

const tab   = ref('login')
const boxRef = ref(null)

// ── Login state ────────────────────────────
const login = reactive({ username: '', password: '', error: '', loading: false })

async function doLogin() {
  login.error = ''
  if (!login.username || !login.password) { shake(); login.error = '请填写账号和密码'; return }

  login.loading = true
  try {
    const info = await apiLogin(login.username, login.password)
    emit('success', info)
  } catch (e) {
    login.error = e.message
    shake()
  } finally {
    login.loading = false
  }
}

// ── Register / pre-quiz state ──────────────
const reg = reactive({ username: '', password: '', email: '', error: '', loading: false })

async function goToQuiz() {
  reg.error = ''
  if (!reg.username)          { shake(); reg.error = '请输入用户名'; return }
  if (reg.username.length < 2){ shake(); reg.error = '用户名至少2个字符'; return }
  if (reg.password.length < 6){ shake(); reg.error = '密码至少6位'; return }

  reg.loading = true
  try {
    await checkUsername(reg.username, reg.password, reg.email)
  } catch (e) {
    reg.error = e.message
    shake()
    return
  } finally {
    reg.loading = false
  }

  // Precheck passed → hand off to QuizModal
  emit('go-quiz', {
    username: reg.username,
    password: reg.password,
    email: reg.email,
  })
}

// ── Shake helper ───────────────────────────
function shake() {
  if (!boxRef.value) return
  boxRef.value.style.animation = 'none'
  void boxRef.value.offsetHeight
  boxRef.value.style.animation = 'shake .4s ease'
}

// Reset forms when modal closes
watch(() => props.open, (v) => {
  if (!v) {
    login.username = ''; login.password = ''; login.error = ''
    reg.username = ''; reg.password = ''; reg.email = ''; reg.error = ''
    tab.value = 'login'
  }
})
</script>

<style scoped>
@import './modal-shared.css';
</style>