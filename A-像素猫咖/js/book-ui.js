/* 1024 猫咖 · 图鉴（设计见 docs/店内设计.md 第九节"图鉴"、第三节"钓鱼"、第四节"彩蛋"）。网页元素，画在 #bookov 里。
   依赖 dialog-ui.js（tipsHTML）、quest-bank.js（TIPS、CAT_CARDS）、world4-guide.js（GUIDE）、fish-art.js、world-charms.js。
   - 三页：店里（119 样）、鱼谱（十种）、彩蛋（八个）。最上面一排页签，各写着有了几个；点页签或按 ←→ 翻页；打开时停在上次看的那一页。
   - 彩蛋：谜面；"要点提示"点开是说得明白的一句和"带我去"；猫猫星球画四格进度、零件一样一行；找到了的写经过、挂坠和"戴上"；联机时写已经有几只猫找到。
   - BOOK.open(game, page)、BOOK.close()、BOOK.isOpen()、BOOK.key(e)、BOOK.click(e)（app.js 接上）；BOOK.pix(画布, 倍数, 缓存名)：像素画按整数倍放大成 <img>。 */
const BOOK=(()=>{
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PAGES=['all','fish','egg'],PN={all:'店里',fish:'鱼谱',egg:'彩蛋'};
// 没解锁的按房间收成一行：一楼、二楼、屋顶、地下
const ROOM_ORDER=['hall','gallery','stage','bar','cafe','stairs','yard','river','lab','well','library','lounge','nap','roof','b1hall','disco','bath','cinema'];
const STEP_N=['望远镜','图纸','零件','火箭'];
let page='all',game=null,onChange=null;
const day=ts=>new Date(ts).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
// 像素画按整数倍放大成图：一格 n×km 个屏幕像素（km 是正文字一个点的屏幕像素数），CSS 尺寸再除以 dpr——放大不插值，每一格落在整的屏幕像素上
const IMG=new Map();
function pix(cv,n,key){const P=window.PXF||{d:1,km:1},d=P.d||1,k=Math.max(1,n*(P.km||1)),id=key+'|'+k;let u=IMG.get(id);
  if(!u){const o=document.createElement('canvas');o.width=cv.width*k;o.height=cv.height*k;const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(cv,0,0,o.width,o.height);u=o.toDataURL();IMG.set(id,u)}
  return `<img class="px" src="${u}" style="width:${cv.width*k/d}px;height:${cv.height*k/d}px" alt="">`}
const FISH=()=>FISH_KINDS.filter(f=>!f.junk);
function counts(A){const L=A.guide.fishLog();return{all:[A.guide.count(),A.guide.total],fish:[FISH().filter(f=>L[f.id]).length,FISH().length],egg:[A.eggs.count(),A.eggs.total]}}

/* ---------- 店里：小游戏的成绩、店猫和你；已解锁的、没解锁的 ---------- */
function pageAll(A){const G=A.guide,all=Object.entries(GUIDE),rn=id=>(WORLD.rooms.find(x=>x.id===id)||{}).n||id,got=all.filter(([k])=>G.disc[k]).sort((a,b)=>G.disc[b[0]]-G.disc[a[0]]),lock=all.filter(([k])=>!G.disc[k]),when=ts=>ts>1?' · '+day(ts):'';
  const games=A.games?A.games.summary():[],fr=[1,2,3,4,5,6].map(p=>({n:(CAT_CARDS[p]||{}).name||'',h:A.friendHearts?A.friendHearts(p):0}));
  let h=`<div class="rows"><div class="lk"><span class="rn">小游戏</span>${games.map(g=>`<span class="chip${g.rec?'':' off'}" data-go="${g.th}">${esc(g.n)}<small>${esc(g.rec||'还没玩过')}</small></span>`).join('')}</div>`+
    `<div class="lk"><span class="rn">店猫和你</span>${fr.map(f=>`<span class="chip${f.h?'':' off'}">${esc(f.n)}<span class="h">${'♥'.repeat(f.h)}${'♡'.repeat(3-f.h)}</span></span>`).join('')}</div></div>`;
  // 解锁的：在哪儿、什么时候、会发生什么；对应猫猫咖啡馆的哪项特性放在 Tips 牌子里（TIPS 里有这一条就带"了解更多"）
  h+=`<div class="sec">已解锁<i>${got.length}</i></div>`+(got.length?'<div class="g">'+got.map(([k,g])=>{const tp=g.tip&&TIPS[g.tip],t=g.tie||(tp&&tp.t);
    return `<div class="e on" data-go="${k}"><span class="ic"><i class="ck"></i></span><div><b>${esc(g.n)}</b><small>${esc(rn(g.room))}${when(G.disc[k])}</small><p class="w">${esc(g.what)}</p>${t?tipsHTML(t,tp&&tp.l,{cls:'v'}):''}</div></div>`}).join('')+'</div>':'<p class="none">还没有。四处逛逛，碰一碰店里的东西。</p>');
  if(lock.length){h+=`<div class="sec">未解锁<i>${lock.length}</i><em>点一下，猫会走过去</em></div>`;
    ROOM_ORDER.forEach(r=>{const L=lock.filter(([,g])=>g.room===r);if(L.length)h+=`<div class="lk"><span class="rn">${esc(rn(r))}</span>`+L.map(([k,g])=>`<span class="e off" data-go="${k}"><span class="ic">×</span>${esc(g.n)}${g.how?`<small>${esc(g.how)}</small>`:''}</span>`).join('')+'</div>'})}
  return h}

/* ---------- 鱼谱：十张小卡；最后一种在天上 ---------- */
function pageFish(A){const L=A.guide.fishLog(),M=A.guide.games().fishMax||{},nine=!!A.guide.games().fish9;
  let h='<p class="lead">一楼河边三根钓竿：栈桥尽头水深，这边岸上水浅，对岸在树荫底下，三处爱咬钩的鱼不一样。钓上来的都看一眼，就放回河里了。</p><div class="fg">';
  h+=FISH().map(f=>{const c=L[f.id]||0;
    if(f.sky){if(!c)return `<div class="fc off sky"><span class="q">？</span><div><b>？？？</b><p class="w">地上的河里钓不到。听说它住在一颗长着耳朵的星星上。${nine?'<br>它在天上：屋顶的望远镜里看看。':''}</p></div></div>`;
      const g=L.crystalGold||0,tk=A.crystal?A.crystal.mine():0;
      return `<div class="fc on sky">${pix(fishCanvas('crystal'),4,'f-crystal')}<div><b>${esc(f.n)}</b><small>${esc(FISH_WHERE(f.id))}</small><p class="w">${esc(f.d)}</p><p class="st">捞到过 ${c} 条${g?` · 金色的 ${g} 条`:''}${tk?` · 放进大鱼缸 ${tk} 条`:''}</p></div></div>`}
    if(!c)return `<div class="fc off">${pix(fishCanvas(f.id,true),4,'s-'+f.id)}<div><b>？？？</b><small>多在${esc(FISH_WHERE(f.id))}咬钩${f.big?' · 个头大的要遛':''}</small></div></div>`;
    return `<div class="fc on">${pix(fishCanvas(f.id),4,'f-'+f.id)}<div><b>${esc(f.n)}</b><small>${esc(FISH_WHERE(f.id))}${f.rare?' · 稀有':''}</small><p class="w">${esc(f.d)}</p><p class="st">钓到过 ${c} 条${M[f.id]?` · 最大 ${M[f.id]} 厘米`:''}</p></div></div>`}).join('')+'</div>';
  const J=[['boot','只'],['yarn','颗']].filter(([k])=>L[k]);if(J.length)h+=`<p class="junk">还钓上来过：${J.map(([k,u])=>`${esc(FISH_BY[k].n)} ${L[k]} ${u}`).join(' · ')}</p>`;
  return h}

/* ---------- 彩蛋：谜面 → 要点提示 → 带我去；找到了的写经过和挂坠 ---------- */
function pageEgg(A){const E=A.eggs,cnt=E.counts,worn=E.worn();
  let h='<p class="lead">店里藏着八个彩蛋。找到一个，项圈上多一枚挂坠（一次戴一枚，别的玩家也看得到）；去过猫猫星球的猫，项圈会一直发光。</p><div class="eggs">';
  h+=E.list().map(e=>{const ch=CHARMS[e.key],n=cnt&&cnt[e.key],who=n?`<em class="who">已经有 ${n} 只猫找到</em>`:'';
    if(e.found){const on=worn===e.key;
      return `<div class="eg on"><span class="st">★</span><div><b>${esc(e.n)}</b><small>${e.at>1?day(e.at)+' 找到':''}</small>${who}<p class="w">${esc(e.what)}</p>`+
        (ch?`<div class="rw">${pix(charmCanvas(e.key),5,'c5-'+e.key)}<span><b>${esc(ch.n)}</b>${esc(ch.d)}${e.key==='planet'?'；项圈一直发光，还能把水晶鱼带回地面':''}</span><button class="lbtn sm${on?' on':''}" data-wear="${on?'':e.key}">${on?'戴着':'戴上'}</button></div>`:'')+'</div></div>'}
    const I=E.info(e.key)||{},open=E.tipOpen(e.key);let b=`<p class="w">${esc(I.riddle||e.hint)}</p>`;
    // 猫猫星球：四格进度，做完的写做了什么，这一步亮着，后面的是问号
    if(e.steps)b+=`<span class="cells">${Array.from({length:e.steps},(_,i)=>`<i class="${i<e.done?'on':i===I.i?'cur':''}">${i<e.done?STEP_N[i]||'':'？'}</i>`).join('')}</span>`;
    if(I.parts)b+='<ul class="parts">'+I.parts.map((p,j)=>`<li class="${p.got?'got':''}"><i class="${p.got?'ck':'o'}"></i><span>${esc(p.n)}</span>${!p.got&&open?`<small>${esc(p.tip)}</small><button class="lbtn sm" data-egggo="${e.key}:${j}">带我去</button>`:''}</li>`).join('')+'</ul>';
    if(open&&I.tip)b+=`<p class="tp"><span>${esc(I.tip)}</span>${I.go?`<button class="lbtn sm" data-egggo="${e.key}">带我去</button>`:''}</p>`;
    else if(!open)b+=`<button class="lbtn sm tipb" data-tip="${e.key}">要点提示</button>`;
    if(ch)b+=`<p class="rwd">${pix(charmCanvas(e.key),4,'c-'+e.key)}<span>${e.key==='planet'?'找到了：水晶项链，项圈一直发光，还能把水晶鱼带回地面':'找到了：项圈上多一枚挂坠'}</span></p>`;
    return `<div class="eg off"><span class="st">☆</span><div><b>？？？</b>${who}${b}</div></div>`}).join('')+'</div>';
  return h}

function render(){if(!game)return;const A=game.A,C2=counts(A),[a,t]=C2[page],el=$('bookov'),sc=el.scrollTop;
  let h=`<div class="top"><b>图鉴</b><div class="tabs">${PAGES.map(p=>`<button class="tab${p===page?' on':''}" data-tab="${p}">${PN[p]}<i>${C2[p][0]} / ${C2[p][1]}</i></button>`).join('')}</div>`+
    `<span class="prog"><i style="width:${Math.round(a/Math.max(1,t)*100)}%"></i></span><span class="kh"><kbd>←</kbd><kbd>→</kbd>翻页</span><button class="lbtn sm" id="bookx">关掉<kbd>B</kbd></button></div>`;
  h+=page==='fish'?pageFish(A):page==='egg'?pageEgg(A):pageAll(A);
  el.innerHTML=`<div class="bk win">${h}</div>`;el.style.display='block';el.scrollTop=sc;$('bookx').onclick=()=>close()}
function open(g,pg,cb){game=g;if(cb)onChange=cb;if(pg&&PAGES.includes(pg))page=pg;$('bookov').scrollTop=0;render()}
function close(){$('bookov').style.display='none';$('game').focus()}
const isOpen=()=>$('bookov').style.display==='block';
function turn(d){page=PAGES[(PAGES.indexOf(page)+d+PAGES.length)%PAGES.length];$('bookov').scrollTop=0;render()}
function key(e){const k=e.key.toLowerCase();if(k==='b'||e.key==='Escape'){close();return true}if(e.key==='ArrowLeft'||k==='a'){turn(-1);return true}if(e.key==='ArrowRight'||k==='d'){turn(1);return true}return true}
// 页签、戴上挂坠、要点提示、带我去；返回 true 表示这一下处理掉了（data-go、data-link 还归 app.js）
function click(e){const A=game&&game.A;if(!A)return false;const q=s=>e.target.closest(s);let d;
  if((d=q('[data-tab]'))){page=d.dataset.tab;$('bookov').scrollTop=0;render();return true}
  if((d=q('[data-wear]'))){A.eggs.wear(d.dataset.wear||null);if(onChange)onChange();render();return true}
  if((d=q('[data-tip]'))){A.eggs.openTip(d.dataset.tip);render();return true}
  if((d=q('[data-egggo]'))){const [k,j]=d.dataset.egggo.split(':'),I=A.eggs.info(k)||{},go=j!=null&&I.parts?(I.parts[+j]||{}).go:I.go;close();if(go)A.eggs.goTo(go);return true}
  return false}
return{open,close,isOpen,key,click,pix,render}})();
