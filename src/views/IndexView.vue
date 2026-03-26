<template>
  <!-- ── Loading screen ───────────────────────── -->
  <div id="loading-screen" :class="{ hide: loaded }">
    <div class="loading-logo">橹穆宇宙</div>
    <div class="loading-bar-wrap"><div class="loading-bar"></div></div>
    <div class="loading-text">正在进入星域...</div>
  </div>

  <!-- ── Animated background ───────────────────── -->
  <CosmosBackground />

  <!-- ── Main page ─────────────────────────────── -->
  <div class="page-wrap">

    <!-- HEADER -->
    <header class="site-header">
      <div class="header-eyebrow">
        <span class="eyebrow-line"></span>
        LUMU KINGDOM · OFFICIAL FAN COMMUNITY
        <span class="eyebrow-line r"></span>
      </div>

      <div class="site-logo">
        <div class="logo-glow-ring"></div>
        <span class="logo-text">橹穆宇宙</span>
      </div>

      <div class="site-tagline">王橹杰 × 穆祉丞 的专属宇宙</div>

      <div class="cp-names">
        <span class="cp-name blue-n">王橹杰</span>
        <span class="cp-dot"></span>
        <span class="cp-heart">💜</span>
        <span class="cp-dot"></span>
        <span class="cp-name pink-n">穆祉丞</span>
      </div>

      <div class="divider">
        <div class="div-line"></div>
        <div class="div-symbol">✦ 请选择你的身份 ✦</div>
        <div class="div-line"></div>
      </div>
    </header>

    <!-- CHOICE CARDS -->
    <div class="choice-section">

      <!-- 路人 card -->
      <a class="choice-card card-passerby" href="#" @click.prevent="showPasserby = true">
        <div class="card-bg-shape" style="width:200px;height:200px;background:radial-gradient(circle,rgba(168,212,245,0.08),transparent);top:-60px;right:-60px;border-radius:50%;"></div>
        <div class="card-sparkle" style="top:14%;left:18%;--d:2.2s;--dl:0s">✦</div>
        <div class="card-sparkle" style="top:20%;right:20%;--d:1.8s;--dl:.4s">✧</div>
        <div class="card-sparkle" style="bottom:25%;left:25%;--d:2.5s;--dl:.8s">⭑</div>
        <div class="card-glow"></div>
        <div class="card-glass">
          <div class="card-icon-wrap">
            <div class="card-icon-ring"></div>
            <div class="card-icon-ring-inner"></div>
            <div class="card-icon-circle">🌙</div>
          </div>
          <div class="card-label">PASSERBY · 路人</div>
          <div class="card-title">路过的人</div>
          <div class="card-subtitle">
            无需登录，悄悄看看<br>
            这片为他们留下的角落
          </div>
          <ul class="card-perks">
            <li class="perk-item"><span class="perk-dot"></span>浏览时间线与大事件</li>
            <li class="perk-item"><span class="perk-dot"></span>翻阅故事线章节</li>
            <li class="perk-item"><span class="perk-dot"></span>欣赏照片合集</li>
            <li class="perk-item"><span class="perk-dot"></span>点赞（不可评论）</li>
            <li class="perk-item locked"><span class="perk-dot"></span>发言 · 评论 · 私信</li>
            <li class="perk-item locked"><span class="perk-dot"></span>橹穆世界完整内容</li>
          </ul>
          <button class="card-btn">以路人身份进入 →</button>
        </div>
      </a>

      <!-- 青梅果 card -->
      <a class="choice-card card-fan" href="#" @click.prevent="showFan = true">
        <div class="card-bg-shape" style="width:200px;height:200px;background:radial-gradient(circle,rgba(245,184,208,0.1),transparent);bottom:-60px;left:-60px;border-radius:50%;"></div>
        <div class="card-sparkle" style="top:12%;right:18%;--d:2s;--dl:.2s">✦</div>
        <div class="card-sparkle" style="top:22%;left:22%;--d:1.6s;--dl:.6s">♡</div>
        <div class="card-sparkle" style="bottom:22%;right:22%;--d:2.3s;--dl:1s">✧</div>
        <div class="card-glow"></div>
        <div class="card-glass">
          <div class="card-icon-wrap">
            <div class="card-icon-ring"></div>
            <div class="card-icon-ring-inner"></div>
            <div class="card-icon-circle">🌸</div>
          </div>
          <div class="card-label">FAN · 青梅果</div>
          <div class="card-title">青梅果</div>
          <div class="card-subtitle">
            通过验证，加入国度<br>
            与同好一起守护橹穆
          </div>
          <ul class="card-perks">
            <li class="perk-item"><span class="perk-dot"></span>解锁完整网站内容</li>
            <li class="perk-item"><span class="perk-dot"></span>发帖 · 评论 · 点赞</li>
            <li class="perk-item"><span class="perk-dot"></span>私信其他粉丝</li>
            <li class="perk-item"><span class="perk-dot"></span>橹穆世界全开放</li>
            <li class="perk-item"><span class="perk-dot"></span>接收大事件通知</li>
            <li class="perk-item"><span class="perk-dot"></span>专属粉丝徽章</li>
          </ul>
          <button class="card-btn">登录 · 注册 →</button>
        </div>
      </a>

    </div>

    <!-- Admin entry -->
    <div class="admin-entry">
      <a class="admin-link" href="#" @click.prevent="showAdmin = true">⚙ 管理员入口</a>
    </div>

  </div>

  <!-- FOOTER -->
  <footer class="site-footer">
    <span class="footer-tag">橹穆宇宙 LUMU UNIVERSE</span>
    <span class="footer-dot"></span>
    <span class="footer-tag">SINCE 2025</span>
    <span class="footer-dot"></span>
    <span class="footer-tag">王橹杰 × 穆祉丞</span>
  </footer>

  <!-- ── Modals ──────────────────────────────── -->
  <PasserbyModal
    :open="showPasserby"
    @close="showPasserby = false"
    @go-fan="showPasserby = false; showFan = true"
    @confirm="onPasserby"
  />

  <FanAuthModal
    :open="showFan"
    @close="showFan = false"
    @success="onAuthSuccess"
    @go-quiz="onGoQuiz"
  />

  <QuizModal
    :open="showQuiz"
    :reg-data="regData"
    @close="showQuiz = false"
    @success="onAuthSuccess"
  />

  <AdminLoginModal
    :open="showAdmin"
    @close="showAdmin = false"
    @success="onAuthSuccess"
  />

  <!-- Toast -->
  <div class="toast" :class="{ show: toastVisible }">{{ toastMsg }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import CosmosBackground   from '@/components/index/CosmosBackground.vue'
import PasserbyModal      from '@/components/auth/PasserbyModal.vue'
import FanAuthModal       from '@/components/auth/FanAuthModal.vue'
import QuizModal          from '@/components/auth/QuizModal.vue'
import AdminLoginModal    from '@/components/auth/AdminLoginModal.vue'
import { useAuth }        from '@/composables/useAuth.js'

const router = useRouter()
const { setUser, setGuest, clearUser } = useAuth()

// ── Loading ──────────────────────────────────
const loaded = ref(false)
onMounted(() => {
  clearUser() // always re-pick identity on landing page
  setTimeout(() => { loaded.value = true }, 1800)
})

// ── Modal visibility ─────────────────────────
const showPasserby = ref(false)
const showFan      = ref(false)
const showQuiz     = ref(false)
const showAdmin    = ref(false)
const regData      = ref(null)

// ── Toast ────────────────────────────────────
const toastMsg     = ref('')
const toastVisible = ref(false)
let toastTimer = null

function toast(msg, dur = 3000) {
  toastMsg.value     = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, dur)
}

// ── Auth callbacks ────────────────────────────
function onPasserby() {
  setGuest()
  showPasserby.value = false
  toast('🌙 以路人身份进入...')
  setTimeout(() => router.push('/main'), 1200)
}

function onGoQuiz(data) {
  regData.value  = data
  showFan.value  = false
  showQuiz.value = true
}

function onAuthSuccess(info) {
  setUser(info)
  showFan.value   = false
  showQuiz.value  = false
  showAdmin.value = false
  const goAdmin = info.role === 'admin' || info.role === 'super_admin'
  toast(goAdmin ? '⚙ 管理员已登录' : `✨ 欢迎回来，${info.username}！`)
  setTimeout(() => router.push(goAdmin ? '/admin' : '/main'), 1500)
}
</script>

<style scoped>
/* ── Loading screen ────────────────────────── */
#loading-screen {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: var(--night);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  transition: opacity .8s ease .2s, visibility .8s ease .2s;
}
#loading-screen.hide { opacity: 0; visibility: hidden; }

.loading-logo {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 60px;
  letter-spacing: 10px;
  background: linear-gradient(135deg, var(--blue), var(--pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: loading-pulse 1.5s ease-in-out infinite;
}
.loading-bar-wrap {
  width: 200px;
  height: 2px;
  background: rgba(255,255,255,.08);
  border-radius: 2px;
  overflow: hidden;
}
.loading-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-deep), var(--pink-deep));
  border-radius: 2px;
  animation: load-fill 1.8s ease forwards;
}
.loading-text { font-size: 11px; letter-spacing: 6px; color: var(--text-dim); }

/* ── Main layout ───────────────────────────── */
.page-wrap {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Header ─────────────────────────────────── */
.site-header {
  width: 100%;
  text-align: center;
  padding: 60px 20px 20px;
  animation: fade-down 1.2s ease both;
}
.header-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 6px;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 18px;
}
.eyebrow-line {
  display: inline-block;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue-deep));
}
.eyebrow-line.r { background: linear-gradient(90deg, var(--pink-deep), transparent); }

.site-logo {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: clamp(72px, 14vw, 130px);
  line-height: 1;
  letter-spacing: 12px;
  position: relative;
  display: inline-block;
}
.logo-glow-ring {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(200,160,255,.08) 0%, transparent 70%);
  animation: pulse-ring 4s ease-in-out infinite;
}
.logo-text {
  background: linear-gradient(135deg, #fff 0%, var(--blue) 30%, #fff 50%, var(--pink) 70%, #fff 85%, var(--lilac) 100%);
  background-size: 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: logo-shimmer 6s linear infinite;
  filter: drop-shadow(0 0 30px rgba(168,212,245,.4)) drop-shadow(0 0 60px rgba(245,184,208,.3));
}

.site-tagline {
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  letter-spacing: 5px;
  color: var(--text-dim);
  margin-top: 12px;
  font-weight: 300;
  animation: fade-in 2s ease both .6s;
}

.cp-names {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  animation: fade-in 2s ease both .9s;
}
.cp-name         { font-family: 'Noto Serif SC', serif; font-size: 13px; letter-spacing: 4px; color: var(--text-dim); }
.cp-name.blue-n  { color: var(--blue-deep); }
.cp-name.pink-n  { color: var(--pink-deep); }
.cp-dot          { width: 4px; height: 4px; border-radius: 50%; background: linear-gradient(135deg, var(--blue), var(--pink)); opacity: .8; }
.cp-heart        { font-size: 16px; animation: heartbeat 2s ease-in-out infinite; }

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 36px 0 10px;
  width: 100%;
  max-width: 500px;
  animation: fade-in 2s ease both 1.2s;
}
.div-line   { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent); }
.div-symbol { font-size: 12px; color: var(--text-dim); letter-spacing: 4px; }

/* ── Choice cards ──────────────────────────── */
.choice-section {
  width: 100%;
  max-width: 960px;
  padding: 20px 24px 60px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  animation: fade-up 1.2s ease both 1s;
}
@media (max-width: 640px) {
  .choice-section { grid-template-columns: 1fr; max-width: 400px; }
  .site-logo { font-size: clamp(56px, 20vw, 90px); }
}

.choice-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s ease;
  text-decoration: none;
  display: block;
}
.choice-card:hover { transform: translateY(-8px) scale(1.02); }

.choice-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1.5px;
  background: var(--border-grad);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: .7;
  transition: opacity .4s;
  pointer-events: none;
}
.choice-card:hover::before { opacity: 1; }

.card-glass {
  position: relative;
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  border-radius: 22px;
  padding: 36px 30px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  inset: -80px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity .5s, transform .5s;
  pointer-events: none;
}
.choice-card:hover .card-glow { opacity: 1; transform: scale(.8); }

/* Passerby theme */
.card-passerby {
  --border-grad: linear-gradient(135deg, rgba(168,212,245,.6), rgba(255,255,255,.1), rgba(168,212,245,.3));
  --glass-bg: linear-gradient(145deg, rgba(168,212,245,.07) 0%, rgba(90,159,212,.04) 100%);
}
.card-passerby .card-glow { background: radial-gradient(circle, rgba(168,212,245,.15) 0%, transparent 60%); }
.card-passerby:hover { box-shadow: 0 20px 60px rgba(90,159,212,.25), 0 0 0 1px rgba(168,212,245,.2); }

/* Fan theme */
.card-fan {
  --border-grad: linear-gradient(135deg, rgba(245,184,208,.6), rgba(255,255,255,.1), rgba(245,184,208,.3));
  --glass-bg: linear-gradient(145deg, rgba(245,184,208,.08) 0%, rgba(232,122,171,.04) 100%);
}
.card-fan .card-glow { background: radial-gradient(circle, rgba(245,184,208,.18) 0%, transparent 60%); }
.card-fan:hover { box-shadow: 0 20px 60px rgba(232,122,171,.25), 0 0 0 1px rgba(245,184,208,.2); }

.card-bg-shape { position: absolute; pointer-events: none; }

.card-icon-wrap { position: relative; width: 88px; height: 88px; margin: 0 auto 4px; }
.card-icon-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  animation: spin-ring 12s linear infinite;
}
.card-icon-ring-inner {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  animation: spin-ring 8s linear infinite reverse;
}
.card-icon-circle {
  width: 88px; height: 88px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
  position: relative; z-index: 1;
  transition: transform .4s ease;
}
.choice-card:hover .card-icon-circle { transform: scale(1.08) rotate(-5deg); }

.card-passerby .card-icon-ring       { border: 1.5px dashed rgba(168,212,245,.4); }
.card-passerby .card-icon-ring-inner { border: 1px solid rgba(168,212,245,.2); }
.card-passerby .card-icon-circle {
  background: radial-gradient(circle at 30% 30%, rgba(200,230,255,.3), rgba(90,159,212,.15));
  box-shadow: 0 8px 30px rgba(90,159,212,.2), inset 0 1px 0 rgba(255,255,255,.2);
}
.card-fan .card-icon-ring       { border: 1.5px dashed rgba(245,184,208,.5); }
.card-fan .card-icon-ring-inner { border: 1px solid rgba(245,184,208,.25); }
.card-fan .card-icon-circle {
  background: radial-gradient(circle at 30% 30%, rgba(255,220,235,.3), rgba(232,122,171,.15));
  box-shadow: 0 8px 30px rgba(232,122,171,.2), inset 0 1px 0 rgba(255,255,255,.2);
}

.card-label {
  font-size: 11px; letter-spacing: 6px; text-align: center;
  text-transform: uppercase; opacity: .5; margin-bottom: 2px;
}
.card-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 32px; text-align: center; letter-spacing: 6px; line-height: 1;
}
.card-passerby .card-title { color: #c8e4f8; }
.card-fan .card-title      { color: #f8d0e4; }

.card-subtitle {
  font-family: 'Noto Serif SC', serif;
  font-size: 12px; text-align: center; color: var(--text-dim);
  letter-spacing: 2px; line-height: 1.7;
}

.card-perks { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.perk-item  { display: flex; align-items: center; gap: 10px; font-size: 12px; color: rgba(255,255,255,.55); letter-spacing: 1px; }
.perk-dot   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.card-passerby .perk-dot { background: var(--blue); box-shadow: 0 0 6px var(--glow-blue); }
.card-fan .perk-dot      { background: var(--pink); box-shadow: 0 0 6px var(--glow-pink); }
.perk-item.locked        { opacity: .3; text-decoration: line-through; }

.card-btn {
  margin-top: auto;
  padding: 14px 20px;
  border-radius: 50px;
  border: none;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 13px; letter-spacing: 4px; font-weight: 700;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform .3s, box-shadow .3s;
  width: 100%;
  pointer-events: none;
}
.card-btn::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.15) 0%, transparent 60%);
  border-radius: 50px;
}
.card-passerby .card-btn { background: linear-gradient(135deg, #6aaed4, #a8d4f5); color: white; box-shadow: 0 8px 24px rgba(90,159,212,.35); }
.card-fan .card-btn      { background: linear-gradient(135deg, #e07aab, #f5b8d0); color: white; box-shadow: 0 8px 24px rgba(232,122,171,.35); }
.choice-card:hover .card-btn { transform: scale(1.03); }

.card-sparkle {
  position: absolute;
  font-size: 14px;
  animation: sparkle-pulse var(--d) ease-in-out infinite;
  animation-delay: var(--dl);
  pointer-events: none;
  opacity: 0;
}
.choice-card:hover .card-sparkle { opacity: 1; }
@keyframes sparkle-pulse {
  0%,100% { transform: scale(0) rotate(0deg); opacity: 0; }
  50%     { transform: scale(1) rotate(180deg); opacity: .8; }
}

/* ── Admin entry ───────────────────────────── */
.admin-entry { margin-top: 4px; margin-bottom: 50px; animation: fade-in 2s ease both 2s; }
.admin-link {
  font-size: 11px;
  color: rgba(255,255,255,.18);
  letter-spacing: 4px;
  cursor: pointer;
  padding: 6px 16px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px;
  backdrop-filter: blur(6px);
  transition: color .4s, border-color .3s;
}
.admin-link:hover { color: rgba(255,255,255,.5); border-color: rgba(255,255,255,.15); }

/* ── Footer ─────────────────────────────────── */
.site-footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 20;
  display: flex; align-items: center; justify-content: center; gap: 20px;
  padding: 12px 20px;
  background: linear-gradient(to top, rgba(13,8,24,.9), transparent);
  animation: fade-in 2s ease both 2.5s;
}
.footer-tag { font-size: 10px; letter-spacing: 4px; color: rgba(255,255,255,.18); }
.footer-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,.15); }

/* ── Toast ──────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 60px; left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(30,20,50,.95);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 50px;
  padding: 12px 24px;
  font-size: 13px; letter-spacing: 2px; color: white;
  z-index: 200;
  opacity: 0;
  transition: opacity .3s, transform .3s;
  backdrop-filter: blur(20px);
  white-space: nowrap;
  pointer-events: none;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>