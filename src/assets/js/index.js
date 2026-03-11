/* ══════════════════════════════════════════
   LOADING
══════════════════════════════════════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hide');
  }, 2000);
});

/* ══════════════════════════════════════════
   STARFIELD CANVAS
══════════════════════════════════════════ */
const canvas = document.getElementById('starfield');
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
    const hue = Math.random() > 0.5 ? 200 : 330; // blue or pink tint
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
  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(drawStars);

/* ══════════════════════════════════════════
   NEBULA BLOBS
══════════════════════════════════════════ */
const blobs = [
  { col:'rgba(100,160,255,0.18)', w:500, h:400, t:'5%',  l:'0%',   d:12, tx:'40px',ty:'30px', s:1.1, oa:0.18, ob:0.28 },
  { col:'rgba(230,130,180,0.15)', w:450, h:350, t:'50%', l:'55%',  d:10, tx:'-30px',ty:'-20px', s:0.9, oa:0.12, ob:0.22 },
  { col:'rgba(160,100,240,0.12)', w:400, h:300, t:'30%', l:'25%',  d:14, tx:'20px',ty:'40px', s:1.05, oa:0.1, ob:0.18 },
  { col:'rgba(100,200,240,0.1)',  w:350, h:280, t:'70%', l:'5%',   d:9,  tx:'50px',ty:'-30px', s:1.15, oa:0.08, ob:0.16 },
];
const nl = document.getElementById('nebula-layer');
blobs.forEach(b => {
  const el = document.createElement('div');
  el.className = 'nebula-blob';
  el.style.cssText = `
    background:${b.col};width:${b.w}px;height:${b.h}px;
    top:${b.t};left:${b.l};
    --d:${b.d}s;--tx:${b.tx};--ty:${b.ty};--s:${b.s};
    --op-from:${b.oa};--op-to:${b.ob};
  `;
  nl.appendChild(el);
});

/* ══════════════════════════════════════════
   PETALS
══════════════════════════════════════════ */
const petalColors = [
  'rgba(245,184,208,0.8)', 'rgba(168,212,245,0.7)',
  'rgba(212,184,245,0.7)', 'rgba(255,210,225,0.8)',
];
const pf = document.getElementById('petal-field');
for (let i = 0; i < 18; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  const sz = (Math.random() * 8 + 6) + 'px';
  p.style.cssText = `
    --sz:${sz};
    --col:${petalColors[Math.floor(Math.random()*petalColors.length)]};
    --x:${Math.random()*100}vw;
    --dur:${Math.random()*8+8}s;
    --del:${Math.random()*12}s;
  `;
  pf.appendChild(p);
}

/* ══════════════════════════════════════════
   FLOATING PARTICLES
══════════════════════════════════════════ */
const particleColors = ['rgba(168,212,245,0.6)','rgba(245,184,208,0.6)','rgba(212,184,245,0.5)'];
const pfield = document.getElementById('particle-field');
for (let i = 0; i < 25; i++) {
  const p = document.createElement('div');
  p.className = 'fp';
  const col = particleColors[i % particleColors.length];
  const sz = (Math.random() * 4 + 2) + 'px';
  p.style.cssText = `
    width:${sz};height:${sz};
    background:${col};
    left:${Math.random()*100}%;
    top:${Math.random()*100}%;
    --dur:${Math.random()*8+6}s;
    --del:${Math.random()*8}s;
    --op:${Math.random()*0.6+0.3};
  `;
  pfield.appendChild(p);
}

/* ══════════════════════════════════════════
   MODAL SYSTEM
══════════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

function openFanLogin(e) {
  if(e) e.preventDefault();
  openModal('modal-fan');
}
function openAdmin(e) {
  if(e) e.preventDefault();
  openModal('modal-admin');
}

/* Tab switching */
function switchTab(tab) {
  const tabs = document.querySelectorAll('.m-tab');
  document.getElementById('tab-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('tab-register').style.display = tab === 'register' ? 'block' : 'none';
  tabs[0].classList.toggle('active', tab === 'login');
  tabs[1].classList.toggle('active', tab === 'register');
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function showToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

/* ══════════════════════════════════════════
   API 配置
   ★ 部署后把下面的地址改成你的 Railway 后端地址
══════════════════════════════════════════ */
const API_BASE = 'https://lumu-backend-production.up.railway.app'; // ← 部署后改这里

/* ══════════════════════════════════════════
   SESSION — 改用 localStorage + JWT 持久化登录
   关闭浏览器再打开也保持登录状态
══════════════════════════════════════════ */
function setSession(data) {
  // data 包含 { token, username, role, badge }
  localStorage.setItem('lumu_session', JSON.stringify(data));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('lumu_session') || 'null'); } catch { return null; }
}

/* ══════════════════════════════════════════
   LOGIN LOGIC — 粉丝登录（调用后端 API）
══════════════════════════════════════════ */
async function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  if (!u || !p) { shakeError(err, '请填写账号和密码'); return; }

  // 禁用按钮防止重复点击
  const btn = document.querySelector('#modal-fan .btn-full');
  if (btn) { btn.disabled = true; btn.textContent = '登录中...'; }

  try {
    const res = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();

    if (!res.ok) {
      shakeError(err, data.error || '账号或密码错误，再试一次');
      return;
    }

    // 保存 token 和用户信息到 localStorage
    setSession({ token: data.token, username: data.username, role: data.role, badge: data.badge });
    closeModal('modal-fan');
    showToast(`✨ 欢迎回来，${data.username}！`);
    setTimeout(() => { window.location.href = 'lumu-main.html'; }, 1500);

  } catch(e) {
    shakeError(err, '网络错误，请确认后端服务已启动');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '进入橹穆宇宙 ✦'; }
  }
}

/* ══════════════════════════════════════════
   ADMIN LOGIN — 管理员登录（同样走后端 API）
══════════════════════════════════════════ */
async function doAdminLogin() {
  const u = document.getElementById('admin-user').value.trim();
  const p = document.getElementById('admin-pass').value;
  const err = document.getElementById('admin-error');

  if (!u || !p) { shakeError(err, '请填写账号和密码'); return; }

  const btn = document.querySelector('#modal-admin .btn-full');
  if (btn) { btn.disabled = true; btn.textContent = '登录中...'; }

  try {
    const res = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();

    if (!res.ok || data.role !== 'admin') {
      shakeError(err, data.role !== 'admin' ? '该账号没有管理员权限' : (data.error || '账号或密码错误'));
      return;
    }

    setSession({ token: data.token, username: data.username, role: data.role, badge: data.badge });
    closeModal('modal-admin');
    showToast('⚙ 管理员已登录');
    setTimeout(() => { window.location.href = 'lumu-main.html'; }, 1500);

  } catch(e) {
    shakeError(err, '网络错误，请确认后端服务已启动');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '进入管理后台 ✦'; }
  }
}

/* ══════════════════════════════════════════
   PASSERBY FLOW — show confirm modal first
══════════════════════════════════════════ */
function openPasserbyConfirm(e) {
  if (e) e.preventDefault();
  openModal('modal-passerby');
}

function confirmPasserby() {
  // 路人不需要 token，直接本地存一个 guest session
  localStorage.setItem('lumu_session', JSON.stringify({ username: '路人', role: 'guest', badge: '路人' }));
  closeModal('modal-passerby');
  showToast('🌙 以路人身份进入...');
  setTimeout(() => { window.location.href = 'lumu-main.html'; }, 1200);
}

/* ══════════════════════════════════════════
   REGISTRATION — QUIZ SYSTEM
══════════════════════════════════════════ */
// Question bank
const QUESTION_BANK = [
  { q: '穆祉丞的身份是？', opts: ['爱豆', '唱跳艺人', '主播', '演员'], ans: 1 },
  { q: '王橹杰的身份是？', opts: ['唱跳艺人', '演员', '爱豆', '主播'], ans: 2 },
  { q: '橹穆宇宙的 CP 名字是由哪两个字组合而成？', opts: ['穆王', '橹穆', '杰丞', '橹丞'], ans: 1 },
  { q: '王橹杰与穆祉丞所在的 CP 粉圈，粉丝自称？', opts: ['路人', '青梅果', '小橹', '丞粉'], ans: 1 },
  { q: '橹穆宇宙网站的主色调是什么颜色？', opts: ['红黄', '绿白', '粉蓝', '黑金'], ans: 2 },
  { q: '以下哪个是穆祉丞的名字中的字？', opts: ['橹', '杰', '丞', '王'], ans: 2 },
  { q: '以下哪个是王橹杰的名字中的字？', opts: ['穆', '丞', '祉', '橹'], ans: 3 },
  { q: '「橹穆宇宙」这个名称中，「橹」字来自哪位成员？', opts: ['穆祉丞', '王橹杰', '两人都有', '都没有'], ans: 1 },
  { q: '「橹穆宇宙」中，「穆」字来自哪位成员？', opts: ['王橹杰', '穆祉丞', '管理员', '都没有'], ans: 1 },
  { q: '本站专属粉丝的身份称号是？', opts: ['路人', '访客', '青梅果', '管理员'], ans: 2 },
  { q: '在橹穆宇宙，路人与粉丝最大的区别是？', opts: ['能看故事线', '能查看时间线', '能发言和评论', '能看照片'], ans: 2 },
  { q: '橹穆宇宙大事件由谁发布？', opts: ['所有粉丝', '路人', '管理员', '任何人'], ans: 2 },
];

let quizState = { questions: [], current: 0, wrong: 0, regData: null };

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

async function goToQuiz() {
  const u = document.getElementById('reg-user').value.trim();
  const p = document.getElementById('reg-pass').value;
  const err = document.getElementById('reg-error');

  if (!u) { shakeError(err, '请输入用户名'); return; }
  if (u.length < 2) { shakeError(err, '用户名至少2个字符'); return; }
  if (p.length < 6) { shakeError(err, '密码至少6位'); return; }

  // 检查用户名是否已存在（通过后端 API）
  const checkBtn = document.querySelector('#modal-fan .btn-full');
  if (checkBtn) { checkBtn.disabled = true; checkBtn.textContent = '检查中...'; }
  try {
    const res = await fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 发一个"预检"请求看用户名是否可用
      body: JSON.stringify({ username: u, password: p, email: document.getElementById('reg-email').value.trim(), precheck: true })
    });
    // 409 = 用户名已存在
    if (res.status === 409) {
      const d = await res.json();
      shakeError(err, d.error || '用户名已存在，请换一个');
      return;
    }
  } catch(e) {
    // 网络错误时不阻止进入答题，注册时再报错
  } finally {
    if (checkBtn) { checkBtn.disabled = false; checkBtn.textContent = '开始答题 →'; }
  }

  quizState.regData = {
    username: u,
    pass: p,
    email: document.getElementById('reg-email').value.trim(),
  };
  quizState.questions = shuffle(QUESTION_BANK).slice(0, 5);
  quizState.current = 0;
  quizState.wrong = 0;

  closeModal('modal-fan');
  openModal('modal-quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = quizState.questions[quizState.current];
  const idx = quizState.current;

  // Update progress
  document.getElementById('quiz-progress-text').textContent = `第 ${idx+1} 题 / 共 5 题`;

  // Update dots
  for (let i = 0; i < 5; i++) {
    const dot = document.getElementById('qdot-' + i);
    if (i < idx) {
      dot.style.background = 'var(--pink)';
      dot.style.boxShadow = '0 0 6px var(--glow-pink)';
    } else if (i === idx) {
      dot.style.background = 'var(--blue)';
      dot.style.boxShadow = '0 0 6px var(--glow-blue)';
      dot.style.transform = 'scale(1.4)';
    } else {
      dot.style.background = 'rgba(255,255,255,0.15)';
      dot.style.boxShadow = 'none';
      dot.style.transform = 'scale(1)';
    }
  }

  // Question text
  const qEl = document.getElementById('quiz-question');
  qEl.style.animation = 'none';
  void qEl.offsetHeight;
  qEl.style.animation = 'fade-in 0.4s ease both';
  qEl.textContent = `${idx + 1}. ${q.q}`;

  // Options
  const optsEl = document.getElementById('quiz-options');
  optsEl.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      padding:12px 16px;
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:10px;
      color:rgba(255,255,255,0.8);
      font-family:'Noto Sans SC',sans-serif;
      font-size:13px;
      letter-spacing:1px;
      cursor:pointer;
      text-align:left;
      transition:all 0.25s;
      animation: fade-in ${0.1 + i*0.08}s ease both;
    `;
    btn.textContent = `${['A','B','C','D'][i]}. ${opt}`;
    btn.onmouseover = () => {
      btn.style.background = 'rgba(168,212,245,0.12)';
      btn.style.borderColor = 'rgba(168,212,245,0.4)';
    };
    btn.onmouseout = () => {
      if (!btn.dataset.answered) {
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
      }
    };
    btn.onclick = () => answerQuestion(i, btn);
    optsEl.appendChild(btn);
  });

  document.getElementById('quiz-error').textContent = '';
}

function answerQuestion(choice, btn) {
  const q = quizState.questions[quizState.current];
  const opts = document.querySelectorAll('#quiz-options button');

  // Disable all
  opts.forEach(b => { b.onclick = null; b.dataset.answered = '1'; b.style.cursor = 'default'; });

  if (choice === q.ans) {
    // Correct
    btn.style.background = 'rgba(168,212,245,0.25)';
    btn.style.borderColor = 'rgba(168,212,245,0.8)';
    btn.style.color = '#a8d4f5';
    // Update dot to correct
    const dot = document.getElementById('qdot-' + quizState.current);
    dot.style.background = '#7de8b0';
    dot.style.boxShadow = '0 0 8px rgba(125,232,176,0.6)';

    setTimeout(() => {
      quizState.current++;
      if (quizState.current >= 5) {
        showQuizSuccess();
      } else {
        renderQuestion();
      }
    }, 600);
  } else {
    // Wrong
    btn.style.background = 'rgba(255,100,130,0.2)';
    btn.style.borderColor = 'rgba(255,100,130,0.6)';
    btn.style.color = '#ff8aaa';
    // Show correct answer
    opts[q.ans].style.background = 'rgba(168,212,245,0.2)';
    opts[q.ans].style.borderColor = 'rgba(168,212,245,0.6)';
    opts[q.ans].style.color = '#a8d4f5';
    // Shake
    const box = document.getElementById('modal-quiz').querySelector('.modal-box');
    box.style.animation = 'none';
    void box.offsetHeight;
    box.style.animation = 'shake 0.4s ease';

    quizState.wrong++;
    const dot = document.getElementById('qdot-' + quizState.current);
    dot.style.background = '#ff8aaa';

    setTimeout(() => {
      if (quizState.wrong >= 2) {
        showQuizFail();
      } else {
        quizState.current++;
        if (quizState.current >= 5) {
          showQuizSuccess();
        } else {
          renderQuestion();
        }
      }
    }, 1200);
  }
}

function showQuizSuccess() {
  document.getElementById('quiz-body').style.display = 'none';
  document.getElementById('quiz-success').style.display = 'block';
  document.getElementById('quiz-fail').style.display = 'none';
}
function showQuizFail() {
  document.getElementById('quiz-body').style.display = 'none';
  document.getElementById('quiz-fail').style.display = 'block';
  document.getElementById('quiz-success').style.display = 'none';
}

function retryQuiz() {
  quizState.questions = shuffle(QUESTION_BANK).slice(0, 5);
  quizState.current = 0;
  quizState.wrong = 0;
  document.getElementById('quiz-body').style.display = 'block';
  document.getElementById('quiz-success').style.display = 'none';
  document.getElementById('quiz-fail').style.display = 'none';
  // Reset dots
  for (let i = 0; i < 5; i++) {
    const dot = document.getElementById('qdot-' + i);
    dot.style.background = 'rgba(255,255,255,0.15)';
    dot.style.boxShadow = 'none';
    dot.style.transform = 'scale(1)';
  }
  renderQuestion();
}

async function completeRegister() {
  const { username, pass, email } = quizState.regData;

  const btn = document.querySelector('#quiz-success .btn-full');
  if (btn) { btn.disabled = true; btn.textContent = '注册中...'; }

  try {
    const res = await fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass, email })
    });
    const data = await res.json();

    if (!res.ok) {
      // 注册失败（比如用户名被别人抢注）
      showToast('❌ ' + (data.error || '注册失败，请重试'));
      if (btn) { btn.disabled = false; btn.textContent = '完成注册 ✦'; }
      return;
    }

    // 注册成功：保存 token 到 localStorage
    setSession({ token: data.token, username: data.username, role: data.role, badge: data.badge });
    closeModal('modal-quiz');
    showToast(`🌸 注册成功！欢迎加入橹穆宇宙，${data.username}！`);
    setTimeout(() => { window.location.href = 'lumu-main.html'; }, 1800);

  } catch(e) {
    showToast('❌ 网络错误，请检查后端连接');
    if (btn) { btn.disabled = false; btn.textContent = '完成注册 ✦'; }
  }
}

/* ══════════════════════════════════════════
   SHAKE ANIMATION
══════════════════════════════════════════ */
function shakeError(el, msg) {
  el.textContent = msg;
  const parent = el.closest('.modal-box') || el.parentElement;
  parent.style.animation = 'none';
  void parent.offsetHeight;
  parent.style.animation = 'shake 0.4s ease';
}

// Inject shake keyframe
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0) scale(1); }
    15%     { transform: translateX(-8px) scale(1); }
    30%     { transform: translateX(7px) scale(1); }
    45%     { transform: translateX(-5px) scale(1); }
    60%     { transform: translateX(4px) scale(1); }
    75%     { transform: translateX(-2px) scale(1); }
  }
`;
document.head.appendChild(shakeStyle);

/* ══════════════════════════════════════════
   PAGE INIT — clear any old session so user
   always picks an identity on this page
══════════════════════════════════════════ */
// 到达首页时清除 session，强制重新选择身份
// （保留 localStorage 中的数据，让用户可以选择快速登录）
// 如果你希望"关闭再打开保持登录"，可以注释掉下面这行
localStorage.removeItem('lumu_session');