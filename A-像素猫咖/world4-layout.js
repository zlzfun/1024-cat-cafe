/* 1024 猫咖 · 场景 v4 布局：毛线巨树放在整张地图的正中间，别的房间围着它。在 world-map.js 后面、world4-map.js 前面加载。
   从左到右：前厅、橱窗长廊（上）/ 厨房、大客厅（下） | 巨树中庭 | 1024 工坊（上）/ 后院（下） | 猫猫图书馆（上）/ 花园小径（下）。世界 1680×540。
   橱窗长廊、工坊各开一道门通中庭，大客厅原来通后院的门现在通中庭；后院和中庭之间不砌墙，草地连成一片（world4-atrium.js 画中庭）。
   做法：world-map.js 不改（v3 还在用）。它的数据（点位、可走区域、家具、夜灯、房间）在这里按新布局挪好：x≥640 的整体右移 400；
   它的画法照旧用老坐标，左半画一次，右半平移 400 再画一次，各自裁在自己那一块里。 */
(()=>{const M=WORLD,SPLIT=640,DX=400,H=M.h;
const P_OLD=JSON.parse(JSON.stringify(WP));   // v3 的画法用老坐标
// 点位：x≥640 的右移（数组、嵌套的也挪；宽度不动）
const shift=o=>{if(Array.isArray(o))o.forEach(shift);else if(o&&typeof o==='object'){if(typeof o.x==='number'&&o.x>=SPLIT)o.x+=DX;for(const k in o)if(o[k]&&typeof o[k]==='object')shift(o[k])}};
for(const k in WP)shift(WP[k]);
M.rooms.forEach(r=>{if(r.x>=SPLIT)r.x+=DX});
M.lights.forEach(l=>{if(l.x>=SPLIT)l.x+=DX});
M.openings.forEach(o=>{if(o[0]>=SPLIT)o[0]+=DX});
// 橱窗长廊右下角那两盆植物挪走：那里开了通中庭的门
M.BLOCK=M.BLOCK.filter(b=>!(b[0]===628&&b[1]===206)).map(b=>b[0]>=SPLIT?[b[0]+DX,b[1],b[2],b[3]]:b);
M.props=M.props.filter(p=>!(p.x===630&&(p.y===196||p.y===222)));
M.props.forEach(p=>{if(p.x<SPLIT)return;p.x+=DX;
  if(p.y===520&&p.w===316){const d=p.draw;p.draw=(t,S)=>{C.save();C.translate(DX,0);d(t,S);C.restore()}}});   // 后院下沿的篱笆是写死坐标画的
// 可走区域：v3 的第 0 块是上排整条走廊，切成两段。第 0 块留给工坊（扫地机器人 A 只在这一块里转，它的充电座在工坊）
const Wk=M.WALK;
Wk[0]=[1044,58,308,190];Wk[3]=[1048,306,300,214];Wk[6]=[1204,240,32,72];
Wk[8]=[626,396,24,36];                    // 大客厅右墙的门洞：原来通后院，现在通中庭
Wk.push([8,58,628,190]);                   // 上排左边：前厅 + 橱窗长廊
// 老代码里写死坐标的几处（world-acts.js 读这几个点位，v3 用默认值）
Object.assign(WP,{flyArea:[680,300,660,220],yardLights:{x0:1050,x1:1350},
  giantPath:[{x:150,y:92},{x:300,y:160},{x:470,y:170},{x:600,y:214},{x:700,y:212},{x:980,y:212},{x:1080,y:204}]});
// 画：左半照画；右半平移 400
const OLD=Object.assign(Object.create(M),{P:P_OLD});
function halves(f,vis){
  if(!vis||vis(0,0,SPLIT,H)){C.save();C.beginPath();C.rect(0,0,SPLIT,H);C.clip();f(vis);C.restore()}
  if(!vis||vis(SPLIT+DX,0,320,H)){C.save();C.beginPath();C.rect(SPLIT+DX,0,320,H);C.clip();C.translate(DX,0);f(vis&&((x,y,w,h)=>vis(x+DX,y,w,h)));C.restore()}}
const bg0=M.bg,wall0=M.wall,floor0=M.floor,over0=M.over;
M.bg=function(){halves(()=>bg0.call(OLD))};
M.wall=function(t,S,vis){halves(v=>wall0.call(OLD,t,S,v),vis)};
M.floor=function(t,S,vis){halves(v=>floor0.call(OLD,t,S,v),vis)};
M.over=function(t,S,vis){halves(v=>over0.call(OLD,t,S,v),vis)};
M.w=1680;
})();
