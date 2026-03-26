<template>
  <div class="modal-overlay" :class="{ open: props.open }">
    <div class="modal-bg" @click="emit('close')"></div>
    <div class="modal-box">
      <div class="modal-top-line" style="background:linear-gradient(90deg,#3a4a6a,#6a3a5a);"></div>
      <div class="modal-inner">
        <button class="modal-close" @click="emit('close')">✕</button>
        <div class="modal-title" style="color:rgba(255,255,255,.7)">⚙ 管理员登录</div>
        <div class="modal-sub">输入管理员账号与密码</div>

        <div class="form-group">
          <label class="form-label">管理员账号</label>
          <input class="form-input" type="text" v-model="form.username" placeholder="admin" @keydown.enter="doLogin">
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input class="form-input" type="password" v-model="form.password" placeholder="输入管理员密码" @keydown.enter="doLogin">
        </div>

        <div class="form-error">{{ error }}</div>

        <button class="form-submit"
          style="background:linear-gradient(135deg,#3a4a6a,#6a3a5a)"
          :disabled="loading"
          @click="doLogin">
          {{ loading ? '登录中...' : '进入管理后台' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { login as apiLogin } from '@/api/auth.js'

const props = defineProps({ open: Boolean })
const emit  = defineEmits(['close', 'success'])

const form    = reactive({ username: '', password: '' })
const error   = ref('')
const loading = ref(false)

async function doLogin() {
  error.value = ''
  if (!form.username || !form.password) { error.value = '请填写账号和密码'; return }

  loading.value = true
  try {
    const info = await apiLogin(form.username, form.password)
    if (info.role !== 'admin' && info.role !== 'super_admin') {
      error.value = '该账号没有管理员权限'
      return
    }
    emit('success', info)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import './modal-shared.css';
</style>