/* 1024 猫咖 · 进店第三步：扭蛋。黑底一台猫头扭蛋机掉下来；名字变成一枚硬币投进去；转一下旋钮，滚出一颗扭蛋，蹦到跟前、晃三下、裂开——里面就是你的猫。
   毛色、项圈、平时的表情都是扭出来的；不满意可以再扭两次，扭到的猫都留着，最多三只一字排开，点一只（或者 ← →）挑它。等你挑的时候，它们各自舔爪、眨眼、踩奶、伸懒腰。
   定下来以后，选中的那只走到中间，就登记进店里的名册：一块小金牌落到它的项圈上。
   EG.run(name, {look, commit}) → Promise：{cat} 登记好了；{taken, look} 名字刚被别的猫占了（回去另挑一个名字，扭到的猫留着）。
   commit(look) → Account.create 的结果。传了 look 就跳过扭蛋，直接登记。 */
const EG=(()=>{
const ease=k=>k<0?0:k>1?1:k<.5?2*k*k:1-(-2*k+2)**2/2,cl=k=>k<0?0:k>1?1:k,lerp=(a,b,k)=>a+(b-a)*k,rr=(a,b)=>a+Math.random()*(b-a);
const bounce=k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MAX_REROLL=2,GAP=34,DIM={bright:'#372a48',mid:'#271d33'};

/* ---------- 待机动作：动作 → 做多久；平时是什么表情，就偏爱哪几样 ---------- */
const IDLE={lick:2.4,slowBlink:2.9,knead:2.4,stretch:2.2,meow:1.6,maneki:2,lie:3.6};
const LIKE={lick:3,slowBlink:2,knead:2,stretch:2,meow:2,maneki:1,lie:1};
const BIAS={sleepy:{lie:4,stretch:3,slowBlink:3},curious:{meow:4},content:{knead:4,slowBlink:3},blep:{lick:5},sparkle:{maneki:3,meow:3},meh:{lick:4},happy:{maneki:3},smug:{slowBlink:3},wink:{slowBlink:3}};
function pickIdle(face){const w={...LIKE,...BIAS[face]},ks=Object.keys(w);let s=ks.reduce((a,k)=>a+w[k],0)*Math.random();for(const k of ks)if((s-=w[k])<0)return k;return ks[0]}
// 一只扭出来的猫：x 站在哪；act 正在做的待机动作；react 打断待机的反应（"!"、开心蹦一下）；walk 挪位置；gone 化成烟的时刻
const mk=(look,x,t)=>({look,x,o:Math.random()*3,act:null,next:t+rr(1.5,4),react:null,walk:null,gone:0,face:'R'});
function tick(c,t){if(c.walk){if(t<c.walk.t0+c.walk.dur)return;c.x=c.walk.x1;c.walk=null}
  if(c.react){if(t<c.react.t0+c.react.dur)return;c.react=null}
  if(c.act&&t>c.act.end){c.act=null;c.next=t+rr(2.5,6)}
  if(!c.act&&t>c.next){const k=pickIdle(c.look.face);c.act={k,t0:t,end:t+IDLE[k]};c.face=Math.random()<.5?'L':'R'}}
const xNow=(c,t)=>c.walk?Math.round(lerp(c.walk.x0,c.walk.x1,cl((t-c.walk.t0)/c.walk.dur))):c.x;
function drawCat(c,t,y,ol){let k='sit',tt=t+c.o;const x=xNow(c,t);
  if(c.walk)k=c.walk.x1<c.walk.x0?'walkL':'walkR';
  else if(c.react){k=c.react.k;tt=t-c.react.t0;if(c.react.hop&&tt<.5)y+=Math.round(-Math.sin(tt/.5*Math.PI)*8)}
  else if(c.act){k=c.act.k;tt=t-c.act.t0}
  if(c.gone){const q=cl((t-c.gone)/.45);if(q<1){alpha(1-q,()=>EA.cat(k,c.look,x,y,tt,{face:c.face}));puff(x,y-8,q)}return}
  (ol?EA.catOl:EA.cat)(k,c.look,x,y,tt,{face:c.face})}

function run(name,{look:keepLook,commit}={}){const S=EK.stage(),{LW,LH}=S,FY=Math.round(LH*.66),MX=Math.round(LW/2),RY=FY+16,MACH=MX-88,caps=EA.pile(20,(Date.now()%9973)+1);
  const st={ph:keepLook?'signing':'drop',t0:0,mx:MX,cats:keepLook?[mk(keepLook,MX+10,0)]:[],sel:0,rolls:0,cap:null,top:null,bot:null,popT:0,walkEnd:0,fx:[],flap:0,turn:0,jig:0,coin:null,wig:0};
  const set=(ph)=>{st.ph=ph;st.t0=S.t};let ui=null,card=null,resolve;
  const clear=()=>{if(ui){ui.remove();ui=null}if(card){card.remove();card=null}};
  // 字幕：中线对着 x（不给就是画面正中），左边取整到屏幕像素（不用 translateX(-50%)，像素字才不发虚）
  const snapX=v=>window.PXF?PXF.snap(v):Math.round(v);
  const cap=(html,y,x)=>{clear();ui=EK.dom(`<div class="cap">${html}</div>`,{top:S.cy(y)});const cx=x==null?innerWidth/2:S.cx(x);ui.style.left=snapX(cx-ui.getBoundingClientRect().width/2)+'px'};
  const catSpot=()=>({x:MX+10,y:RY});
  // 一排 n 只时第 i 只站在哪：以画面中线为中心排开
  const slotX=(i,n)=>MX+Math.round((i-(n-1)/2)*GAP);
  const chosen=()=>st.cats[st.sel],look=()=>chosen().look;
  const hit=(x,y)=>st.cats.findIndex(c=>!c.gone&&Math.abs(x-(c.walk?c.walk.x1:c.x))<13&&y>RY-26&&y<RY+5);
  // 输入：转旋钮是 E / 空格 / 回车，或者点一下画面；挑猫是点猫，或者 ← →
  const act=()=>{if(st.ph==='wait'){Sound.sfx('ratchet');set('turn');clear()}};
  const offKey=EK.onKey(e=>{if(e.type!=='keydown'||e.repeat)return;
    if(st.ph==='wait'&&(e.key==='e'||e.key==='E'||e.key===' '||e.key==='Enter')){e.preventDefault();act();return}
    if(st.ph==='pick'){const d={ArrowLeft:-1,a:-1,A:-1,ArrowRight:1,d:1,D:1}[e.key];if(d){e.preventDefault();select(st.sel+d)}}});
  const offClick=EK.onClick((x,y)=>{if(st.ph==='pick'){const i=hit(x,y);if(i>=0)select(i);return}act()});
  const onMove=e=>{const r=EK.pc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*EK.pc.width,y=(e.clientY-r.top)/r.height*EK.pc.height;EK.pc.style.cursor=st.ph==='pick'&&hit(x,y)>=0?'pointer':''};
  EK.pc.addEventListener('pointermove',onMove);
  // 名字飞进投币口
  function flyName(slot){const r=CW.fieldRect(innerWidth,innerHeight),el=EK.dom(`<div class="fly">${esc(name)}</div>`,{left:r.x+r.w/2,top:r.y+r.h/2});el.style.transform='translate(-50%,-50%)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.left=S.cx(slot.x)+'px';el.style.top=S.cy(slot.y)+'px';el.style.transform='translate(-50%,-50%) scale(.2)';el.style.opacity='0'}));setTimeout(()=>el.remove(),700)}
  // 卡片写的是选中的那只；放在队尾那只的右边，窗口窄就往左收
  function showCard(){const n=st.cats.length,left=MAX_REROLL-st.rolls;
    card=EK.dom(`<div class="gc win"><small class="no"></small><b>${esc(name)}</b><p class="d"></p><div class="acts"><button class="go pbtn">就是它了</button>${left>0?`<button class="re lbtn">再扭一次<small>还有 ${left} 次</small></button>`:''}</div>${n>1?'<p class="hint"><kbd class="k">←</kbd> <kbd class="k">→</kbd> 或者点一只猫，换着看</p>':''}</div>`,{left:S.cx(slotX(n-1,n)+24),top:S.cy(RY-34)});
    const over=card.offsetLeft+card.offsetWidth-(innerWidth-24);card.style.left=snapX(card.offsetLeft-Math.max(0,over))+'px';
    fill();card.querySelector('.go').onclick=take;const re=card.querySelector('.re');if(re)re.onclick=again;
    setTimeout(()=>card&&card.querySelector('.go').focus(),50)}
  function fill(){if(!card)return;const d=EA.describe(look());card.querySelector('.no').textContent=st.cats.length>1?`扭到了 · 第 ${st.sel+1} 只`:'扭到了';card.querySelector('.d').innerHTML=`${d.coat} · ${d.collar}<br>${esc(d.face)}`}
  function select(i){if(i<0||i>=st.cats.length||i===st.sel)return;st.sel=i;const c=chosen();c.act=null;c.react={k:'happy',t0:S.t,dur:.6,hop:1};Sound.sfx('tick');fill();const g=card&&card.querySelector('.go');if(g)g.focus()}
  // 再扭一次：已经扭到的往左挪，给新的一只让出队尾；扭蛋机留在左边
  function again(){st.rolls++;card.remove();card=null;Sound.sfx('whoosh');const n=st.cats.length+1,t=S.t;
    st.cats.forEach((c,i)=>{const x1=slotX(i,n);c.act=null;c.react=null;c.walk={x0:c.x,x1,t0:t,dur:Math.max(.25,Math.abs(x1-c.x)/40)}});
    st.cap=st.top=st.bot=null;st.wn=st.rat=null;st.rolled=0;set('wait');cap(`<b>再转一下</b><span><kbd class="k">E</kbd> <kbd class="k">空格</kbd> 或者点一下</span>`,FY+22,st.mx)}
  // 就是它了：别的几只化成烟，扭蛋机滑走，选中的走到中间，走到了就登记
  function take(){Sound.sfx('ok');card.remove();card=null;EK.pc.style.cursor='';const t=S.t,c=chosen(),sp=catSpot();
    st.cats.forEach((o,i)=>{if(i!==st.sel)o.gone=t});c.act=null;c.react=null;c.next=t+2;
    c.walk=c.x!==sp.x?{x0:c.x,x1:sp.x,t0:t,dur:Math.abs(sp.x-c.x)/45}:null;st.walkEnd=c.walk?t+c.walk.dur:t;set('toSign')}
  // 登记：成功就落金牌；名字被占了回去另挑；网不好、浏览器存不下就在猫旁边说一声，带"再试一次"
  async function sign(){set('signing');chosen().act=null;if(card){card.remove();card=null}
    const r=await commit(look());
    if(r&&r.cat){st.cat=r.cat;Sound.sfx('hang');set('done');return}
    if(r&&(r.err==='taken'||r.err==='name')){finish({taken:true,look:look()});return}
    const sp=catSpot(),store=r&&r.err==='store';set('err');
    card=EK.dom(`<div class="gc win"><b>${store?'这个浏览器存不下东西':'店门口网不好'}</b><p>${store?'可能是无痕模式，换个窗口再试':'等一下再试一次'}</p><div class="acts"><button class="go pbtn">再试一次</button></div></div>`,{left:S.cx(sp.x+26),top:S.cy(sp.y-34)});
    card.querySelector('.go').onclick=sign;setTimeout(()=>card&&card.querySelector('.go').focus(),50)}
  function finish(v){offKey();offClick();EK.pc.removeEventListener('pointermove',onMove);EK.pc.style.cursor='';clear();EK.stop();resolve(v)}

  return new Promise(res=>{resolve=res;if(keepLook)setTimeout(sign,450);
    EK.loop((t,dt)=>{S.t=t;const k=t-st.t0;S.clear('#1c1424');use(S.x);
      let my=FY,m=null;
      // 每帧只走一段：k 是这一帧开头算的，一段刚结束就接着判断下一段，下一段会被当成已经播完
      if(st.ph==='drop'){my=Math.round(FY-(1-bounce(cl(k/.7)))*(FY+120));if(k>.28&&!st.landed){st.landed=1;Sound.sfx('land')}if(k>.75&&!st.flown){st.flown=1;flyName({x:st.mx+11,y:FY-32})}
        if(k>1.3&&!st.coin){st.coin={t0:t};Sound.sfx('coin')}if(k>1.75){set('wait');cap(`<b>转一下旋钮</b><span><kbd class="k">E</kbd> <kbd class="k">空格</kbd> 或者点一下</span>`,FY+22)}}
      else if(st.ph==='turn'){st.turn=ease(cl(k/.9));st.jig=k<.9?Math.sin(cl(k/.9)*Math.PI)*1+.2:Math.max(0,.4-(k-.9));if(Math.floor(k*4.4)!==st.rat&&k<.9){st.rat=Math.floor(k*4.4);Sound.sfx('ratchet')}
        if(k>.9&&!st.cap){const i=caps.reduce((b,c,j)=>c.y>caps[b].y?j:b,0),c=caps.splice(i,1)[0];st.cap={c:c.c,x:st.mx,y:FY-8,r:5,a:0};Sound.sfx('toss')}
        st.flap=k<1?0:k<1.25?(k-1)/.25:k<1.6?1:Math.max(0,1-(k-1.6)/.3);
        if(st.cap&&k>1.1){const q=cl((k-1.1)/.7),bx=st.mx+2+q*30,by=q<.35?lerp(FY-8,FY+4,q/.35):FY+4-Math.abs(Math.sin((q-.35)/.65*Math.PI*2))*3*(1-q);st.cap.x=bx;st.cap.y=by;st.cap.a=q*5;if(q>.3&&!st.rolled){st.rolled=1;Sound.sfx('roll')}}
        if(k>2){st.turn=0;st.jig=0;set('hop');st.hop={x:st.cap.x,y:st.cap.y,mx:st.mx,to:slotX(st.cats.length,st.cats.length+1)}}}
      // 扭蛋蹦到队尾（第一只就是画面中间）；后面几颗要跳过前面的猫，跳得高一点
      else if(st.ph==='hop'){const q=ease(cl(k/.6)),h=st.hop;st.mx=Math.round(lerp(h.mx,MACH,q));st.cap.x=lerp(h.x,h.to,q);st.cap.y=lerp(h.y,RY-14,q)-Math.sin(cl(k/.6)*Math.PI)*(st.cats.length?34:26);st.cap.r=Math.round(lerp(5,14,q));st.cap.a=lerp(st.cap.a,0,q);
        if(k>.6){set('wob');Sound.sfx('land')}}
      else if(st.ph==='wob'){const n=Math.floor(k/.34),q=(k%.34)/.34;st.cap.a=n<3?Math.sin(q*Math.PI*2)*(.18+n*.14):0;st.cap.hopY=n<3?-Math.round(Math.sin(q*Math.PI)*(n+1)):0;if(n!==st.wn&&n<3){st.wn=n;Sound.sfx('clack')}
        if(k>1.1){const c=st.cap,nc=mk(EA.roll(st.cats.map(o=>o.look)),Math.round(c.x),t);nc.react={k:'happy',t0:t,dur:1.1,hop:1};
          st.cats.forEach(o=>{o.act=null;o.react={k:'alert',t0:t,dur:1.3}});st.cats.push(nc);st.sel=st.cats.length-1;st.popT=t;
          set('pop');Sound.sfx('crack');setTimeout(()=>Sound.sfx('reveal'),120);st.top={x:c.x,y:c.y,vx:(Math.random()<.5?-1:1)*38,vy:-70,va:(Math.random()<.5?-1:1)*7};st.bot={x:c.x,y:c.y};
          for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,v=20+Math.random()*50;st.fx.push({x:c.x,y:c.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,t0:t,life:.5+Math.random()*.6})}}}
      else if(st.ph==='pop'&&k>1.05){set('pick');showCard()}
      else if(st.ph==='toSign'&&t>=Math.max(st.t0+.5,st.walkEnd+.15)){st.cats=[chosen()];st.sel=0;sign()}
      else if(st.ph==='done'&&k>1.25){finish({cat:st.cat,look:look()});return true}
      if(st.ph!=='signing'&&st.ph!=='done')for(const c of st.cats)tick(c,t);
      // —— 画 ——
      const sp=catSpot(),n=st.cats.length,row=!['toSign','signing','err','done'].includes(st.ph),showMachine=row||st.ph==='toSign'&&k<.5;
      if(showMachine){const off=st.ph==='toSign'?Math.round(-ease(k/.5)*LW*.5):0;EA.spot(st.mx+off,FY+1,40,9);st.wig=st.ph==='wait'?1:0;m=EA.machine(st.mx+off,my,t,{caps,turn:st.turn,flap:st.flap,jig:st.jig,wiggle:st.wig});
        if(st.coin){const q=cl((t-st.coin.t0)/.35);if(q<1)EA.coin(m.slot.x+Math.round((1-q)*5),m.slot.y+3,q)}}
      // 地上的光：只有一只时一大圈；几只排开（或者正等着下一颗）时各一小圈，选中的那圈亮
      if(row){const pend=st.rolls>=n,small=n>1||pend,lit=st.ph==='pick'||st.ph==='pop';
        if(st.cap&&(st.ph==='hop'||st.ph==='wob'))EA.spot(st.hop.to,RY+1,n?16:24,n?5:6,{k:cl(st.ph==='hop'?k/.6:1)});
        st.cats.map((c,i)=>i).sort((a,b)=>(a===st.sel)-(b===st.sel)).forEach(i=>{const x=xNow(st.cats[i],t);if(!small)EA.spot(x,RY+1,24,6);else EA.spot(x,RY+1,16,5,lit&&i===st.sel?{}:DIM)})}
      else EA.spot(sp.x,sp.y+1,24,6);
      // 裂开的壳和光
      const pa=t-st.popT;if(st.bot&&pa<.9)EA.rays(st.bot.x,RY-10,40+pa*20,t,'#ffe08a');
      if(st.bot){const q=cl(pa/.5);if(q<1)alpha(1-q,()=>EA.capsule(st.bot.x,st.bot.y+q*4,14,0,st.cap.c,{part:'bot'}))}
      if(st.top){const tt=Math.min(pa,3);EA.capsule(st.top.x+st.top.vx*tt,st.top.y+st.top.vy*tt+70*tt*tt,14,st.top.va*tt,st.cap.c,{part:'top'})}
      // 猫：挑的时候选中的那只描一圈黄边（店里"你"也是黄边）
      const ol=st.ph==='pick'&&n>1;[...st.cats].sort((a,b)=>a.x-b.x).forEach(c=>drawCat(c,t,RY,ol&&c===chosen()));
      if(st.bot&&pa<2)for(let i=0;i<6;i++){const a=i*1.047+pa*2,r=10+pa*14;spark(Math.round(st.bot.x+Math.cos(a)*r),Math.round(RY-10+Math.sin(a)*r*.7),t+i*.3)}
      // 还没裂开的扭蛋画在猫前面：跳过前面几只猫的时候不会被挡住
      if(st.cap&&['turn','hop','wob'].includes(st.ph))EA.capsule(st.cap.x,st.cap.y+(st.cap.hopY||0),st.cap.r,st.cap.a,st.cap.c);
      // 登记好了：一块小金牌从上面落到项圈上，"叮"一声，绕一圈星星
      if(st.ph==='done'){const q=cl(k/.45);if(q<1){const r=Math.round(lerp(5,2,q));disc(sp.x+1,Math.round(lerp(sp.y-46,sp.y-10,ease(q))),r,r,'#e8b83a')}
        else{if(!st.ding){st.ding=1;Sound.sfx('tick')}disc(sp.x+1,sp.y-10,1,1,'#ffd84a');for(let i=0;i<5;i++){const a=i*1.26+t*3;spark(Math.round(sp.x+1+Math.cos(a)*(6+(k-.45)*16)),Math.round(sp.y-10+Math.sin(a)*(6+(k-.45)*16)),t+i)}}}
      // 碎片、火星
      st.fx=st.fx.filter(f=>{const a=t-f.t0;if(a>f.life)return false;const x=Math.round(f.x+f.vx*a),y=Math.round(f.y+f.vy*a+60*a*a);P1(x,y,a<f.life*.5?'#fff4dc':'#ffd84a');return true});
    })})
}
return{run}})();
