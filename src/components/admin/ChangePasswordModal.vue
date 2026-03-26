<template>
  <Teleport to="body">
    <div class="cp-overlay" @click.self="$emit('close')">
      <div class="cp-modal">
        <div class="cp-header">
          <span class="cp-title">修 改 密 码</span>
          <button class="cp-close" @click="$emit('close')">✕</button>
        </div>

        <div class="cp-body">
          <div class="cp-field">
            <label class="cp-label">当前密码</label>
            <input
              v-model="form.oldPassword"
              type="password"
              class="cp-input"
              placeholder="输入当前密码"
              autocomplete="current-password"
            />
          </div>
          <div class="cp-field">
            <label class="cp-label">新密码</label>
            <input
              v-model="form.newPassword"
              type="password"
              class="cp-input"
              placeholder="至少 6 位"
              autocomplete="new-password"
            />
          </div>
          <div class="cp-field">
            <label class="cp-label">确认新密码</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              class="cp-input"
              placeholder="再次输入新密码"
              autocomplete="new-password"
              @keyup.enter="submit"
            />
          </div>

          <p v-if="error"   class="cp-error">{{ error }}</p>
          <p v-if="success" class="cp-success">密码已更新</p>
        </div>

        <div class="cp-footer">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn-confirm" @click="submit" :disabled="loading">
            {{ loading ? '提交中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { changeMyPassword } from '@/api/userAdmin.js'

defineEmits(['close'])

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)
const error   = ref('')
const success = ref(false)

async function submit() {
  error.value   = ''
  success.value = false

  if (!form.oldPassword)                       { error.value = '请输入当前密码'; return }
  if (form.newPassword.length < 6)             { error.value = '新密码至少 6 位'; return }
  if (form.newPassword !== form.confirmPassword) { error.value = '两次输入的新密码不一致'; return }

  loading.value = true
  try {
    await changeMyPassword({
      oldPassword:     form.oldPassword,
      newPassword:     form.newPassword,
      confirmPassword: form.confirmPassword,
    })
    success.value = true
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cp-modal {
  width: 360px;
  background: #12091e;
  border: 1px solid rgba(212, 170, 112, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
}

.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.cp-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 14px;
  letter-spacing: 4px;
  color: var(--gold);
}
.cp-close {
  background: none;
  border: none;
  color: rgba(255,255,255,.3);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color .2s;
}
.cp-close:hover { color: rgba(255,255,255,.7); }

.cp-body {
  padding: 20px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cp-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.cp-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.35);
}
.cp-input {
  height: 36px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  padding: 0 12px;
  color: rgba(255,255,255,.85);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color .2s;
}
.cp-input:focus { border-color: rgba(212,170,112,.4); }
.cp-input::placeholder { color: rgba(255,255,255,.2); }

.cp-error   { font-size: 12px; color: #ff8aaa; letter-spacing: 1px; margin: 0; }
.cp-success { font-size: 12px; color: rgba(150,240,180,.85); letter-spacing: 1px; margin: 0; }

.cp-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px 20px;
}
.btn-cancel {
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  color: rgba(255,255,255,.4);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
}
.btn-cancel:hover { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.6); }

.btn-confirm {
  height: 34px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid rgba(212,170,112,.4);
  background: rgba(212,170,112,.08);
  color: var(--gold);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all .2s;
}
.btn-confirm:hover:not(:disabled) { background: rgba(212,170,112,.16); border-color: var(--gold); }
.btn-confirm:disabled { opacity: .5; cursor: not-allowed; }
</style>