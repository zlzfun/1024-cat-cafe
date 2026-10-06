/* 1024 猫咖 · 屋顶上能玩的（设计见 docs/店内设计.md 第三节）。依赖 world-acts.js、world4-vista.js、map-roof.js。
   - 屋脊：从平台跳上斜屋顶，再一路跳到屋脊上坐着；六个位置，坐成一排，背后是星空。烟囱边上那两个最暖和。
   - 观星毯：躺下，画面切到满天星（world4-vista.js 的 stars）。
   - 望远镜：凑过去，画面切到镜筒里的月亮（moon）。
   - 萤火虫：在树冠边上飞，扑……差一点。
   吊床、猫跑轮和那串大灯泡在 world-acts.js、world4-things.js（只是搬到了屋顶）。 */
WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,say,sfx,T,stay,unclaim,dist,land}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,tick=f=>A.tickers.push(f);

/* ---------- 屋脊：从东头跳上去，沿着屋脊一个个位置挪过去 ---------- */
const RG=P.ridge,UP=P.ridgeUp,order=i=>{const L=[];for(let j=RG.length-1;j>=i;j--)L.push(RG[j]);return L};
A.seatThing({id:'ridge',n:'屋脊',hit:[0,P.ridge[0].y-30,250,70],at:P.ridgeAt,near:[P.ridgeAt.x-20,P.ridgeAt.y-16,40,26],label:c=>c.me?'跳上屋脊（背后就是星空）':'跳上屋脊',
  spots:RG,prefer:c=>c.me?[2,3,1,4,0,5]:[5,4,0,1,3,2],up:i=>[...UP,...order(i).map(p=>({...p}))],down:i=>[...order(i).reverse().slice(1).map(p=>({...p})),...UP.slice().reverse(),{...P.ridgeAt}],floor:()=>({...P.ridgeAt}),
  k:c=>c.me?'sit':rnd(['sit','sit','lie','sleep']),ex:'content',doing:'坐在屋脊上看星星',dur:()=>rr(14,30),ai:{mood:'rest',w:2.2}});

/* ---------- 观星毯：两只猫躺着看天；你躺下就切到满天星 ---------- */
const BL=P.blanket,BS=[{x:BL.x+14,y:BL.y+11,z:BL.y+20.6,face:'R'},{x:BL.x+32,y:BL.y+11,z:BL.y+20.6,face:'L'}];
A.seatThing({id:'stargaze',n:'观星毯',hit:[BL.x,BL.y,44,20],at:P.blanketAt,near:[BL.x-6,BL.y+14,56,22],label:'躺在观星毯上看满天星',spots:BS,up:i=>[BS[i]],down:()=>[{...P.blanketAt}],floor:()=>({...P.blanketAt}),
  k:c=>c.me?'sit':rnd(['lie','sleep','belly']),ex:'lookUp',doing:'躺着看星星',dur:()=>rr(14,26),ai:{mood:'rest',w:1.8}});

/* ---------- 望远镜：凑过去看月亮 ---------- */
T({id:'scope',n:'望远镜',hit:[P.scope.x,P.scope.y,26,30],at:P.scopeAt,near:[P.scopeAt.x-16,P.scopeAt.y-14,32,24],label:'凑过去看月亮',ai:{mood:'explore',w:.6},
  go(c){run(c,[{go:P.scopeAt},{fn:c=>{c.face='R';if(c.me){A.settle(c,{k:'sit',ex:'lookUp'});c.doing='在看月亮';A.vista.open('moon')}else stay(c,{k:'sit',ex:'lookUp',face:'R',dur:rr(4,8)})}}])}});

/* ---------- 萤火虫：和后院的蝴蝶一样扑不到 ---------- */
const FA=P.flyArea;S.ffly=Array.from({length:5},(_,i)=>({x:rr(FA[0]+20,FA[0]+FA[2]-20),y:rr(FA[1]+120,FA[1]+FA[3]),h:rr(14,30),tx:0,ty:0,ph:Math.random(),spook:0}));
tick(dt=>S.ffly.forEach(f=>{if(f.spook>0)f.spook-=dt;if(!f.tx||Math.hypot(f.tx-f.x,f.ty-f.y)<3){f.tx=rr(FA[0]+20,FA[0]+FA[2]-20);f.ty=rr(FA[1]+120,FA[1]+FA[3])}
  const dx=f.tx-f.x,dy=f.ty-f.y,d=Math.hypot(dx,dy)||1,sp=f.spook>0?50:10;f.x+=dx/d*Math.min(d,sp*dt)+Math.sin(now()*3+f.ph*9)*6*dt;f.y+=dy/d*Math.min(d,sp*dt);f.h=Math.max(8,Math.min(48,f.spook>0?f.h+24*dt:f.h+Math.sin(now()*2+f.x)*8*dt))}));
A.overs.push(vis=>S.ffly.forEach(f=>{const x=Math.round(f.x),y=Math.round(f.y-f.h);if(vis(x-3,y-3,6,6))firefly(x,y,now(),f.ph)}));
tick(()=>S.ffly.forEach(f=>A.lights.push({x:f.x,y:f.y-f.h,r:8,col:'#e8f070',a:.7})));
const nearFF=c=>S.ffly.filter(f=>near(c,f,36)&&f.spook<=0).sort((a,b)=>dist(a,c)-dist(b,c))[0];
T({id:'firefly',n:'萤火虫',hidden:c=>!nearFF(c),near:c=>{const f=nearFF(c);return f?[f.x-36,f.y-26,72,52]:null},hit:()=>null,at:c=>S.ffly[0],label:'扑萤火虫',ai:{mood:'play',w:c=>A.roomAt(c.x,c.y).id==='roof'?1.5:0},
  go(c){const f=nearFF(c)||rnd(S.ffly);A.faceTo(c,f);run(c,[...(near(c,f,30)?[]:[{chase:()=>f,near:16}]),{k:'pounce',dur:.9},{jump:()=>land(f.x,f.y),h:14,dur:.34},{fn:c=>{f.spook=2.2;f.tx=0;if(c.me)say(rnd(['差一点！','萤火虫往上一飘，亮了一下','它就在爪子尖上一闪'])) }},{k:'sit',dur:.6,ex:'meh',soft:1}])}});

/* ---------- 店猫也爱上屋顶：烁烁爱看星星，斑斑爱跑轮，宪宪爱屋脊 ---------- */
Object.assign(A.LIKES[3],{stargaze:2.5,scope:1.5,firefly:2});Object.assign(A.LIKES[5],{firefly:3,ridge:1});Object.assign(A.LIKES[4],{ridge:1.5,stargaze:1});
});
