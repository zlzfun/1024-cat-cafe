/* 1024 猫咖 · 组织者后台页面（admin.html）。接口见 docs/组织者后台.md。
   名册里的数有一部分来自玩家自己交上来的存档，抽奖登记也是玩家自己填的：插进网页的每个值都过 esc()，不信任任何字段。
   口令只存在这个标签页里（sessionStorage）；页面本身不含任何秘密，数据都要带着口令去服务端取。
   猫的像素头像用店里同一套画法（dialog-ui.js 的 drawPortrait）。 */
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
async function unlock(){$('login').hidden=true;$('app').hidden=false;$('out').hidden=false;await Promise.all([loadStats(),loadCats(),loadDraws()])}
$('loginf').onsubmit=async e=>{e.preventDefault();key=$('key').value.trim();if(!key)return;try{await api('GET','/stats');try{sessionStorage.setItem(KK,key)}catch(x){}$('key').value='';unlock()}catch(x){}};
$('out').onclick=()=>lock('');

/* ---------- 时间 ---------- */
const p2=n=>String(n).padStart(2,'0');
function when(t){if(!t)return '—';const d=new Date(t),now=new Date(),s=(now-d)/1000;if(s<90)return '刚刚';if(s<3600)return Math.round(s/60)+' 分钟前';
  const hm=p2(d.getHours())+':'+p2(d.getMinutes());if(d.toDateString()===now.toDateString())return '今天 '+hm;return (d.getMonth()+1)+'-'+d.getDate()+' '+hm}

/* ---------- 像素 ---------- */
const portrait=look=>{const c=document.createElement('canvas'),pal=7+(look.coat|0)*6+(look.collar|0);try{drawPortrait(c,pal,0,look.face)}catch(e){}return c};

/* ---------- 概况 ---------- */
async function loadStats(){const s=await api('GET','/stats'),L=s.live||{};
  const T=[['登记的猫',s.cats],['此刻在线',L.online??0,'ok'],['今天来过',s.today],['集齐三个章',s.eligible],['登记抽奖（人）',s.people],['今天挂了几件',s.hungToday],['巨树一共挂过',s.hung],['去过猫猫星球',(s.eggs||{}).planet??0]];
  $('enum').innerHTML=`${esc(s.people??0)} 人<small>能抽的人（按工号算）· 一共 ${esc(s.entries??0)} 份登记</small>`;
  $('stats').innerHTML=T.map(([a,b,k])=>`<div class="stat ${k||''}"><b>${esc(b??0)}</b><span>${a}</span></div>`).join('');const st=s.stamps||{};
  // 彩蛋：每个有几只猫找到（js/world-eggs.js 的 EGGS，顺序一样）；大鱼缸里一共放了几条水晶鱼
  const EG=[['planet','猫猫星球'],['ninelives','九条命'],['shark','鲨鱼来了'],['milk','一口闷'],['disco','迪斯科之夜'],['clock','10:24'],['konami','老秘籍'],['credits','片尾彩蛋']],eg=s.eggs||{};
  $('live').innerHTML=`在线 <b>${esc(L.online??0)}</b> · 盖章：解球 ${esc(st.ball)} / 内源 ${esc(st.inner)} / 官网 ${esc(st.site)}`+(L.cpu!=null?` · 服务端 CPU ${esc(L.cpu)}% · 内存 ${esc(L.rssMB)}MB`:'')+
    `<br>彩蛋（几只猫找到）：${EG.map(([k,n])=>`${n} ${esc(eg[k]||0)}`).join(' / ')} · 吧台大鱼缸里的水晶鱼 ${esc((s.crystal||{}).n||0)} 条`}
setInterval(()=>{if(key&&!$('app').hidden)loadStats().catch(()=>{})},10000);

/* ---------- 名册 ---------- */
async function loadCats(){const r=await api('GET','/cats');cats=r.cats||[];drawRows()}
const canDraw=c=>c.eligible&&c.entry;
function drawRows(){const q=$('q').value.trim().toLowerCase(),el=$('onlyElig').checked,on=$('onlyOn').checked;
  const hit=c=>[c.name,c.entry&&c.entry.real,c.entry&&c.entry.emp].some(v=>v&&String(v).toLowerCase().includes(q));
  const L=cats.filter(c=>(!q||hit(c))&&(!el||canDraw(c))&&(!on||c.online));
  $('rcount').textContent=`${cats.length} 只${q||el||on?` · 符合的 ${L.length} 只`:''}`;
  const tb=$('rows');tb.innerHTML='';
  for(const c of L.slice(0,SHOW)){const tr=document.createElement('tr'),s=c.stamps||{};
    tr.innerHTML=`<td><div class="who"><span class="pc"></span><div><b>${esc(c.name)}</b>${c.online?'<i class="dot" title="在线"></i>':''}${c.banned?'<span class="tag ban">封禁</span>':''}${c.flag?'<span class="tag flag" title="盖了解球章，服务端却没记到它挂过">待核</span>':''}${canDraw(c)?'<span class="tag">能抽</span>':c.eligible?'<span class="tag">集齐</span>':''}</div></div></td>
      <td>${esc(when(c.created))}</td><td>${esc(when(c.last))}</td><td class="n">${esc(c.visits||0)}</td><td class="n">${esc(c.balls||0)}</td><td class="n">${esc(c.hangs||0)}</td>
      <td><span class="st"><i class="${s.ball?'on':''}" title="解一颗球">球</i><i class="${s.inner?'on':''}" title="内源主页">源</i><i class="${s.site?'on':''}" title="官网 / GitHub">官</i></span></td>
      <td class="en">${c.entry?`${esc(c.entry.real)} · ${esc(c.entry.emp)}${c.dup?`<span class="tag flag" title="同一个工号还登记在 ${esc(c.dup)} 只别的猫上">同工号</span>`:''}<br><small>${esc(c.entry.contact)}</small>`:'—'}</td>
      <td>${(c.won||[]).length?esc(c.won.map(n=>'第 '+n+' 轮').join('、')):'—'}</td>
      <td><div class="acts"><button class="lbtn" data-a="rename">换个名字</button><button class="lbtn warn" data-a="ban">${c.banned?'解封':'封禁'}</button></div></td>`;
    tr.querySelector('.pc').replaceWith(portrait(c.look||{}));tr.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a,c));tb.appendChild(tr)}
  $('more').textContent=L.length>SHOW?`只列出前 ${SHOW} 只（最近来过的在前），还有 ${L.length-SHOW} 只，按名字找。`:''}
['q','onlyElig','onlyOn'].forEach(id=>$(id).oninput=drawRows);$('reload').onclick=()=>{loadCats();loadStats()};

/* ---------- 每一行的两件事 ---------- */
function modal(html,wire){$('mbox').innerHTML=html;$('modal').style.display='flex';wire&&wire($('mbox'))}
const close=()=>{$('modal').style.display='none'};$('modal').onclick=e=>{if(e.target===$('modal'))close()};addEventListener('keydown',e=>{if(e.key==='Escape')close()});
function act(a,c){
  if(a==='rename')return modal(`<h2>给「${esc(c.name)}」换个名字</h2><p>从还空着的名字里另发一个。它正在店里的话，自己和别人的画面上马上换成新名字。</p><p class="err"></p><div class="row"><button class="lbtn" data-x>算了</button><button class="pbtn" data-go>换</button></div>`,m=>{
    m.querySelector('[data-x]').onclick=close;m.querySelector('[data-go]').onclick=async()=>{const r=await api('POST','/rename',{id:c.id});
      if(!r.ok){m.querySelector('.err').textContent='没换成';return}modal(`<h2>换好了</h2><p>「${esc(c.name)}」现在叫「${esc(r.name)}」。</p><div class="row"><button class="pbtn" data-x>好</button></div>`,m2=>m2.querySelector('[data-x]').onclick=close);loadCats()}});
  if(a==='ban'){const on=!c.banned;return modal(`<h2>${on?'封禁':'解封'}「${esc(c.name)}」</h2><p>${on?'封禁以后进不了店，正在店里的会被请出去，也抽不到；名字仍然占着。':'解封以后，原来那个浏览器又能进店了。'}</p><div class="row"><button class="lbtn" data-x>算了</button><button class="pbtn" data-go>${on?'封禁':'解封'}</button></div>`,m=>{
    m.querySelector('[data-x]').onclick=close;m.querySelector('[data-go]').onclick=async()=>{await api('POST','/ban',{id:c.id,on});close();loadCats();loadStats()}})}}

/* ---------- 抽奖 ---------- */
async function loadDraws(){const r=await api('GET','/draws');draws=r.draws||[];drawDraws()}
function drawDraws(){$('draws').innerHTML=draws.slice().reverse().map(d=>`<div class="draw"><h3>第 ${esc(d.no)} 轮<span>${esc(when(d.t))} · 从 ${esc(d.pool)} 人里抽了 ${esc(d.winners.length)} 人${d.fresh?' · 排除了抽中过的':''}${d.how?' · '+esc(d.how):''}</span><button class="lbtn" data-ex="${esc(d.no)}">导出</button></h3>
  <div class="wins">${d.winners.map(w=>`<span class="win ${d.no===lastDraw?'new':''}" title="${esc(w.contact||'')}"><b>${esc(w.real||(w.names||[w.name]).join(' / '))}</b>${w.emp?esc(w.emp)+' · ':''}${esc((w.names||[w.name]).join(' / '))}<code>${esc(w.code)}</code></span>`).join('')}</div></div>`).join('')||'<p class="hint">还没抽过。</p>';
  $('draws').querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>download('/export?what=draw&no='+b.dataset.ex))}
$('dgo').onclick=async()=>{const n=+$('dn').value,fresh=$('dfresh').checked,how=$('dhow').value.trim();$('drawerr').textContent='';
  if(!(n>=1&&n<=500)){$('drawerr').textContent='抽 1～500 人';return}
  if(!confirm(`从能抽的人里${fresh?'（排除抽中过的）':''}抽 ${n} 人？\n抽中的人名下的猫会在店里看到领奖码${how?'和这句话：\n'+how:''}`))return;
  const r=await api('POST','/draw',{n,fresh,how});if(r.status===409){$('drawerr').textContent='没有能抽的人（没人登记，或者都抽中过了）';return}if(!r.draw){$('drawerr').textContent='没抽成';return}
  lastDraw=r.draw.no;await loadDraws();loadCats();loadStats()};

/* ---------- 导出 ---------- */
async function download(path){const r=await api('GET',path);if(!r.blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(r.blob);a.download=r.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('exElig').onclick=()=>download('/export?what=people');$('exAll').onclick=()=>download('/export?what=all');

/* ---------- 清空抽奖登记（活动结束、名单导出以后） ---------- */
$('eclear').onclick=async()=>{if(!confirm('清空所有抽奖登记？\n所有猫上的姓名、工号、联系方式，和中奖记录里的，都会删掉，不能撤回。\n要留的名单先导出。'))return;
  const r=await api('POST','/entries/clear');$('emsg').textContent=r.ok?`清掉了 ${r.n} 份登记`:'没清成';loadStats();loadCats();loadDraws()};

if(key)api('GET','/stats').then(unlock).catch(()=>{});else lock('')})();
