/* 1024 猫咖 · 场景 v4 "看风景"：在几样东西前坐下，画面切到一张特写——你的猫的背影，和它看到的东西。画法在 world4-vista-art.js（VA），屋顶天边那片城的零件在 skyline-art.js（NC）。
   看到的永远是晴天的夜里（全店都是，见 docs/店内设计.md 第一节）。每张都要壮观：有远近、有一样主角、夜里的光、至少三样会动的（第八节）。
   - 橱窗（空着嘴时）→ 窗外的街：对面一排亮着灯的小店，背后是高高低低的楼、电视塔和楼缝里的月亮；猫猫电车开过去（乘客全是猫），窗外落一只麻雀，敲敲玻璃它就飞走；晾衣绳上挂的是这扇窗里真挂着的成品
   - 图书馆的窗边软座 → 拱形大窗：城的剪影，银河从城后面升起来；看一会儿星星连成星座（猫座、毛线球座、小鱼干座），等到流星可以许愿
   - 屋顶：巨树的瞭望台 → 整座夜城：雪山、海和灯塔、河上的两座桥、亮着灯的摩天轮、高架上的电车；热气球、鸟群；放烟花，河里有倒影
   - 屋顶：观星毯 → 整屏的天：银河的核心、带环的大星、星座、流星（许愿）；望远镜 → 镜筒里占满的大月亮，偶尔一只猫的影子走过去
   - 鱼缸 → 凑得很近看鱼：伸爪碰碰玻璃，碰到鱼算一次（鱼吓一跳游开，没有鱼受伤），偶尔来一条金鱼
   - 澡堂的水族馆玻璃墙（地下一层，坐着的时候由澡堂那边 A.vista.open('aquarium')）→ 一整面海；隔 25～40 秒一条鲨鱼擦过玻璃（彩蛋"鲨鱼来了"）；伸爪碰玻璃，附近的鱼游开
   Esc 回到店里：你的猫还坐在原地，走两步就起身。街上没有人类：只有店面、电车、猫、麻雀。
   打开时画面先变黑（0.25 秒），这一下里把这张特写不动的部分分几帧画好（VA.prep），免得第一帧卡。 */
WORLD_MODS.push(A=>{
const {S,P,me,say,sfx,rr,rnd}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f);
const INFO={window:()=>({n:'橱窗外',sub:'对面一排亮着灯的小店，背后是高高低低的楼和电视塔；猫猫电车隔一阵开过去',hint:'E 敲敲玻璃'}),
  sky:()=>({n:'窗边',sub:'银河从城后面升起来；多看一会儿，星星会连成星座',hint:'看到流星，E 许个愿'}),
  treetop:()=>({n:'毛线巨树的树顶',sub:'整座夜城：雪山、海和灯塔、河上的桥、亮着灯的摩天轮',hint:'E 放一朵烟花'}),tank:()=>({n:'鱼缸',sub:'等鱼游过来，伸爪碰碰玻璃',hint:'点一下或 E 伸爪 · 鼠标、←→ 挪一挪'}),
  stars:()=>({n:'观星毯',sub:'银河的核心，一颗带环的大星；多看一会儿，星星会连起来',hint:'看到流星，E 许个愿'}),moon:()=>({n:'望远镜',sub:'镜筒里一轮大月亮，环形山一个套一个',hint:'等一会儿，月亮前面会走过去一个影子'}),
  aquarium:()=>({n:'水族馆',sub:'一整面海：鱼群、水母、海龟，隔一阵游过一个大家伙',hint:'点一下或 E 伸爪碰碰玻璃 · 鼠标、←→ 挪一挪'})};
// 永远是晴天的夜里
const skyS=()=>({...S,tod:'night',weather:'sun'}),starry=k=>k==='stars'||k==='sky';
let V=null;const T_IN=.25,T_ON=.4,T_OUT=.25,T_BACK=.35;
// 别的模块挂进来的特写（抓娃娃机，world-games.js）：{info()→{n,sub,hint}, draw(E), act(V), key(e,V), keyup(e,V), pointer(x,y,V), click(x,y,V), open(V), close(V), tint}
const EXT={};
function open(kind,o={}){if(V&&V.phase!=='back')return;V={kind,o,t0:now(),phase:'in',px:null,py:null,fx:[],hits:0,gold:0,wish:0,star:null,nextStar:now()+rr(1.5,3),con:null,ready:false};sfx('page');if(EXT[kind]&&EXT[kind].open)EXT[kind].open(V)}
function close(){if(!V||V.phase==='out'||V.phase==='back')return;if(EXT[V.kind]&&EXT[V.kind].close)EXT[V.kind].close(V);V.phase=V.phase==='in'?'back':'out';V.t0=now()}
const info=k=>EXT[k]?EXT[k].info():INFO[k]();
tick(()=>{if(!V)return;const k=now()-V.t0;
  // 变黑的那一下里，一帧画一步这张特写不动的部分
  if(V.phase==='in'&&!V.ready&&!EXT[V.kind]&&VA.prep){const v=A.view();V.ready=!v||VA.prep(V.kind,v.w,v.h)}
  if(V.phase==='in'&&k>=T_IN){V.phase='on';V.t0=now();A.ui.vista&&A.ui.vista({kind:V.kind,...info(V.kind)});
    if(starry(V.kind))V.con={i:Math.floor(Math.random()*VA.CONS.length),t0:now()+2.5,said:0};cap()}
  else if(V.phase==='out'&&k>=T_OUT){V.phase='back';V.t0=now();A.ui.vista&&A.ui.vista(null)}
  else if(V.phase==='back'&&k>=T_BACK)V=null;
  // 猫藏起来了（钻进纸箱这类）就收起特写；外挂特写可以说 hideOk（坐在纸箱火箭里飞的时候猫一直藏着）
  else if(V.phase==='on'&&(!me.place||me.hidden&&!(EXT[V.kind]&&EXT[V.kind].hideOk)||A.dlg.open))close()});
function cap(){if(!V||!A.ui.vistaCap)return;if(EXT[V.kind]){A.ui.vistaCap(EXT[V.kind].cap?EXT[V.kind].cap(V):'');return}
  if(V.kind==='tank')A.ui.vistaCap(V.hits?`碰到 ${V.hits} 次`+(V.gold?` · 金鱼 ${V.gold} 次`:''):'还没碰到');
  else if(V.kind==='sky'||V.kind==='stars')A.ui.vistaCap([V.con&&V.con.said?'今晚看得见：'+VA.CONS[V.con.i].n:'',V.wish?`许了 ${V.wish} 个愿`:''].filter(Boolean).join(' · '));
  else A.ui.vistaCap('')}
tick(()=>{if(V&&V.phase==='on'&&V.con&&!V.con.said&&now()-V.con.t0>4.5){V.con.said=1;cap()}});
// 水族馆：鲨鱼擦过玻璃（画里放进 V.ev 的事）→ 出声、记彩蛋
tick(()=>{if(!V||V.kind!=='aquarium'||!V.ev||!V.ev.length)return;const ev=V.ev.splice(0);if(V.phase!=='on')return;
  ev.forEach(e=>{if(e==='shark'){sfx('boom');A.after(.3,()=>sfx('whoosh'));A.eggs&&A.eggs.found('shark')}})});

/* ---------- 鱼缸：伸爪 ---------- */
function tankTap(quiet){if(V.tap&&now()-V.tap.t0<.4)return;const r=VA.tankReach(V,V.W||480,V.H||270),x=r.x,y=r.y;V.tap={x,y,sx:r.sx,t0:now()};if(!quiet)sfx('clack');const PV0=V;
  A.after(.12,()=>{const V=PV0;if(!V||!V.fish)return;let hit=null;for(const f of V.fish){const d=Math.hypot(f.x-x,f.y-y);if(d<14&&(!hit||d<Math.hypot(hit.x-x,hit.y-y)))hit=f}
    V.fish.forEach(f=>{if(Math.hypot(f.x-x,f.y-y)<60){f.scare=1.2;const a=Math.atan2(f.y-y,f.x-x),G=VA.geo.tank(V.W,V.H);f.tx=Math.max(V.W*.06,Math.min(V.W*.94,f.x+Math.cos(a)*120));f.ty=Math.max(G.top+14,Math.min(G.sand-20,f.y+Math.sin(a)*60))}});
    if(quiet)return;if(hit){V.hits++;if(hit.gold){V.gold++;hit.gold=false;say('碰到了金鱼！它甩甩尾巴游走了')}sfx('pop')}cap()})}

/* ---------- 操作：Esc 回到店里；E / 点一下 做这个画面里的事 ---------- */
// 烟花：先一颗火星从城里升上去，0.55 秒后炸开；偶尔是垂下来的金柳，偶尔炸成一张猫脸
function firework(w,h,t,big=1){const G=VA.geo.treetop(w,h),x=rr(w*.3,w*.92),y=rr(h*.06,h*.26);V.fx.push({x0:x+rr(-14,14),x,y,r:rr(24,36)*big*G.k,col:rnd(FEST_COL),col2:rnd(FEST_COL),t0:t,tb:t+.55,kind:Math.random()<.16?2:Math.random()<.35?1:0});if(V.fx.length>8)V.fx.shift()}
function act(){if(!V||V.phase!=='on')return;const t=now(),w=V.W||480,h=V.H||270;if(EXT[V.kind]){EXT[V.kind].act&&EXT[V.kind].act(V);return}
  if(V.kind==='tank'){tankTap();return}
  if(V.kind==='aquarium'){if(VA.aqTap(V,w,h))sfx('clack');return}
  if(V.kind==='treetop'){firework(w,h,t);sfx('whoosh');A.after(.55,()=>sfx('boom'));return}
  if(V.kind==='sky'||V.kind==='stars'){const s=V.star;if(s&&t-s.t0<1.1){V.wish++;V.star=null;sfx('disc');say(V.wish>1?`又许了一个愿（第 ${V.wish} 个）`:'流星！许了一个愿');cap();return}say('等一颗流星……');return}
  if(V.kind==='moon'){say('月亮上有一只猫？……再看一会儿');return}
  if(V.kind==='window'){V.shoo=t;sfx('meow')}}
// 夜里：隔几秒划过一颗流星（窗边在拱形窗里，观星毯满屏）
tick(()=>{if(!V||V.phase!=='on'||!starry(V.kind))return;if(now()>V.nextStar){const w=V.W||480,h=V.H||270;
  if(V.kind==='sky'){const G=VA.geo.sky(w,h);V.star={t0:now(),x:rr(G.wx0+G.ww*.2,G.wx1-G.ww*.2),y:rr(G.wy0+12,G.spring),dx:rr(40,70)*(Math.random()<.5?-1:1),dy:rr(20,34)}}
  else{const G=VA.geo.stars(w,h);V.star={t0:now(),x:rr(G.x0,G.x1),y:rr(G.y0,G.y1*.6),dx:rr(60,110)*(Math.random()<.5?-1:1),dy:rr(26,44)}}V.nextStar=now()+rr(2.5,6)}});
function paint(ctx,w,h){const o=C,t=now(),S2=skyS();ctx.imageSmoothingEnabled=false;V.W=w;V.H=h;
  if(EXT[V.kind]){const X=EXT[V.kind];VA.tint=X.tint||null;use(VA.tint?VA.tctx(ctx):ctx);try{X.draw({w,h,t,S,V,pal:me.pal})}finally{VA.tint=null;use(o)}return}
  VA.tint=(VA.KTINT&&VA.KTINT[V.kind])||null;
  use(VA.tint?VA.tctx(ctx):ctx);try{VA.draw[V.kind]({w,h,t,S:S2,V,pal:me.pal});(OVL[V.kind]||[]).forEach(f=>f({w,h,t,S:S2,V,pal:me.pal}))}finally{VA.tint=null;use(o)}}
// 别的模块往原有的画面上叠东西（望远镜里那颗长耳朵的星球，world-rocket.js）：A.vista.overlay(kind,f)，f({w,h,t,S,V,pal}) 在原画面画完以后、同一个画布上画（镜筒、月亮的位置：VA.geo.moon(w,h)）
const OVL={};
const aimKind=k=>k==='tank'||k==='aquarium';
A.vista={get on(){return !!V&&V.phase!=='back'},get kind(){return V&&V.kind},open,close,add:(k,spec)=>{EXT[k]=spec},overlay:(k,f)=>{(OVL[k]=OVL[k]||[]).push(f)},cap:()=>cap(),get cur(){return V},
  frame(){if(!V)return{show:'world',black:0};const k=now()-V.t0;return V.phase==='in'?{show:'world',black:Math.min(1,k/T_IN)}:V.phase==='on'?{show:'vista',black:Math.max(0,1-k/T_ON)}:V.phase==='out'?{show:'vista',black:Math.min(1,k/T_OUT)}:{show:'world',black:Math.max(0,1-k/T_BACK)}},
  draw(ctx,w,h){if(V)paint(ctx,w,h)},
  key(e){const k=e.key;if(k==='Escape'){close();return true}if(V&&EXT[V.kind]&&EXT[V.kind].key&&EXT[V.kind].key(e,V))return true;if(k==='e'||k==='E'||k===' '||k==='Enter'){if(!e.repeat)act();return true}
    const mv={ArrowLeft:-1,a:-1,A:-1,ArrowRight:1,d:1,D:1}[k];if(V&&aimKind(V.kind)&&mv!=null){const w=V.W||480;V.px=Math.max(w*.06,Math.min(w*.94,(V.px??w/2)+mv*10));V.py=V.py??(V.H||270)*(V.kind==='tank'?.6:.45);return true}
    if(/^(Arrow|[wasdWASD]$)/.test(k))close();return true},
  keyup(e){if(V&&EXT[V.kind]&&EXT[V.kind].keyup)EXT[V.kind].keyup(e,V)},
  pointer(x,y){if(V){V.px=x;V.py=y;if(EXT[V.kind]&&EXT[V.kind].pointer)EXT[V.kind].pointer(x,y,V)}},click(x,y){if(!V)return;V.px=x;V.py=y;if(EXT[V.kind]&&EXT[V.kind].click){EXT[V.kind].click(x,y,V);return}if(V.kind==='tank')tankTap();else act()}};

// 说明页上的小预览：每个画面一份自己的状态，自己放烟花、等流星、伸爪、连星座（不出声、不计数）。成品里没有说明页，留着给样页对照
const PV={};
A.vista.preview=(ctx,w,h,kind)=>{const keep=V,t=now();V=PV[kind]||(PV[kind]={kind,o:{w:0},t0:t,phase:'on',px:null,py:null,fx:[],hits:0,gold:0,wish:0,star:null,nextStar:0,auto:0,con:null});
  try{if(t>V.auto){V.auto=t+2.4;if(kind==='treetop')firework(w,h,t,.8);else if(kind==='tank'&&V.fish){const f=V.fish[Math.floor(Math.random()*V.fish.length)];V.px=f.x;V.py=f.y;tankTap(true)}else if(kind==='aquarium'&&V.aq){V.px=rr(w*.3,w*.7);V.py=rr(h*.25,h*.6);VA.aqTap(V,w,h)}}
    if(kind==='sky'){if(!V.con||t-V.con.t0>9)V.con={i:((V.con?V.con.i:-1)+1)%VA.CONS.length,t0:t};const G=VA.geo.sky(w,h);if(!V.star||t-V.star.t0>3)V.star={t0:t,x:rr(G.wx0+G.ww*.3,G.wx1-G.ww*.3),y:rr(G.wy0+12,G.spring),dx:rr(40,60),dy:rr(20,30)}}
    paint(ctx,w,h)}finally{V=keep}};

/* ---------- 在哪儿切到特写 ---------- */
// 橱窗：空着嘴按"看看窗外"；鱼缸：凑近看；窗边软座、巨树树顶、观星毯：坐好以后（A.onSeat）。水族馆由澡堂那边坐下以后自己开
const sitThen=(c,at,face,kind,o)=>A.run(c,[{go:at},{fn:c=>{c.face=face;A.settle(c,{k:'sit',ex:'lookUp'});c.doing='在看风景';open(kind,o)}}]);
[0,1].forEach(w=>{const th=A.TID('win'+w),go0=th.go;th.go=c=>{if(c.me&&!(c.hold&&c.hold.knit)){const W=P.wins[w];sitThen(c,{x:Math.max(W.x+14,Math.min(W.x+W.w-14,c.x)),y:P.hangY+4},'R','window',{w});return}go0(c)}});
{const th=A.TID('tank'),go0=th.go;th.go=c=>{if(c.me){sitThen(c,P.tankView,'L','tank');return}go0(c)}}
const seat0=A.onSeat;A.onSeat=(id,c,i)=>{if(seat0)seat0(id,c,i);if(!c.me)return;const k={treetop:'treetop',winseat:'sky',stargaze:'stars'}[id];if(k)A.after(.3,()=>{if(me.place)open(k)})};
});
