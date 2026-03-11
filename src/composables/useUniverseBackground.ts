import { onUnmounted } from 'vue';

export function useUniverseBackground() {
  let animationId = null;

  // --- Starfield 逻辑 ---
  function initStarfield(canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 5000);
      for (let i = 0; i < count; i++) {
        const hue = Math.random() > 0.5 ? 200 : 330;
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.8 + 0.3,
          alpha: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.015 + 0.005,
          phase: Math.random() * Math.PI * 2,
          hue,
        });
      }
    }

    function drawStars(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        const a = s.alpha * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 90%, ${a})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(drawStars);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animationId = requestAnimationFrame(drawStars);

    // 返回清理函数
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }

  // --- Nebula 逻辑 ---
  function initNebula(container) {
    const blobs = [
      { col:'rgba(100,160,255,0.18)', w:500, h:400, t:'5%',  l:'0%',   d:12, tx:'40px',ty:'30px', s:1.1, oa:0.18, ob:0.28 },
      { col:'rgba(230,130,180,0.15)', w:450, h:350, t:'50%', l:'55%',  d:10, tx:'-30px',ty:'-20px', s:0.9, oa:0.12, ob:0.22 },
      { col:'rgba(160,100,240,0.12)', w:400, h:300, t:'30%', l:'25%',  d:14, tx:'20px',ty:'40px', s:1.05, oa:0.1, ob:0.18 },
      { col:'rgba(100,200,240,0.1)',  w:350, h:280, t:'70%', l:'5%',   d:9,  tx:'50px',ty:'-30px', s:1.15, oa:0.08, ob:0.16 },
    ];
    blobs.forEach(b => {
      const el = document.createElement('div');
      el.className = 'nebula-blob';
      el.style.cssText = `
        background:${b.col};width:${b.w}px;height:${b.h}px;
        top:${b.t};left:${b.l};
        --d:${b.d}s;--tx:${b.tx};--ty:${b.ty};--s:${b.s};
        --op-from:${b.oa};--op-to:${b.ob};
      `;
      container.appendChild(el);
    });
  }

  // --- Petals 逻辑 ---
  function initPetals(container) {
    const petalColors = ['rgba(245,184,208,0.8)', 'rgba(168,212,245,0.7)', 'rgba(212,184,245,0.7)', 'rgba(255,210,225,0.8)'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      const sz = (Math.random() * 8 + 6) + 'px';
      p.style.cssText = `--sz:${sz};--col:${petalColors[Math.floor(Math.random()*petalColors.length)]};--x:${Math.random()*100}vw;--dur:${Math.random()*8+8}s;--del:${Math.random()*12}s;`;
      container.appendChild(p);
    }
  }

  // --- Floating Particles 逻辑 ---
  function initParticles(container) {
    const particleColors = ['rgba(168,212,245,0.6)','rgba(245,184,208,0.6)','rgba(212,184,245,0.5)'];
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'fp';
      const col = particleColors[i % particleColors.length];
      const sz = (Math.random() * 4 + 2) + 'px';
      p.style.cssText = `width:${sz};height:${sz};background:${col};left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${Math.random()*8+6}s;--del:${Math.random()*8}s;--op:${Math.random()*0.6+0.3};`;
      container.appendChild(p);
    }
  }

  return { initStarfield, initNebula, initPetals, initParticles };
}