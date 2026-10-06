/* 1024 猫咖 · 成品页面：店里的界面（左上头像卡和任务条、右上小地图和集章卡、提示条、图鉴、右键菜单、合照）+ 进店流程 + 存档。
   由 index.html 的加载器在所有脚本到齐后调用 App.boot(progress)。
   - 店里的记录（图鉴、训练营、解了几颗球、集章、上次站在哪）跟着账号存：Account.save，隔几秒存一次，关页面前再存一次。
   - 同一只猫在两个窗口里开着：后开的那个接着玩，先开的那个显示"它在另一个窗口醒着"。
   - 其他在线的猫：接了服务端就联机（net.js + world-online.js，见 docs/联机.md），人少时由机器人补位（数量在 config.js 里）。人类始终不出场。
   - 时段跟着现实的钟，天气跟着日子变。
   - 地址后面加 ?dev 出一条开发用的工具条（机器人数量、时段、天气、触发事件）。 */
const App=(()=>{
const CFG=window.CAT1024_CONFIG||{},DEV=/[?&]dev\b/.test(location.search);
const $=id=>document.getElementById(id),dpr=Math.min(2,window.devicePixelRatio||1),WW=WORLD.w,WH=WORLD.h;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(CFG.links)for(const k in CFG.links)if(LINKS[k]&&CFG.links[k])LINKS[k].url=CFG.links[k];
let game=null,cat=null,pctx,octx,mctx,VW=480,VH=270,SC=3,zoomPref=0,toastT=0,discT=0,replyT=0,banT=0,playing=false,asleep=false,veil=null;
const sfx=(k,a)=>Sound.sfx(k,a);

/* ---------- 存档：跟着账号 ---------- */
let SAVE={},saveT=0,dirty=false;
window.CAT_SAVE={load:k=>SAVE[k],save:(k,v)=>{SAVE[k]=v;touch()}};
function touch(){dirty=true}
function snapshot(){const m=game.me;return{g:SAVE.g||{},stamps:{...game.S.stamps},pos:{x:Math.round(m.x),y:Math.round(m.y)},arrived:1,visits:SAVE.visits||1}}
function flush(keep){if(!cat||asleep||!playing)return;dirty=false;Account.save(snapshot(),keep)}

/* ---------- 界面回调（和样页 v4 一样，去掉了说明页的部分） ---------- */
const NEWS=[];
const ui={prompt:s=>{$('prompt').textContent=s;$('prompt').style.display=s&&!dlg.open&&playing?'block':'none'},toast:s=>{$('toast').textContent=s;$('toast').style.opacity=1;toastT=3.2},
  room:r=>{$('room').firstChild.textContent=r.n;if(!playing||!(game&&game.A.firstRoom&&game.A.firstRoom(r.id)))return;
    if(r.id==='atrium'){game.A.reveal();bigTitle('巨树中庭','毛线巨树','猫猫咖啡馆的家族树 · 爬到树顶，能看整条街');return}
    $('roomban').innerHTML=`<h5>第一次来：${esc(r.n)}</h5><p>${esc(r.d)}</p>`;$('roomban').classList.add('show');banT=5},
  vista:v=>{$('game').classList.toggle('vista',!!v);if(v){$('vcap').innerHTML=`<b>${esc(v.n)}</b><span>${esc(v.sub)}</span><span class="sc" id="vsc"></span><span>${esc(v.hint)}</span><span><kbd>Esc</kbd> 回到店里</span>`;$('tip').style.display='none';closeMenu()}},
  vistaCap:s=>{const e=$('vsc');if(e)e.textContent=s},
  news:s=>{NEWS.push({s,t:performance.now()});if(NEWS.length>5)NEWS.shift();drawNews()},sfx,photo:showPhoto,
  dialog:s=>{dlg.render(s);$('prompt').style.display=s?'none':$('prompt').style.display;if(s){closeMenu();$('tip').style.display='none'}},
  discover:d=>{sfx('disc');$('disc').innerHTML=`<h5>新发现 · ${esc(d.n)}</h5><p>${esc(d.what)}</p>${d.tie?`<p class="tie">${esc(d.tie)}</p>`:''}`;$('disc').classList.add('show');discT=6},
  reply:r=>{sfx('bell');$('reply').innerHTML=`<h5>📮 人类回信 · 毛线球 #${r.no}</h5><q>${esc(r.thx)}</q><div class="chain">球权链：${r.chain.map(esc).join(' → ')}</div>`;$('reply').classList.add('show');replyT=8;drawStamps()},
  stamps:()=>{sfx('stamp');drawStamps();touch()},camp:()=>{panelKey=''},book:()=>openGuide(),renamed:n=>{if(cat)cat.name=n;meKey=''},prizes:L=>L.forEach(queuePrize)};
let bigT1=0,bigT2=0;function bigTitle(a,b,c,delay=1600,hold=4400){const el=$('vtitle');el.innerHTML=`<small>${esc(a)}</small><b>${esc(b)}</b><span>${esc(c)}</span>`;clearTimeout(bigT1);clearTimeout(bigT2);
  bigT1=setTimeout(()=>el.classList.add('show'),delay);bigT2=setTimeout(()=>el.classList.remove('show'),delay+hold)}
function drawNews(){const now=performance.now();$('news').innerHTML=NEWS.filter(n=>now-n.t<12000).map(n=>`<div style="opacity:${now-n.t>9000?.4:1}">${esc(n.s)}</div>`).join('')}
let dlg;
function openLink(k){const L=LINKS[k];if(!L)return;if(L.url)window.open(L.url,'_blank','noopener');else ui.toast('内源主页的地址还没配（config.js 里的 links.inner），先照样盖章');game.A.visit(k);if(dlg.open)dlg.render(dlg.spec);$('game').focus()}

/* ---------- 画面大小：铺满窗口，按整数倍放大像素 ---------- */
function layout(){const aw=innerWidth,ah=innerHeight,auto=aw>=1300&&ah>=700?3:2;SC=Math.max(zoomPref||auto,Math.ceil(ah/WH),Math.ceil(aw/WW));
  VW=Math.min(WW,Math.ceil(aw/SC));VH=Math.min(WH,Math.ceil(ah/SC));const pc=$('pc'),oc=$('oc');
  if(pc.width!==VW||pc.height!==VH){pc.width=VW;pc.height=VH}if(oc.width!==VW*SC*dpr||oc.height!==VH*SC*dpr){oc.width=VW*SC*dpr;oc.height=VH*SC*dpr}
  for(const c of [pc,oc]){c.style.width=VW*SC+'px';c.style.height=VH*SC+'px'}const g=$('game');g.style.width=Math.min(aw,VW*SC)+'px';g.style.height=Math.min(ah,VH*SC)+'px';
  if(game){game.A.live.view=[VW,VH];const v=game.camera(VW,VH,1);game.render(pctx,v.x,v.y,VW,VH);game.hud(octx,SC*dpr,dpr)}}

/* ---------- 左上：头像卡、任务条 / 训练营；右上：集章卡 ---------- */
let meKey='',panelKey='';
function drawMe(){const m=game.me,h=m.hold,G=game.A.guide,st=h?(h.knit?'叼着织好的'+KNIT_NAMES[h.kind][0]:'叼着一颗毛线球'):m.toy?'叼着'+TOY_NAMES[m.toy]:m.place?'窝着':m.hidden?'躲起来了':'空着嘴',k=m.pal+'|'+st+'|'+G.balls()+'|'+G.count()+'|'+m.name;if(k===meKey)return;meKey=k;
  drawPortrait($('mec'),m.pal,0,m.myFace);$('mename').textContent=m.name;$('mest').textContent=st;$('stBall').textContent=G.balls();$('stDisc').textContent=G.count()+' / '+G.total}
function drawPanel(){const A=game.A,tr=A.Q.tracker();let html='';
  if(tr){html=`<h4>🧶 毛线球 #${tr.no}<i>${esc(tr.type)} · E 打开便签</i></h4><div class="q">「${esc(tr.q)}」</div>`+(tr.steps?'<ul>'+tr.steps.map(s=>`<li class="${s.done?'done':s.cur?'cur':''}">${esc(s.t)}</li>`).join('')+'</ul>':`<div class="ln">${esc(tr.line)}</div>`)}
  else if(A.camp.on&&!A.camp.done.finished){const c=A.camp.cur();html=`<h4>🎓 新猫训练营<i>${A.camp.steps.filter(s=>A.camp.done[s.id]).length}/${A.camp.steps.length}</i></h4><ul>`+A.camp.steps.map(s=>`<li class="${A.camp.done[s.id]?'done':s===c?'cur':''}">${esc(s.t)}${s===c?`<br><small>${esc(s.sub)}</small>`:''}</li>`).join('')+'</ul>'}
  if(html!==panelKey){panelKey=html;$('panel').innerHTML=html}}
function drawStamps(){const s=game.S.stamps,n=(s.ball?1:0)+(s.inner?1:0)+(s.site?1:0),en=cat&&cat.entry;$('stamps').innerHTML=`<h4>集章卡<i>${n}/3${n===3?' · 集齐了！':''}</i></h4><div class="row">`+
  [['ball','解球','解一颗球'],['inner','内源','内源主页'],['site','官网','官网 / GitHub']].map(([k,a,b])=>`<div><div class="s ${s[k]?'on':''}">${s[k]?'已盖':a}</div>${b}</div>`).join('')+'</div>'+
  (n===3&&cat?`<div class="lt ${en?'done':''}">${en?'已登记抽奖 · 点这里改':'点这里登记抽奖 →'}</div>`:'')}
function findMe(){game.A.findMe();$('game').focus()}

/* ---------- 图鉴 ---------- */
const ROOM_ORDER=['hall','gallery','atrium','lab','library','kitchen','lounge','yard','path'];
function openGuide(){const G=game.A.guide,all=Object.entries(GUIDE),rn=id=>WORLD.rooms.find(x=>x.id===id).n,got=all.filter(([k])=>G.disc[k]).sort((a,b)=>G.disc[b[0]]-G.disc[a[0]]),lock=all.filter(([k])=>!G.disc[k]);
  const when=ts=>ts>1?' · '+new Date(ts).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  let html=`<div class="top"><b>图鉴</b><span class="prog"><i style="width:${Math.round(got.length/all.length*100)}%"></i></span><span class="num">${got.length} / ${all.length}</span><button id="bookx">关掉（B）</button></div>`;
  html+=`<div class="sec">已解锁<i>${got.length}</i></div>`+(got.length?'<div class="g">'+got.map(([k,g])=>`<div class="e on" data-go="${k}"><span class="ic">✓</span><div><b>${esc(g.n)}</b><small>${esc(rn(g.room))}${when(G.disc[k])}</small><p>${esc(g.what)}</p>${g.tie?`<p class="tie">${esc(g.tie)}</p>`:''}</div></div>`).join('')+'</div>':'<p class="none">还没有。四处逛逛，碰一碰店里的东西。</p>');
  if(lock.length){html+=`<div class="sec">未解锁<i>${lock.length}</i><em>点一下，猫会走过去</em></div>`;
    ROOM_ORDER.forEach(r=>{const L=lock.filter(([,g])=>g.room===r);if(L.length)html+=`<div class="lk"><span class="rn">${esc(rn(r))}</span>`+L.map(([k,g])=>`<span class="e off" data-go="${k}"><span class="ic">✗</span>${esc(g.n)}${g.how?`<small>${esc(g.how)}</small>`:''}</span>`).join('')+'</div>'})}
  $('bookov').innerHTML=html;$('bookov').style.display='block';$('bookx').onclick=closeGuide}
function closeGuide(){$('bookov').style.display='none';$('game').focus()}

/* ---------- 按键说明 ---------- */
function openKeys(){$('keyov').style.display='flex'}function closeKeys(){$('keyov').style.display='none';$('game').focus()}

/* ---------- 输入 ---------- */
const PAW=(()=>{const F=new Set(),add=(x0,y0,w,h)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)F.add(x+','+y)};
  add(2,4,3,3);add(6,2,3,3);add(10,4,3,3);add(5,8,5,1);add(4,9,7,2);add(5,11,5,1);
  const n8=(x,y)=>[-1,0,1].some(dx=>[-1,0,1].some(dy=>F.has((x+dx)+','+(y+dy)))),O=new Set(),Hl=new Set();
  for(let y=0;y<14;y++)for(let x=0;x<15;x++)if(!F.has(x+','+y)&&n8(x,y))O.add(x+','+y);
  for(let y=0;y<14;y++)for(let x=0;x<15;x++){const k=x+','+y;if(F.has(k)||O.has(k))continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>O.has((x+dx)+','+(y+dy))))Hl.add(k)}
  const c=document.createElement('canvas');c.width=30;c.height=28;const x=c.getContext('2d');const dot=(k,col)=>{const [a,b]=k.split(',').map(Number);x.fillStyle=col;x.fillRect(a*2,b*2,2,2)};
  Hl.forEach(k=>dot(k,'#fff4dc'));O.forEach(k=>dot(k,'#241a2e'));F.forEach(k=>dot(k,'#f4a6b8'));return `url(${c.toDataURL()}) 14 4, pointer`})();
const phrasesList=PHRASES;let menuMode='',menuCat=null;
function closeMenu(){$('menu').style.display='none'}
function openMenu(x,y,html){const menu=$('menu');menu.innerHTML=html;menu.style.display='block';const gr=$('game').getBoundingClientRect();menu.style.left=Math.min(x-gr.left,gr.width-290)+'px';menu.style.top=Math.min(y-gr.top,gr.height-menu.offsetHeight-6)+'px'}
function bindInput(){const gameEl=$('game'),pc=$('pc'),tip=$('tip'),menu=$('menu');
  const toW=e=>{const r=pc.getBoundingClientRect();return game.toWorld((e.clientX-r.left)*VW/r.width,(e.clientY-r.top)*VH/r.height)};
  const toC=e=>{const r=pc.getBoundingClientRect();return{x:(e.clientX-r.left)*VW/r.width,y:(e.clientY-r.top)*VH/r.height}};
  const live=()=>playing&&!asleep&&!game.A.arriving();
  gameEl.addEventListener('keydown',e=>{const k=e.key.toLowerCase();Sound.init();if(!live()){e.preventDefault();return}
    if($('keyov').style.display==='flex'){if(e.key==='Escape'||k==='h'||e.key==='?')closeKeys();e.preventDefault();return}
    if($('photo').style.display==='flex'){if(e.key==='Escape')$('photo').style.display='none';e.preventDefault();return}
    if(game.A.vista.on){if(game.A.vista.key(e))e.preventDefault();game.blurKeys();return}
    if($('bookov').style.display==='block'){if(k==='b'||e.key==='Escape')closeGuide();e.preventDefault();return}
    if(dlg.open){if(dlg.key(e))e.preventDefault();game.blurKeys();return}
    if(k==='t'&&!e.repeat){e.preventDefault();const gr=gameEl.getBoundingClientRect();openMenu(gr.left+gr.width/2-80,gr.top+gr.height-230,'<div class="t">快捷短语（按数字键或点一下）</div>'+phrasesList.map((p,i)=>`<button data-ph="${i}">${i+1}　${p}</button>`).join(''));menuMode='ph';return}
    if(menu.style.display==='block'&&menuMode==='ph'&&/^[1-8]$/.test(k)){e.preventDefault();game.cmd.say(phrasesList[+k-1]);closeMenu();return}
    if(k==='z'&&!e.repeat){zoomPref=SC===3?2:3;layout();e.preventDefault();return}
    if(k==='c'&&!e.repeat){findMe();e.preventDefault();return}
    if(k==='b'&&!e.repeat){openGuide();e.preventDefault();return}
    if((k==='h'||e.key==='?')&&!e.repeat){openKeys();e.preventDefault();return}
    if(e.key==='Escape')closeMenu();
    if(game.key(e,true))e.preventDefault()});
  gameEl.addEventListener('keyup',e=>{if(game.key(e,false))e.preventDefault()});
  gameEl.addEventListener('blur',()=>game.blurKeys());
  pc.addEventListener('pointerdown',e=>{if(e.button!==0)return;gameEl.focus();closeMenu();if(!live())return;if(game.A.vista.on){const p=toC(e);game.A.vista.click(p.x,p.y);return}if(dlg.open){const s=dlg.spec;game.A.dlg.act((s.acts||[]).some(a=>a.id==='later')?'later':'close');return}const w=toW(e);game.tap(w.x,w.y)});
  pc.addEventListener('pointermove',e=>{if(!live()){tip.style.display='none';return}if(game.A.vista.on){const p=toC(e);game.A.vista.pointer(p.x,p.y);pc.style.cursor='default';tip.style.display='none';return}const w=toW(e),h=game.hover(w.x,w.y),gr=gameEl.getBoundingClientRect();pc.style.cursor=h?PAW:'default';
    if(!h){tip.style.display='none';return}let html='';
    if(h.cat&&h.cat.desk||h.th&&h.th.id==='deskcat')html=`<b>前台猫</b> · 有事问它<br><span class="what">这附近有什么好玩的、我是哪只猫、毛线球怎么解……想去哪儿，它带你过去</span>`;
    else if(h.cat){const c=h.cat,k=c.kind==='npc'?CAT_CARDS[c.pal]:null;html=k?`<b>${esc(k.name)}</b> · 店猫 · ${esc(k.breed)}（${esc(k.cli)}）<br><span class="how">${esc(k.at)}</span> · <span class="what">擅长：${esc(k.good)}</span>${c.doing?`<br><span class="what">${esc(c.doing)}</span>`:''}`:`<b>${esc(c.name)}</b>${c.doing?' · '+esc(c.doing):''}`}
    else{const g=game.A.guide.info(h.th.id);html=g?`<b>${esc(g.n)}</b>${g.how?`<br><span class="how">${esc(g.how)}</span>`:''}<br><span class="what">${esc(g.what)}</span>${g.tie?`<br><span class="tie">${esc(g.tie)}</span>`:''}`:`<b>${esc(h.label)}</b>`}
    tip.innerHTML=html;tip.style.display='block';const tw=tip.offsetWidth;tip.style.left=Math.min(e.clientX-gr.left+14,gr.width-tw-8)+'px';tip.style.top=(e.clientY-gr.top+14)+'px'});
  pc.addEventListener('pointerleave',()=>{tip.style.display='none';game.hover(-99,-99)});
  pc.addEventListener('contextmenu',e=>{e.preventDefault();gameEl.focus();if(!live()||dlg.open||game.A.vista.on)return;const w=toW(e),c=game.catAt(w.x,w.y);if(!c){closeMenu();return}menuMode='cat';menuCat=c;const me=game.me,ball=me.hold&&!me.hold.knit,k=c.kind==='npc'?CAT_CARDS[c.pal]:null;
    const head=k?`<b>${esc(k.name)}</b> · 店猫 · ${esc(k.breed)}<br>${esc(k.cli)} · ${esc(k.at)}<br>擅长：${esc(k.good)}<br>${esc(k.say)}`:`<b>${esc(c.name)}</b>${c.doing?' · '+esc(c.doing):''}`;
    if(c.desk){openMenu(e.clientX,e.clientY,`<div class="t"><b>前台猫</b> · 有事问它<br>这附近有什么好玩的、我是哪只猫、毛线球怎么解……</div><button data-a="rub">问问它</button><button data-a="follow">跟着它走</button>`);return}
    openMenu(e.clientX,e.clientY,`<div class="t">${head}</div><button data-a="rub">蹭蹭它</button><button data-a="follow">跟着它走</button><button data-a="pass" ${ball?'':'disabled'}>把毛线球传给它${ball?'':'（嘴里没有）'}</button>`)});
  menu.addEventListener('pointerdown',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.ph!=null)game.cmd.say(phrasesList[+b.dataset.ph]);else if(menuCat){const a=b.dataset.a;if(a==='follow')game.cmd.follow(menuCat);game.cmd.social(menuCat,a==='follow'?'follow':a)}closeMenu();gameEl.focus()});
  $('mm').addEventListener('pointerdown',e=>{e.stopPropagation();gameEl.focus();if(!live()||dlg.open||game.A.vista.on)return;const r=$('mm').getBoundingClientRect();game.tap((e.clientX-r.left)/r.width*WW,(e.clientY-r.top)/r.height*WH)});
  $('mecard').onclick=e=>{e.stopPropagation();findMe()};$('stBook').onclick=e=>{e.stopPropagation();openGuide()};$('panel').onclick=e=>{e.stopPropagation();if(game.A.Q.cur)game.A.Q.open();gameEl.focus()};$('stamps').onclick=e=>{e.stopPropagation();if(cat&&full()){openLotto();return}game.A.openWelcome();gameEl.focus()};
  $('bookov').addEventListener('pointerdown',e=>{e.stopPropagation();const d=e.target.closest('[data-go]');if(!d)return;const id=d.dataset.go,th=game.A.TH.find(t=>t.id===id||t.id.replace(/\d$/,'')===id);closeGuide();if(!th)return;
    const h=typeof th.hit==='function'?th.hit(game.me):th.hit,at=typeof th.at==='function'?th.at(game.me):th.at;if(h&&h[2])game.tap(h[0]+h[2]/2,h[1]+h[3]/2);else if(at)game.tap(at.x,at.y)});
  $('phx').onclick=()=>{$('photo').style.display='none';gameEl.focus()};
  // 右下角：按键、声音、离店
  const snd=$('bSnd'),paintSnd=()=>{snd.textContent='声音 '+(Sound.on?'开':'关');snd.classList.toggle('on',Sound.on)};paintSnd();
  snd.onclick=()=>{Sound.set(!Sound.on);paintSnd();gameEl.focus()};$('bKeys').onclick=openKeys;$('keyov').onclick=e=>{if(e.target===$('keyov')||e.target.closest('button'))closeKeys()};
  $('bOut').onclick=()=>{if(!confirm(`让「${cat.name}」离店？\n这个浏览器会忘掉它，以后也找不回来。已经登记的抽奖不受影响。`))return;flush();Account.logout().then(()=>location.reload())}
  // 登记抽奖的表：回车登记，Esc 收起
  $('lgo').onclick=sendLotto;$('lno').onclick=closeLotto;$('lok').onclick=closeLotto;
  $('lotto').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeLotto()}else if(e.key==='Enter'&&e.target.tagName==='INPUT'&&!e.isComposing){e.preventDefault();sendLotto()}})}
function showPhoto(cv,names){const s=4,c=$('phc');c.width=cv.width*s;c.height=cv.height*s;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(cv,0,0,c.width,c.height);
  $('phw').textContent='1024 猫咖 · 合照 · '+names.slice(0,12).join('、')+(names.length>12?` 等 ${names.length} 只猫`:'');$('phs').href=c.toDataURL('image/png');$('photo').style.display='flex'}

/* ---------- 时段跟着现实的钟：7～17 点白天，17～19 点黄昏，其余是夜里 ---------- */
function clockTod(){const h=new Date().getHours();return h>=7&&h<17?'day':h>=17&&h<19?'dusk':'night'}

/* ---------- 天气跟着日子变：每天上午、下午各定一次，按日期算，大家看到的一样；10 月 24 日一定是晴天 ---------- */
function weatherNow(d=new Date()){const m=d.getMonth()+1,day=d.getDate();if(m===10&&day===24)return 'sun';
  let h=(d.getFullYear()*1000+m*50+day*2+(d.getHours()<12?0:1))>>>0;h=Math.imul(h^h>>>15,2246822507)>>>0;h=Math.imul(h^h>>>13,3266489909)>>>0;h=(h^h>>>16)>>>0;const r=h%1000/1000;
  if((m===12||m<=2)&&r<.15)return 'snow';return r>=.8?'rain':'sun'}

/* ---------- 联机：接了服务端才有（设计见 docs/联机.md） ---------- */
function startNet(){if(Account.mode!=='server')return;const L=game.A.live;L.send=o=>Net.send(o);
  Net.start({onState:s=>L.state(s),onMsg:m=>{if(m.t==='bye'){if(m.why==='elsewhere')sleep(true);else gone(m.why);return}if(m.t==='prize'){queuePrize(m);return}L.recv(m)}})}
// 被封禁、这个浏览器记着的猫店里不认了：请出店，点"好"回到进店第一步
function gone(why){playing=false;Net.stop();const T={ban:['这只猫暂时不能进店','有疑问请找组织者。']}[why]||['找不到你的猫了','店里不认这个浏览器记着的猫了。点"好"，重新扭一只。'];
  $('goneh').textContent=T[0];$('gonep').textContent=T[1];$('gone').style.display='flex';$('goneb').onclick=()=>Account.logout().then(()=>location.reload())}
// 抽中了：前台猫来告诉你领奖码。进店动画、对话框、看风景的时候先等等
// 同一轮只弹一次：进店时的账号快照、联机时推过来的、重连时补发的，可能是同一条
const prizeQ=[],prizeNos=new Set(),queuePrize=p=>{if(!p||!Number.isInteger(p.no)||prizeNos.has(p.no))return;prizeNos.add(p.no);prizeQ.push(p)};
function tryPrize(){if(!prizeQ.length||!playing||asleep||dlg.open||game.A.arriving()||game.A.vista.on)return;const p=prizeQ.shift();sfx('fanfare');
  game.A.dlg.show({id:'prize-'+p.no,kind:'info',head:{icon:'star',title:'你被抽中了'},blocks:[{k:'say',pal:DESK_PAL,name:'前台猫',t:`第 ${p.no} 轮抽奖，抽中了你！`},
    {k:'code',label:'领奖码',t:p.code},...(p.how?[{k:'text',t:'怎么领：'+p.how}]:[]),{k:'text',t:'这个码只有你看得到。把它发给组织者，就能领奖。'}],acts:[{id:'ok',t:'记下了',key:'E'}]},{close:()=>Account.prizeSeen(p.no)})}

/* ---------- 登记抽奖：集齐三个章以后（设计见 docs/店内设计.md、docs/组织者后台.md） ----------
   盖上第三个章、手上没别的事时自己弹一次（这一次进店里只弹一次）；以后点集章卡打开，登记过的可以改。只有服务端模式能登记。 */
let lottoAsked=false;
const full=()=>{const s=game.S.stamps;return !!(s.ball&&s.inner&&s.site)},lottoOpen=()=>$('lotto').style.display==='flex';
const LF={real:'lreal',emp:'lemp',contact:'lcon'};
function openLotto(){const e=cat.entry;$('lotto').style.display='flex';$('lerr').textContent='';Object.values(LF).forEach(id=>$(id).classList.remove('bad'));
  if(Account.mode!=='server'){lottoDone('现在是本机模式，没有连着店里的服务器，不能登记抽奖。');return}
  $('ltf').hidden=false;$('ltd').hidden=true;$('ltlead').textContent=e?'改一改登记的信息。':'三个章都集齐了！留下这三项，抽中了好找到你。';
  $('lreal').value=e?e.real:'';$('lemp').value=e?e.emp:'';$('lcon').value=e?e.contact:'';$('lgo').textContent=e?'改好了':'登记';$('lgo').disabled=false;
  setTimeout(()=>$('lreal').focus(),30)}
function lottoDone(t){$('ltf').hidden=true;$('ltd').hidden=false;$('ltdp').textContent=t;setTimeout(()=>$('lok').focus(),30)}
function closeLotto(){$('lotto').style.display='none';$('game').focus()}
async function sendLotto(){if($('lgo').disabled)return;const v={real:$('lreal').value,emp:$('lemp').value,contact:$('lcon').value};Object.values(LF).forEach(id=>$(id).classList.remove('bad'));
  const bad=e=>{$('lerr').textContent=e.why||'格式不对';const f=$(LF[e.field]);if(f){f.classList.add('bad');f.focus()}};
  const b=Account.entryWhy(v);if(b)return bad(b);
  $('lgo').disabled=true;$('lerr').textContent='';await Account.save(snapshot());const r=await Account.entry(v);$('lgo').disabled=false;
  if(r.entry){const first=!cat.entry;cat.entry=r.entry;drawStamps();sfx('stamp');lottoDone(first?'登记好了。抽中了，前台猫会在店里告诉你，组织者也会按你留的联系方式找你。':'改好了。');return}
  if(r.err==='bad'&&LF[r.field])return bad(r);
  $('lerr').textContent=r.err==='stamps'?'三个章还没存到店里，过几秒再点一次':'店门口网不好，等一下再点一次'}
function tryLotto(){if(lottoAsked||!cat||cat.entry||Account.mode!=='server'||!full()||!playing||asleep||dlg.open||prizeQ.length||lottoOpen()||game.A.arriving()||game.A.vista.on)return;lottoAsked=true;openLotto()}

/* ---------- 同一只猫开在两个窗口：后开的接着玩 ---------- */
let chan=null;const TAB=Math.random().toString(36).slice(2);
function claim(){try{chan=chan||new BroadcastChannel('cat1024');chan.onmessage=e=>{const m=e.data||{};if(cat&&m.id===cat.id&&m.tab!==TAB&&m.t==='here'){flush();sleep(true)}};chan.postMessage({t:'here',id:cat.id,tab:TAB})}catch(e){}}
function sleep(on){asleep=on;$('elsewhere').style.display=on?'flex':'none';if(on)Net.stop();else{claim();startNet();$('game').focus()}}

/* ---------- 开发用 ---------- */
function devBar(){const b=$('devbar');b.style.display='flex';const n=CFG.bots??40;
  b.innerHTML=`<span>机器人</span><input type="range" min="0" max="150" value="${n}" id="dvB"><b id="dvBv">${n}</b><span>时段</span>${['day','dusk','night'].map(t=>`<button data-tod="${t}">${{day:'白天',dusk:'黄昏',night:'夜晚'}[t]}</button>`).join('')}<span>天气</span>${['sun','rain','snow'].map(w=>`<button data-wx="${w}">${{sun:'晴',rain:'雨',snow:'雪'}[w]}</button>`).join('')}
    <span>事件</span>${[['arrive','塞几颗球'],['giant','大毛线团'],['ci','CI 红了'],['laser','激光点'],['bubbles','泡泡'],['bird','小鸟']].map(([k,n])=>`<button data-ev="${k}">${n}</button>`).join('')}<span id="dvP"></span>`;
  $('dvB').oninput=e=>{$('dvBv').textContent=e.target.value;game.bots(+e.target.value)};
  b.onclick=e=>{const t=e.target;if(t.dataset.tod){game.S.tod=t.dataset.tod;devTod=true}if(t.dataset.wx){game.S.weather=t.dataset.wx;devTod=true}if(t.dataset.ev){const r=game.cmd.event(t.dataset.ev);if(r)ui.toast(r)}$('game').focus()}}
let devTod=false;

/* ---------- 主循环 ---------- */
let last=performance.now(),fno=0,fpsT=0,fpsN=0,jsT=0;
function loop(ms){const t=ms/1000,dt=Math.min(.05,Math.max(0,(ms-last)/1000));last=ms;fno++;const t0=performance.now();
  if(!asleep){game.tick(t,dt);const V=game.A.vista,vf=V.frame();
    if(vf.show==='vista'){V.draw(pctx,VW,VH);octx.clearRect(0,0,$('oc').width,$('oc').height)}else{const v=game.camera(VW,VH,dt,dlg.open?Math.round(VH*.3):0);game.render(pctx,v.x,v.y,VW,VH);game.hud(octx,SC*dpr,dpr)}
    if(vf.black>0){pctx.fillStyle=`rgba(0,0,0,${vf.black.toFixed(3)})`;pctx.fillRect(0,0,VW,VH);if(vf.black>.4)octx.clearRect(0,0,$('oc').width,$('oc').height)}
    if(veil)drawVeil(t);
    if(fno%4===0)game.mini(mctx,336,108);
    if(fno%10===0){$('online').textContent='店里 '+game.S.cats.filter(c=>!c.gone).length+' 只猫'+(Net.on?' · 在线 '+(1+game.A.live.count()):'');drawMe();drawPanel()}
    if(fno%30===0){tryPrize();tryLotto()}
    if(fno%1800===0&&!devTod){game.S.tod=clockTod();game.S.weather=weatherNow()}
    if(playing&&(saveT+=dt)>(dirty?3:20)){saveT=0;flush()}}
  jsT+=performance.now()-t0;
  if(toastT>0&&(toastT-=dt)<=0)$('toast').style.opacity=0;if(discT>0&&(discT-=dt)<=0)$('disc').classList.remove('show');if(replyT>0&&(replyT-=dt)<=0)$('reply').classList.remove('show');if(banT>0&&(banT-=dt)<=0)$('roomban').classList.remove('show');
  if(fno%30===0)drawNews();
  if(DEV){fpsT+=dt;fpsN++;if(fpsT>=1){const s=game.stats(),e=$('dvP');if(e)e.textContent=`${Math.round(fpsN/fpsT)} 帧/秒 · 引擎 ${(jsT/fpsN).toFixed(1)} ms · 同屏 ${s.drawn} 只`;fpsT=0;fpsN=0;jsT=0}}
  requestAnimationFrame(loop)}
// 进店那一下的遮罩：drop 从一片暖白里淡出来；wake 从黑里一圈圈亮开（圆心是你的猫）
function drawVeil(t){const k=(performance.now()-veil.t0)/1000;if(veil.how==='drop'){const a=1-Math.min(1,k/.7);if(a<=0){veil=null;return}pctx.fillStyle=`rgba(255,244,220,${a.toFixed(3)})`;pctx.fillRect(0,0,VW,VH);return}
  const r=Math.max(0,(k-.15)/1.3)**1.6*Math.hypot(VW,VH);if(r>=Math.hypot(VW,VH)){veil=null;return}const v=game.view(),x=game.me.x-v.x,y=game.me.y-10-v.y;pctx.fillStyle='#000';pctx.beginPath();pctx.rect(0,0,VW,VH);
  for(let a=0;a<=32;a++){const q=a/32*Math.PI*2,px=Math.round(x+Math.cos(q)*r),py=Math.round(y+Math.sin(q)*r);a?pctx.lineTo(px,py):pctx.moveTo(px,py)}pctx.fill('evenodd')}

/* ---------- 启动：加载器调它 ---------- */
async function boot(progress){const gameEl=$('game');pctx=$('pc').getContext('2d',{willReadFrequently:true});octx=$('oc').getContext('2d');mctx=$('mm').getContext('2d');
  (()=>{const o=C;use($('icYarn').getContext('2d'));yarnBall(3,3,2,0);use($('icPaw').getContext('2d'));pawPrint(1,1,'#f4a6b8');use(o)})();
  progress('点灯……');await tick0();
  game=makeWorld($('pc'),{play:true,ui,hi:true});window.__game=game;game.S.tod=clockTod();game.S.weather=weatherNow();game.bots(CFG.bots??40,true);
  dlg=makeDialog($('dlg'),{pick:i=>{game.A.dlg.pick(i);sfx('page')},act:id=>game.A.dlg.act(id),link:k=>openLink(k),visited:k=>k==='inner'?game.S.stamps.inner:game.S.stamps.site});
  layout();addEventListener('resize',layout);bindInput();drawStamps();if(DEV)devBar();requestAnimationFrame(loop);
  progress('看看你是不是来过……');const resumed=await Account.resume();await progress(null);
  let intro=true;
  if(resumed&&resumed.state&&resumed.state.arrived){const v=await Entry.welcome(resumed,$('bootbox'));hideBoot();if(v==='enter')return enter({cat:resumed,how:'wake'});await Account.logout();intro=false}
  hideBoot();const r=await Entry.start(resumed&&!(resumed.state&&resumed.state.arrived)?resumed:null,{intro});enter(r)}
const tick0=()=>new Promise(r=>setTimeout(r,16));
function hideBoot(){const b=$('boot');b.classList.add('out');setTimeout(()=>b.style.display='none',450)}
// 进店：把账号里的猫放进世界，放 drop / wake 的动画
function enter({cat:c,how}){cat=c;const me=game.me,st=c.state||{};SAVE={g:st.g||{},visits:(st.visits||0)+(how==='wake'?1:0)||1};
  me.name=me.label=c.name;me.pal=EA.palOf(c.look);me.myFace=me.ex=c.look.face;
  // 补位的猫是在认出你之前生成的：要是有一只刚好和你同名，给它改个名
  const U=game.A.usedNames;if(U){for(const b of game.S.cats)if(b!==me&&b.kind==='bot'&&b.name===c.name){U.delete(b.name);let n;do n=c.name+(2+Math.floor(Math.random()*98));while(U.has(n));b.name=n;U.add(n)}U.add(c.name)}
  game.A.guide.load(SAVE.g);Object.assign(game.S.stamps,st.stamps||{});drawStamps();meKey='';panelKey='';(c.prizes||[]).forEach(queuePrize);
  if(how==='drop'){game.A.guide.mark('move');game.A.firstRoom('atrium')}
  Entry.leave();veil={how,t0:performance.now()};playing=true;dirty=true;claim();startNet();$('game').classList.add('on');
  game.A.arrive(how,{...(st.pos||{}),onLand:()=>{},onDone:()=>{flush();$('game').focus()}});
  if(how==='drop')bigTitle('1024 猫咖营业中','欢迎，'+c.name,'你落在了毛线巨树下 · 前台猫在前厅，有事可以问它',1900,4600);
  else bigTitle('欢迎回来',c.name,(c.prev?'上次来是 '+Entry.ago(c.prev):'又见面了')+(st.g&&st.g.balls?` · 解开过 ${st.g.balls} 颗毛线球`:''),1400,3800);
  $('game').focus();
  addEventListener('pagehide',()=>flush(true));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush(true)})}
return{boot,get game(){return game},sleep}})();
