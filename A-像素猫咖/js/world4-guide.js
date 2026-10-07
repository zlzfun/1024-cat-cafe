/* 1024 猫咖 · 场景 v4 引导：让人知道"我是哪只猫"、"哪些东西能玩、怎么玩、玩了会怎样"。依赖 world4-things.js、world4-quest.js。
   - 找到我：C 键或点头像，你脚下荡开三圈波纹（引擎里 hi 模式另有黄色描边、脚下光圈、黄底名牌）
   - 能玩的东西：画面上不给东西加记号。走近了，按 E 会用到的那一样头上顶一个 E 键帽；鼠标移到能玩的东西上会变成猫爪（页面里做）。
     想知道玩什么，问前台猫，或者等店猫搭话（world4-desk.js）
   - 图鉴 GUIDE：每样东西在哪、会发生什么、对应猫猫咖啡馆的哪项能力（how 只写前提）；第一次玩到弹"新发现"，记下时间。
     悬停卡只写名字（有前提写前提）；会发生什么先不说，玩了才在"新发现"里揭晓。只有几样复杂的、和主线有关的带一行很短的 hint。
     页面上的图鉴像成就列表：解锁的排在前面（最近的最前），没解锁的只留名字和房间，点一下猫走过去
   - 指路：有任务时画箭头指向下一步（在画面外就贴在边上，躲开页面左上、右上的两块界面；在别的楼层先指楼梯）；
     点了集章卡上没盖的"交付"章，箭头指向最近的毛线篮
   发现过什么、交付了几件：成品里跟着账号存（页面提供 window.CAT_SAVE）；没有就存在浏览器本地（localStorage，读不到就当第一次来）。
   原来的"新猫训练营"去掉了（2026-10-07）：它的活分给了任务条（每颗球都摆出"解开 → 挂进橱窗 → 回信"）、集章卡和斑斑送来的第一颗球。 */
const GUIDE={
  // 一楼 · 门厅
  basket:{n:'毛线篮',room:'hall',how:'空着嘴才能叼',hint:'叼一颗，看看人类的委托',what:'叼起一颗毛线球，便签会自动展开：人类想请猫帮什么忙',tie:'猫猫咖啡馆里，任务就叫"毛线球"，按 doing / blocked / todo / done 排得清清楚楚',tip:'ball'},
  knock:{n:'门 · 投递口',room:'hall',what:'扒拉一下，门外会塞进来几颗毛线球',tie:'毛线球从各个渠道来：网页、飞书、钉钉、企业微信、微信、GitHub……',tip:'channel'},
  cork:{n:'委托看板',room:'hall',what:'一张便签就是一颗还没解的毛线球',tie:'猫猫咖啡馆有一块全局的任务中心：猫会建议谁来领，你批准了就自动开工'},
  stand:{n:'迎宾立牌',room:'hall',hint:'猫咖的来历 · 集章抽奖的入口',what:'一段猫咖介绍，还有官网、GitHub、内源主页的入口',tip:'multi'},
  starjar:{n:'星星罐子',room:'hall',what:'打开以后，附近的猫全都停下三秒，等你指示',tie:'"星星罐子"是猫猫咖啡馆的拉闸词：对猫说出来，猫会全面冻结',tip:'magic'},
  post:{n:'猫抓柱',room:'hall',what:'伸长了磨爪子，毛屑乱飞'},plant:{n:'盆栽',room:'hall',what:'蹭一蹭，叶子晃一晃'},
  // 一楼 · 橱窗长廊、1024 舞台
  win:{n:'橱窗',room:'gallery',hint:'织好的东西挂在这里',what:'叼着织好的东西，就跳上窗台挂到夹子上，等人类取走、收回信；空着嘴，就趴在窗台上看看街对面',tie:'猫猫咖啡馆的交付不只是文字，还有卡片、截图、清单、语音',tip:'rich'},
  board:{n:'小黑板',room:'gallery',what:'今天一共交付了多少件',tie:'猫猫咖啡馆有猫猫排行榜：最爱猫猫、深夜劳模、成就徽章'},
  paw:{n:'爪印墙',room:'gallery',what:'在墙边的印泥上蘸一下，墙上多一个爪印，颜色是你项圈的颜色',tie:'想在猫猫咖啡馆留下爪印？来 GitHub 提个 PR',tip:'open'},
  sunA:{n:'橱窗下的月光',room:'gallery',what:'月光从橱窗照进来，躺在里面'},
  giant:{n:'大毛线团',room:'gallery',how:'要三只猫一起',what:'围着一起扒拉才解得开，解开后织成一条横幅',tip:'multi'},
  stage:{n:'1024 舞台',room:'stage',what:'站上舞台，等有猫按快门'},camera:{n:'相机',room:'stage',what:'倒数 3、2、1，拍一张合照，可以保存',tie:'对猫猫咖啡馆的猫说"给我看看"，它会直接截图给你',tip:'rich'},
  claw:{n:'抓娃娃机',room:'stage',hint:'挪爪子，按下去抓',what:'切到机器跟前：左右挪爪子，按下去抓。十种玩偶：六只店猫、小鱼、毛线球、小老鼠，还有一条难抓的金色小鱼干',tip:'game'},
  mic:{n:'话筒',room:'stage',what:'对着话筒喵一声，声音放大好几倍，全店都听见；台下的猫回头看',tie:'猫猫咖啡馆里，每只猫有自己的声线',tip:'voice'},
  spot:{n:'聚光灯',room:'stage',what:'拨一下，一圈灯光跟着你走十五秒'},
  // 一楼 · 吧台
  coffee:{n:'大咖啡机',room:'bar',what:'伸爪按一下，咕嘟咕嘟做出一杯拉花，杯面上是一张猫脸'},cake:{n:'蛋糕柜',room:'bar',what:'隔着玻璃看蛋糕。猫只能看看'},
  stool:{n:'高脚凳',room:'bar',what:'跳上去，坐在吧台前'},
  feed:{n:'自动喂食器',room:'bar',what:'吃饭；碗空了伸爪按一下',tie:'在猫猫咖啡馆，"猫粮"指的是模型额度（猫粮看板正在做）'},fountain:{n:'流水饮水机',room:'bar',what:'趴着喝几口'},
  grass:{n:'猫草',room:'bar',what:'啃两口'},tank:{n:'鱼缸',room:'bar',what:'凑近了看鱼：画面切到鱼缸跟前，伸爪子碰碰玻璃，看能碰到几次'},
  maneki:{n:'招财猫摆件',room:'bar',what:'拍一下，它的爪子招得飞快；金哥在吧台上的话，也跟着招手。偶尔真能招来一颗毛线球'},
  grinder:{n:'磨豆机',room:'bar',what:'转一转，咖啡豆的香味一缕缕飘起来，附近的猫凑过来闻'},
  // 一楼 · 咖啡厅
  yarntree:{n:'毛线巨树',room:'cafe',hint:'一路能爬到屋顶',what:'顺着树干爬上去，穿过二楼，一直爬到屋顶的瞭望台'},
  treebench:{n:'树下的环形长凳',room:'cafe',what:'围着树根一圈，能坐六只'},treeplaque:{n:'猫猫咖啡馆的招牌',room:'cafe',what:'树下的大招牌：CLOWDER AI · 猫猫咖啡馆。凑过去看这家店和这棵树的来历：全店每挂出一件成品，树上就多挂一件，挂满了满树金光；还有官网和 GitHub',tip:'multi'},
  table:{n:'咖啡桌',room:'cafe',what:'跳上桌，把桌上的东西推下去；落地弹一下，正好砸到路过的猫，它会吓一跳'},chair:{n:'椅子',room:'cafe',what:'坐在咖啡桌旁，像在等咖啡'},
  juke:{n:'点唱机',room:'cafe',what:'换一首（一共三首），或者关掉；开着的时候灯管里的气泡往上冒。开了声音，离它越近听得越清楚'},
  toyback:{n:'掉在地上的东西',room:'cafe',how:'有东西被推下来的时候',what:'叼起来，跳上桌摆回原处。下一只猫还能再推一次'},
  // 一楼 · 楼梯间
  plate:{n:'零食机的爪垫',room:'stairs',how:'要三只猫一起踩',what:'三块爪垫同时有猫踩着，才出零食',tip:'multi'},treat:{n:'零食机',room:'stairs',what:'看看它怎么用'},treatBit:{n:'零食',room:'stairs',what:'吃掉'},
  ubin:{n:'大伞桶',room:'stairs',what:'钻进去，只露出一个脑袋'},directory:{n:'楼层指示牌',room:'stairs',what:'三层楼各有什么、怎么上去'},
  // 一楼 · 后院、河边
  pile:{n:'落叶堆',room:'yard',how:'叶子攒够了才能跳',what:'一跃跳进去，叶子炸开一地；从秋千上飞过来，正好落进去也算'},fly:{n:'飞蛾',room:'yard',what:'绕着路灯飞，扑……差一点'},
  swing:{n:'秋千',room:'yard',hint:'荡高了松手，落进落叶堆',what:'顺着摆的方向使劲，越荡越高；松手飞出去，正好落进右边的落叶堆，叶子炸开一地。太慢够不着，太快飞过头',tip:'game'},
  frog:{n:'青蛙',room:'yard',what:'蹲在许愿池边呱呱叫；扑过去，它扑通一声跳进池子，过一会儿又爬上来'},
  bath:{n:'鸟浴盆',room:'yard',how:'有鸟来的时候',what:'悄悄靠近，扑！'},
  pond:{n:'许愿池',room:'yard',what:'投一颗星星，许个愿',tie:'在 GitHub 上给猫猫咖啡馆点一颗 Star，就等于往池子里投了一颗',tip:'open'},
  chess:{n:'石桌象棋',room:'yard',how:'要两只猫坐下',what:'两个石凳都坐了猫，就开一盘',tip:'game'},bench:{n:'长椅',room:'yard',what:'躺着看许愿池'},
  fish:{n:'钓鱼',room:'river',hint:'浮漂一沉就收竿 · 大鱼要遛',what:'三个钓点的鱼不一样。甩竿，等浮漂往下一沉再收竿；上钩的是大鱼，要等点跑进绿的那段再收线，收三下才拉得上来。钓上来看一眼，放回河里',tie:'猫会照顾你：连续忙了 90 分钟，会撒娇提醒你歇一会儿——比如来河边摸会儿鱼',tip:'care'},
  boat:{n:'小船',room:'river',hint:'自己划，捞漂着的毛线球',what:'解开缆绳自己划：捞漂下来的毛线球，躲开漂木，偶尔捞到漂流瓶。一趟一分钟，捞上来的毛线球送进门厅的篮子；两只猫一起划，快一半'},
  bucket:{n:'鱼桶 · 鱼谱',room:'river',what:'翻开图鉴里的鱼谱：十种鱼，每种一幅画，钓到过几条、最大的一条多长；没钓到过的是一团黑影，写着它爱在哪个钓点咬钩。最后一种，地上的河里钓不到',tip:'care'},
  ducks:{n:'鸭子一家',room:'river',what:'鸭妈妈带着三只小鸭在河上游；扑过去，嘎嘎叫着游开'},
  signpost:{n:'路标',room:'river',hint:'集章抽奖的入口',what:'三块木牌：官网、GitHub、内源主页',tip:'open'},mailbox:{n:'邮筒',room:'river',what:'给猫咖写封信（反馈、需求、bug）',tip:'feedback'},
  gate:{n:'小门',room:'river',what:'推不开：门外是人类的世界'},
  // 二楼
  desk:{n:'键盘',room:'lab',hint:'CI 红了就去踩',what:'CI 红了就跳上桌踩键盘，猫越多修得越快',tie:'猫猫咖啡馆会盯着 CI：挂了会加急叫醒猫',tip:'github'},
  duck:{n:'小黄鸭',room:'lab',how:'要叼着毛线球',what:'把问题讲给它听，这颗球会解得很快'},printer:{n:'打印机',room:'lab',what:'打出来一张纸，团成纸团踢着玩'},
  paper:{n:'纸团',room:'lab',what:'扑过去，往废纸篓那边踢，进了算进球'},
  rack:{n:'服务器机柜',room:'lab',how:'砚砚不在的时候才能上去',what:'顶上最暖，是砚砚的地盘',tie:'砚砚是缅因猫（Codex），专管 Review 和找 bug',tip:'review'},
  tools:{n:'工具墙',room:'lab',what:'看看猫都有哪些工具',tie:'实际上，它们是猫猫咖啡馆的 MCP 工具和按需加载的 Skills',tip:'skills'},
  wboard:{n:'白板',room:'lab',what:'跳起来画一笔：一条鱼、一个毛线球、一张猫脸、LGTM、一张流程图……画满了就擦掉重来'},
  merge:{n:'合并门禁',room:'lab',hint:'三盏灯全亮才放行',what:'测试、CI、Review 三盏灯全亮，横杆才抬起来',tie:'猫猫咖啡馆的家规：main 永远是绿的',tip:'sop'},
  branch:{n:'巨树的横枝',room:'well',what:'跳上一根横枝窝着，往下看得见一楼的咖啡厅'},
  treeslide:{n:'抱着树干滑下去',room:'well',hint:'一路滑回一楼',what:'从二楼或者屋顶，顺着树干一路滑回一楼'},
  rail:{n:'天井栏杆',room:'well',what:'趴在栏杆上往下看：一楼的咖啡厅，巨树底下的猫在干什么'},
  shelf:{n:'书架',room:'library',what:'翻一翻：五架书是决策日志、教训沉淀、证据库、人物关系、事件记忆，翻到的都是这间猫咖自己的记忆',tie:'猫猫咖啡馆的长期记忆就叫"图书馆"',tip:'memory'},
  catalog:{n:'检索柜',room:'library',what:'查一查某件事记在哪一架',tip:'memory'},readtable:{n:'阅读桌',room:'library',what:'跳上桌，趴在摊开的书上'},
  armchair:{n:'扶手椅',room:'library',what:'窝进去'},winseat:{n:'窗边软座',room:'library',what:'趴在窗边看天：夜里等一颗流星许个愿。在这儿睡着的猫会做梦',tip:'dream'},
  lectern:{n:'说明书讲台',room:'library',hint:'猫咖说明书 · 官网入口',what:'翻开猫咖说明书：官网、文档、使用小 Tips',tip:'identity'},
  ladder:{n:'滚梯',room:'library',what:'站上去蹬一下，嗖地滑过整面书墙'},globe:{n:'地球仪',room:'library',what:'拍一下，转起来；停下来的时候，爪子按着一个地方'},
  kotatsu:{n:'暖桌',room:'lounge',what:'钻进去只露尾巴，最多 6 条'},fire:{n:'壁炉',room:'lounge',what:'趴在前面烤火'},
  sofa:{n:'沙发',room:'lounge',what:'跳上去睡一觉',tie:'最左边的位置是宪宪的：布偶猫（Claude），管架构、写代码',tip:'profile'},
  tree:{n:'高猫爬架',room:'lounge',what:'一层层跳上去，跳到最顶上'},piano:{n:'地板钢琴',room:'lounge',hint:'照着曲谱架弹',what:'跳上钢琴，一个键一个键跳上去，照着曲谱架弹完一首，全屋的猫都跑过来听；走过去踩着也会响',tie:'猫猫咖啡馆里，每只猫有自己的声线',tip:'voice'},
  sheet:{n:'曲谱架',room:'lounge',hint:'地板钢琴的谱',what:'摆着一首曲子的简谱，翻一页换一首：《小星星》《两只老虎》《欢乐颂》《送别》'},
  wand:{n:'弹簧逗猫棒',room:'lounge',what:'拍一下，顶上的羽毛来回弹，越拍越起劲'},
  bubbler:{n:'泡泡机',room:'lounge',what:'冒十秒泡泡'},pop:{n:'泡泡',room:'lounge',what:'扑上去，啵！泡泡机开着的十秒里戳破几个，记最好的一次'},
  laser:{n:'激光逗猫器',room:'lounge',what:'红点满客厅乱窜'},dot:{n:'激光点',room:'lounge',what:'红点停下来的那一下扑上去，才算按住；激光开着的十五秒里按住几次，记最好的一次'},
  tunnel:{n:'猫隧道',room:'lounge',what:'从任意一头钻进去，另一头钻出来'},catnip:{n:'猫薄荷鱼',room:'lounge',what:'闻一闻，晕乎乎'},
  bed:{n:'猫窝',room:'nap',what:'蜷起来睡一觉'},bigbox:{n:'大纸箱',room:'nap',what:'能挤三只，只露脑袋'},bean:{n:'懒人沙发',room:'nap',what:'陷进去'},
  moonlamp:{n:'月亮小夜灯',room:'nap',what:'跳起来拍一下，墙上地上转起一屋子星星；附近的猫慢慢睡着'},
  // 屋顶
  ridge:{n:'屋脊',room:'roof',what:'跳上屋脊，和别的猫坐成一排，背后是星空'},
  stargaze:{n:'观星毯',room:'roof',what:'躺下看满天星：多看一会儿，星星会连成星座；看到流星可以许个愿',tip:'dream'},
  scope:{n:'望远镜',room:'roof',what:'凑过去看月亮'},firefly:{n:'萤火虫',room:'roof',what:'扑……差一点'},
  hammock:{n:'吊床',room:'roof',what:'躺进去，在星星底下晃呀晃',tip:'dream'},wheel:{n:'猫跑轮',room:'roof',hint:'跑得越快，灯亮得越快',what:'跑起来发电，那一串大灯泡一颗颗亮；跑得越快亮得越快，十六颗全亮，屋顶放一场烟花',tip:'game'},
  treetop:{n:'树顶瞭望台',room:'roof',what:'爬到树顶看整座夜城：雪山、海和灯塔、河上的桥、亮着灯的摩天轮，还能放烟花'},
  lantern:{n:'孔明灯',room:'roof',what:'放一盏，它慢慢飘进夜空，越飘越小',tip:'dream'},owl:{n:'猫头鹰',room:'roof',what:'停在楼梯小屋的天线上。盯着它看，它把头转半圈；扑过去，它飞到水塔或者烟囱上'},
  wtank:{n:'水塔',room:'roof',what:'顺着支架爬到顶上：屋顶上除了巨树最高的地方'},chimney:{n:'烟囱',room:'roof',what:'爬上斜屋顶，挨着烟囱趴着，暖和；烟囱时不时冒一个烟圈'},
  eaves:{n:'屋檐边',room:'roof',what:'趴在平台南沿那段没装栏杆的地方，探头往下看：好高，下面是后院'},
  // 一楼 · 舞台（第五轮）
  tipboard:{n:'Tips 大屏',room:'stage',hint:'猫猫咖啡馆的小贴士',what:'舞台背板隔一会儿变成一块大屏，滚动一条猫猫咖啡馆的小贴士；凑过去看全文和链接',tie:'每一条都是猫猫咖啡馆真有的用法',tip:'wait'},
  // 地下一层（第五轮）
  dancefloor:{n:'舞池',room:'disco',hint:'跳一曲，踩亮的金格子',what:'站上去就跳舞。"跳一曲"是三十秒的小游戏：格子一块块亮成金色，赶在它暗下去之前踩上去，连着踩中有连击',tie:'猫猫咖啡馆的猫也会一起玩游戏',tip:'game'},
  mball:{n:'镜面球',room:'disco',what:'拉一下墙上的链子，镜面球降下来越转越快：二十秒迪斯科时间，附近的猫都跑上舞池'},
  dj:{n:'DJ 台',room:'disco',what:'跳到唱盘后面搓碟，呲啦一声，舞池换一套颜色'},speaker:{n:'大音箱',room:'disco',what:'蹲在跟前，低音一下一下把毛吹得往后飘'},
  booth:{n:'卡座',room:'disco',what:'跳累了窝进去歇一会儿'},
  poster:{n:'海报墙',room:'b1hall',what:'五张"本周上映"的海报：身份、记忆、传球、门禁、一键开店，每张是猫猫咖啡馆的一项能力，点进去有链接',tie:'海报上写的都是猫猫咖啡馆真有的功能',tip:'multi'},
  popcorn:{n:'爆米花机',room:'b1hall',what:'拍一下，噼里啪啦爆一锅，几颗蹦到地上，附近的猫过来抢'},ticket:{n:'售票亭',room:'b1hall',what:'领一张电影票，上面写着第几排第几座，猫自己走过去坐下'},
  onsen:{n:'温泉池',room:'bath',what:'泡进去，头上顶一块小毛巾，背对着我们看玻璃里的鱼；泡够十秒就暖乎乎的',tie:'猫会照顾你：忙久了会提醒你歇一歇',tip:'care'},
  aqwall:{n:'水族馆玻璃墙',room:'bath',what:'趴在玻璃前，凑近看一整面海：鱼群、水母、海龟、鳐鱼……偶尔还游过一个大家伙'},
  milk:{n:'牛奶冰柜',room:'bath',what:'拿一瓶咖啡牛奶喝掉'},dryer:{n:'吹风机',room:'bath',what:'坐到罩子底下呼呼吹一阵，出来炸成一颗毛球'},
  massage:{n:'按摩椅',room:'bath',what:'窝进去，跟着椅子一起嗡嗡抖，抖着抖着就睡着了'},scale:{n:'体重秤',room:'bath',what:'站上去，指针晃两下停住；隔一天再称，会胖一点或瘦一点'},
  buckets:{n:'木桶',room:'bath',what:'扒拉一下，哗啦倒一地，过一会儿店猫又摞回去'},
  cseat:{n:'电影院座位',room:'cinema',hint:'坐下就开演',what:'坐下，画面切到银幕：一部讲猫猫咖啡馆的像素小电影',tie:'电影里讲的都是猫猫咖啡馆真有的功能',tip:'multi'},
  projector:{n:'放映机',room:'cinema',what:'换一卷：跳到下一段'}};
const GID=id=>id.startsWith('q_')||id.startsWith('st:')?null:id==='treeslide2'?'treeslide':id.replace(/^(basket|win|feed|plate|shelf|toyback|table|chair|stool|fish|bed|bean|poster|booth)\d$/,'$1');

WORLD_MODS.push(A=>{
const {S,P,me,rr,rnd,run,emote,say,sfx,after,TH,dist}=A;
const now=()=>A.t,near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,val=(v,...a)=>typeof v==='function'?v(...a):v,tick=f=>A.tickers.push(f);
let store={disc:{},rooms:{}};try{const s=window.CAT_SAVE?CAT_SAVE.load('g'):JSON.parse(localStorage.getItem('cat1024-v4')||'null');if(s&&s.disc)store=Object.assign(store,s)}catch(e){}
const save=()=>{try{if(window.CAT_SAVE)CAT_SAVE.save('g',store);else localStorage.setItem('cat1024-v4',JSON.stringify(store))}catch(e){}};
// disc[k] 记的是第一次玩到的时间（毫秒）；旧记录是 1。balls：一共解开了几颗毛线球；hung：挂进橱窗几件（交付，状态块上显示的是这个）
const G=A.guide={GUIDE,disc:store.disc,total:Object.keys(GUIDE).length,count:()=>Object.keys(store.disc).filter(k=>GUIDE[k]).length,balls:()=>store.balls||0,hung:()=>store.hung||0,
  info:id=>{const g=GID(id);return g&&GUIDE[g]?{...GUIDE[g],id:g,found:!!store.disc[g]}:null},
  roomInfo:id=>{const L=Object.entries(GUIDE).filter(([,g])=>g.room===id);return{n:L.length,found:L.filter(([k])=>store.disc[k]).length}},
  reset:()=>{store={disc:{},rooms:{}};G.disc=store.disc;save()},
  // 成品：认出是哪只猫以后，换成它自己的记录（旧存档里的 camp 是原来训练营的进度，丢掉）
  load:s=>{store=Object.assign({disc:{},rooms:{}},s||{});delete store.camp;G.disc=store.disc;A.emit&&A.emit('guideLoad')},   // guideLoad：挂坠、水晶泡泡这些记在存档里的，换一套重新套上
  fishLog:()=>store.fish=store.fish||{},qseen:()=>store.qseen=store.qseen||{},save:()=>save(),
  // 小游戏的成绩（world-games.js、world-river.js）、店猫和你熟不熟（world-social.js）
  games:()=>store.games=store.games||{},friends:()=>store.friends=store.friends||{},
  // 彩蛋（world-eggs.js）：{key:{at,steps}}
  eggs:()=>store.eggs=store.eggs||{}};
A.on('solve',()=>{store.balls=(store.balls||0)+1;save()});A.on('hang',()=>{store.hung=(store.hung||0)+1;save()});

/* ---------- 第一次玩到某样东西：新发现 ---------- */
A.onUse=th=>{const g=GID(th.id);if(!g||!GUIDE[g])return;A.emit('use',g);if(store.disc[g])return;store.disc[g]=Date.now();save();
  A.ui.discover&&A.ui.discover({...GUIDE[g],id:g,count:G.count(),total:G.total,tipObj:GUIDE[g].tip?{...TIPS[GUIDE[g].tip],key:GUIDE[g].tip}:null})};
/* ---------- 点了集章卡上没盖的"交付"章：箭头指向最近的毛线篮；叼起一颗、或者一分钟以后收起 ---------- */
let seek=-1;
A.seekBasket=()=>{seek=now()+60};
A.guideTarget=()=>{if(now()>seek)return null;if(me.hold){seek=-1;return null}
  const i=[0,1,2].filter(i=>S.baskets[i].length).sort((a,b)=>dist(P.baskets[a],me)-dist(P.baskets[b],me))[0];return i==null?null:{x:P.baskets[i].x+20,y:P.baskets[i].y+30,label:'毛线篮'}};

/* ---------- 找到我 ---------- */
let findT=-9;A.findMe=()=>{findT=now();if(!me.place&&!me.hidden&&!A.busy())run(me,[{k:'alert',dur:.8,soft:1}])};
A.overs.push(vis=>{const k=(now()-findT)/1.4;if(k<0||k>1||me.hidden)return;const x=Math.round(me.x),y=Math.round(me.y);
  for(let w=0;w<3;w++){const u=k*1.6-w*.3;if(u<0||u>1)continue;const rx=6+u*40,ry=rx*.38,n=Math.round(rx*1.6);alpha(1-u,()=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;P1(Math.round(x+Math.cos(a)*rx),Math.round(y+Math.sin(a)*ry),'#ffd84a')}})}});

/* ---------- 按 E 会用到的那一样：头上顶一个 E 键帽 ---------- */
const anchor=th=>{const h=val(th.hit,me);if(h)return{x:Math.round(h[0]+h[2]/2),y:Math.round(h[1])};const n=val(th.near,me);return n?{x:Math.round(n[0]+n[2]/2),y:Math.round(n[1]+n[3]/2-18)}:null};
A.anchorOf=anchor;
A.overs.push(()=>{if(!A.play||me.hidden||me.place||A.busy())return;const th=A.thingNear(me);
  if(!th||th.ok&&!th.ok(me)||me.hold&&!me.hold.knit&&th.id.startsWith('basket'))return;const a=anchor(th);if(a)eKey(a.x-4,a.y-13+(Math.floor(now()*3)%2),'#ffd84a')});

/* ---------- 指路：任务要去的地方 / 点了"交付"章时的毛线篮；画在高清层上 ---------- */
// 要去的地方不在这一层：先指向楼梯口，写"上楼 · 图书馆"
function viaStairs(tg){const fa=A.floorOf(me.y),fb=A.floorOf(tg.y);if(fa===fb)return tg;const p=A.nextPortal(fa,fb);if(!p)return tg;const up=(A.FLID[p.to].lv||0)>(fa.lv||0);   // 上还是下看楼层的高低（lv），不看在列表里的先后
  return{x:p.at.x,y:p.at.y,label:(up?'上楼':'下楼')+' · '+tg.label}}
A.viaStairs=viaStairs;
// 带我去（图鉴、前台猫、彩蛋的提示）：走到那样东西跟前，碰它一下；在别的楼层先走楼梯。没有这样东西返回 false
A.goThing=id=>{const th=A.TH.find(t=>t.id===id)||A.TH.find(t=>t.id.replace(/\d$/,'')===id);if(!th)return false;const h=val(th.hit,me),at=val(th.at,me);if(h&&h[2])A.tap(h[0]+h[2]/2,h[1]+h[3]/2);else if(at)A.tap(at.x,at.y);else return false;return true};
// 页面的界面（左上状态块、右上地图）盖着的地方：A.hudAvoid() 给出覆盖层画布上的几个矩形。目标在底下就当它在画面外；箭头和字落在里面就沿着画面边挪出来
const inR=(x,y,r)=>x>r[0]&&x<r[0]+r[2]&&y>r[1]&&y<r[1]+r[3];
function dodge(x,y,av,W,H,m,pw=0,ph=0){for(let n=0;n<2;n++){const r=av.find(r=>inR(x,y,[r[0]-pw,r[1]-ph,r[2]+pw*2,r[3]+ph*2]));if(!r)break;
    const c=[[r[0]+r[2]+pw+1,y],[r[0]-pw-1,y],[x,r[1]+r[3]+ph+1],[x,r[1]-ph-1]].filter(([a,b])=>a>=m&&a<=W-m&&b>=m&&b<=H-m&&!av.some(q=>q!==r&&inR(a,b,q)));
    if(!c.length)break;c.sort((p,q)=>Math.hypot(p[0]-x,p[1]-y)-Math.hypot(q[0]-x,q[1]-y));[x,y]=c[0]}return[x,y]}
// 像素箭头：在 15×15 的小格子里按角度算出哪些格子在箭头里（外面一圈是深色描边），每格画成 k×k；角度分成 64 份存起来
const ARW={};function arrowCells(a){const q=Math.round(a/(Math.PI*2)*64)&63;if(ARW[q])return ARW[q];const A2=q/64*Math.PI*2,c=Math.cos(A2),s=Math.sin(A2),P=[[7,0],[-4,-5.5],[-1.5,0],[-4,5.5]];
  const inside=(x,y)=>{const u=x*c+y*s,w=-x*s+y*c;let n=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>w)!==(yj>w)&&u<(xj-xi)*(w-yi)/(yj-yi)+xi)n=!n}return n};
  const fill=[],ol=[];for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){if(inside(x,y))fill.push([x,y]);else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>inside(x+dx,y+dy)))ol.push([x,y])}return ARW[q]={fill,ol}}
function pixArrow(hx,cx,cy,a,k,col){const C2=arrowCells(a),X=Math.round(cx),Y=Math.round(cy);hx.fillStyle='#241a2e';C2.ol.forEach(([x,y])=>hx.fillRect(X+x*k,Y+y*k,k,k));hx.fillStyle=col;C2.fill.forEach(([x,y])=>hx.fillRect(X+x*k,Y+y*k,k,k))}
A.huds.push((hx,scale,dpr,v)=>{A.hudScale=scale;if(!A.play||A.dlg.open)return;const tg0=(A.Q&&A.Q.target&&A.Q.target())||A.guideTarget();if(!tg0)return;const tg=viaStairs(tg0),t=now(),av=(A.hudAvoid&&A.hudAvoid())||[];
  const sx=(tg.x-v.x)*scale,sy=(tg.y-v.y)*scale,W=hx.canvas.width,H=hx.canvas.height,m=34*dpr,in_=sx>m&&sx<W-m&&sy>m&&sy<H-m&&!av.some(r=>inR(sx,sy-20*dpr,r));hx.save();
  // 指路的小牌：像素字（12×k 个画布像素，k 取整，和名牌一样），深底、一格金色描边、四角切掉；字的左边、基线落在整像素上
  let pk=Math.max(1,Math.floor(dpr));if(pk*(pk+1)<dpr*dpr)pk++;hx.font=`${12*pk}px FusionPixel,"PingFang SC","Microsoft YaHei",sans-serif`;hx.textAlign='left';hx.textBaseline='alphabetic';
  const pill=(x,y,s)=>{const k=pk,w=Math.ceil(hx.measureText(s).width/k)*k+7*k,h=17*k;[x,y]=dodge(x,y,av,W,H,w/2,w/2,h/2);const x0=Math.max(2*k,Math.min(W-w-2*k,Math.round(x-w/2))),y0=Math.max(2*k,Math.min(H-h-2*k,Math.round(y-h/2)));   // 字宽了也不出画面
    hx.fillStyle='#ffd84a';hx.fillRect(x0+k,y0,w-2*k,h);hx.fillRect(x0,y0+k,w,h-2*k);hx.fillStyle='#241a2e';hx.fillRect(x0+k,y0+k,w-2*k,h-2*k);hx.fillStyle='#ffd84a';hx.fillText(s,x0+4*k,y0+13*k)};
  const ak=pk+1;   // 箭头一格比字的一格大一点，和原来的矢量箭头差不多大
  if(in_){const b=Math.round(Math.sin(t*5)*2)*pk,top=sy-(tg.cat?32:10)*scale-b;pixArrow(hx,sx,top-7*ak,Math.PI/2,ak,'#ffd84a');pill(sx,top-15*ak-14*dpr,tg.label)}
  else{const cx=W/2,cy=H/2,dx=sx-cx,dy=sy-cy,k=Math.min((W/2-m)/Math.abs(dx||1),(H/2-m)/Math.abs(dy||1)),a=Math.atan2(dy,dx);let ex=cx+dx*k,ey=cy+dy*k;[ex,ey]=dodge(ex,ey,av,W,H,m,16*dpr,16*dpr);
    pixArrow(hx,ex,ey,a,ak,'#ffd84a');const d=Math.round(Math.hypot(tg.x-me.x,tg.y-me.y)/10);pill(Math.max(60*dpr,Math.min(W-60*dpr,ex-Math.cos(a)*40*dpr)),Math.max(20*dpr,Math.min(H-20*dpr,ey-Math.sin(a)*28*dpr)),`${tg.label} · ${d} 步`)}
  hx.restore()});

/* ---------- 进一间新房间：告诉你这里有几样能玩 ---------- */
A.firstRoom=id=>{if(store.rooms[id])return false;store.rooms[id]=1;save();return true};
});
