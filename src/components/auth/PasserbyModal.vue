<template>
  <div class="modal-overlay" :class="{ open: props.open }">
    <div class="modal-bg" @click="emit('close')"></div>
    <div class="modal-box" style="max-width:380px;">
      <div class="modal-top-line" style="background:linear-gradient(90deg,var(--blue-deep),rgba(168,212,245,0.6));"></div>
      <div class="modal-inner" style="text-align:center;">
        <button class="modal-close" @click="emit('close')">✕</button>
        <div style="font-size:48px;margin-bottom:14px;">🌙</div>
        <div class="modal-title" style="font-size:22px;letter-spacing:5px;margin-bottom:8px;">路人进入</div>
        <div class="modal-sub" style="line-height:1.9;margin-bottom:20px;">
          你将以 <span style="color:var(--blue);">路人</span> 身份浏览橹穆宇宙<br>
          部分功能将不可使用<br>
          <span style="font-size:11px;opacity:.5;">（无法评论 · 无法发帖 · 无法私信）</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="form-submit" style="background:linear-gradient(135deg,#5a9fd4,#a8d4f5);" @click="confirm">
            🌙 确认以路人身份进入
          </button>
          <button @click="emit('go-fan')"
            style="padding:12px;border-radius:50px;border:1px solid rgba(245,184,208,0.4);
            background:transparent;color:var(--pink);font-family:'Noto Sans SC',sans-serif;
            font-size:12px;letter-spacing:3px;cursor:pointer;transition:all .3s;">
            🌸 还是登录/注册吧
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ open: Boolean })
const emit  = defineEmits(['close', 'go-fan', 'confirm'])

function confirm() {
  emit('confirm')
}
</script>

<style scoped>
@import './modal-shared.css';
</style>