/* 1024 猫咖 · 进店流程：把加载页之后、进店之前的几步串起来。设计见 docs/登录与进店.md。
   第一次来：Clowder AI 网页动画（CW）→ 挑名字（EN）→ 扭蛋 + 登记（EG）→ 黑底教走路和互动（ET）→ 从毛线巨树上掉进店里
   来过（这个浏览器记得）：加载页上一张"欢迎回来"的卡 → 在上次离开的地方醒来
   换了浏览器：认不出来，和第一次来一样扭一只新猫（不设密码，见 docs/登录与进店.md）
   Entry.start(resumed, {intro}) → Promise<{cat, how:'drop'|'wake'}>；Entry.welcome(cat) → Promise<'enter'|'switch'>
   EK 是几步共用的小工具：像素画布、DOM 浮层、按键和点击、跳过按钮、逐帧循环。 */
const EK=(()=>{
let root,ui,pc,hc,sk,raf=0,skipFn=null;const keyFns=new Set(),clickFns=new Set();let S=null;
function mount(){root=document.getElementById('entry');ui=document.getElementById('eui');pc=document.getElementById('epc');hc=document.getElementById('ehc');sk=document.getElementById('eskip');
  const kh=e=>{if(!root.classList.contains('on'))return;keyFns.forEach(f=>f(e))};addEventListener('keydown',kh);addEventListener('keyup',kh);
  pc.addEventListener('pointerdown',e=>{if(!S)return;const r=pc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*pc.width,y=(e.clientY-r.top)/r.height*pc.height;Sound.init();clickFns.forEach(f=>f(x,y))});
  sk.onclick=()=>{const f=skipFn;if(f)f()}}
function stage(){const W=innerWidth,H=innerHeight,PX=Math.max(3,Math.min(6,Math.floor(H/175))),LW=Math.ceil(W/PX),LH=Math.ceil(H/PX);
  pc.width=LW;pc.height=LH;pc.style.width=LW*PX+'px';pc.style.height=LH*PX+'px';pc.style.display='block';hc.style.display='none';
  const x=pc.getContext('2d');x.imageSmoothingEnabled=false;S={LW,LH,PX,x,t:0,cx:v=>v*PX,cy:v=>v*PX,clear(c){x.fillStyle=c;x.fillRect(0,0,LW,LH)}};return S}
function loop(fn){stop();const t0=performance.now();let last=t0;const step=ms=>{const t=(ms-t0)/1000,dt=Math.min(.05,Math.max(0,(ms-last)/1000));last=ms;let r;try{r=fn(t,dt)}catch(e){console.error(e)}if(r===true){raf=0;return}if(raf)raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
function dom(html,pos={}){const w=document.createElement('div');w.innerHTML=html.trim();const el=w.firstElementChild;if(pos.left!=null)el.style.left=pos.left+'px';if(pos.top!=null)el.style.top=pos.top+'px';ui.appendChild(el);return el}
const on=(set,f)=>{set.add(f);return()=>set.delete(f)};
function skip(label,fn){sk.textContent=label;sk.style.display='block';skipFn=()=>{Sound.sfx('tick');fn()};return()=>{if(skipFn){skipFn=null;sk.style.display='none'}}}
function flash(el){if(!el)return;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
return{mount,stage,loop,stop,dom,skip,flash,onKey:f=>on(keyFns,f),onClick:f=>on(clickFns,f),get ui(){return ui},get hc(){return hc},get pc(){return pc},get root(){return root}}})();

const Entry=(()=>{
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduced=()=>matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const ago=ms=>{if(!ms)return'';const s=(Date.now()-ms)/1000;return s<90?'刚刚':s<3600?Math.round(s/60)+' 分钟前':s<86400?Math.round(s/3600)+' 小时前':Math.round(s/86400)+' 天前'};

async function start(resumed,{intro=true}={}){EK.root.classList.add('on');let cat=resumed;
  try{
    if(cat&&cat.state&&cat.state.arrived)return{cat,how:'wake'};
    if(cat){await ET.run(cat.look,cat.name);return{cat,how:'drop'}}
    // 第一次来：先看一段 Clowder AI 的网页
    if(intro&&!reduced()){EK.hc.style.display='block';let fire=null;const off=EK.skip('跳过动画',()=>{fire&&fire();off()});await CW.play(EK.hc,{skip:f=>fire=f});off()}
    EK.hc.style.display='none';EK.pc.style.display='none';
    // 挑好的名字到扭蛋登记那一刻才真正占下；这中间被别的猫先占了，就回来再挑一个，扭到的猫留着、直接登记
    let o={};
    for(;;){const r=await EN.show(o);
      const g=await EG.run(r.name,{look:o.look,commit:look=>Account.create({name:r.name,look})});
      if(g.taken){o={msg:`「${r.name}」刚被别的猫挑走了，再挑一个吧`,look:g.look};EK.pc.style.display='none';continue}
      cat=g.cat;break}
    await ET.run(cat.look,cat.name);return{cat,how:'drop'}}
  finally{EK.stop()}}
function leave(){const r=EK.root;r.classList.add('out');setTimeout(()=>{r.classList.remove('on','out');EK.ui.innerHTML=''},450)}

/* ---------- 加载页上的"欢迎回来"：几秒后自己进店；不是这只猫就换一只 ---------- */
function welcome(cat,box){return new Promise(res=>{const d=EA.describe(cat.look),st=cat.state||{};
  box.innerHTML=`<div class="wb"><canvas width="30" height="26"></canvas><div><small>欢迎回来</small><b>${esc(cat.name)}</b><p>${d.coat} · ${d.collar}${cat.prev?' · 上次来是 '+ago(cat.prev):''}${st.g&&st.g.balls?' · 解开过 '+st.g.balls+' 颗毛线球':''}</p>
    <div class="acts"><button class="go pbtn"><i></i>进店</button><a class="sw">不是我？换一只新猫</a></div></div></div>`;
  const cv=box.querySelector('canvas'),x=cv.getContext('2d'),go=box.querySelector('.go'),bar=go.querySelector('i');let t0=performance.now(),stopped=false,raf=0;
  const draw=ms=>{const t=(ms-t0)/1000;x.clearRect(0,0,30,26);const o=C;use(x);EA.cat(t%6<2.9?'slowBlink':'sit',cat.look,15,24,t%6<2.9?t%6:t);use(o);
    if(!stopped){const k=Math.min(1,t/4.5);bar.style.width=k*100+'%';if(k>=1){end('enter');return}}raf=requestAnimationFrame(draw)};raf=requestAnimationFrame(draw);
  const end=v=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);res(v)};
  const kd=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();end('enter')}};addEventListener('keydown',kd);
  go.onclick=()=>end('enter');
  // 换了就找不回来：先说清楚
  box.querySelector('.sw').onclick=()=>{stopped=true;bar.style.width='0';if(confirm(`换了以后，这个浏览器就不记得「${cat.name}」了，它也找不回来。\n还要换一只新猫吗？`))end('switch')};
  box.addEventListener('pointerdown',e=>{if(!e.target.closest('a,button')){stopped=true;bar.style.width='0'}},{once:true});setTimeout(()=>go.focus(),30)})}
return{start,leave,welcome,ago}})();
