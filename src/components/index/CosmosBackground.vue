<template>
  <!-- Deep space gradient -->
  <div class="bg-cosmos"></div>

  <!-- Nebula blobs (JS-populated) -->
  <div class="bg-nebula" ref="nebulaRef"></div>

  <!-- Star field canvas -->
  <canvas ref="canvasRef" class="bg-starfield"></canvas>

  <!-- Falling petals -->
  <div class="petal-field" ref="petalRef"></div>

  <!-- Floating particles -->
  <div class="particle-field" ref="particleRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef   = ref(null)
const nebulaRef   = ref(null)
const petalRef    = ref(null)
const particleRef = ref(null)

let rafId = null

// ── Star field ──────────────────────────────
function initStars(canvas) {
  const ctx = canvas.getContext('2d')
  let stars = []

  function resize() {
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    stars = []
    const count = Math.floor((canvas.width * canvas.height) / 5000)
    for (let i = 0; i < count; i++) {
      const hue = Math.random() > 0.5 ? 200 : 330
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.3,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
        hue,
      })
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    stars.forEach(s => {
      const a = s.alpha * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase))
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${s.hue}, 80%, 90%, ${a})`
      ctx.fill()
    })
    rafId = requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  resize()
  rafId = requestAnimationFrame(draw)
  return () => window.removeEventListener('resize', resize)
}

// ── Nebula blobs ────────────────────────────
function initNebula(container) {
  const blobs = [
    { col:'rgba(100,160,255,0.18)', w:500, h:400, t:'5%',  l:'0%',  d:12, tx:'40px',  ty:'30px',  s:1.1,  oa:.18, ob:.28 },
    { col:'rgba(230,130,180,0.15)', w:450, h:350, t:'50%', l:'55%', d:10, tx:'-30px', ty:'-20px', s:0.9,  oa:.12, ob:.22 },
    { col:'rgba(160,100,240,0.12)', w:400, h:300, t:'30%', l:'25%', d:14, tx:'20px',  ty:'40px',  s:1.05, oa:.1,  ob:.18 },
    { col:'rgba(100,200,240,0.1)',  w:350, h:280, t:'70%', l:'5%',  d:9,  tx:'50px',  ty:'-30px', s:1.15, oa:.08, ob:.16 },
  ]
  blobs.forEach(b => {
    const el = document.createElement('div')
    el.className = 'nebula-blob'
    el.style.cssText = `
      background:${b.col};width:${b.w}px;height:${b.h}px;
      top:${b.t};left:${b.l};
      --d:${b.d}s;--tx:${b.tx};--ty:${b.ty};--s:${b.s};
      --op-from:${b.oa};--op-to:${b.ob};
    `
    container.appendChild(el)
  })
}

// ── Petals ──────────────────────────────────
function initPetals(container) {
  const colors = [
    'rgba(245,184,208,0.8)', 'rgba(168,212,245,0.7)',
    'rgba(212,184,245,0.7)', 'rgba(255,210,225,0.8)',
  ]
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div')
    p.className = 'petal'
    const sz = (Math.random() * 8 + 6) + 'px'
    p.style.cssText = `
      --sz:${sz};
      --col:${colors[Math.floor(Math.random() * colors.length)]};
      --x:${Math.random() * 100}vw;
      --dur:${Math.random() * 8 + 8}s;
      --del:${Math.random() * 12}s;
    `
    container.appendChild(p)
  }
}

// ── Floating particles ───────────────────────
function initParticles(container) {
  const cols = ['rgba(168,212,245,0.6)','rgba(245,184,208,0.6)','rgba(212,184,245,0.5)']
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div')
    p.className = 'fp'
    const sz = (Math.random() * 4 + 2) + 'px'
    p.style.cssText = `
      width:${sz};height:${sz};
      background:${cols[i % cols.length]};
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --dur:${Math.random() * 8 + 6}s;
      --del:${Math.random() * 8}s;
      --op:${Math.random() * 0.6 + 0.3};
    `
    container.appendChild(p)
  }
}

let cleanupResize = null

onMounted(() => {
  cleanupResize = initStars(canvasRef.value)
  initNebula(nebulaRef.value)
  initPetals(petalRef.value)
  initParticles(particleRef.value)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (cleanupResize) cleanupResize()
})
</script>

<style scoped>
.bg-cosmos {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 120% 80% at 50% -10%, #1a0d3a 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 10% 100%, #0a1830 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 90% 80%, #1a0a22 0%, transparent 50%),
    linear-gradient(180deg, #0d0818 0%, #100a20 50%, #0d0818 100%);
}

.bg-nebula {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-starfield {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.petal-field {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
}

.particle-field {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
</style>

<!-- unscoped: nebula-blob, petal, fp need to be global since injected by JS -->
<style>
.nebula-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: nebula-drift var(--d) ease-in-out infinite alternate;
}
@keyframes nebula-drift {
  from { transform: translate(0,0) scale(1); opacity: var(--op-from); }
  to   { transform: translate(var(--tx), var(--ty)) scale(var(--s)); opacity: var(--op-to); }
}

.petal {
  position: absolute;
  top: -30px;
  width: var(--sz);
  height: var(--sz);
  background: var(--col);
  border-radius: 50% 0 50% 0;
  animation: petal-fall var(--dur) linear infinite;
  animation-delay: var(--del);
  opacity: .7;
}
@keyframes petal-fall {
  0%   { top: -30px; left: var(--x); transform: rotate(0deg) translateX(0); opacity: .7; }
  100% { top: 110vh; left: calc(var(--x) + 80px); transform: rotate(720deg) translateX(40px); opacity: 0; }
}

.fp {
  position: absolute;
  border-radius: 50%;
  animation: fp-float var(--dur) ease-in-out infinite;
  animation-delay: var(--del);
}
@keyframes fp-float {
  0%   { transform: translateY(0) rotate(0deg) scale(1);   opacity: 0; }
  20%  { opacity: var(--op); }
  80%  { opacity: var(--op); }
  100% { transform: translateY(-120px) rotate(360deg) scale(.5); opacity: 0; }
}
</style>