/* 1024 现场抽奖 · 抽奖页（index.html）。设计见 README.md，接口在 server.js。
   上面是舞台（stage.js）：给围观的人看，扭蛋机、悬念、欢呼、彩带都在那里。下面一条是操作条。
   同一时间只有一台是抽奖台（服务端认的，见 server.js"抽奖台"）；别的打开这个页面是观看：跟着演那一幕，没有按钮，可以点"在这台抽"换过来。
   抽奖台的操作条：
     等着 → 抽一次（空格）→ 舞台上演完 → 中了：登记工号（同工号中过先提醒），登记了才能抽下一次；真登记不了就作废，奖品放回奖池
                                         → 谢谢惠顾：提示发一张猫猫图鉴卡
   抽到什么是服务端定的：一按就去抽，扭蛋晃着等结果。每一次带一个编号（REQ）：连不上就重试，再按也拿同一个编号去，服务端抽过就把那一次原样还回来，不会多抽。
   隔两秒问一次服务端：设置页里作废、登记了，断线时抽的那一次，暂停、换抽奖台，都跟上。页面刷新了，没登记的那一次还在，接着登记。
   舞台上还叠着两样页面上的东西（图片清楚）：左边墙上的奖品榜（各档的图片和名称，不写还剩几份），揭晓时跳出来的奖品卡。 */
(()=>{
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TIER=t=>['谢谢惠顾','一等奖','二等奖','三等奖'][t]||'';
const ERR={closed:'抽奖暂停了（设置页里打开）',disk:'没存上：看一下这台电脑的磁盘',net:'连不上抽奖服务：看一下黑窗口还开着没有',bad:'工号不对：字母、数字、- 和 _，2～32 位',none:'没有这一次'};
const newId=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
// 存在这个标签页里：刷新还在，另开一个标签页是新的
const ss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}}};
const DESK=ss.get('lotto.desk')||newId();ss.set('lotto.desk',DESK);
// 请求最多等 8 秒；连不上、超时都回 {err:'net'}
async function api(m,p,b){const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),8000);
  try{const r=await fetch('api/'+p,{method:m,headers:{'Content-Type':'application/json','X-Desk':DESK},body:b?JSON.stringify(b):undefined,signal:ac.signal});return await r.json()}catch(e){return{err:'net'}}finally{clearTimeout(tm)}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- 操作条：左边一句话，右边按钮 ---------- */
let S=null,cur=null,busy=false,mode=null;   // S：最近一次 /api/state；cur：刚抽到、还在条上的那一次；mode：'desk' 抽奖台 / 'watch' 观看
let REQ=ss.get('lotto.req');                 // 还没拿到回复的那一次的编号
const setReq=v=>{REQ=v;ss.set('lotto.req',v)};
const bar=(title,sub,ctl,cls='')=>{$('say').innerHTML=`<b class="${cls}">${title}</b><span>${sub||'&nbsp;'}</span>`;$('ctl').innerHTML=ctl||'';const f=$('ctl').querySelector('input');if(f)setTimeout(()=>f.focus(),30)};
// 操作条上只提醒一句：奖品都发完了（还剩几份只在设置页看）
const stock=()=>S&&S.allOut?' · 奖品都发完了，抽到的都是谢谢惠顾':'';
const GO=label=>`<button class="pbtn" id="go" ${S&&!S.open?'disabled':''}>${label} <kbd>空格</kbd></button>`;
let idleKey='';const idleNow=()=>JSON.stringify(S&&[S.open,S.note,S.allOut]);
function idle(msg){cur=null;idleKey=idleNow();sc.ready(!!(S&&S.open));
  if(S&&!S.open)return bar('抽奖暂停了','到设置页里点"继续"',GO('抽一次'));
  bar('下一位',msg?`<span class="warn">${esc(msg)}</span>`:esc((S&&S.note?S.note:'先确认这个人满足条件，再抽')+stock()),GO('抽一次'));$('go').onclick=go}
function lose(d,why=''){cur=d;bar('谢谢惠顾',`${why?esc(why)+' · ':''}<span class="ok">请发一张猫猫图鉴卡</span>`,GO('下一位 · 抽一次'),'t0');$('go').onclick=go}
// 中了：登记工号。dup 是同工号中过的那几次（工作人员决定还是登记，还是作废这一次）
function win(d,{emp='',err='',dup=null}={}){cur=d;
  const sub=dup?`<span class="warn">${esc(dup.emp)} 之前中过：${dup.prev.map(x=>`第 ${x.no} 次 ${esc(TIER(x.tier))}`).join('、')}</span>`:err?`<span class="warn">${esc(err)}</span>`:'登记工号；活动结束后组织方按工号联系兑奖。登记之前不能抽下一次';
  bar(`${esc(TIER(d.tier))} · ${esc(d.name)}`,sub,dup?`<button class="pbtn" id="force">还是登记 ${esc(dup.emp)}</button><button class="lbtn" id="vd">作废这一次</button><button class="lbtn" id="re">改工号</button>`
    :`<form id="cf"><input type="text" id="emp" maxlength="32" placeholder="工号" autocomplete="off" spellcheck="false" value="${esc(emp)}"><button class="pbtn">登记</button></form><button class="lbtn sm" id="vd">作废</button>`,'t'+d.tier);
  if($('cf'))$('cf').onsubmit=e=>{e.preventDefault();claim($('emp').value,false)};$('vd').onclick=voidIt;
  if($('force'))$('force').onclick=()=>claim(dup.emp,true);if($('re'))$('re').onclick=()=>win(d,{emp:dup.emp})}
function claimed(d){cur=d;bar(`登记好了 · ${esc(d.emp)}`,`${esc(TIER(d.tier))} · ${esc(d.name)} · 活动结束后组织方按工号联系兑奖`,GO('下一位 · 抽一次'),'t'+d.tier);$('go').onclick=go;sc.ready(true)}

// 登记、作废没成：先把原因写在条上，再问一次服务端（可能是设置页里已经登记、作废了，或者换了抽奖台）
async function claim(emp,force){emp=emp.trim();if(!emp)return;const r=await api('POST','claim',{no:cur.no,emp,force});
  if(r.err==='dup')return win(cur,{emp,dup:{emp:emp.replace(/\s+/g,'').toUpperCase(),prev:r.prev}});
  if(r.err){win(cur,{emp,err:ERR[r.err]||'没登记上'});return tick()}try{Sfx.ev('stamp')}catch(e){}await load();claimed(r.draw)}
async function voidIt(){if(!confirm(`作废第 ${cur.no} 次的${TIER(cur.tier)}？奖品放回奖池，这一次不算。`))return;const r=await api('POST','void',{no:cur.no});
  if(r.err){win(cur,{err:ERR[r.err]||'没作废成'});return tick()}hideReveal();await load();idle(`第 ${r.draw.no} 次作废了，奖品放回奖池`)}

// 抽：条上先换成"转啊转"，同时去抽（连不上隔 1.5 秒再试，一共三回）；舞台演完（onShown）再把结果交给条
async function go(){if(mode!=='desk'||busy||(cur&&cur.tier>0&&!cur.emp&&!cur.void)||(S&&!S.open))return;if(!sc.spin())return;busy=true;hideReveal();
  bar('转啊转……','','');if(!REQ)setReq(newId());let r;
  for(let i=0;i<3;i++){r=await api('POST','draw',{req:REQ});if(r.err!=='net')break;bar('转啊转……','<span class="warn">连不上抽奖服务，在重试</span>','');await wait(1500)}
  if(!r.err){setReq(null);return sc.result(r.draw)}
  busy=false;sc.abort();if(r.err==='net'){net(false);return idle('连不上抽奖服务：看一下黑窗口还开着没有。连上以后再按，接着刚才那一次，不会多抽')}
  setReq(null);await tick();if(r.err==='pending'||r.err==='desk')return;idle(ERR[r.err]||'没抽成')}
function shown(d){if(mode==='watch')return watchBar(true);cur=d;busy=false;load().then(()=>d.tier>0?win(d):lose(d))}

const net=ok=>{$('count').classList.toggle('warn',!ok);if(!ok)$('count').textContent='连不上抽奖服务'};
async function load(){const r=await api('GET','state');net(!r.err);if(r.err)return false;S=r;$('count').textContent=`已经抽了 ${r.total} 次`;drawBoard();return true}

/* ---------- 跟上服务端 ---------- */
// 这台是不是抽奖台：服务端说是就是；还没有抽奖台就自己当；刚打开页面时原来那台 10 秒没动静（关掉了）也自己当；别处在抽就观看。
// 开着的观看页（比如大屏）不自动抢，要点"在这台抽"
async function role(){if(S.desk.me)return'desk';if(!S.desk.has||mode===null&&S.desk.ago>10){const r=await api('POST','desk');if(!r.err)return'desk'}return'watch'}
let ticking=false;
async function tick(){if(busy||sc.busy||ticking)return;ticking=true;try{if(!await load())return;
  const m=await role(),changed=m!==mode;mode=m;document.body.classList.toggle('watch',m==='watch');
  if(changed){cur=null;hideReveal()}m==='desk'?deskSync(changed):watchSync(changed)}finally{ticking=false}}
// 抽奖台：正在填工号的不打断，只在服务端的情况变了的时候换条
function deskSync(changed){
  // 断线时抽的那一次：服务端抽过了，回复没回来。中了的走下面"等登记"；谢谢惠顾的在这里补上，别漏发图鉴卡
  const lost=REQ&&S.recent.find(d=>d.req===REQ);if(lost){setReq(null);if(lost.tier===0){reveal(lost);return lose(lost,`第 ${lost.no} 次（断线时抽的）`)}}
  const P=S.pending;if(P){if(!cur||cur.no!==P.no||cur.emp){reveal(P);win(P)}return}
  // 条上那一次不在等登记了：设置页里登记或者作废了
  if(cur&&cur.tier>0&&!cur.emp&&!cur.void){const d=S.recent.find(x=>x.no===cur.no);hideReveal();if(d&&d.emp)return claimed(d);return idle(d&&d.void?`第 ${d.no} 次在设置页作废了，奖品放回奖池`:'')}
  if(changed||!cur&&idleKey!==idleNow())idle()}

/* ---------- 观看：跟着抽奖台演，没有按钮 ---------- */
let seen=null,watchKey='';
function watchSync(changed){const d=S.recent[0];
  if(changed||seen===null){seen=d?d.no:0;sc.ready(false);if(S.pending)reveal(S.pending);return watchBar(true)}
  if(d&&d.no>seen){seen=d.no;if(sc.spin()){hideReveal();sc.result(d);return bar('转啊转……','','')}}
  if(d&&d.void)hideReveal();watchBar(false)}
function watchBar(force){const d=S.recent[0],ago=S.desk.ago,key=JSON.stringify([d&&[d.no,d.emp,d.void],ago>15]);if(!force&&key===watchKey)return;watchKey=key;
  const where=`这台在观看，抽奖在另一台上${ago>15?`（那一台 ${ago} 秒没动静了）`:''}`;let t='等下一位',sub=where,cls='';
  if(d&&!d.void&&d.no===seen){cls='t'+d.tier;if(d.tier===0){t='谢谢惠顾';sub='送一张猫猫图鉴卡 · '+where}else{t=`${esc(TIER(d.tier))} · ${esc(d.name)}`;sub=(d.emp?'登记好了':'等工作人员登记工号')+' · '+where}}
  bar(t,sub,'<button class="lbtn sm" id="take">在这台抽</button>',cls);
  $('take').onclick=async()=>{if(!confirm(`换到这台抽？${ago>15?'':'另一台刚才还在用，'}那一台会变成观看。`))return;const r=await api('POST','desk');if(r.err)return net(false);tick()}}

/* ---------- 叠在舞台上的：奖品榜、奖品卡 ---------- */
const img=f=>f?`<img src="img/${esc(f)}" alt="">`:'';
// 没传图片的，用等级的颜色写一个数字占着
const pic=(f,tier)=>f?img(f):`<i class="t${tier}">${tier?['','壹','贰','叁'][tier]:'卡'}</i>`;
let boardKey='';
function drawBoard(){const P=S.prizes.filter(p=>p.prob>0).sort((a,b)=>a.tier-b.tier),key=JSON.stringify([P.map(p=>[p.tier,p.name,p.img]),S.cardImg]);if(key===boardKey)return;boardKey=key;
  $('board').hidden=!P.length;$('board').innerHTML=`<h3>奖品</h3>`+P.map(p=>`<div class="row"><div class="pic">${pic(p.img,p.tier)}</div><div class="txt"><b class="t${p.tier}">${esc(TIER(p.tier))}</b><span>${esc(p.name)}</span></div></div>`).join('')
    +`<div class="row"><div class="pic">${pic(S.cardImg,0)}</div><div class="txt"><b class="t0">谢谢惠顾</b><span>猫猫图鉴卡</span></div></div>`}
// 扭蛋裂开那一刻（stage.js 叫 onReveal）：中了跳出来，没中沉下来
function reveal(d){const e=$('reveal'),won=d.tier>0,p=won&&S?S.prizes.find(x=>x.id===d.prize):null;
  e.className='win '+(won?'won':'lost')+(scale<4?' small':'');e.style.borderTop='';
  e.innerHTML=`${(won?p&&p.img:S&&S.cardImg)?`<div class="pic">${img(won?p.img:S.cardImg)}</div>`:''}<b class="t${d.tier}">${esc(TIER(d.tier))}${won?'！':''}</b><span>${esc(won?d.name:'送你一张猫猫图鉴卡')}</span>`;e.hidden=false}
function hideReveal(){$('reveal').hidden=true}
function place(el,r){Object.assign(el.style,{left:r.x/sc.W*100+'%',top:r.y/sc.H*100+'%',width:r.w/sc.W*100+'%',height:r.h/sc.H*100+'%'})}

/* ---------- 舞台（stage.js）：一格像素放大成整数倍，铺满上面那一块 ---------- */
const sc=Stage.create({onShown:shown,onReveal:reveal}),cv=$('cv'),ctx=cv.getContext('2d');cv.width=sc.W;cv.height=sc.H;let scale=4;
place($('board'),Stage.LAYOUT.board);place($('reveal'),Stage.LAYOUT.card);
function fit(){const st=$('stage'),w=st.clientWidth,h=st.clientHeight||innerHeight*.6,s=scale=Math.max(1,Math.floor(Math.min(w/sc.W,h/sc.H)));cv.style.width=sc.W*s+'px';cv.style.height=sc.H*s+'px';
  $('reveal').classList.toggle('small',s<4)}
addEventListener('resize',fit);
function frame(ms){use(ctx);sc.draw(ms/1000);requestAnimationFrame(frame)}

// 声音：活动现场默认开着（猫咖里默认关）；条上一个开关，每台记自己的（比如抽奖台关掉、大屏开着）
const paintSnd=()=>{$('snd').textContent='声音 '+(Sound.on?'开':'关')};
$('snd').onclick=()=>{Sound.set(!Sound.on);if(!Sound.on)try{Sfx.stop()}catch(e){}paintSnd()};
addEventListener('pointerdown',()=>{try{Sound.init()}catch(e){}},{once:true});
// 空格 / 回车：等着、谢谢惠顾、登记好了的时候就是"抽一次"；在输入框里不算
addEventListener('keydown',e=>{try{Sound.init()}catch(x){}if((e.key===' '||e.key==='Enter')&&!e.repeat&&document.activeElement.tagName!=='INPUT'&&$('go')&&!$('go').disabled){e.preventDefault();go()}});
setInterval(()=>{if(!document.hidden||mode==='desk')tick()},2000);

PXT.ready.then(async()=>{try{if(localStorage.getItem('cat1024.sound')===null)Sound.set(true)}catch(e){}paintSnd();fit();requestAnimationFrame(frame);
  bar('连接抽奖服务……','','');await tick();if(!S)bar('连不上抽奖服务',esc(ERR.net),'')})})();
