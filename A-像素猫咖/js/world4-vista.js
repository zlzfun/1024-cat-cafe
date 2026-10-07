/* 1024 猫咖 · 场景 v4 "看风景"：在几样东西前坐下，画面切到一张特写——你的猫的背影，和它看到的东西。画法在 world4-vista-art.js（VA）。
   - 橱窗（空着嘴时）→ 窗外的街：对面一排小店，路灯和行道树穿着店里织的毛线套，灯杆之间挂着织的三角旗；猫猫电车开过去（乘客全是猫），窗外落一只麻雀；晾衣绳上挂的是这扇窗里真挂着的成品
   - 图书馆的窗边软座 → 拱形大窗看天：夜里有银河，看一会儿星星会连成一个星座（猫座、毛线球座、小鱼干座），等到流星可以许愿；白天看云（有一朵长着耳朵）
   - 屋顶：巨树的瞭望台 → 夜里的整条街：远山、海和灯塔、河上的桥、猫咖那一排屋顶和串灯，一只毛线球热气球飘过去；放烟花
   - 屋顶：观星毯 → 整屏的天：银河、星座、流星（许愿）；望远镜 → 镜筒里一轮大月亮，偶尔一只猫的影子走过去
     屋顶上的几处永远是晴天的夜里（屋顶是夜里，见 docs/店内设计.md）
   - 鱼缸 → 凑得很近看鱼：伸爪碰碰玻璃，碰到鱼算一次（鱼吓一跳游开，没有鱼受伤），偶尔来一条金鱼
   Esc 回到店里：你的猫还坐在原地，走两步就起身。街上没有人类：只有店面、电车、猫、麻雀。 */
WORLD_MODS.push(A=>{
const {S,P,me,say,sfx,rr,rnd}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f);
const INFO={window:()=>({n:'橱窗外',sub:'对面一排小店，路灯和树都穿着店里织的毛线套；猫猫电车隔一阵开过去',hint:'E 敲敲玻璃'}),
  sky:()=>S.tod==='night'&&S.weather==='sun'?{n:'窗边',sub:'看星星：多看一会儿，星星会连起来',hint:'看到流星，E 许个愿'}:{n:'窗边',sub:S.weather==='sun'?'看云，有一朵长着耳朵':'看雨、看雪',hint:'夜里晴天有流星'},
  treetop:()=>({n:'毛线巨树的树顶',sub:'夜里的整条街、河上的桥、远处的海和灯塔',hint:'E 放一朵烟花'}),tank:()=>({n:'鱼缸',sub:'等鱼游过来，伸爪碰碰玻璃',hint:'点一下或 E 伸爪 · 鼠标、←→ 挪一挪'}),
  stars:()=>({n:'观星毯',sub:'满天星：多看一会儿，星星会连起来',hint:'看到流星，E 许个愿'}),moon:()=>({n:'望远镜',sub:'镜筒里一轮大月亮',hint:'等一会儿，月亮前面会走过去一个影子'})};
// 屋顶上的几处永远是晴天的夜里
const NIGHTV=new Set(['treetop','stars','moon']),skyS=k=>NIGHTV.has(k)?{...S,tod:'night',weather:'sun'}:S,starry=k=>k==='stars'||k==='sky'&&S.tod==='night'&&S.weather==='sun';
let V=null;const T_IN=.25,T_ON=.4,T_OUT=.25,T_BACK=.35;
// 别的模块挂进来的特写（抓娃娃机，world-games.js）：{info()→{n,sub,hint}, draw(E), act(V), key(e,V), keyup(e,V), pointer(x,y,V), click(x,y,V), open(V), close(V), tint}
const EXT={};
function open(kind,o={}){if(V&&V.phase!=='back')return;V={kind,o,t0:now(),phase:'in',px:null,py:null,fx:[],hits:0,gold:0,wish:0,star:null,nextStar:now()+rr(1.5,3),con:null};sfx('page');if(EXT[kind]&&EXT[kind].open)EXT[kind].open(V)}
function close(){if(!V||V.phase==='out'||V.phase==='back')return;if(EXT[V.kind]&&EXT[V.kind].close)EXT[V.kind].close(V);V.phase=V.phase==='in'?'back':'out';V.t0=now()}
const info=k=>EXT[k]?EXT[k].info():INFO[k]();
tick(()=>{if(!V)return;const k=now()-V.t0;
  if(V.phase==='in'&&k>=T_IN){V.phase='on';V.t0=now();A.ui.vista&&A.ui.vista({kind:V.kind,...info(V.kind)});
    if(starry(V.kind))V.con={i:Math.floor(Math.random()*VA.CONS.length),t0:now()+2.5,said:0};cap()}
  else if(V.phase==='out'&&k>=T_OUT){V.phase='back';V.t0=now();A.ui.vista&&A.ui.vista(null)}
  else if(V.phase==='back'&&k>=T_BACK)V=null;
  else if(V.phase==='on'&&(!me.place||me.hidden||A.dlg.open))close()});
function cap(){if(!V||!A.ui.vistaCap)return;if(EXT[V.kind]){A.ui.vistaCap(EXT[V.kind].cap?EXT[V.kind].cap(V):'');return}
  if(V.kind==='tank')A.ui.vistaCap(V.hits?`碰到 ${V.hits} 次`+(V.gold?` · 金鱼 ${V.gold} 次`:''):'还没碰到');
  else if(V.kind==='sky'||V.kind==='stars')A.ui.vistaCap([V.con&&V.con.said?'今晚看得见：'+VA.CONS[V.con.i].n:'',V.wish?`许了 ${V.wish} 个愿`:''].filter(Boolean).join(' · '));
  else A.ui.vistaCap('')}
tick(()=>{if(V&&V.phase==='on'&&V.con&&!V.con.said&&now()-V.con.t0>4.5){V.con.said=1;cap()}});

/* ---------- 鱼缸：伸爪 ---------- */
function tankTap(quiet){if(V.tap&&now()-V.tap.t0<.4)return;const r=VA.tankReach(V,V.W||480,V.H||270),x=r.x,y=r.y;V.tap={x,y,sx:r.sx,t0:now()};if(!quiet)sfx('clack');const PV0=V;
  A.after(.12,()=>{const V=PV0;if(!V||!V.fish)return;let hit=null;for(const f of V.fish){const d=Math.hypot(f.x-x,f.y-y);if(d<14&&(!hit||d<Math.hypot(hit.x-x,hit.y-y)))hit=f}
    V.fish.forEach(f=>{if(Math.hypot(f.x-x,f.y-y)<60){f.scare=1.2;const a=Math.atan2(f.y-y,f.x-x),G=VA.geo.tank(V.W,V.H);f.tx=Math.max(V.W*.06,Math.min(V.W*.94,f.x+Math.cos(a)*120));f.ty=Math.max(G.top+14,Math.min(G.sand-20,f.y+Math.sin(a)*60))}});
    if(quiet)return;if(hit){V.hits++;if(hit.gold){V.gold++;hit.gold=false;say('碰到了金鱼！它甩甩尾巴游走了')}sfx('pop')}cap()})}

/* ---------- 操作：Esc 回到店里；E / 点一下 做这个画面里的事 ---------- */
function firework(w,h,t,big=1){const x=rr(w*.35,w*.95),y=rr(h*.08,h*.3),c=rnd(FEST_COL);V.fx.push({x,y,r:rr(26,40)*big,col:c,t0:t},{x,y,r:rr(12,18)*big,col:rnd(FEST_COL.filter(q=>q!==c)),t0:t+.08})}
function act(){if(!V||V.phase!=='on')return;const t=now(),w=V.W||480,h=V.H||270;if(EXT[V.kind]){EXT[V.kind].act&&EXT[V.kind].act(V);return}
  if(V.kind==='tank'){tankTap();return}
  if(V.kind==='treetop'){firework(w,h,t);sfx('pop');return}
  if(V.kind==='sky'||V.kind==='stars'){const s=V.star;if(s&&t-s.t0<1.1){V.wish++;V.star=null;sfx('disc');say(V.wish>1?`又许了一个愿（第 ${V.wish} 个）`:'流星！许了一个愿');cap();return}say(starry(V.kind)?'等一颗流星……':'白天看不到流星。夜里再来，或者去屋顶');return}
  if(V.kind==='moon'){say('月亮上有一只猫？……再看一会儿');return}
  if(V.kind==='window'){V.shoo=t;sfx('meow')}}
// 夜里晴天：隔几秒划过一颗流星（在拱形窗里）
tick(()=>{if(!V||V.phase!=='on'||!starry(V.kind))return;if(now()>V.nextStar){const w=V.W||480,h=V.H||270;
  if(V.kind==='sky'){const G=VA.geo.sky(w,h);V.star={t0:now(),x:rr(G.wx0+G.ww*.2,G.wx1-G.ww*.2),y:rr(G.wy0+12,G.spring),dx:rr(40,70)*(Math.random()<.5?-1:1),dy:rr(20,34)}}
  else{const G=VA.geo.stars(w,h);V.star={t0:now(),x:rr(G.x0,G.x1),y:rr(G.y0,G.y1*.6),dx:rr(60,110)*(Math.random()<.5?-1:1),dy:rr(26,44)}}V.nextStar=now()+rr(2.5,6)}});
function paint(ctx,w,h){const o=C,t=now(),S2=skyS(V.kind);ctx.imageSmoothingEnabled=false;V.W=w;V.H=h;
  if(EXT[V.kind]){const X=EXT[V.kind];VA.tint=X.tint||null;use(VA.tint?VA.tctx(ctx):ctx);try{X.draw({w,h,t,S,V,pal:me.pal})}finally{VA.tint=null;use(o)}return}
  VA.tint=V.kind==='stars'||V.kind==='moon'?null:S2.tod==='day'?null:S2.tod==='dusk'?'#ffe2cc':{window:'#8a86c0',treetop:'#7c78b8',sky:'#b8b4e0',tank:'#cdc9ec'}[V.kind];
  use(VA.tint?VA.tctx(ctx):ctx);try{VA.draw[V.kind]({w,h,t,S:S2,V,pal:me.pal})}finally{VA.tint=null;use(o)}}
A.vista={get on(){return !!V&&V.phase!=='back'},get kind(){return V&&V.kind},open,close,add:(k,spec)=>{EXT[k]=spec},cap:()=>cap(),get cur(){return V},
  frame(){if(!V)return{show:'world',black:0};const k=now()-V.t0;return V.phase==='in'?{show:'world',black:Math.min(1,k/T_IN)}:V.phase==='on'?{show:'vista',black:Math.max(0,1-k/T_ON)}:V.phase==='out'?{show:'vista',black:Math.min(1,k/T_OUT)}:{show:'world',black:Math.max(0,1-k/T_BACK)}},
  draw(ctx,w,h){if(V)paint(ctx,w,h)},
  key(e){const k=e.key;if(k==='Escape'){close();return true}if(V&&EXT[V.kind]&&EXT[V.kind].key&&EXT[V.kind].key(e,V))return true;if(k==='e'||k==='E'||k===' '||k==='Enter'){if(!e.repeat)act();return true}
    const mv={ArrowLeft:-1,a:-1,A:-1,ArrowRight:1,d:1,D:1}[k];if(V&&V.kind==='tank'&&mv!=null){const w=V.W||480;V.px=Math.max(w*.06,Math.min(w*.94,(V.px??w/2)+mv*10));V.py=V.py??(V.H||270)*.6;return true}
    if(/^(Arrow|[wasdWASD]$)/.test(k))close();return true},
  keyup(e){if(V&&EXT[V.kind]&&EXT[V.kind].keyup)EXT[V.kind].keyup(e,V)},
  pointer(x,y){if(V){V.px=x;V.py=y;if(EXT[V.kind]&&EXT[V.kind].pointer)EXT[V.kind].pointer(x,y,V)}},click(x,y){if(!V)return;V.px=x;V.py=y;if(EXT[V.kind]&&EXT[V.kind].click){EXT[V.kind].click(x,y,V);return}if(V.kind==='tank')tankTap();else act()}};

// 说明页上的小预览：每个画面一份自己的状态，自己放烟花、等流星、伸爪、连星座（不出声、不计数）。成品里没有说明页，留着给样页对照
const PV={};
A.vista.preview=(ctx,w,h,kind)=>{const keep=V,t=now();V=PV[kind]||(PV[kind]={kind,o:{w:0},t0:t,phase:'on',px:null,py:null,fx:[],hits:0,gold:0,wish:0,star:null,nextStar:0,auto:0,con:null});
  try{if(t>V.auto){V.auto=t+2.4;if(kind==='treetop')firework(w,h,t,.8);else if(kind==='tank'&&V.fish){const f=V.fish[Math.floor(Math.random()*V.fish.length)];V.px=f.x;V.py=f.y;tankTap(true)}}
    if(kind==='sky'){if(!V.con||t-V.con.t0>9)V.con={i:((V.con?V.con.i:-1)+1)%VA.CONS.length,t0:t};const G=VA.geo.sky(w,h);if(!V.star||t-V.star.t0>3)V.star={t0:t,x:rr(G.wx0+G.ww*.3,G.wx1-G.ww*.3),y:rr(G.wy0+12,G.spring),dx:rr(40,60),dy:rr(20,30)}}
    paint(ctx,w,h)}finally{V=keep}};

/* ---------- 在哪儿切到特写 ---------- */
// 橱窗：空着嘴按"看看窗外"；鱼缸：凑近看；窗边软座、巨树树顶：坐好以后（A.onSeat）
const sitThen=(c,at,face,kind,o)=>A.run(c,[{go:at},{fn:c=>{c.face=face;A.settle(c,{k:'sit',ex:'lookUp'});c.doing='在看风景';open(kind,o)}}]);
[0,1].forEach(w=>{const th=A.TID('win'+w),go0=th.go;th.go=c=>{if(c.me&&!(c.hold&&c.hold.knit)){const W=P.wins[w];sitThen(c,{x:Math.max(W.x+14,Math.min(W.x+W.w-14,c.x)),y:P.hangY+4},'R','window',{w});return}go0(c)}});
{const th=A.TID('tank'),go0=th.go;th.go=c=>{if(c.me){sitThen(c,P.tankView,'L','tank');return}go0(c)}}
const seat0=A.onSeat;A.onSeat=(id,c,i)=>{if(seat0)seat0(id,c,i);if(!c.me)return;const k={treetop:'treetop',winseat:'sky',stargaze:'stars'}[id];if(k)A.after(.3,()=>{if(me.place)open(k)})};
});
