/* 1024 猫咖 · 组织者后台页面（admin.html）。接口见 docs/组织者后台.md。
   口令只存在这个标签页里（sessionStorage）；页面本身不含任何秘密，数据都要带着口令去服务端取。
   猫的像素头像用店里同一套画法（dialog-ui.js 的 drawPortrait），暗号的九个图案用进店时同一套（entry-art.js 的 EA.icon）。 */
(()=>{
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KK='cat1024.admin',SHOW=200,API=((window.CAT1024_CONFIG||{}).api||'api').replace(/\/$/,'')+'/admin';
let key='';try{key=sessionStorage.getItem(KK)||''}catch(e){}
let cats=[],draws=[],lastDraw=0;

/* ---------- 接口 ---------- */
async function api(method,path,body){const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json','X-Admin-Key':key},body:body?JSON.stringify(body):undefined});
  if(r.status===401||r.status===429){lock(r.status===429?'试错太多次了，过一会儿再来':'口令不对');throw new Error('auth')}
  const ct=r.headers.get('content-type')||'';if(ct.includes('text/csv'))return{blob:await r.blob(),name:decodeURIComponent((/filename\*=UTF-8''([^;]+)/.exec(r.headers.get('content-disposition')||'')||[])[1]||'名单.csv')};
  return{status:r.status,...await r.json().catch(()=>({}))}}
function lock(msg){key='';try{sessionStorage.removeItem(KK)}catch(e){}$('app').hidden=true;$('out').hidden=true;$('login').hidden=false;$('loginerr').textContent=msg||'';$('live').textContent=''}
async function unlock(){$('login').hidden=true;$('app').hidden=false;$('out').hidden=false;await Promise.all([loadStats(),loadCats(),loadDraws(),loadWords()])}
$('loginf').onsubmit=async e=>{e.preventDefault();key=$('key').value.trim();if(!key)return;try{await api('GET','/stats');try{sessionStorage.setItem(KK,key)}catch(x){}$('key').value='';unlock()}catch(x){}};
$('out').onclick=()=>lock('');

/* ---------- 时间 ---------- */
const p2=n=>String(n).padStart(2,'0');
function when(t){if(!t)return '—';const d=new Date(t),now=new Date(),s=(now-d)/1000;if(s<90)return '刚刚';if(s<3600)return Math.round(s/60)+' 分钟前';
  const hm=p2(d.getHours())+':'+p2(d.getMinutes());if(d.toDateString()===now.toDateString())return '今天 '+hm;return (d.getMonth()+1)+'-'+d.getDate()+' '+hm}

/* ---------- 像素 ---------- */
const portrait=look=>{const c=document.createElement('canvas'),pal=7+(look.coat|0)*6+(look.collar|0);try{drawPortrait(c,pal,0,look.face)}catch(e){}return c};
const iconCv=i=>{const c=document.createElement('canvas');c.width=c.height=9;const o=C;use(c.getContext('2d'));EA.icon(i,0,0);use(o);return c};

/* ---------- 概况 ---------- */
async function loadStats(){const s=await api('GET','/stats'),L=s.live||{};
  const T=[['登记的猫',s.cats],['此刻在线',L.online??0,'ok'],['今天来过',s.today],['有抽奖资格',s.eligible],['今天挂了几件',s.hungToday],['巨树一共挂过',s.hung]];
  $('stats').innerHTML=T.map(([a,b,k])=>`<div class="stat ${k||''}"><b>${b??0}</b><span>${a}</span></div>`).join('');
  $('live').innerHTML=`在线 <b>${L.online??0}</b> · 盖章：解球 ${s.stamps.ball} / 内源 ${s.stamps.inner} / 官网 ${s.stamps.site}`+(L.cpu!=null?` · 服务端 CPU ${L.cpu}% · 内存 ${L.rssMB}MB`:'')}
setInterval(()=>{if(key&&!$('app').hidden)loadStats().catch(()=>{})},10000);

/* ---------- 名册 ---------- */
async function loadCats(){const r=await api('GET','/cats');cats=r.cats||[];drawRows()}
function drawRows(){const q=$('q').value.trim().toLowerCase(),el=$('onlyElig').checked,on=$('onlyOn').checked;
  const L=cats.filter(c=>(!q||c.name.toLowerCase().includes(q))&&(!el||c.eligible)&&(!on||c.online));
  $('rcount').textContent=`${cats.length} 只${q||el||on?` · 符合的 ${L.length} 只`:''}`;
  const tb=$('rows');tb.innerHTML='';
  for(const c of L.slice(0,SHOW)){const tr=document.createElement('tr'),s=c.stamps;
    tr.innerHTML=`<td><div class="who"><span class="pc"></span><div><b>${esc(c.name)}</b>${c.online?'<i class="dot" title="在线"></i>':''}${c.banned?'<span class="tag ban">封禁</span>':''}${c.flag?'<span class="tag flag" title="盖了解球章，服务端却没记到它挂过">待核</span>':''}${c.eligible?'<span class="tag">有资格</span>':''}</div></div></td>
      <td>${when(c.created)}</td><td>${when(c.last)}</td><td class="n">${c.visits||0}</td><td class="n">${c.balls||0}</td><td class="n">${c.hangs||0}</td>
      <td><span class="st"><i class="${s.ball?'on':''}" title="解一颗球">球</i><i class="${s.inner?'on':''}" title="内源主页">源</i><i class="${s.site?'on':''}" title="官网 / GitHub">官</i></span></td>
      <td>${c.won.length?c.won.map(n=>'第 '+n+' 轮').join('、'):'—'}</td>
      <td><div class="acts"><button class="lbtn" data-a="reset">重置暗号</button><button class="lbtn" data-a="rename">改名</button><button class="lbtn warn" data-a="ban">${c.banned?'解封':'封禁'}</button></div></td>`;
    tr.querySelector('.pc').replaceWith(portrait(c.look||{}));tr.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a,c));tb.appendChild(tr)}
  $('more').textContent=L.length>SHOW?`只列出前 ${SHOW} 只（最近来过的在前），还有 ${L.length-SHOW} 只，按名字找。`:''}
['q','onlyElig','onlyOn'].forEach(id=>$(id).oninput=drawRows);$('reload').onclick=()=>{loadCats();loadStats()};

/* ---------- 每一行的三件事 ---------- */
function modal(html,wire){$('mbox').innerHTML=html;$('modal').style.display='flex';wire&&wire($('mbox'))}
const close=()=>{$('modal').style.display='none'};$('modal').onclick=e=>{if(e.target===$('modal'))close()};addEventListener('keydown',e=>{if(e.key==='Escape')close()});
function act(a,c){
  if(a==='reset')return modal(`<h2>重置「${esc(c.name)}」的暗号</h2><p>会换一组随机的四个图案；它在别处登着的都会被登出，要用新暗号重新进店。</p><div class="row"><button class="lbtn" data-x>算了</button><button class="pbtn" data-go>重置</button></div>`,m=>{
    m.querySelector('[data-x]').onclick=close;m.querySelector('[data-go]').onclick=async()=>{const r=await api('POST','/reset',{id:c.id});if(!r.code)return;
      modal(`<h2>「${esc(c.name)}」的新暗号</h2><p>按这个顺序告诉它：</p><div class="code"></div><p class="hint">它进店时点"来过了？领回我的猫"，报名字，再按顺序点这四个图案。这组暗号只显示这一次。</p><div class="row"><button class="pbtn" data-x>好</button></div>`,m2=>{
        const box=m2.querySelector('.code');r.code.forEach((i,k)=>{const d=document.createElement('div');d.append(iconCv(i));d.insertAdjacentHTML('beforeend',`<span>${esc(r.icons[k])}</span><em>第 ${k+1} 个</em>`);box.append(d)});m2.querySelector('[data-x]').onclick=close});loadCats()}});
  if(a==='rename')return modal(`<h2>给「${esc(c.name)}」改名</h2><p>新名字同样要守取名的规矩，也不能和别的猫重名。它正在店里的话，马上就换。</p><input type="text" maxlength="16" value="${esc(c.name)}"><p class="err"></p><div class="row"><button class="lbtn" data-x>算了</button><button class="pbtn" data-go>改</button></div>`,m=>{
    const inp=m.querySelector('input');inp.focus();inp.select();m.querySelector('[data-x]').onclick=close;
    const go=async()=>{const r=await api('POST','/rename',{id:c.id,name:inp.value.trim()});if(r.ok){close();loadCats()}else m.querySelector('.err').textContent=r.why||'没改成'};
    m.querySelector('[data-go]').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go()}});
  if(a==='ban'){const on=!c.banned;return modal(`<h2>${on?'封禁':'解封'}「${esc(c.name)}」</h2><p>${on?'封禁以后进不了店，正在店里的会被请出去；名字仍然占着，别人不能用。':'解封以后，它可以用原来的名字和暗号重新进店。'}</p><div class="row"><button class="lbtn" data-x>算了</button><button class="pbtn" data-go>${on?'封禁':'解封'}</button></div>`,m=>{
    m.querySelector('[data-x]').onclick=close;m.querySelector('[data-go]').onclick=async()=>{await api('POST','/ban',{id:c.id,on});close();loadCats();loadStats()}})}}

/* ---------- 抽奖 ---------- */
async function loadDraws(){const r=await api('GET','/draws');draws=r.draws||[];drawDraws()}
function drawDraws(){$('draws').innerHTML=draws.slice().reverse().map(d=>`<div class="draw"><h3>第 ${d.no} 轮<span>${when(d.t)} · 从 ${d.pool} 只里抽了 ${d.winners.length} 只${d.fresh?' · 排除了抽中过的':''}${d.how?' · '+esc(d.how):''}</span><button class="lbtn" data-ex="${d.no}">导出</button></h3>
  <div class="wins">${d.winners.map(w=>`<span class="win ${d.no===lastDraw?'new':''}"><b>${esc(w.name)}</b><code>${esc(w.code)}</code></span>`).join('')}</div></div>`).join('')||'<p class="hint">还没抽过。</p>';
  $('draws').querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>download('/export?what=draw&no='+b.dataset.ex))}
$('dgo').onclick=async()=>{const n=+$('dn').value,fresh=$('dfresh').checked,how=$('dhow').value.trim();$('drawerr').textContent='';
  if(!(n>=1&&n<=500)){$('drawerr').textContent='抽 1～500 只';return}
  if(!confirm(`从有资格的猫里${fresh?'（排除抽中过的）':''}抽 ${n} 只？\n抽中的猫会在店里看到自己的领奖码${how?'和这句话：\n'+how:''}`))return;
  const r=await api('POST','/draw',{n,fresh,how});if(r.status===409){$('drawerr').textContent='没有能抽的猫（没有有资格的，或者都抽中过了）';return}if(!r.draw){$('drawerr').textContent='没抽成';return}
  lastDraw=r.draw.no;await loadDraws();loadCats();loadStats()};

/* ---------- 导出 ---------- */
async function download(path){const r=await api('GET',path);if(!r.blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(r.blob);a.download=r.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('exElig').onclick=()=>download('/export?what=eligible');$('exAll').onclick=()=>download('/export?what=all');

/* ---------- 屏蔽词 ---------- */
async function loadWords(){const r=await api('GET','/blocked');$('wtext').value=(r.words||[]).join('\n')}
$('wsave').onclick=async()=>{const words=$('wtext').value.split('\n').map(s=>s.trim()).filter(Boolean);const r=await api('PUT','/blocked',{words});$('wmsg').textContent=r.ok?`存好了，一共 ${r.n} 个词`:'没存上'};

if(key)api('GET','/stats').then(unlock).catch(()=>{});else lock('')})();
