<template>
  <div class="user-admin">

    <!-- 新建管理员（仅 super_admin） -->
    <div v-if="isSuperAdmin()" class="create-bar">
      <h3 class="create-title">新 建 管 理 员</h3>
      <div class="create-form">
        <input v-model="newUser.username" class="ua-input" placeholder="用户名" maxlength="32" />
        <input v-model="newUser.password" class="ua-input" type="password" placeholder="密码（至少6位）" />
        <button class="btn-create" @click="handleCreate" :disabled="creating">
          {{ creating ? '创建中...' : '+ 创建' }}
        </button>
      </div>
      <p v-if="createError" class="ua-error">{{ createError }}</p>
    </div>

    <!-- 用户列表 -->
    <div v-if="loading" class="admin-loading">加载中...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <div v-else class="user-table-wrap">
      <div class="admin-count">共 {{ users.length }} 个用户</div>
      <table class="user-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th class="col-name">用户名</th>
            <th class="col-role">角色</th>
            <th class="col-status">状态</th>
            <th class="col-time">注册时间</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="user-row" :class="{ self: u.username === state.user?.username }">
            <td class="col-id">{{ u.id }}</td>
            <td class="col-name">
              {{ u.username }}
              <span v-if="u.username === state.user?.username" class="self-tag">我</span>
            </td>
            <td class="col-role">
              <span class="role-badge" :class="u.role">{{ roleLabel(u.role) }}</span>
            </td>
            <td class="col-status">
              <span class="status-dot" :class="u.status === 1 ? 'active' : 'banned'">
                {{ u.status === 1 ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="col-time">{{ formatTime(u.createdAt) }}</td>
            <td class="col-action">
              <!-- 禁/启用：admin 只能操作 fan；super_admin 可操作 fan+admin，不能操作 super_admin 和自身 -->
              <button
                v-if="canToggleStatus(u)"
                class="btn-action"
                :class="u.status === 1 ? 'btn-ban' : 'btn-unban'"
                @click="handleToggleStatus(u)"
              >{{ u.status === 1 ? '禁用' : '启用' }}</button>

              <!-- 角色切换：仅 super_admin，不能操作 super_admin 和自身 -->
              <button
                v-if="isSuperAdmin() && u.role !== 'super_admin' && u.username !== state.user?.username"
                class="btn-action btn-role"
                @click="handleToggleRole(u)"
              >{{ u.role === 'admin' ? '降为粉丝' : '升为管理' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { fetchUsers, toggleUserStatus, toggleUserRole, createAdmin } from '@/api/userAdmin.js'

const { state, isSuperAdmin, isAdmin } = useAuth()

const users   = ref([])
const loading = ref(false)
const error   = ref('')

const newUser     = reactive({ username: '', password: '' })
const creating    = ref(false)
const createError = ref('')

onMounted(load)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    users.value = await fetchUsers()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function canToggleStatus(u) {
  if (u.username === state.user?.username) return false
  if (u.role === 'super_admin') return false
  if (!isSuperAdmin() && u.role !== 'fan') return false
  return true
}

async function handleToggleStatus(u) {
  const action = u.status === 1 ? '禁用' : '启用'
  if (!confirm(`确认${action}用户 "${u.username}"？`)) return
  try {
    const updated = await toggleUserStatus(u.id)
    const idx = users.value.findIndex(x => x.id === u.id)
    if (idx !== -1) users.value[idx] = updated
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

async function handleToggleRole(u) {
  const to = u.role === 'admin' ? '粉丝' : '管理员'
  if (!confirm(`确认将 "${u.username}" 切换为${to}？`)) return
  try {
    const updated = await toggleUserRole(u.id)
    const idx = users.value.findIndex(x => x.id === u.id)
    if (idx !== -1) users.value[idx] = updated
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

async function handleCreate() {
  createError.value = ''
  if (!newUser.username.trim()) { createError.value = '请输入用户名'; return }
  if (newUser.password.length < 6) { createError.value = '密码至少6位'; return }
  creating.value = true
  try {
    const created = await createAdmin({ username: newUser.username.trim(), password: newUser.password })
    users.value.unshift(created)
    newUser.username = ''
    newUser.password = ''
  } catch (e) {
    createError.value = e.message
  } finally {
    creating.value = false
  }
}

function roleLabel(role) {
  if (role === 'super_admin') return '总管理员'
  if (role === 'admin')       return '管理员'
  return '粉丝'
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
.user-admin {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 创建区 ── */
.create-bar {
  padding: 18px 20px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(212,170,112,.15);
  border-radius: 12px;
}
.create-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 13px;
  letter-spacing: 4px;
  color: var(--gold);
  margin: 0 0 14px;
}
.create-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
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
  min-width: 160px;
}
.ua-input:focus { border-color: rgba(212,170,112,.4); }
.ua-input::placeholder { color: rgba(255,255,255,.2); }

.btn-create {
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
.btn-create:hover:not(:disabled) { background: rgba(212,170,112,.16); }
.btn-create:disabled { opacity: .5; cursor: not-allowed; }

.ua-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #ff8aaa;
  letter-spacing: 1px;
}

/* ── 列表 ── */
.admin-count { font-size: 11px; color: rgba(255,255,255,.3); letter-spacing: 2px; margin-bottom: 10px; }
.admin-loading, .admin-error { font-size: 13px; color: rgba(255,255,255,.3); text-align: center; padding: 40px 0; letter-spacing: 2px; }
.admin-error { color: #ff8aaa; }

.user-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.user-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.3);
  border-bottom: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.02);
  white-space: nowrap;
}

.user-row td {
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  color: rgba(255,255,255,.7);
  vertical-align: middle;
}
.user-row:last-child td { border-bottom: none; }
.user-row:hover td { background: rgba(255,255,255,.02); }
.user-row.self td { background: rgba(212,170,112,.03); }

.col-id     { width: 60px; color: rgba(255,255,255,.3) !important; }
.col-name   { width: 140px; }
.col-role   { width: 100px; }
.col-status { width: 80px; }
.col-time   { width: 140px; white-space: nowrap; color: rgba(255,255,255,.35) !important; font-size: 11px; }
.col-action { min-width: 140px; }

.self-tag {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(212,170,112,.15);
  color: var(--gold);
  letter-spacing: 1px;
}

.role-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 8px;
  font-size: 10px;
  letter-spacing: 1px;
}
.role-badge.super_admin { background: rgba(212,170,112,.18); color: var(--gold); }
.role-badge.admin       { background: rgba(168,212,245,.12); color: var(--blue); }
.role-badge.fan         { background: rgba(245,184,208,.10); color: var(--pink); }

.status-dot {
  font-size: 11px;
  letter-spacing: 1px;
}
.status-dot.active { color: rgba(150,240,180,.8); }
.status-dot.banned { color: rgba(255,120,120,.7); }

.btn-action {
  padding: 3px 11px;
  border-radius: 6px;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
  margin-right: 6px;
}
.btn-ban {
  border: 1px solid rgba(255,77,109,.3);
  background: transparent;
  color: rgba(255,77,109,.6);
}
.btn-ban:hover { border-color: #ff4d6d; color: #ff4d6d; background: rgba(255,77,109,.06); }

.btn-unban {
  border: 1px solid rgba(150,240,180,.3);
  background: transparent;
  color: rgba(150,240,180,.7);
}
.btn-unban:hover { border-color: rgba(150,240,180,.7); color: rgba(150,240,180,1); }

.btn-role {
  border: 1px solid rgba(212,170,112,.3);
  background: transparent;
  color: rgba(212,170,112,.6);
}
.btn-role:hover { border-color: var(--gold); color: var(--gold); background: rgba(212,170,112,.06); }
</style>