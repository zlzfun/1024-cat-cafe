/* 1024 猫咖 · 场景 v4 引导：让人知道"我是哪只猫"、"哪些东西能玩、怎么玩、玩了会怎样"。依赖 world4-things.js、world4-quest.js。
   - 找到我：C 键或点头像，你脚下荡开三圈波纹（引擎里 hi 模式另有黄色描边、脚下光圈、黄底名牌）
   - 能玩的东西：画面上不给东西加记号。走近了，按 E 会用到的那一样头上顶一个 E 键帽；鼠标移到能玩的东西上会变成猫爪（页面里做）。
     想知道玩什么，问前台猫，或者等店猫搭话（world4-desk.js）
   - 图鉴 GUIDE：每样东西在哪、会发生什么、对应猫猫咖啡馆的哪项能力（how 只写前提）；第一次玩到弹"新发现"，记下时间。
     页面上的图鉴像成就列表：解锁的排在前面（最近的最前），没解锁的只留名字和房间，点一下猫走过去
   - 训练营：五步走完一整颗毛线球；有任务时画箭头指路（在画面外就贴在边上）
   发现过什么、训练营走到哪，存在浏览器本地（localStorage，读不到就当第一次来）。 */
const GUIDE={
  basket:{n:'毛线篮',room:'hall',how:'空着嘴才能叼',what:'叼起一颗毛线球，便签会自动展开：人类想请猫帮什么忙',tie:'猫猫咖啡馆里，任务就叫"毛线球"，按 doing / blocked / todo / done 排得清清楚楚',tip:'ball'},
  knock:{n:'门 · 投递口',room:'hall',what:'扒拉一下，门外会塞进来几颗毛线球',tie:'毛线球从各个渠道来：网页、飞书、钉钉、企业微信、微信、GitHub……',tip:'channel'},
  cork:{n:'委托看板',room:'hall',what:'一张便签就是一颗还没解的毛线球',tie:'猫猫咖啡馆有一块全局的任务中心：猫会建议谁来领，你批准了就自动开工'},
  stand:{n:'迎宾立牌',room:'hall',what:'一段猫咖介绍，还有官网、GitHub、内源主页的入口',tip:'multi'},
  starjar:{n:'星星罐子',room:'hall',what:'打开以后，附近的猫全都停下三秒，等你指示',tie:'"星星罐子"是猫猫咖啡馆的拉闸词：对猫说出来，猫会全面冻结',tip:'magic'},
  post:{n:'猫抓柱',room:'hall',what:'伸长了磨爪子，毛屑乱飞'},plant:{n:'盆栽',room:'hall',what:'蹭一蹭，叶子晃一晃'},coffee:{n:'咖啡机',room:'hall',what:'自己咕嘟一下'},
  bigbox:{n:'大纸箱',room:'hall',what:'能挤三只，只露脑袋'},bed:{n:'猫窝',room:'hall',what:'蜷起来睡一觉'},
  win:{n:'橱窗',room:'gallery',what:'叼着织好的东西，就跳上窗台挂到夹子上，等人类取走、收回信；空着嘴，就趴在窗台上看看街对面',tie:'猫猫咖啡馆的交付不只是文字，还有卡片、截图、清单、语音',tip:'rich'},
  board:{n:'小黑板',room:'gallery',what:'今天一共交付了多少件',tie:'猫猫咖啡馆有猫猫排行榜：最爱猫猫、深夜劳模、成就徽章'},
  paw:{n:'爪印墙',room:'gallery',what:'在墙边的印泥上蘸一下，墙上多一个爪印，颜色是你项圈的颜色',tie:'想在猫猫咖啡馆留下爪印？来 GitHub 提个 PR',tip:'open'},
  stage:{n:'背景板',room:'gallery',what:'站到背景板前，等有猫按快门'},camera:{n:'相机',room:'gallery',what:'倒数 3、2、1，拍一张合照，可以保存',tie:'对猫猫咖啡馆的猫说"给我看看"，它会直接截图给你',tip:'rich'},
  sunA:{n:'橱窗下的阳光',room:'gallery',how:'晴天才有',what:'趴着晒太阳'},
  desk:{n:'键盘',room:'lab',what:'CI 红了就跳上桌踩键盘，猫越多修得越快',tie:'猫猫咖啡馆会盯着 CI：挂了会加急叫醒猫',tip:'github'},
  duck:{n:'小黄鸭',room:'lab',how:'要叼着毛线球',what:'把问题讲给它听，这颗球会解得很快'},printer:{n:'打印机',room:'lab',what:'打出来一张纸，团成纸团踢着玩'},
  paper:{n:'纸团',room:'lab',what:'扑过去，往废纸篓那边踢，进了算进球'},
  rack:{n:'服务器机柜',room:'lab',how:'砚砚不在的时候才能上去',what:'顶上最暖，是砚砚的地盘',tie:'砚砚是缅因猫（Codex），专管 Review 和找 bug',tip:'review'},
  tools:{n:'工具墙',room:'lab',what:'看看猫都有哪些工具',tie:'实际上，它们是猫猫咖啡馆的 MCP 工具和按需加载的 Skills',tip:'skills'},
  merge:{n:'合并门禁',room:'lab',what:'测试、CI、Review 三盏灯全亮，横杆才抬起来',tie:'猫猫咖啡馆的家规：main 永远是绿的',tip:'sop'},
  giant:{n:'大毛线团',room:'lab',how:'要三只猫一起',what:'围着一起扒拉才解得开，解开后织成一条横幅',tip:'multi'},bean:{n:'懒人沙发',room:'lab',what:'陷进去'},
  feed:{n:'自动喂食器',room:'kitchen',what:'吃饭；碗空了伸爪按一下',tie:'在猫猫咖啡馆，"猫粮"指的是模型额度（猫粮看板正在做）'},fountain:{n:'流水饮水机',room:'kitchen',what:'趴着喝几口'},
  plate:{n:'零食机的爪垫',room:'kitchen',how:'要三只猫一起踩',what:'三块爪垫同时有猫踩着，才出零食',tip:'multi'},treat:{n:'零食机',room:'kitchen',what:'看看它怎么用'},
  treatBit:{n:'零食',room:'kitchen',what:'吃掉'},table:{n:'小桌子',room:'kitchen',what:'跳上去，把桌上的小东西推下去'},
  toyback:{n:'掉在地上的小东西',room:'kitchen',how:'有东西被推下来的时候',what:'叼起来，跳上桌摆回原处。下一只猫还能再推一次'},
  grass:{n:'猫草',room:'kitchen',what:'啃两口'},tank:{n:'鱼缸',room:'kitchen',what:'凑近了看鱼：画面切到鱼缸跟前，伸爪子碰碰玻璃，看能碰到几次'},
  kotatsu:{n:'暖桌',room:'lounge',what:'钻进去只露尾巴，最多 6 条'},fire:{n:'壁炉',room:'lounge',what:'趴在前面烤火'},
  sofa:{n:'沙发',room:'lounge',what:'跳上去睡一觉',tie:'最左边的位置是宪宪的：布偶猫（Claude），管架构、写代码',tip:'profile'},
  tree:{n:'高猫爬架',room:'lounge',what:'一层层跳上去'},piano:{n:'地板钢琴',room:'lounge',what:'走上去就响，踩到哪个键亮哪个（右边可以开声音）',tie:'猫猫咖啡馆里，每只猫有自己的声线',tip:'voice'},
  bubbler:{n:'泡泡机',room:'lounge',what:'冒十秒泡泡'},pop:{n:'泡泡',room:'lounge',what:'扑上去，啵！'},
  laser:{n:'激光逗猫器',room:'lounge',what:'红点满客厅乱窜'},dot:{n:'激光点',room:'lounge',what:'扑上去……永远差一点'},
  tunnel:{n:'猫隧道',room:'lounge',what:'从任意一头钻进去，另一头钻出来'},catnip:{n:'猫薄荷鱼',room:'lounge',what:'闻一闻，晕乎乎'},
  sunB:{n:'客厅的阳光',room:'lounge',how:'晴天才有',what:'趴着晒太阳'},
  pile:{n:'落叶堆',room:'yard',how:'叶子攒够了才能跳',what:'一跃跳进去，叶子炸开一地'},fly:{n:'蝴蝶',room:'yard',what:'扑……差一点'},
  bath:{n:'鸟浴盆',room:'yard',how:'有鸟来的时候',what:'悄悄靠近，扑！'},wheel:{n:'猫跑轮',room:'yard',what:'跑起来发电，旁边的串灯一颗颗亮起来'},
  hammock:{n:'吊床',room:'yard',what:'躺进去晃呀晃',tip:'dream'},
  shelf:{n:'书架',room:'library',what:'翻一翻：五架书是决策日志、教训沉淀、证据库、人物关系、事件记忆，翻到的都是这间猫咖自己的记忆',tie:'猫猫咖啡馆的长期记忆就叫"图书馆"',tip:'memory'},
  catalog:{n:'检索柜',room:'library',what:'查一查某件事记在哪一架',tip:'memory'},readtable:{n:'阅读桌',room:'library',what:'跳上桌，趴在摊开的书上'},
  armchair:{n:'扶手椅',room:'library',what:'窝进去'},winseat:{n:'窗边软座',room:'library',what:'趴在窗边看天：夜里等一颗流星许个愿。在这儿睡着的猫会做梦',tip:'dream'},
  lectern:{n:'说明书讲台',room:'library',what:'翻开猫咖说明书：官网、文档、使用小 Tips',tip:'identity'},
  pond:{n:'许愿池',room:'path',what:'投一颗星星，许个愿',tie:'在 GitHub 上给猫猫咖啡馆点一颗 Star，就等于往池子里投了一颗',tip:'open'},
  chess:{n:'石桌象棋',room:'path',how:'要两只猫坐下',what:'两个石凳都坐了猫，就开一盘',tip:'game'},bench:{n:'长椅',room:'path',what:'躺着晒太阳'},
  signpost:{n:'路标',room:'path',what:'三块木牌：官网、GitHub、内源主页',tip:'open'},mailbox:{n:'邮筒',room:'path',what:'给猫咖写封信（反馈、需求、bug）',tip:'feedback'},
  gate:{n:'小门',room:'path',what:'推不开：门外是人类的世界'},
  yarntree:{n:'毛线巨树',room:'atrium',what:'一根根横枝跳上去，爬到树顶的瞭望台，看整条街',tie:'六根横枝是猫猫咖啡馆的六个家族：Claude、Codex、Gemini、GLM、Antigravity、opencode',tip:'family'},
  treeplaque:{n:'巨树的铭牌',room:'atrium',what:'全店每挂出一件成品，树上就多挂一件；挂满了，满树金光',tip:'multi'}};
const GID=id=>id.startsWith('q_')?null:id.replace(/^(basket|win|feed|plate|shelf|toyback)\d$/,'$1');

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,say,sfx,after,TH,dist}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,val=(v,...a)=>typeof v==='function'?v(...a):v,tick=f=>A.tickers.push(f);
let store={disc:{},camp:{},rooms:{}};try{const s=JSON.parse(localStorage.getItem('cat1024-v4')||'null');if(s&&s.disc)store=Object.assign(store,s)}catch(e){}
const save=()=>{try{localStorage.setItem('cat1024-v4',JSON.stringify(store))}catch(e){}};
// disc[k] 记的是第一次玩到的时间（毫秒）；旧记录是 1。balls：一共解开了几颗毛线球
const G=A.guide={GUIDE,disc:store.disc,total:Object.keys(GUIDE).length,count:()=>Object.keys(store.disc).filter(k=>GUIDE[k]).length,balls:()=>store.balls||0,
  info:id=>{const g=GID(id);return g&&GUIDE[g]?{...GUIDE[g],id:g,found:!!store.disc[g]}:null},
  roomInfo:id=>{const L=Object.entries(GUIDE).filter(([,g])=>g.room===id);return{n:L.length,found:L.filter(([k])=>store.disc[k]).length}},
  reset:()=>{store={disc:{},camp:{},rooms:{}};G.disc=store.disc;camp.done=store.camp;camp.on=true;save();A.ui.camp&&A.ui.camp()}};
A.on('solve',()=>{store.balls=(store.balls||0)+1;save()});

/* ---------- 第一次玩到某样东西：新发现 ---------- */
A.onUse=th=>{const g=GID(th.id);if(!g||!GUIDE[g])return;A.emit('use',g);if(store.disc[g])return;store.disc[g]=Date.now();save();
  A.ui.discover&&A.ui.discover({...GUIDE[g],id:g,count:G.count(),total:G.total,tipObj:GUIDE[g].tip?{...TIPS[GUIDE[g].tip],key:GUIDE[g].tip}:null})};
A.on('visit',()=>campMark('visit'));A.on('take',()=>campMark('take'));A.on('solve',()=>campMark('solve'));A.on('hang',()=>campMark('hang'));
A.on('use',g=>{if(['stand','signpost','lectern','pond','mailbox'].includes(g))campMark('visit')});

/* ---------- 训练营：五步 ---------- */
const CAMP=[{id:'move',t:'走两步',sub:'WASD / 方向键，或者点一下地面'},{id:'take',t:'叼一颗毛线球',sub:'前厅的毛线篮里就有'},{id:'solve',t:'按便签把它解开',sub:'对话框里会告诉你要做什么'},
  {id:'hang',t:'挂进橱窗',sub:'叼去橱窗长廊，挂到窗前的夹子上'},{id:'visit',t:'认识猫猫咖啡馆',sub:'看看迎宾立牌、图书馆的说明书，或者花园小径的路标'}];
const camp=A.camp={steps:CAMP,done:store.camp,on:!store.camp.finished,
  start(reset){if(reset){store.camp={};this.done=store.camp}this.on=true;store.camp.finished=0;save();A.ui.camp&&A.ui.camp()},cur(){return CAMP.find(s=>!store.camp[s.id])||null}};
function campMark(id){if(store.camp[id])return;store.camp[id]=1;save();A.ui.camp&&A.ui.camp();
  if(CAMP.every(s=>store.camp[s.id])&&!store.camp.finished){store.camp.finished=1;save();sfx('fanfare');
    after(1.2,()=>{if(A.dlg.open)return;A.infoDialog('camp','训练营结业','cat',[{k:'steps',items:CAMP.map(s=>({t:s.t,sub:s.sub,done:true}))},
      {k:'text',t:'一颗毛线球从门缝进来，被你解开、织好、挂进橱窗、被人类取走——这就是猫猫咖啡馆里一个任务的一生。'},{k:'text',t:'接下来随便逛：图鉴（B）里还有很多没玩过的东西。'}],'camp',['site','inner'])})}}
let walked=0,lx=me.x,ly=me.y;
tick(()=>{walked+=Math.hypot(me.x-lx,me.y-ly);lx=me.x;ly=me.y;if(walked>60)campMark('move')});
A.campTarget=()=>{const s=camp.cur();if(!camp.on||!s)return null;
  if(s.id==='take'&&!me.hold){const i=[0,1,2].filter(i=>S.baskets[i].length).sort((a,b)=>dist(P.baskets[a],me)-dist(P.baskets[b],me))[0];if(i!=null)return{x:P.baskets[i].x+14,y:P.baskets[i].y+24,label:'毛线篮'}}
  if(s.id==='visit'&&!me.hold)return{x:P.stand.x+16,y:222,label:'迎宾立牌'};return null};

/* ---------- 找到我 ---------- */
let findT=-9;A.findMe=()=>{findT=now();if(!me.place&&!me.hidden&&!A.busy())run(me,[{k:'alert',dur:.8,soft:1}])};
A.overs.push(vis=>{const k=(now()-findT)/1.4;if(k<0||k>1||me.hidden)return;const x=Math.round(me.x),y=Math.round(me.y);
  for(let w=0;w<3;w++){const u=k*1.6-w*.3;if(u<0||u>1)continue;const rx=6+u*40,ry=rx*.38,n=Math.round(rx*1.6);alpha(1-u,()=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;P1(Math.round(x+Math.cos(a)*rx),Math.round(y+Math.sin(a)*ry),'#ffd84a')}})}});

/* ---------- 按 E 会用到的那一样：头上顶一个 E 键帽 ---------- */
const anchor=th=>{const h=val(th.hit,me);if(h)return{x:Math.round(h[0]+h[2]/2),y:Math.round(h[1])};const n=val(th.near,me);return n?{x:Math.round(n[0]+n[2]/2),y:Math.round(n[1]+n[3]/2-18)}:null};
A.anchorOf=anchor;
A.overs.push(()=>{if(!A.play||me.hidden||me.place||A.busy())return;const th=A.thingNear(me);
  if(!th||th.ok&&!th.ok(me)||me.hold&&!me.hold.knit&&th.id.startsWith('basket'))return;const a=anchor(th);if(a)eKey(a.x-4,a.y-13+(Math.floor(now()*3)%2),'#ffd84a')});

/* ---------- 指路：任务要去的地方 / 训练营下一步；画在高清层上 ---------- */
A.huds.push((hx,scale,dpr,v)=>{if(!A.play||A.dlg.open)return;const tg=(A.Q&&A.Q.target&&A.Q.target())||A.campTarget();if(!tg)return;const t=now();
  const sx=(tg.x-v.x)*scale,sy=(tg.y-v.y)*scale,W=hx.canvas.width,H=hx.canvas.height,m=34*dpr,in_=sx>m&&sx<W-m&&sy>m&&sy<H-m;hx.save();
  hx.font=`600 ${Math.round(12*dpr)}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;hx.textAlign='center';hx.textBaseline='middle';
  const pill=(x,y,s)=>{const w=hx.measureText(s).width+12*dpr,h=18*dpr;hx.fillStyle='#241a2ee6';hx.fillRect(x-w/2,y-h/2,w,h);hx.strokeStyle='#ffd84a';hx.lineWidth=dpr;hx.strokeRect(x-w/2+.5,y-h/2+.5,w-1,h-1);hx.fillStyle='#ffd84a';hx.fillText(s,x,y+.5)};
  if(in_){const b=Math.sin(t*5)*4*dpr,top=sy-(tg.cat?32:10)*scale-b;hx.fillStyle='#ffd84a';hx.strokeStyle='#241a2e';hx.lineWidth=3*dpr;
    hx.beginPath();hx.moveTo(sx-10*dpr,top-14*dpr);hx.lineTo(sx+10*dpr,top-14*dpr);hx.lineTo(sx,top);hx.closePath();hx.stroke();hx.fill();pill(sx,top-28*dpr,tg.label)}
  else{const cx=W/2,cy=H/2,dx=sx-cx,dy=sy-cy,k=Math.min((W/2-m)/Math.abs(dx||1),(H/2-m)/Math.abs(dy||1)),ex=cx+dx*k,ey=cy+dy*k,a=Math.atan2(dy,dx);
    hx.translate(ex,ey);hx.rotate(a);hx.fillStyle='#ffd84a';hx.strokeStyle='#241a2e';hx.lineWidth=3*dpr;hx.beginPath();hx.moveTo(14*dpr,0);hx.lineTo(-8*dpr,-11*dpr);hx.lineTo(-3*dpr,0);hx.lineTo(-8*dpr,11*dpr);hx.closePath();hx.stroke();hx.fill();
    hx.setTransform(1,0,0,1,0,0);const d=Math.round(Math.hypot(tg.x-me.x,tg.y-me.y)/10);pill(Math.max(60*dpr,Math.min(W-60*dpr,ex-Math.cos(a)*40*dpr)),Math.max(20*dpr,Math.min(H-20*dpr,ey-Math.sin(a)*28*dpr)),`${tg.label} · ${d} 步`)}
  hx.restore()});

/* ---------- 进一间新房间：告诉你这里有几样能玩 ---------- */
A.firstRoom=id=>{if(store.rooms[id])return false;store.rooms[id]=1;save();return true};
});
