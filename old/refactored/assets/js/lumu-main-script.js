/* ── STARFIELD ── */
const cv=document.getElementById('starfield'),cx=cv.getContext('2d');let stars=[];
function rsz(){cv.width=innerWidth;cv.height=innerHeight;stars=[];const n=Math.floor(cv.width*cv.height/5500);for(let i=0;i<n;i++)stars.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.6+.3,a:Math.random()*.8+.2,sp:Math.random()*.015+.005,ph:Math.random()*Math.PI*2,h:Math.random()>.5?210:330});}
function dstars(t){cx.clearRect(0,0,cv.width,cv.height);stars.forEach(s=>{const a=s.a*(.5+.5*Math.sin(t*s.sp+s.ph));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle=`hsla(${s.h},80%,90%,${a})`;cx.fill();});requestAnimationFrame(dstars);}
window.addEventListener('resize',rsz);rsz();requestAnimationFrame(dstars);

/* ── SESSION ── */
const S={
  get(){try{return JSON.parse(localStorage.getItem('lumu_session')||'null');}catch{return null;}},
  set(d){localStorage.setItem('lumu_session',JSON.stringify(d));},
  clear(){localStorage.removeItem('lumu_session');},
  token(){const s=this.get();return s?s.token:null;},
  role(){const s=this.get();return s?s.role:'guest';},
  isAdmin(){return this.role()==='admin';},
  isFan(){return['fan','admin'].includes(this.role());},
  isGuest(){return this.role()==='guest'||!this.get();},
  username(){const s=this.get();return s?s.username:'路人';},
  badge(){const s=this.get();return s?(s.badge||'路人'):'路人';}
};

/* ── NOTIFS ── */
const N={
  _cache:null,
  async fetch(){if(!S.isFan())return;try{const d=await api('GET','/api/notifications');this._cache=d;updateBellBadge();}catch(e){}},
  get(){return this._cache||[];},
  unread(){return this.get().filter(n=>!n.is_read).length;},
  async markAll(){try{await api('PUT','/api/notifications/read');this._cache=this.get().map(n=>({...n,is_read:true}));updateBellBadge();}catch(e){}}
};

/* ── TOAST ── */
function toast(m,d=3000){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),d);}

/* ── API ── */
const API_BASE='https://lumu-backend-production.up.railway.app';
async function api(method,path,body){
  const opts={method,headers:{'Content-Type':'application/json'}};
  const token=S.token();
  if(token)opts.headers['Authorization']='Bearer '+token;
  if(body)opts.body=JSON.stringify(body);
  try{
    const res=await fetch(API_BASE+path,opts);
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'请求失败');
    return data;
  }catch(e){console.error('API Error:',method,path,e.message);throw e;}
}

/* ── MODAL ── */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

/* ── NAV ── */
function initNav(){
  document.querySelectorAll('.nl.fan-only,.nav-acts .fan-only').forEach(el=>{
    el.style.display=S.isFan()?'':'none';
  });
  if(S.isGuest()){const gm=document.getElementById('home-guest-msg');if(gm)gm.style.display='block';}
  document.getElementById('u-name').textContent=S.username();
  const bdgEl=document.getElementById('u-badge');
  bdgEl.textContent=S.badge();
  bdgEl.classList.toggle('admin',S.isAdmin());
  document.getElementById('u-av').textContent=S.isAdmin()?'★':S.isFan()?'●':'○';
  const chip=document.getElementById('guest-chip');
  if(chip)chip.style.display=S.isGuest()?'inline-flex':'none';
  updateBellBadge();
}
function updateBellBadge(){
  if(!S.isFan())return;
  const n=N.unread();
  const b=document.getElementById('bell-badge');
  b.textContent=n;b.classList.toggle('hide',n===0);
}

/* ── ROUTER ── */
let currentPage='home';
function showPage(id){
  if(id==='messages'&&!S.isFan()){toast('🌸 请先登录才能使用私信');return;}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nl').forEach(b=>b.classList.remove('active'));
  const pg=document.getElementById('page-'+id);
  if(pg)pg.classList.add('active');
  document.querySelectorAll(`.nl[data-page="${id}"]`).forEach(b=>b.classList.add('active'));
  currentPage=id;closeNotif();
  if(id==='story'&&!storyInited)renderStory();
  if(id==='timeline'&&!tlInited)renderTimeline();
  if(id==='photos'&&!photosInited)renderPhotos();
  if(id==='videos'&&!videosInited)renderVideos();
  if(id==='world'&&!worldInited)renderWorld();
  if(id==='events'&&!eventsInited)renderEvents();
  if(id==='messages'&&!dmInited)renderDM();
}

function doLogout(){S.clear();toast('已退出橹穆宇宙 🌙');setTimeout(()=>window.location.href='lumu-index.html',1200);}

/* ── NOTIF ── */
let notifOpen=false;
function toggleNotif(){notifOpen=!notifOpen;document.getElementById('notif-drop').classList.toggle('open',notifOpen);if(notifOpen)renderNotifs();}
function closeNotif(){notifOpen=false;document.getElementById('notif-drop').classList.remove('open');}
document.addEventListener('click',e=>{if(!e.target.closest('#notif-drop')&&!e.target.closest('#nav-bell'))closeNotif();});
function renderNotifs(){
  const list=N.get();const el=document.getElementById('nd-list');
  if(!list.length){el.innerHTML='<div class="nd-empty">暂无通知 ✦</div>';return;}
  el.innerHTML=list.map(n=>`<div class="nd-item ${n.is_read?'':'unread'}"><div class="nd-dot ${n.is_read?'read':''}"></div><div style="flex:1"><div class="nd-msg">${n.message}</div><div class="nd-time">${fmtTime(n.created_at)}</div></div></div>`).join('');
}
async function markAllRead(){await N.markAll();renderNotifs();}

/* ── TIME ── */
function fmtTime(iso){
  const d=new Date(iso),now=new Date(),diff=now-d;
  if(diff<60000)return'刚刚';
  if(diff<3600000)return Math.floor(diff/60000)+'分钟前';
  if(diff<86400000)return Math.floor(diff/3600000)+'小时前';
  return d.toLocaleDateString('zh-CN');
}

/* ── COMMENTS ── */
function renderComments(comments,containerId){
  const el=document.getElementById(containerId);if(!el)return;
  if(!comments||!comments.length){el.innerHTML='<div style="font-size:12px;color:var(--t3);letter-spacing:2px;padding:16px 0;">还没有评论，来留下第一条～</div>';return;}
  el.innerHTML=comments.map(c=>`
    <div class="c-item">
      <div class="cav">${c.username==='admin'?'👑':'💙'}</div>
      <div style="flex:1">
        <div class="c-meta">
          <span class="c-user">${c.username}</span>
          <span class="c-bdg">${c.badge||'访客'}</span>
          <span class="c-time">${fmtTime(c.created_at)}</span>
        </div>
        <div class="c-body">${c.body}</div>
        <div class="c-acts">
          <span class="c-like" id="clike-${c.id}" onclick="likeComment(${c.id},this)">🤍 ${c.likes||0}</span>
          ${S.isAdmin()?`<span class="c-del" onclick="delComment(${c.id},'${containerId}')">删除</span>`:''}
        </div>
      </div>
    </div>`).join('');
}
async function likeComment(commentId,el){
  if(!S.isFan()){toast('登录后才能点赞');return;}
  try{const r=await api('POST','/api/likes/comment/'+commentId);el.classList.toggle('liked',r.liked);const cur=parseInt(el.textContent.replace(/\D/g,''))||0;el.innerHTML=(r.liked?'💗':'🤍')+' '+(r.liked?cur+1:Math.max(0,cur-1));}catch(e){toast('点赞失败');}
}
async function delComment(commentId,containerId){
  if(!S.isAdmin())return;
  try{await api('DELETE','/api/comments/'+commentId);toast('已删除');const item=document.getElementById('clike-'+commentId)?.closest('.c-item');if(item)item.remove();}catch(e){toast('删除失败');}
}
async function loadComments(type,targetId,containerId){
  try{const comments=await api('GET',`/api/comments/${type}/${targetId}`);renderComments(comments,containerId);}
  catch(e){const el=document.getElementById(containerId);if(el)el.innerHTML='<div style="font-size:12px;color:var(--t3);padding:10px 0;">评论加载失败</div>';}
}
function commentInputHTML(type,targetId,containerId){
  if(!S.isFan())return`<div style="padding:12px 0;font-size:11px;color:var(--t3);letter-spacing:2px;border-top:1px solid var(--border);margin-top:10px;"><a href="lumu-index.html" style="color:var(--pink);">登录</a> 后才能评论</div>`;
  const key=type+'_'+targetId;
  return`<div class="comment-input-row">
    <div class="cav">${S.isAdmin()?'★':'●'}</div>
    <div class="ci-wrap">
      <textarea class="ci" id="ci-${key}" placeholder="留下你的想法..."></textarea>
      <div class="ci-actions">
        <div class="ci-emojis">
          <span class="ci-emoji" onclick="addCiEmoji('${key}','💙')">💙</span>
          <span class="ci-emoji" onclick="addCiEmoji('${key}','🌸')">🌸</span>
          <span class="ci-emoji" onclick="addCiEmoji('${key}','✨')">✨</span>
          <span class="ci-emoji" onclick="addCiEmoji('${key}','💗')">💗</span>
        </div>
        <button class="btn-p" style="padding:6px 16px;font-size:11px;" onclick="submitComment('${type}','${targetId}','${containerId}')">发送</button>
      </div>
    </div>
  </div>`;
}
function addCiEmoji(key,em){const el=document.getElementById('ci-'+key);if(el)el.value+=em;}
async function submitComment(type,targetId,containerId){
  if(!S.isFan()){toast('🌸 请先登录后才能评论');return;}
  const key=type+'_'+targetId;
  const el=document.getElementById('ci-'+key);
  if(!el||!el.value.trim()){toast('评论内容不能为空');return;}
  try{await api('POST',`/api/comments/${type}/${targetId}`,{body:el.value.trim()});el.value='';await loadComments(type,targetId,containerId);toast('✨ 评论已发布');}
  catch(e){toast(e.message||'评论失败');}
}

/* ═══════════════════════════════════════
   STORY LINE 故事线
═══════════════════════════════════════ */
let storyInited=false,currentChapter=0;
async function renderStory(){
  storyInited=true;
  if(S.isAdmin())document.getElementById('admin-story-btn').style.display='block';
  let apiChapters=[];
  try{apiChapters=await api('GET','/api/chapters');}catch(e){}
  const allCh=apiChapters.map((c,i)=>({
    num:i+1,title:c.title,date:c.date_label,emoji:c.emoji,
    grad:c.gradient,content:c.content,_api:true,_id:c.id
  }));
  const nums=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
  const toc=document.getElementById('toc-list');
  const wrap=document.getElementById('story-chapters');
  if(!allCh.length){
    toc.innerHTML='<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:10px 0;">暂无章节</div>';
    wrap.innerHTML='<div style="color:var(--t3);font-size:13px;letter-spacing:3px;padding:60px 0;text-align:center;">还没有章节 · 管理员可添加</div>';
    return;
  }
  toc.innerHTML=allCh.map((c,i)=>`
    <div class="toc-item ${i===0?'active':''}" onclick="switchChapter(${i})">
      <div class="toc-num">${c.num}</div>
      <div class="toc-text">第${nums[i]||i+1}章 · ${c.title}</div>
    </div>`).join('');
  wrap.innerHTML=allCh.map((c,i)=>`
    <div class="story-chapter ${i===0?'active':''}" id="chapter-${i}">
      <div class="chapter-head">
        <div class="chapter-num">第${nums[i]||i+1}章</div>
        <div class="chapter-title">${c.title}</div>
        <div class="chapter-meta">${c.date||''} · 橹穆故事</div>
        ${c._api&&S.isAdmin()?`<div class="chapter-admin-bar">
          <button class="btn-edit" onclick="openEditChapter(${c._id},'${encodeURIComponent(c.title)}','${encodeURIComponent(c.date||'')}','${encodeURIComponent(c.emoji||'')}','${encodeURIComponent(c.content)}')">✏️ 编辑</button>
          <button class="btn-danger" onclick="delChapter(${c._id})">🗑 删除</button>
        </div>`:''}
      </div>
      <div class="chapter-banner" style="background:${c.grad||'linear-gradient(135deg,rgba(168,212,245,.2),rgba(245,184,208,.15))'};">${c.emoji||'✨'}</div>
      <div class="chapter-body">${c.content}</div>
      <div class="story-comments">
        <div class="sc-toggle" onclick="toggleStoryComments(${i})">
          <span class="sc-toggle-txt">💬 评论区</span>
          <span class="sc-toggle-icon">▼</span>
        </div>
        <div class="sc-list" id="sc-list-${i}">
          <div id="sc-comments-${i}"></div>
          ${commentInputHTML('story',''+i,'sc-comments-'+i)}
        </div>
      </div>
    </div>`).join('');
}
async function submitChapter(){
  if(!S.isAdmin()){toast('⚠️ 仅管理员可操作');return;}
  const editId=document.getElementById('ch-edit-id').value;
  const title=document.getElementById('ch-title').value.trim();
  const date_label=document.getElementById('ch-date').value.trim();
  const emoji=document.getElementById('ch-emoji').value.trim()||'✨';
  const rawContent=document.getElementById('ch-content').value.trim();
  const err=document.getElementById('ch-err');
  if(!title||!rawContent){err.textContent='请填写标题和内容';return;}
  const content=rawContent.split(/\n\n+/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  try{
    if(editId){
      await api('PUT','/api/chapters/'+editId,{title,date_label,emoji,content});
      toast('✨ 章节已更新');
    }else{
      await api('POST','/api/chapters',{title,date_label,emoji,content,chapter_num:999});
      toast('✨ 章节已添加');
    }
    closeModal('modal-add-chapter');
    ['ch-title','ch-date','ch-emoji','ch-content'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('ch-edit-id').value='';
    document.getElementById('modal-chapter-mode-sub').textContent='新增章节';
    err.textContent='';storyInited=false;renderStory();
  }catch(e){err.textContent=e.message||'操作失败';}
}
function openEditChapter(id,title,date,emoji,content){
  document.getElementById('ch-edit-id').value=id;
  document.getElementById('ch-title').value=decodeURIComponent(title);
  document.getElementById('ch-date').value=decodeURIComponent(date);
  document.getElementById('ch-emoji').value=decodeURIComponent(emoji);
  // Strip HTML tags for editing
  const tmp=document.createElement('div');tmp.innerHTML=decodeURIComponent(content);
  document.getElementById('ch-content').value=tmp.innerText||tmp.textContent;
  document.getElementById('modal-chapter-mode-sub').textContent='编辑章节';
  openModal('modal-add-chapter');
}
async function delChapter(id){
  if(!S.isAdmin())return;
  if(!confirm('确定删除此章节？'))return;
  try{await api('DELETE','/api/chapters/'+id);storyInited=false;renderStory();toast('章节已删除');}
  catch(e){toast('删除失败');}
}
function switchChapter(i){
  document.querySelectorAll('.toc-item').forEach((t,j)=>t.classList.toggle('active',j===i));
  document.querySelectorAll('.story-chapter').forEach((c,j)=>c.classList.toggle('active',j===i));
  currentChapter=i;
}
function toggleStoryComments(i){
  const toggle=document.querySelector(`#chapter-${i} .sc-toggle`);
  const list=document.getElementById('sc-list-'+i);
  const wasOpen=list.classList.contains('open');
  toggle.classList.toggle('open');list.classList.toggle('open');
  if(!wasOpen&&!list.dataset.loaded){list.dataset.loaded='1';loadComments('story',''+i,'sc-comments-'+i);}
}

/* ═══════════════════════════════════════
   TIMELINE 时间线（双Tab）
═══════════════════════════════════════ */
let tlInited=false,_tlApiEvents=[];
const calState={
  rose:{year:new Date().getFullYear(),month:new Date().getMonth()},
  blue:{year:new Date().getFullYear(),month:new Date().getMonth()}
};

function getImportantEvents(){return _tlApiEvents.filter(e=>e.color!=='blue').sort((a,b)=>a.date.localeCompare(b.date));}
function getDailyEvents(){return _tlApiEvents.filter(e=>e.color==='blue').sort((a,b)=>a.date.localeCompare(b.date));}

async function renderTimeline(){
  tlInited=true;
  if(S.isAdmin()){
    document.getElementById('admin-tl-btn').style.display='block';
    const d=document.getElementById('admin-tl-btn-daily');if(d)d.style.display='block';
  }
  try{_tlApiEvents=await api('GET','/api/timeline');}catch(e){_tlApiEvents=[];}
  renderCal('rose');renderCal('blue');
  renderSDList('rose');renderSDList('blue');
  renderTLRows('rose');renderTLRows('blue');
}

/* 日历渲染 */
function renderCal(type){
  const {year,month}=calState[type];
  const months=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  document.getElementById('cal-ym-'+type).textContent=year+' 年 '+String(month+1).padStart(2,'0')+' 月';
  const grid=document.getElementById('cal-grid-'+type);
  const events=type==='rose'?getImportantEvents():getDailyEvents();
  const specialSet=new Set(events.map(e=>e.date));
  const spClass=type==='rose'?'special-rose':'special-blue';
  const today=new Date();
  const firstDay=new Date(year,month,1).getDay();
  const lastDate=new Date(year,month+1,0).getDate();
  const prevLast=new Date(year,month,0).getDate();
  let cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevLast-i,curr:false});
  for(let d=1;d<=lastDate;d++)cells.push({day:d,curr:true});
  let t=1;while(cells.length%7!==0)cells.push({day:t++,curr:false});
  grid.innerHTML='';
  cells.forEach(({day,curr})=>{
    const el=document.createElement('div');
    el.className='cal-day';el.textContent=day;
    if(!curr){el.classList.add('other');}
    else{
      const ds=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      if(specialSet.has(ds)){el.classList.add(spClass);el.addEventListener('click',()=>jumpToTLEvent(type,ds));}
      if(day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear())el.classList.add('today');
    }
    grid.appendChild(el);
  });
}
function calNav(type,dir){
  calState[type].month+=dir;
  if(calState[type].month>11){calState[type].month=0;calState[type].year++;}
  if(calState[type].month<0){calState[type].month=11;calState[type].year--;}
  renderCal(type);
}

/* 日期列表 */
function renderSDList(type){
  const el=document.getElementById('sd-list-'+type);if(!el)return;
  const events=type==='rose'?getImportantEvents():getDailyEvents();
  if(!events.length){el.innerHTML='<div style="font-size:11px;color:var(--t3);letter-spacing:2px;padding:8px 0;">暂无记录</div>';return;}
  el.innerHTML=events.map(e=>`
    <div class="sd-item" onclick="jumpToTLEvent('${type}','${e.date}')">
      <span class="sd-dot ${type==='rose'?'rose':'purple'}"></span>
      <div class="sd-info">
        <div class="sd-date">${e.date}</div>
        <div class="sd-label">${e.title}</div>
      </div>
      <span class="sd-arrow">›</span>
    </div>`).join('');
}

/* 跳转+高亮 */
function jumpToTLEvent(type,dateId){
  const targetTab=type==='rose'?'important':'daily';
  if(!document.getElementById('panel-'+targetTab).classList.contains('active'))switchTLTab(targetTab);
  setTimeout(()=>{
    const target=document.getElementById('tl-row-'+dateId);
    if(!target)return;
    target.scrollIntoView({behavior:'smooth',block:'center'});
    target.classList.remove('jumped');void target.offsetWidth;
    target.classList.add('jumped');
    setTimeout(()=>target.classList.remove('jumped'),1500);
  },80);
}

/* Tab切换 */
function switchTLTab(tab){
  document.querySelectorAll('.tl-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tl-tab').forEach(b=>b.classList.remove('active-rose','active-blue'));
  if(tab==='important'){
    document.getElementById('panel-important').classList.add('active');
    document.getElementById('tab-important').classList.add('active-rose');
  }else{
    document.getElementById('panel-daily').classList.add('active');
    document.getElementById('tab-daily').classList.add('active-blue');
  }
}

/* 渲染事件行 */
function renderTLRows(type){
  const containerId=type==='rose'?'tl-rows-rose':'tl-rows-blue';
  const rows=document.getElementById(containerId);if(!rows)return;
  const events=(type==='rose'?getImportantEvents():getDailyEvents()).map(e=>({...e,_api:true,_dbId:e.id}));
  const isDot=type==='rose'?'dot-rose':'dot-blue';
  const barClass=type==='rose'?'tl-card-bar-rose':'tl-card-bar-blue';
  const dateClass=type==='rose'?'tl-date-rose':'tl-date-blue';
  const tagClass=type==='rose'?'tl-event-tag-rose':'tl-event-tag-blue';
  const endDot=type==='rose'?'tl-end-dot-rose':'tl-end-dot-blue';
  const yearInnerCls=type==='rose'?'year-inner-rose':'year-inner-blue';
  if(!events.length){rows.innerHTML='<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:60px;text-align:center;">暂无记录 · 管理员可点击上方按钮添加</div>';return;}
  let html='',lastYear='',idx=0;
  events.forEach(e=>{
    const yr=e.date?e.date.slice(0,4):'';
    if(yr&&yr!==lastYear){html+=`<div class="tl-year-stamp"><div class="tl-year-inner ${yearInnerCls}">${yr}</div></div>`;lastYear=yr;}
    const isLeft=idx%2===0;
    const dateDisp=e.date?e.date.slice(5):'';
    const safeTitle=(e.title||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
    const safeImg=(e.image_url||'').replace(/'/g,"\\'");
    // 卡片内容
    const cardInner=`<div class="${barClass}"></div>
      <div class="tl-card-body">
        ${e.description&&e.description.includes('|')?`<div class="${tagClass}">${e.description.split('|')[0]}</div>`:(e.description?`<div class="${tagClass}">${e.description.slice(0,12)}</div>`:'')}
        <div class="${dateClass}">${dateDisp} <span>${yr}</span></div>
        <div class="tl-title">${e.title}</div>
        ${e.description?`<div class="tl-desc">${e.description.includes('|')?e.description.split('|').slice(1).join('|'):e.description}</div>`:''}
        ${e._api&&S.isAdmin()?`<div class="tl-event-admin-bar">
          <button class="btn-edit" onclick="event.stopPropagation();openEditTL(${e._dbId},'${encodeURIComponent(e.title)}','${e.date}','${encodeURIComponent(e.description||'')}','${e.emoji||''}','${encodeURIComponent(e.image_url||'')}','${e.color}',${e.is_big||false})">✏️ 编辑</button>
          <button class="btn-danger" onclick="event.stopPropagation();delTLDate(${e._dbId})">🗑 删除</button>
        </div>`:''}
      </div>
      ${e.video_url?`<a class="tl-video-btn tl-video-btn-${type==='rose'?'rose':'blue'}" href="${e.video_url}" target="_blank" onclick="event.stopPropagation()">观看视频</a>`:''}
      ${e.image_url?`<img class="tl-card-img" src="${e.image_url}" onerror="this.style.display='none'" onclick="event.stopPropagation();openLightbox('${safeImg}','${safeTitle}')">`:'<div class="img-ph"><span class="ph-icon">📷</span>暂无图片</div>'}
      <div class="tl-comment-area" id="tl-ca-${e.event_key}" onclick="event.stopPropagation()">
        <div id="tl-cmts-${e.event_key}"></div>
        ${commentInputHTML('timeline',e.event_key,'tl-cmts-'+e.event_key)}
      </div>`;
    const card=`<div class="tl-card" onclick="toggleTLComment('${e.event_key}')">${cardInner}</div>`;
    if(isLeft){
      html+=`<div class="tl-row ${isDot} ${(e.is_big)?'big':''}" id="tl-row-${e.date}">
        <div class="tl-left">${card}</div>
        <div class="tl-row-dot"></div>
        <div class="tl-right" style="display:block;"></div>
      </div>`;
    }else{
      html+=`<div class="tl-row ${isDot} ${(e.is_big)?'big':''}" id="tl-row-${e.date}">
        <div class="tl-left" style="display:flex;"></div>
        <div class="tl-row-dot"></div>
        <div class="tl-right">${card}</div>
      </div>`;
    }
    idx++;
  });
  html+=`<div class="tl-end"><div class="${endDot}"></div></div>`;
  rows.innerHTML=html;
  events.forEach(e=>loadComments('timeline',e.event_key,'tl-cmts-'+e.event_key));
}
function toggleTLComment(key){const ca=document.getElementById('tl-ca-'+key);if(ca)ca.style.display=ca.style.display==='block'?'none':'block';}

function openAddTLDate(type){
  document.getElementById('tl-type-input').value=type||'important';
  document.getElementById('tl-edit-id').value='';
  document.getElementById('modal-tl-mode-sub').textContent='新增时间线事件';
  ['tl-date-input','tl-title-input','tl-desc-input','tl-emoji-input','tl-img-input','tl-tag-input'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const vi=document.getElementById('tl-video-input');if(vi)vi.value='';
  document.getElementById('tl-big-input').checked=false;
  openModal('modal-add-tldate');
}
async function submitTLDate(){
  if(!S.isAdmin()){toast('⚠️ 仅管理员可操作');return;}
  const editId=document.getElementById('tl-edit-id').value;
  const tlType=document.getElementById('tl-type-input').value; // 'important'|'daily'
  const color=tlType==='daily'?'blue':'pink';
  const date=document.getElementById('tl-date-input').value;
  const tag=(document.getElementById('tl-tag-input').value||'').trim();
  const title=document.getElementById('tl-title-input').value.trim();
  const descBody=document.getElementById('tl-desc-input').value.trim();
  // tag存在时拼接到description前：tag|描述（前端渲染时以|分割）
  const description=tag?(tag+'|'+descBody):descBody;
  const emoji=document.getElementById('tl-emoji-input').value.trim()||'✦';
  const image_url=document.getElementById('tl-img-input').value.trim();
  const video_url=(document.getElementById('tl-video-input').value||'').trim();
  const is_big=document.getElementById('tl-big-input').checked;
  const err=document.getElementById('tl-err');
  if(!date||!title){err.textContent='日期和标题不能为空';return;}
  // event_key = date（唯一键）
  const event_key=date+(editId?'':'-'+Date.now());
  try{
    const body={date,title,description,emoji,image_url,color,is_big,event_key};
    if(video_url)body.video_url=video_url;
    if(editId){
      await api('PUT','/api/timeline/'+editId,body);toast('✨ 已更新');
    }else{
      await api('POST','/api/timeline',body);toast('✨ 日期已添加');
    }
    closeModal('modal-add-tldate');
    err.textContent='';tlInited=false;renderTimeline();
  }catch(e){err.textContent=e.message||'操作失败';}
}
function openEditTL(id,title,date,desc,emoji,img,color,big){
  document.getElementById('tl-edit-id').value=id;
  document.getElementById('tl-type-input').value=color==='blue'?'daily':'important';
  document.getElementById('tl-date-input').value=date;
  const fullDesc=decodeURIComponent(desc||'');
  const parts=fullDesc.split('|');
  document.getElementById('tl-tag-input').value=parts.length>1?parts[0]:'';
  document.getElementById('tl-desc-input').value=parts.length>1?parts.slice(1).join('|'):fullDesc;
  document.getElementById('tl-title-input').value=decodeURIComponent(title);
  document.getElementById('tl-emoji-input').value=emoji;
  document.getElementById('tl-img-input').value=decodeURIComponent(img||'');
  const vi=document.getElementById('tl-video-input');if(vi)vi.value='';
  document.getElementById('tl-big-input').checked=big;
  document.getElementById('modal-tl-mode-sub').textContent='编辑时间线事件';
  openModal('modal-add-tldate');
}
async function delTLDate(dbId){
  if(!S.isAdmin())return;
  if(!confirm('确定删除此时间线事件？'))return;
  try{await api('DELETE','/api/timeline/'+dbId);tlInited=false;renderTimeline();toast('已删除');}
  catch(e){toast('删除失败');}
}

/* ═══════════════════════════════════════
   PHOTOS 照片合集
═══════════════════════════════════════ */
let photosInited=false,currentPhotoFilter='all';
async function renderPhotos(){
  photosInited=true;
  if(S.isAdmin())document.getElementById('admin-photo-area').style.display='block';
  await filterPhotos('all',document.querySelector('.pf-btn'));
}
async function filterPhotos(cat,btn){
  currentPhotoFilter=cat;
  document.querySelectorAll('.pf-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const grid=document.getElementById('photo-grid');
  grid.innerHTML='<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:20px;">加载中...</div>';
  let apiPhotos=[];
  try{
    const url=cat==='all'?'/api/photos':'/api/photos?category='+cat;
    apiPhotos=await api('GET',url);
  }catch(e){}
  const all=apiPhotos.map(p=>({
    id:'a'+p.id, cat:p.category, caption:p.caption,
    author:p.author_name,platform:p.platform,
    url:p.url||'',_api:true,_dbId:p.id
  }));
  if(!all.length){
    grid.innerHTML='<div style="color:var(--t3);font-size:13px;padding:60px;text-align:center;letter-spacing:2px;">暂无照片 · 管理员可点击上方按钮添加</div>';
    return;
  }
  const tagMap={lumu:'tag-lumu',wlj:'tag-wlj',mzc:'tag-mzc',fan:'tag-fan'};
  const tagLabelMap={lumu:'橹穆同框',wlj:'王橹杰',mzc:'穆祉丞',fan:'粉丝投稿'};
  grid.innerHTML=all.map(p=>{
    const safeUrl=p.url.replace(/\\/g,'\\\\').replace(/'/g,'\\\'');
    const safeCap=(p.caption||'').replace(/'/g,'\\\'');
    const tagCls=tagMap[p.cat]||'tag-fan';
    const tagLabel=tagLabelMap[p.cat]||p.cat;
    return`<div class="photo-item">
      <div class="photo-img-wrap" onclick="openLightbox('${safeUrl}','${safeCap}')">
        ${p.url
          ?`<img src="${p.url}" loading="lazy" alt="${safeCap}" onerror="this.style.display='none'">`
          :`<div class="photo-img-ph"><span style="font-size:26px;opacity:.5;">🌸</span><span>暂无图片</span></div>`
        }
      </div>
      <div class="photo-info">
        <div class="photo-tag ${tagCls}">${tagLabel}</div>
        <div class="photo-caption">${p.caption||''}</div>
        <div class="photo-author">📷 ${p.author||''} ${p.platform?'· '+p.platform:''}</div>
      </div>
      <div class="photo-actions">
        <span class="pa-like" onclick="likePhoto('${p.id}',this)">🤍</span>
        ${p._api&&S.isAdmin()?`<button class="btn-edit" onclick="openEditPhoto(${p._dbId},'${encodeURIComponent(p.caption||'')}','${encodeURIComponent(p.url||'')}','${encodeURIComponent(p.author||'')}','${p.platform||'微博'}','${p.cat}')">✏️</button>
          <button class="btn-danger" onclick="deletePhoto(${p._dbId})">🗑</button>`:''}
      </div>
    </div>`;
  }).join('');
}
/* ═══════════════════════════════════════
   VIDEOS 独立视频合集页
═══════════════════════════════════════ */
let videosInited=false,currentVideoFilter='all';
const VIDEO_TAG_LABELS={lumu:'橹穆同框',live:'直播片段',clip:'综艺/节目',fan:'粉丝剪辑'};
const VIDEO_TAG_COLORS={lumu:'color:var(--pink)',live:'color:#f0c050',clip:'color:var(--blue)',fan:'color:var(--lilac)'};
async function renderVideos(){
  videosInited=true;
  if(S.isAdmin())document.getElementById('admin-video-area').style.display='block';
  await filterVideos('all',document.querySelector('.vf-btn'));
}
async function filterVideos(tag,btn){
  currentVideoFilter=tag;
  document.querySelectorAll('.vf-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const grid=document.getElementById('video-grid');
  grid.innerHTML='<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:20px;">加载中...</div>';
  let apiItems=[];
  try{apiItems=await api('GET','/api/media?type=video');}catch(e){}
  // 用tags里的第一个tag作为分类，或fallback 'lumu'
  const all=apiItems.map(o=>({
    id:o.id,title:o.title,url:o.url,img:o.image_url||'',
    platform:o.platform||'',author:o.author_name||'',
    tags:o.tags?JSON.parse(o.tags||'[]'):[],
    date:new Date(o.created_at).toLocaleDateString('zh-CN'),
    vtag:(o.tags?JSON.parse(o.tags||'[]'):[]).find(t=>['lumu','live','clip','fan'].includes(t))||'lumu',
    _dbId:o.id
  })).filter(o=>tag==='all'||o.vtag===tag);
  if(!all.length){
    grid.innerHTML='<div style="color:var(--t3);font-size:13px;padding:60px;text-align:center;letter-spacing:2px;">暂无视频 · 管理员可点击上方按钮添加</div>';
    return;
  }
  grid.innerHTML=all.map(o=>{
    const embed=getEmbedUrl(o.url);
    const safeTitle=o.title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
    const safeUrl=o.url.replace(/'/g,"\\'");
    const tagLabel=VIDEO_TAG_LABELS[o.vtag]||o.vtag;
    const tagColor=VIDEO_TAG_COLORS[o.vtag]||'color:var(--t2)';
    return`<div class="vg-card">
      <div class="vg-thumb" onclick="${embed?`openVideoPlayer('${embed}','${safeTitle}')`:`window.open('${safeUrl}','_blank')`}">
        ${o.img?`<img src="${o.img}" onerror="this.style.display='none'">`:``}
        <div class="vg-play"></div>
        <span class="vg-badge" style="${tagColor}">${tagLabel}</span>
        <span class="vg-dur">${o.platform||''}</span>
      </div>
      <div class="vg-info">
        <div class="vg-title">${o.title}</div>
        <div class="vg-meta">由 ${o.author||'未知'} · ${o.date||''}</div>
        ${o.tags&&o.tags.length?`<div class="vg-desc">${o.tags.filter(t=>!['lumu','live','clip','fan'].includes(t)).join(' · ')}</div>`:''}
      </div>
      <div class="vg-actions">
        ${embed?`<span style="font-size:11px;color:var(--pink);cursor:pointer;" onclick="openVideoPlayer('${embed}','${safeTitle}')">▶ 在线播放</span>`:''}
        <span style="font-size:11px;color:var(--blue);cursor:pointer;" onclick="window.open('${safeUrl}','_blank')">🔗 原链接</span>
        ${S.isAdmin()?`<button class="btn-edit" onclick="openEditLink(${o._dbId},'${encodeURIComponent(o.title)}','${encodeURIComponent(o.url)}','${encodeURIComponent(o.img||'')}','🎬','${encodeURIComponent(o.author||'')}','${o.platform||'bilibili'}','${encodeURIComponent(JSON.stringify(o.tags||[]))}')">✏️</button>
          <button class="btn-danger" onclick="deleteLink(${o._dbId})">🗑</button>`:''}
      </div>
    </div>`;
  }).join('');
}

async function likePhoto(id,el){
  if(!S.isFan()){toast('登录后才能点赞');return;}
  try{const r=await api('POST','/api/likes/photo/'+id);el.innerHTML=r.liked?'💗':'🤍';el.classList.toggle('liked',r.liked);}catch(e){toast('点赞失败');}
}
/* lightbox */
function openLightbox(url,cap){
  const lb=document.getElementById('photo-lightbox');
  document.getElementById('lightbox-img').src=url;
  document.getElementById('lightbox-caption').textContent=cap||'';
  lb.style.display='flex';
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('photo-lightbox').style.display='none';
  document.getElementById('lightbox-img').src='';
  document.body.style.overflow='';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLightbox();closeVideoPlayer();}});
document.getElementById('video-player-modal').addEventListener('click',function(e){if(e.target===this)closeVideoPlayer();});

/* file preview + compress */
function previewPhoto(input){
  const file=input.files[0];if(!file)return;
  if(file.size>10*1024*1024){toast('⚠️ 图片超过10MB，请选择小一点的文件');return;}
  const reader=new FileReader();
  reader.onload=ev=>{
    // Compress to max 1200px wide / < 800KB
    const img=new Image();
    img.onload=()=>{
      const MAX=1200,quality=0.82;
      let w=img.width,h=img.height;
      if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      const b64=canvas.toDataURL('image/jpeg',quality);
      document.getElementById('ph-base64').value=b64;
      document.getElementById('ph-preview-img').src=b64;
      document.getElementById('ph-preview').style.display='block';
      document.getElementById('ph-upload-hint').textContent='✅ '+file.name+' (已压缩)';
      document.getElementById('ph-upload-area').style.borderColor='var(--pink)';
      document.getElementById('ph-url').value='';
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

async function submitPhoto(){
  if(!S.isAdmin()){toast('⚠️ 仅管理员可操作');return;}
  const editId=document.getElementById('ph-edit-id').value;
  const caption=document.getElementById('ph-caption').value.trim();
  const base64=document.getElementById('ph-base64').value;
  const urlInput=document.getElementById('ph-url').value.trim();
  const author_name=document.getElementById('ph-author').value.trim()||'管理员';
  const platform=document.getElementById('ph-platform').value;
  const category=document.getElementById('ph-cat').value;
  const err=document.getElementById('ph-err');
  if(!caption){err.textContent='请填写说明';return;}
  if(!base64&&!urlInput&&!editId){err.textContent='请上传图片文件或填写图片链接';return;}
  const url=base64||urlInput;
  const btn=document.querySelector('#modal-add-photo .btn-full');
  if(btn){btn.disabled=true;btn.textContent='保存中...';}
  try{
    if(editId){
      const payload={caption,author_name,platform,category};
      if(url)payload.url=url;
      await api('PUT','/api/photos/'+editId,payload);
      toast('✨ 照片已更新');
    }else{
      await api('POST','/api/photos',{caption,url,emoji:'🌸',author_name,platform,category});
      toast('✨ 照片已添加');
    }
    closeModal('modal-add-photo');
    resetPhotoForm();
    await filterPhotos(currentPhotoFilter,document.querySelector('.pf-btn.active'));
  }catch(e){err.textContent=e.message||'操作失败';}
  finally{if(btn){btn.disabled=false;btn.textContent='保存 ✦';}}
}
function resetPhotoForm(){
  ['ph-caption','ph-url','ph-author'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ph-edit-id').value='';
  document.getElementById('ph-base64').value='';
  document.getElementById('ph-preview').style.display='none';
  document.getElementById('ph-upload-hint').textContent='📷 点击选择图片文件';
  document.getElementById('ph-upload-area').style.borderColor='';
  const fi=document.getElementById('ph-file');if(fi)fi.value='';
  document.getElementById('ph-err').textContent='';
  document.getElementById('modal-photo-mode-sub').textContent='新增照片';
}
function openEditPhoto(id,caption,url,author,platform,cat){
  document.getElementById('ph-edit-id').value=id;
  document.getElementById('ph-caption').value=decodeURIComponent(caption);
  document.getElementById('ph-url').value=decodeURIComponent(url);
  document.getElementById('ph-author').value=decodeURIComponent(author);
  document.getElementById('ph-platform').value=platform;
  document.getElementById('ph-cat').value=cat;
  document.getElementById('ph-base64').value='';
  document.getElementById('modal-photo-mode-sub').textContent='编辑照片';
  openModal('modal-add-photo');
}
async function deletePhoto(dbId){
  if(!S.isAdmin())return;
  if(!confirm('确定删除此照片？'))return;
  try{await api('DELETE','/api/photos/'+dbId);await filterPhotos(currentPhotoFilter,document.querySelector('.pf-btn.active'));toast('已删除');}
  catch(e){toast('删除失败');}
}

/* ═══════════════════════════════════════
   WORLD + OUTPUT (merged)
═══════════════════════════════════════ */
const WORLD_CONFIG={
  lumu:{title:'橹穆世界',emoji:'🌍',desc:'橹穆CP专属讨论区'},
  quanen:{title:'全恩世界',emoji:'💗',desc:'全恩CP专属讨论区'},
  jiec:{title:'杰丞世界',emoji:'💙',desc:'杰丞CP专属讨论区'},
  tunman:{title:'豚馒世界',emoji:'🐷',desc:'豚馒专属讨论区'},
  video:{title:'视频合集',emoji:'🎬',desc:'橹穆相关视频'},
  article:{title:'文章合集',emoji:'📝',desc:'橹穆相关文章'},
  material:{title:'物料专区',emoji:'🗂',desc:'应援物料下载'},
};
let worldInited=false,currentWorld='lumu';
function renderWorld(){
  worldInited=true;
  switchWorld('lumu',document.querySelector('.wt-btn'));
}
async function switchWorld(w,btn){
  currentWorld=w;
  document.querySelectorAll('.wt-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const area=document.getElementById('world-content-area');
  const cfg=WORLD_CONFIG[w];
  const isLinkType=['video','article','material'].includes(w);
  if(isLinkType){
    await renderWorldLinks(w,area,cfg);
  }else{
    await renderWorldPosts(w,area,cfg);
  }
}
/* ── 视频链接转换为可嵌入 embed URL ── */
function getEmbedUrl(url){
  if(!url) return null;
  // bilibili: https://www.bilibili.com/video/BVxxxxxxx  or  /video/av123
  const bv = url.match(/bilibili\.com\/video\/(BV[^/?&#]+|av\d+)/i);
  if(bv) return 'https://player.bilibili.com/player.html?bvid='+bv[1]+'&autoplay=0&high_quality=1';
  // YouTube: youtu.be/ID  or  youtube.com/watch?v=ID  or  youtube.com/shorts/ID
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  if(yt) return 'https://www.youtube.com/embed/'+yt[1];
  return null;
}

async function renderWorldLinks(type,area,cfg){
  area.innerHTML=`<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:20px;">加载中...</div>`;
  let adminBar='';
  if(S.isAdmin()){
    adminBar=`<div class="admin-panel" style="margin-bottom:20px;">
      <div class="admin-panel-title">👑 管理员工具 · ${cfg.title}</div>
      <div class="admin-actions">
        <button class="admin-upload-btn" onclick="openAddLink('${type}')">＋ 添加${type==='video'?'视频':type==='article'?'文章':'物料'}链接</button>
      </div>
    </div>`;
  }
  let apiItems=[];
  try{apiItems=await api('GET','/api/media?type='+type);}catch(e){}
  const all=apiItems.map(o=>({
    type:o.type,title:o.title,url:o.url,emoji:o.emoji||'🎬',
    author:o.author_name||'',platform:o.platform||'',
    tags:o.tags?JSON.parse(o.tags||'[]'):[],
    img:o.image_url||'',
    date:new Date(o.created_at).toLocaleDateString('zh-CN'),
    _api:true,_dbId:o.id
  }));
  if(!all.length){
    area.innerHTML=adminBar+'<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:60px;text-align:center;">暂无内容 · 管理员可点击上方按钮添加</div>';
    return;
  }
  const isVideo = type==='video';
  const cards=all.map(o=>{
    const embed=isVideo?getEmbedUrl(o.url):null;
    const safeTitle=o.title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
    const safeUrl=o.url.replace(/'/g,"\\'");
    // thumb area: if video+embed → show play button overlay; if has cover img → show img; else emoji
    let thumbHtml='';
    if(embed){
      thumbHtml=`<div class="wl-thumb wl-thumb-video" onclick="openVideoPlayer('${embed}','${safeTitle}')">
        ${o.img?`<img src="${o.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`:''}
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);">
          <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.15);backdrop-filter:blur(4px);border:2px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:22px;padding-left:4px;">▶</div>
        </div>
        <div class="wl-type-badge">${cfg.emoji} ${o.platform||''}</div>
      </div>`;
    } else {
      thumbHtml=`<div class="wl-thumb" onclick="window.open('${safeUrl}','_blank')" style="cursor:pointer;">
        ${o.img?`<img src="${o.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`:''}
        <span style="font-size:44px;${o.img?'position:absolute;opacity:.12;':''}">${o.emoji}</span>
        <div class="wl-type-badge">${cfg.emoji} ${o.platform||''}</div>
      </div>`;
    }
    return`<div class="wl-card">
      ${thumbHtml}
      <div class="wl-body">
        <div class="wl-title">${o.title}</div>
        <div class="wl-meta">由 ${o.author||'未知'} · ${o.date||''}</div>
        ${o.tags&&o.tags.length?`<div class="wl-tags">${o.tags.map(t=>`<span class="wl-tag">${t}</span>`).join('')}</div>`:''}
      </div>
      <div class="wl-actions">
        ${embed?`<span style="font-size:11px;color:var(--pink);cursor:pointer;" onclick="openVideoPlayer('${embed}','${safeTitle}')">▶ 在线播放</span>`:''}
        <span style="font-size:11px;color:var(--blue);cursor:pointer;" onclick="window.open('${safeUrl}','_blank')">🔗 原链接</span>
        ${o._api&&S.isAdmin()?`<button class="btn-edit" onclick="openEditLink(${o._dbId},'${encodeURIComponent(o.title)}','${encodeURIComponent(o.url)}','${encodeURIComponent(o.img||'')}','${o.emoji}','${encodeURIComponent(o.author||'')}','${o.platform||'bilibili'}','${encodeURIComponent(JSON.stringify(o.tags||[]))}')">✏️</button>
        <button class="btn-danger" onclick="deleteLink(${o._dbId})">🗑</button>`:''}
      </div>
    </div>`;
  }).join('');
  area.innerHTML=adminBar+`<div class="world-links-grid">${cards}</div>`;
}

/* ── 视频播放弹窗 ── */
function openVideoPlayer(embedUrl,title){
  document.getElementById('vp-title').textContent=title||'';
  document.getElementById('vp-frame').src=embedUrl;
  document.getElementById('video-player-modal').style.display='flex';
  document.body.style.overflow='hidden';
}
function closeVideoPlayer(){
  document.getElementById('video-player-modal').style.display='none';
  document.getElementById('vp-frame').src='';
  document.body.style.overflow='';
}
async function renderWorldPosts(w,area,cfg){
  let apiPosts=[];
  try{apiPosts=await api('GET','/api/world/'+w);}catch(e){}
  const all=apiPosts.map(p=>({
    id:p.post_key,username:p.username,badge:p.badge,
    time:p.created_at,body:p.body,likes:p.likes||0,
    _api:true,_dbId:p.id
  }));
  let adminBar='';
  if(S.isAdmin()){
    adminBar=`<div class="admin-panel" style="margin-bottom:20px;">
      <div class="admin-panel-title">👑 管理员工具 · ${cfg.title}</div>
    </div>`;
  }
  const postBox=S.isFan()?`
    <div class="card" style="padding:18px;margin-bottom:20px;">
      <div style="font-size:12px;color:var(--t3);letter-spacing:2px;margin-bottom:10px;">✦ 发布内容</div>
      <textarea class="fi" id="world-post-input-${w}" placeholder="分享你的想法..." style="min-height:80px;"></textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:10px;">
        <button class="btn-p" onclick="submitPost()">发布 ✦</button>
      </div>
    </div>`:`<div style="margin-bottom:20px;padding:14px 18px;border-radius:var(--r);background:rgba(245,184,208,.06);border:1px solid rgba(245,184,208,.15);font-size:12px;color:var(--t3);letter-spacing:2px;text-align:center;">
      路人身份仅可浏览 &nbsp;·&nbsp; <a href="lumu-index.html" style="color:var(--pink);">登录</a> 后可发帖
    </div>`;
  const postsHtml=all.length?all.map(p=>renderWorldPost(p,w)).join(''):'<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:20px 0;">还没有帖子，来发第一条吧～</div>';
  area.innerHTML=adminBar+postBox+postsHtml;
}
function renderWorldPost(p,w){
  const av=p.username==='admin'?'👑':'💙';
  return`<div class="wp-card" id="wp-${p.id}">
    <div class="wp-header">
      <div class="wp-av">${av}</div>
      <div><span class="wp-user">${p.username}</span><span class="wp-badge">${p.badge||'访客'}</span></div>
      <span class="wp-time">${fmtTime(p.time||p.created_at)}</span>
    </div>
    <div class="wp-body">${p.body}</div>
    <div class="wp-actions">
      <span class="wp-act" id="wpl-${p.id}" onclick="likeWorldPost('${p.id}',this)">🤍 ${p.likes||0}</span>
      ${S.isAdmin()&&p._api?`<span class="wp-act" style="color:#ff8aaa;margin-left:auto;" onclick="deleteWorldPost(${p._dbId},'${w}')">🗑 删除</span>`:''}
    </div>
  </div>`;
}
async function likeWorldPost(postId,el){
  if(!S.isFan()){toast('登录后才能点赞');return;}
  try{const r=await api('POST',`/api/likes/world_post/${postId}`);const cur=parseInt(el.textContent.replace(/\D/g,''))||0;el.innerHTML=(r.liked?'💗':'🤍')+' '+(r.liked?cur+1:Math.max(0,cur-1));el.classList.toggle('liked',r.liked);}
  catch(e){toast('点赞失败');}
}
async function deleteWorldPost(dbId,w){
  if(!S.isAdmin())return;
  try{await api('DELETE','/api/world/post/'+dbId);toast('已删除');switchWorld(w,null);}
  catch(e){toast('删除失败');}
}
async function submitPost(){
  if(!S.isFan()){toast('🌸 请先登录后才能发帖');return;}
  const textarea=document.getElementById('world-post-input-'+currentWorld);
  const body=textarea?textarea.value.trim():'';
  if(!body){toast('内容不能为空');return;}
  try{await api('POST','/api/world/'+currentWorld,{body});if(textarea)textarea.value='';await switchWorld(currentWorld,null);toast('✨ 发布成功');}
  catch(e){toast(e.message||'发布失败');}
}
// Link management
function openAddLink(type){
  document.getElementById('lk-type').value=type;
  document.getElementById('lk-edit-id').value='';
  document.getElementById('modal-link-mode-sub').textContent='新增链接';
  ['lk-title','lk-url','lk-img','lk-emoji','lk-author','lk-tags'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('lk-emoji').value=type==='video'?'🎬':type==='article'?'📝':'🗂';
  openModal('modal-add-link');
}
function openEditLink(id,title,url,img,emoji,author,platform,tagsJson){
  document.getElementById('lk-edit-id').value=id;
  document.getElementById('lk-title').value=decodeURIComponent(title);
  document.getElementById('lk-url').value=decodeURIComponent(url);
  document.getElementById('lk-img').value=decodeURIComponent(img);
  document.getElementById('lk-emoji').value=emoji;
  document.getElementById('lk-author').value=decodeURIComponent(author);
  document.getElementById('lk-platform').value=platform;
  try{const t=JSON.parse(decodeURIComponent(tagsJson));document.getElementById('lk-tags').value=t.join(',');}catch(e){}
  document.getElementById('modal-link-mode-sub').textContent='编辑链接';
  openModal('modal-add-link');
}
async function submitLink(){
  if(!S.isAdmin()){toast('⚠️ 仅管理员可操作');return;}
  const editId=document.getElementById('lk-edit-id').value;
  const type=document.getElementById('lk-type').value||currentWorld;
  const title=document.getElementById('lk-title').value.trim();
  const url=document.getElementById('lk-url').value.trim();
  const image_url=document.getElementById('lk-img').value.trim();
  const emoji=document.getElementById('lk-emoji').value.trim()||'🎬';
  const author_name=document.getElementById('lk-author').value.trim()||'管理员';
  const platform=document.getElementById('lk-platform').value;
  const tagsRaw=document.getElementById('lk-tags').value.trim();
  const tags=tagsRaw?JSON.stringify(tagsRaw.split(',').map(t=>t.trim()).filter(Boolean)):'[]';
  const err=document.getElementById('lk-err');
  if(!title||!url){err.textContent='请填写标题和链接';return;}
  try{
    if(editId){
      await api('PUT','/api/media/'+editId,{type,title,url,image_url,emoji,author_name,platform,tags});
      toast('✨ 已更新');
    }else{
      await api('POST','/api/media',{type,title,url,image_url,emoji,author_name,platform,tags});
      toast('✨ 添加成功');
    }
    closeModal('modal-add-link');err.textContent='';
    await switchWorld(type,document.querySelector(`.wt-btn[data-world="${type}"]`));
  }catch(e){err.textContent=e.message||'操作失败';}
}
async function deleteLink(dbId){
  if(!S.isAdmin())return;
  if(!confirm('确定删除？'))return;
  try{await api('DELETE','/api/media/'+dbId);await switchWorld(currentWorld,document.querySelector(`.wt-btn[data-world="${currentWorld}"]`));toast('已删除');}
  catch(e){toast('删除失败');}
}

/* ═══════════════════════════════════════
   EVENTS 大事件
═══════════════════════════════════════ */
let eventsInited=false;
async function renderEvents(){
  eventsInited=true;
  if(S.isAdmin())document.getElementById('admin-event-area').style.display='block';
  const el=document.getElementById('events-list');
  el.innerHTML='<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:20px;">加载中...</div>';
  let apiEvents=[];
  try{apiEvents=await api('GET','/api/events');}catch(e){}
  const all=apiEvents.map(ev=>({
    id:ev.event_key,title:ev.title,content:ev.content,
    date:ev.date_label||new Date(ev.created_at).toLocaleDateString('zh-CN'),
    admin:ev.admin||'管理员',img:ev.image_url||'',
    _api:true,_dbId:ev.id
  }));
  if(!all.length){
    el.innerHTML='<div style="color:var(--t3);font-size:13px;letter-spacing:3px;padding:60px;text-align:center;">暂无公告 · 管理员可在上方发布</div>';
    return;
  }
  el.innerHTML=all.map((ev,idx)=>`
    <div class="ev-card ${idx===0?'featured':''}">
      <div class="ev-top-bar"></div>
      <div class="ev-body">
        ${idx===0?'<div class="ev-pin">★ 最新公告</div>':''}
        <div class="ev-type-tag ${idx===0?'gold':''}">📣 ${idx===0?'橹穆宇宙公告':'官方公告'}</div>
        <div class="ev-title">${ev.title}</div>
        ${ev.img?`<img src="${ev.img}" class="ev-img" onerror="this.style.display='none'" onclick="openLightbox('${ev.img.replace(/'/g,"\\'")}','${(ev.title||'').replace(/'/g,"\\'")}')">`:'' }
        <div class="ev-content" style="white-space:pre-line;">${ev.content}</div>
        <div class="ev-footer">
          <span class="ev-date">📅 ${ev.date}</span>
          <span class="ev-sig">— ${ev.admin}</span>
        </div>
      </div>
      ${ev._api&&S.isAdmin()?`<div class="ev-admin-bar">
        <button class="btn-edit" onclick="openEditEvent(${ev._dbId},'${encodeURIComponent(ev.title)}','${encodeURIComponent(ev.content)}','${encodeURIComponent(ev.img||'')}')">✏️ 编辑</button>
        <button class="btn-danger" onclick="delEvent(${ev._dbId})">🗑 删除</button>
      </div>`:''}
      <div class="ev-comments">
        <div style="font-size:11px;letter-spacing:2px;color:var(--t3);margin-bottom:10px;">💬 评论</div>
        <div id="ev-cmts-${ev.id}"></div>
        ${commentInputHTML('event',ev.id,'ev-cmts-'+ev.id)}
      </div>
    </div>`).join('');
  all.forEach(ev=>loadComments('event',ev.id,'ev-cmts-'+ev.id));
}
async function publishEvent(){
  if(!S.isAdmin())return;
  const title=document.getElementById('ev-title-input').value.trim();
  const content=document.getElementById('ev-content-input').value.trim();
  const image_url=document.getElementById('ev-img-input').value.trim();
  if(!title||!content){toast('请填写标题和内容');return;}
  try{
    await api('POST','/api/events',{title,content,image_url});
    document.getElementById('ev-title-input').value='';
    document.getElementById('ev-content-input').value='';
    document.getElementById('ev-img-input').value='';
    eventsInited=false;renderEvents();
    toast('✨ 公告已发布，已通知全体粉丝');
  }catch(e){toast(e.message||'发布失败');}
}
function openEditEvent(id,title,content,img){
  document.getElementById('ev-edit-id').value=id;
  document.getElementById('ev-edit-title').value=decodeURIComponent(title);
  document.getElementById('ev-edit-content').value=decodeURIComponent(content);
  document.getElementById('ev-edit-img').value=decodeURIComponent(img);
  openModal('modal-edit-event');
}
async function submitEditEvent(){
  if(!S.isAdmin())return;
  const id=document.getElementById('ev-edit-id').value;
  const title=document.getElementById('ev-edit-title').value.trim();
  const content=document.getElementById('ev-edit-content').value.trim();
  const image_url=document.getElementById('ev-edit-img').value.trim();
  const err=document.getElementById('ev-edit-err');
  if(!title||!content){err.textContent='请填写标题和内容';return;}
  try{
    await api('PUT','/api/events/'+id,{title,content,image_url});
    closeModal('modal-edit-event');err.textContent='';
    eventsInited=false;renderEvents();toast('✨ 公告已更新');
  }catch(e){err.textContent=e.message||'更新失败';}
}
async function delEvent(dbId){
  if(!S.isAdmin())return;
  if(!confirm('确定删除此公告？'))return;
  try{await api('DELETE','/api/events/'+dbId);eventsInited=false;renderEvents();toast('已删除');}
  catch(e){toast('删除失败');}
}

/* ═══════════════════════════════════════
   DM 私信
═══════════════════════════════════════ */
let dmInited=false,currentThread=null;
async function renderDM(){
  dmInited=true;
  if(!S.isFan()){document.getElementById('dm-chat-col').innerHTML='<div style="display:flex;flex:1;align-items:center;justify-content:center;color:var(--t3);font-size:12px;letter-spacing:3px;">请先登录</div>';return;}
  const el=document.getElementById('dm-thread-list');
  el.innerHTML='<div style="color:var(--t3);font-size:12px;padding:16px;">加载中...</div>';
  try{
    const threads=await api('GET','/api/messages/threads');
    if(!threads.length){
      el.innerHTML='<div style="color:var(--t3);font-size:12px;letter-spacing:2px;padding:20px;">暂无私信 ✦</div>';
      el.innerHTML+=`<button class="btn-g" style="width:100%;margin-top:8px;" onclick="openDMThread('admin')">💌 联系管理员</button>`;
      return;
    }
    el.innerHTML=threads.map(t=>`
      <div class="dm-thread" id="dmt-${t.other_user}" onclick="openDMThread('${t.other_user}')">
        <div class="dt-av">💙</div>
        <div class="dt-info"><div class="dt-name">${t.other_user}</div><div class="dt-preview">${t.last_message||''}</div></div>
        <div class="dt-badge ${t.unread?'':'read'}"></div>
      </div>`).join('');
  }catch(e){el.innerHTML='<div style="color:#ff8aaa;font-size:12px;padding:16px;">加载失败</div>';}
}
async function openDMThread(otherId){
  currentThread=otherId;
  document.querySelectorAll('.dm-thread').forEach(t=>t.classList.remove('active'));
  const tEl=document.getElementById('dmt-'+otherId);if(tEl)tEl.classList.add('active');
  const chatCol=document.getElementById('dm-chat-col');
  chatCol.innerHTML=`
    <div class="chat-header">
      <div class="ch-av">💙</div>
      <div><div class="ch-name">${otherId}</div><div class="ch-status">橹穆宇宙成员</div></div>
    </div>
    <div class="chat-messages" id="chat-msgs-${otherId}"></div>
    <div class="chat-input-area">
      <div class="chat-input-row">
        <textarea class="chat-input" id="chat-input" placeholder="发一条消息..." rows="2"></textarea>
        <button class="chat-send" onclick="sendDM('${otherId}')">➤</button>
      </div>
    </div>`;
  try{const msgs=await api('GET','/api/messages/'+otherId);renderDMMessages(otherId,msgs);}catch(e){renderDMMessages(otherId,[]);}
  const inp=document.getElementById('chat-input');
  if(inp)inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendDM(otherId);}});
}
function renderDMMessages(otherId,msgs){
  const el=document.getElementById('chat-msgs-'+otherId);if(!el)return;
  if(!msgs.length){el.innerHTML='<div style="text-align:center;font-size:11px;color:var(--t3);padding:8px 0;">👋 开始聊天吧！</div>';return;}
  el.innerHTML=msgs.map(m=>{const isMe=m.from_user===S.username();return`<div class="chat-msg ${isMe?'mine':''}"><div class="cm-av">${isMe?(S.isAdmin()?'👑':'🌸'):'💙'}</div><div><div class="cm-bubble">${m.body}</div><div class="cm-time">${fmtTime(m.created_at)}</div></div></div>`;}).join('');
  el.scrollTop=el.scrollHeight;
}
async function sendDM(toId){
  if(!S.isFan()){toast('🌸 请先登录后才能发消息');return;}
  const input=document.getElementById('chat-input');
  if(!input||!input.value.trim())return;
  const body=input.value.trim();input.value='';
  try{await api('POST','/api/messages/'+toId,{body});const msgs=await api('GET','/api/messages/'+toId);renderDMMessages(toId,msgs);}
  catch(e){toast('发送失败');}
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.querySelectorAll('.hnc').forEach(c=>{
  c.addEventListener('mouseenter',()=>{c.style.transform='translateY(-5px)';c.style.boxShadow='0 14px 36px rgba(0,0,0,.28)';});
  c.addEventListener('mouseleave',()=>{c.style.transform='';c.style.boxShadow='';});
});
(async function(){
  const sess=S.get();
  if(!sess||!sess.role){window.location.replace('lumu-index.html');return;}
  initNav();
  if(S.isFan())N.fetch().catch(()=>{});
  if(S.isGuest()){const gm=document.getElementById('home-guest-msg');if(gm)gm.style.display='block';}
})();