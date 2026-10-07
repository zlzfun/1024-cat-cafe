/* 1024 猫咖 · 声音的店里这一侧（设计见 docs/店内设计.md 第六节）：你在哪一层、离哪些声源多远，每 0.2 秒交给 sound.js 一次；你走路的脚步；每只猫的声线。
   声音默认关着；关着的时候这里只算不发。
   - 一楼：点唱机（离它越近越响）、河水和小溪、后院的虫鸣、许愿池边的青蛙；在屋里的时候，屋外的声音小很多。
   - 二楼：大客厅的壁炉；站在巨树回廊的天井边，隐约听得到楼下点唱机的音乐。
   - 屋顶：夜风。
   - 地下：迪斯科舞厅放《喵喵迪斯科》（Sound.DISCO，点唱机里没有；门厅里隔着墙闷闷地听得到）；澡堂的水声和滴水；电影院放映机的咔嗒。
   - 猫猫星球：很轻的一层嗡嗡声。
   - 挨着睡着的猫躺下，听得见呼噜。 */
WORLD_MODS.push(A=>{
const {S,P,me,roomAt}=A;
const now=()=>A.t,tick=f=>A.tickers.push(f),cl=v=>Math.max(0,Math.min(1,v)),fall=(d,r)=>cl(1-d/r);
// 店猫的声线（宪宪低而软、砚砚短促、烁烁又高又碎、小狸花清亮、斑斑尖、金哥懒洋洋拖长音）；别的猫按名字定一个音高，同一只猫每次都一样
const SHOP={1:{f:520,d:.36,s:1.2},2:{f:470,d:.18,s:1.1},3:{f:820,d:.2,s:1.5,two:1},4:{f:700,d:.26,s:1.3},5:{f:900,d:.2,s:1.6},6:{f:430,d:.62,s:.85}};
const hs=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return(h>>>0)/4294967296};
A.voiceOf=c=>c.kind==='npc'&&SHOP[c.pal]?SHOP[c.pal]:{f:560+hs(c.name)*320,d:.22+hs(c.name+'d')*.14,s:1.15+hs(c.name+'s')*.4};
const emo0=A.onEmote;A.onEmote=(c,i)=>{if(i===0&&A.play&&Math.hypot(c.x-me.x,c.y-me.y)<240&&window.Sound&&Sound.on){Sound.sfx('meow',A.voiceOf(c));c._meowed=now()}emo0(c,i)};

// 地面：你脚下是什么
const OUT=r=>r==='yard'||r==='river';
function surface(){const r=roomAt(me.x,me.y).id,x=me.x,y=me.y;
  if(r==='river'){if(x>=P.pier.x-2&&x<=P.pier.x+P.pier.w+2&&y<=P.pier.y+P.pier.h)return'plank';if(x>=P.bridge.x-4&&x<=P.bridge.x+P.bridge.w+4)return'plank';return'grass'}
  if(r==='yard')return y<640&&x>740?'stone':'grass';
  return{hall:'wood',gallery:'wood',stage:'wood',bar:'tile',cafe:'wood',stairs:'stone',lab:'rubber',well:'wood',library:'wood',lounge:x>60&&x<270&&y>P.kotatsu.y-16&&y<P.kotatsu.y+46?'carpet':'wood',nap:'carpet',roof:x<250&&y<Y3+414?'tile':'wood',
    disco:'tile',b1hall:'carpet',bath:'tile',cinema:'carpet'}[r]||(A.floorOf(y).id==='planet'?'rubber':'wood')}
let stepT=0,ambT=0;
tick(dt=>{if(!A.play||!window.Sound||!Sound.on)return;
  // 脚步：只有你自己的
  const walking=me.k&&me.k.startsWith('walk')&&me.z==null&&!me.hidden&&!me.transit;
  if(walking){if((stepT-=dt)<=0){stepT=.27;Sound.sfx('step2',surface())}}else stepT=.05;
  if((ambT-=dt)>0)return;ambT=.2;
  const f=A.floorOf(me.y).id,r=roomAt(me.x,me.y).id,out=OUT(r),lv={};
  if(f==='f1'){const RV=P.river,dr=me.y<RV.y?RV.y-me.y:me.y>RV.y+RV.h?me.y-RV.y-RV.h:0;lv.river=fall(dr,260)*(out?1:.25);
    lv.brook=fall(Math.hypot(me.x-P.pond.x,me.y-P.pond.y),200)*(out?1:.2);lv.crickets=out?(r==='yard'?1:.6):me.y>380?.12:0;lv.frogs=fall(Math.hypot(me.x-P.pond.x,me.y-P.pond.y),320)*(out?1:.15);
    const J=S.juke;if(J&&J.on){const d=Math.hypot(me.x-(P.juke.x+12),me.y-(P.juke.y+30));lv.music=fall(d,460)*(out?.35:1);lv.track=J.track}}
  else if(f==='f2'){lv.fire=fall(Math.hypot(me.x-(P.fire.x+30),me.y-(P.fire.y+50)),280);const J=S.juke;if(J&&J.on&&r==='well'){lv.music=.22;lv.track=J.track}}
  else if(f==='roof')lv.wind=1;
  else if(f==='b1'){const d=Math.hypot(me.x-264,me.y-(Y4+164));lv.music=r==='disco'?fall(d,520)*.9+.1:r==='b1hall'?.28:.08;lv.track=Sound.DISCO;
    if(r==='bath'){lv.bath=1;lv.drip=1}if(r==='cinema'){lv.proj=fall(Math.hypot(me.x-P.projector.x,me.y-P.projector.y),360);if(A.cinema&&A.cinema.playing()){lv.music=.45;lv.track=1}else lv.music=0}}
  else if(f==='planet')lv.hum=1;
  // 挨着睡着的猫：呼噜
  if(me.k==='sleep'||me.k==='lie')lv.purr=S.cats.some(c=>c!==me&&c.k==='sleep'&&!c.hidden&&Math.hypot(c.x-me.x,c.y-me.y)<22)?1:0;
  Sound.amb(lv)});
});
