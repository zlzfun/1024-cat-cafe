/* 1024 猫咖 · 场景 v4 进店的那一下（进店流程的最后一步，接在 entry-tutorial.js 的"跳进光里"后面）。
   - drop（第一次来）：镜头停在一楼咖啡厅的天花板下，你的猫从巨树的叶子里掉下来，一路带下几片叶子，落在树下——压扁一下、扬起一圈灰；
     旁边的猫吓一跳回头看，你的猫开心地蹦一下。
   - wake（来过）：画面从黑里一圈圈亮开，你的猫在上次离开的地方蜷着睡觉，醒来、伸个懒腰。
   - 第一颗毛线球送到面前：第一次来、落地以后，一只闲着的店猫（先找斑斑）叼着一颗毛线球从画面外跑过来，传给你——
     不用先去门厅找毛线篮，也是第一次看到"传球"。
   A.arrive(how, {x,y, onLand, onDone})；到结束之前 A.arriving() 为真，页面这时不接玩家的操作。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,run,emote,speak,sfx,after,idle}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f);
const LAND={x:TREE.cx+70,y:TREE.f1.base+48},TOP=TREE.f1.top+6,G=560,D=.45,fy=k=>TOP+.5*G*Math.max(0,k-D)**2;   // 从咖啡厅天花板的洞口、树叶里掉下来，落在树下
let ar=null;const leaves=[];
function spotNear(x,y){if(A.free?A.free(x,y):true)return{x,y};for(let r=4;r<60;r+=4)for(let a=0;a<12;a++){const q=a/12*Math.PI*2,px=x+Math.cos(q)*r,py=y+Math.sin(q)*r;if(A.free(px,py))return{x:px,y:py}}return{...LAND}}
A.arrive=(how,o={})=>{const p=how==='wake'&&o.x!=null?spotNear(o.x,o.y):spotNear(LAND.x,LAND.y);me.x=p.x;me.y=p.y;run(me,[]);me.place=null;me.follow=null;A.poke();
  ar={how,t0:now(),o,x:p.x,y:p.y,landed:false};
  if(how==='drop'){me.hidden=true;me.face='R';for(let i=0;i<14;i++)leaves.push({x:p.x+rr(-26,26),y:rr(60,130),vx:rr(-8,8),vy:rr(-6,6),t0:now()+rr(0,.5),col:rnd2(['#7cc47a','#5e8a4a','#9ccc98','#e8b83a'])});sfx('rustle')}
  else{me.hidden=false;run(me,[{k:'sleep',dur:1.2,lock:1},{k:'stretch',dur:DUR.stretch,lock:1},{k:'happy',dur:.8,lock:1}])}};
const rnd2=a=>a[Math.floor(Math.random()*a.length)];
A.arriving=()=>!!ar;
tick(()=>{if(!ar)return;const k=now()-ar.t0;
  if(ar.how==='drop'){const fall=D+Math.sqrt(2*(ar.y-TOP)/G);
    if(k>=fall&&!ar.landed){ar.landed=true;me.hidden=false;run(me,[{k:'lie',dur:.28,lock:1},{k:'happy',dur:1.1,lock:1}]);S.puffs.push({x:ar.x,y:ar.y-2,t0:now()},{x:ar.x-7,y:ar.y,t0:now()+.05},{x:ar.x+7,y:ar.y,t0:now()+.05});sfx('land');ar.shake=now();
      S.cats.filter(c=>!c.me&&!c.hidden&&!c.gone&&Math.hypot(c.x-ar.x,c.y-ar.y)<90).slice(0,6).forEach((c,i)=>after(.1+i*.07,()=>{if(c.place)return;c.face=c.x<ar.x?'R':'L';emote(c,'bang',1.4);if(idle(c))run(c,[{k:'alert',dur:1.2,soft:1}])}));
      ar.o.onLand&&ar.o.onLand()}
    if(ar.landed&&k>fall+.3&&!ar.hop){ar.hop=1;sfx('meow')}
    if(k>fall+1.5)end()}
  else{if(k>1.2&&!ar.woke){ar.woke=1;sfx('yawn');
      const c=S.cats.filter(c=>c.kind==='npc'&&!c.hidden&&Math.hypot(c.x-me.x,c.y-me.y)<120)[0];if(c)after(.8,()=>emote(c,'heart',1.6))}
    if(k>1.2+DUR.stretch+.9)end()}});
function end(){const o=ar.o,how=ar.how;ar=null;me.hidden=false;A.poke();o.onDone&&o.onDone();if(how==='drop')after(2.4,greet)}
function greet(){if(A.guide.balls()||A.Q.cur||me.hold||me.hidden||me.place)return;   // 还没解过球、嘴里空着才送
  const c=[5,4,3].map(p=>S.cats.find(o=>o.kind==='npc'&&o.pal===p)).find(o=>o&&!o.working&&!o.hold&&!o.ctoy&&!o.place&&!o.riding&&!o.hidden&&o.z==null);if(!c)return;
  // 从画面外跑进来：离得远就先挪到画面边上外头一点（能站的地方），省得跑半个店
  const v=A.view(),out=p=>p.x<v.x-8||p.x>v.x+v.w+8||p.y<v.y-8||p.y>v.y+v.h+30;
  if(Math.hypot(c.x-me.x,c.y-me.y)>320||!out(c)){const side=me.x-v.x<v.w/2?1:-1;for(const dx of [side,-side]){const p=A.land(me.x+dx*(v.w/2+26),me.y-6);if(out(p)&&A.findPath(p.x,p.y,me.x,me.y)){A.run(c,[]);c.x=p.x;c.y=p.y;c.z=undefined;c.atHome=false;break}}}
  c.hold={ci:Math.floor(Math.random()*5),kind:rnd2(Object.keys(KNIT)),note:'',knit:false,chain:['门外',c.name]};c.working=true;c.doing='给新来的猫送毛线球';
  run(c,[{chase:()=>({x:me.x+(c.x<me.x?-24:24),y:me.y+2}),near:26,sp:64},{fn:c=>{A.faceTo(c,me);speak(c,'新来的？这颗给你练练手',2.8)}},{k:'hold',dur:1.5},
    {fn:c=>{c.working=false;c.doing=null;if(!c.hold)return;if(me.hold||me.hidden||Math.hypot(c.x-me.x,c.y-me.y)>170){S.baskets[0].push(c.hold);c.hold=null;return}A.pass(c,me)}}])}
// 掉下来的那只猫和叶子画在最上面（落地以前 me.hidden，引擎不画它）
A.overs.push(()=>{const t=now();for(let i=leaves.length-1;i>=0;i--){const l=leaves[i],a=t-l.t0;if(a<0)continue;if(a>3){leaves.splice(i,1);continue}
    const x=Math.round(l.x+l.vx*a+Math.sin(a*3+i)*4),y=Math.round(l.y+22*a+a*a*16);alpha(Math.min(1,(3-a)/.8),()=>{P1(x,y,l.col);P1(x+1,y,l.col);P1(x,y+1,'#3f7a44')})}
  if(!ar||ar.how!=='drop'||ar.landed)return;const k=t-ar.t0,y=Math.min(ar.y,fy(k));
  drawCat3(C,{k:k<D+.25?'leap':'pounce',pal:me.pal,face:'R',o:0,t0:ar.t0,ex:me.myFace,def:'normal'},Math.round(ar.x),Math.round(y),t,'#ffd84a')});
// 镜头：掉下来的时候跟着猫从树冠往下走；落地时抖一下
const cam0=A.camHook;A.camHook=(vw,vh)=>{if(!ar)return cam0?cam0(vw,vh):null;const k=now()-ar.t0;
  if(ar.how==='drop'){const y=ar.landed?ar.y-12:Math.min(ar.y,fy(k))+20,sh=ar.shake&&now()-ar.shake<.25?Math.round(Math.sin(now()*90)*2):0;return{x:ar.x+(ar.landed?0:0),y:y+sh,k:k<.05?1000:9}}
  return{x:me.x,y:me.y-12,k:k<.05?1000:6}};
});
