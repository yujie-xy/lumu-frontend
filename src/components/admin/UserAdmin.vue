<template>
  <div class="user-admin">

    <!-- 用户治理（通过 UUID 操作） -->
    <div class="section-card">
      <div class="section-head">
        <div class="section-label">🛡 用户治理</div>
      </div>

      <div class="gov-form">
        <div class="fg">
          <label class="fl">用户 UUID</label>
          <input class="ua-input" v-model="gov.userUuid" placeholder="输入目标用户的 UUID" />
        </div>

        <div class="fg">
          <label class="fl">操作</label>
          <div class="gov-actions">
            <button class="btn-action btn-ban"   @click="doBan(true)">封禁</button>
            <button class="btn-action btn-unban" @click="doBan(false)">解封</button>
            <button class="btn-action btn-mute"  @click="doMute(true)">禁言</button>
            <button class="btn-action btn-unban" @click="doMute(false)">解禁言</button>
          </div>
        </div>

        <div class="fg" v-if="isSuperAdmin()">
          <label class="fl">重置密码</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input class="ua-input" v-model="gov.newPassword" type="password" placeholder="新密码（至少6位）" />
            <button class="btn-action btn-role" @click="doResetPassword">重置密码</button>
          </div>
        </div>

        <div class="fg" v-if="isSuperAdmin()">
          <label class="fl">重置用户名</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input class="ua-input" v-model="gov.newUsername" placeholder="新用户名" />
            <button class="btn-action btn-role" @click="doResetUsername">重置用户名</button>
          </div>
        </div>

        <p v-if="gov.msg" :class="gov.isErr ? 'ua-error' : 'ua-ok'">{{ gov.msg }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { banUser, muteUser, adminResetPassword, adminResetUsername } from '@/api/userAdmin.js'

const { isSuperAdmin } = useAuth()

const gov = reactive({
  userUuid:    '',
  newPassword: '',
  newUsername: '',
  msg:         '',
  isErr:       false,
})

function setMsg(msg, isErr = false) {
  gov.msg   = msg
  gov.isErr = isErr
  setTimeout(() => { gov.msg = '' }, 3000)
}

function requireUuid() {
  if (!gov.userUuid.trim()) { setMsg('请填写目标用户 UUID', true); return false }
  return true
}

async function doBan(banned) {
  if (!requireUuid()) return
  try {
    await banUser(gov.userUuid.trim(), banned)
    setMsg(banned ? '已封禁用户' : '已解封用户')
  } catch (e) {
    setMsg(e.message, true)
  }
}

async function doMute(muted) {
  if (!requireUuid()) return
  try {
    await muteUser(gov.userUuid.trim(), muted)
    setMsg(muted ? '已禁言用户' : '已解除禁言')
  } catch (e) {
    setMsg(e.message, true)
  }
}

async function doResetPassword() {
  if (!requireUuid()) return
  if (gov.newPassword.length < 6) { setMsg('密码至少6位', true); return }
  try {
    await adminResetPassword(gov.userUuid.trim(), gov.newPassword)
    setMsg('密码已重置'); gov.newPassword = ''
  } catch (e) {
    setMsg(e.message, true)
  }
}

async function doResetUsername() {
  if (!requireUuid()) return
  if (!gov.newUsername.trim()) { setMsg('请填写新用户名', true); return }
  try {
    await adminResetUsername(gov.userUuid.trim(), gov.newUsername.trim())
    setMsg('用户名已重置'); gov.newUsername = ''
  } catch (e) {
    setMsg(e.message, true)
  }
}
</script>

<style scoped>
.user-admin { display: flex; flex-direction: column; gap: 20px; }

.section-card {
  padding: 18px 20px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(212,170,112,.15);
  border-radius: 12px;
}
.section-head { margin-bottom: 16px; }
.section-label {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 13px;
  letter-spacing: 4px;
  color: var(--gold);
}

.gov-form { display: flex; flex-direction: column; gap: 14px; }
.fg { display: flex; flex-direction: column; gap: 6px; }
.fl { font-size: 11px; color: rgba(255,255,255,.3); letter-spacing: 2px; }

.ua-input {
  height: 34px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  padding: 0 12px;
  color: rgba(255,255,255,.8);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  outline: none;
  transition: border-color .2s;
  min-width: 200px;
  max-width: 340px;
}
.ua-input:focus { border-color: rgba(212,170,112,.4); }
.ua-input::placeholder { color: rgba(255,255,255,.2); }

.gov-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-action {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.btn-ban   { border: 1px solid rgba(255,77,109,.3); background: transparent; color: rgba(255,77,109,.7); }
.btn-ban:hover { border-color: #ff4d6d; color: #ff4d6d; background: rgba(255,77,109,.06); }
.btn-unban { border: 1px solid rgba(150,240,180,.3); background: transparent; color: rgba(150,240,180,.7); }
.btn-unban:hover { border-color: rgba(150,240,180,.7); color: rgba(150,240,180,1); }
.btn-mute  { border: 1px solid rgba(245,184,208,.3); background: transparent; color: rgba(245,184,208,.7); }
.btn-mute:hover { border-color: var(--pink); color: var(--pink); background: rgba(245,184,208,.06); }
.btn-role  { border: 1px solid rgba(212,170,112,.3); background: transparent; color: rgba(212,170,112,.6); }
.btn-role:hover { border-color: var(--gold); color: var(--gold); background: rgba(212,170,112,.06); }

.ua-error { font-size: 12px; color: #ff8aaa; letter-spacing: 1px; margin: 0; }
.ua-ok    { font-size: 12px; color: rgba(150,240,180,.8); letter-spacing: 1px; margin: 0; }
</style>