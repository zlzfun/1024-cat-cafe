/* 1024 现场抽奖 · 服务（设计见 README.md）。零依赖，Node 18 以上：node server.js → http://127.0.0.1:1025
   PORT=… 换端口；HOST=0.0.0.0 让局域网里别的电脑也打得开（没有口令，自己掂量）；DATA_DIR=… 换数据目录（测试用）。
   - 接口在 /api/*，规则在 core.js。每次改动先写进磁盘（fsync + 换名）再回页面；写不进去就把内存退回改之前。
   - 网页：这个目录里的几个文件；扭蛋机、像素字借猫咖的（../A-像素猫咖/ 的 js/ 和 fonts/，只发下面列出来的几个）。
   - 每抽 20 次在 data/backups/ 存一份；清空重来之前也存一份。
   - 设置里出错：bad 填得不对、sum 各档概率加起来超过 100%（都不改）。
   - 奖品图片、图鉴卡图片存在 data/images/（文件名带版本号，换了图浏览器不会拿旧的），发在 /img/ 下。设置页先在浏览器里缩到最长边 640 再传上来。 */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),C=require('./core');
const PORT=+process.env.PORT||1025,HOST=process.env.HOST||'127.0.0.1',HERE=__dirname,CAT=path.join(HERE,'..','A-像素猫咖');
const DATA=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):path.join(HERE,'data'),FILE=path.join(DATA,'lotto.json'),BAK=path.join(DATA,'backups'),IMG=path.join(DATA,'images');

/* ---------- 库 ---------- */
// 读坏了不能当空库接着写，那会把原来的记录盖掉：除了"文件还没有"，别的错误都让服务起不来
let st=C.fresh();try{st=C.load(JSON.parse(fs.readFileSync(FILE,'utf8')))}catch(e){if(e.code!=='ENOENT'){console.error(`读不了 ${FILE}：${e.message}\n用 ${BAK} 里最近的一份换回来再启动。`);process.exit(1)}}
function writeTo(f,text){fs.mkdirSync(path.dirname(f),{recursive:true});const tmp=f+'.tmp',fd=fs.openSync(tmp,'w');try{fs.writeSync(fd,text);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}fs.renameSync(tmp,f)}
// 备份文件名用这台电脑的本地时间，工作人员一看就知道是几点的
const stamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`};
const backup=why=>writeTo(path.join(BAK,`lotto-${stamp()}-${why}.json`),JSON.stringify(st));
// 改东西都走这里：规则说不行，或者写盘出错，内存都退回改之前
function commit(fn){const before=JSON.stringify(st);let r;
  try{r=fn();if(r.err){st=C.load(JSON.parse(before));const {err,...more}=r;return[err==='bad'?400:err==='none'?404:409,{err,...more}]}writeTo(FILE,JSON.stringify(st))}
  catch(e){st=C.load(JSON.parse(before));console.error('没存上',e);return[500,{err:'disk'}]}return[200,r]}
const rnd=()=>crypto.randomInt(2**47)/2**47,id=()=>crypto.randomBytes(4).toString('hex');

/* ---------- 图片：奖品一张、图鉴卡一张 ---------- */
// data:image/png|jpeg|webp;base64,…，最大 2.5MB；再看一眼文件头，对不上的不收
const IMG_RE=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/,IMG_MAX=2.5e6,IMG_NAME=/^(?:card|[0-9a-f]{8})-\d+\.(?:png|jpg|webp)$/;
const magic={png:b=>b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47,jpeg:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff,webp:b=>b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'};
const rmImg=f=>{if(f&&IMG_NAME.test(f))fs.rm(path.join(IMG,f),{force:true},()=>{})};
// id 是奖品的 id，或者 'card'（图鉴卡）。先写文件，库里记上新文件名，成了再删旧文件；没成就删新文件
function setImage(body){const key=body.id==='card'?'card':typeof body.id==='string'?body.id:'';const x=key==='card'?null:st.prizes.find(p=>p.id===key);
  if(key!=='card'&&!x)return[404,{err:'none'}];const m=IMG_RE.exec(typeof body.data==='string'?body.data:'');if(!m)return[400,{err:'bad'}];
  const buf=Buffer.from(m[2],'base64');if(!buf.length||buf.length>IMG_MAX||!magic[m[1]](buf))return[400,{err:'bad'}];
  const file=`${key}-${Date.now()}.${m[1]==='jpeg'?'jpg':m[1]}`,old=key==='card'?st.cardImg:x.img;
  try{writeTo(path.join(IMG,file),buf)}catch(e){console.error('图片没存上',e);return[500,{err:'disk'}]}
  const r=commit(()=>{if(key==='card')st.cardImg=file;else x.img=file;return{img:file}});if(r[0]===200)rmImg(old);else rmImg(file);return r}
function delImage(body){const x=body.id==='card'?null:st.prizes.find(p=>p.id===body.id);if(body.id!=='card'&&!x)return[404,{err:'none'}];
  const old=body.id==='card'?st.cardImg:x.img;const r=commit(()=>{if(body.id==='card')st.cardImg=null;else x.img=null;return{ok:true}});if(r[0]===200)rmImg(old);return r}

/* ---------- 抽奖台：同一时间只有一台能抽、能登记、能作废，别的抽奖页打开是观看 ----------
   抽奖页每个标签页有自己的编号（X-Desk 头）。没有抽奖台时，第一个打开的就是；观看页上点"在这台抽"换过来。
   只记在内存里：服务重启以后谁先打开谁是。设置页的请求不带 X-Desk，不受限制。 */
let desk=null;
const who=req=>{const v=req.headers['x-desk'];return typeof v==='string'&&/^[a-z0-9]{8,40}$/.test(v)?v:null};
function deskInfo(me){if(me&&desk&&desk.id===me)desk.at=Date.now();return{me:!!(me&&desk&&desk.id===me),has:!!desk,ago:desk?Math.round((Date.now()-desk.at)/1000):null}}
// 抽奖页来的（带 X-Desk）只认抽奖台；这时还没有抽奖台（服务刚重启），它就是
const notDesk=me=>{if(!me)return null;if(!desk)desk={id:me,at:Date.now()};return desk.id===me?null:[409,{err:'desk'}]};

/* ---------- 接口 ---------- */
const pubPrize=p=>({...p,rest:C.rest(p)});
const state=()=>({open:st.open,note:st.note,cardImg:st.cardImg||null,cards:C.cards(st),lose:C.loseProb(st),allOut:st.prizes.length>0&&st.prizes.every(C.out),prizes:st.prizes.map(pubPrize),pending:C.winOf(st),
  total:st.draws.length,recent:st.draws.slice(-12).reverse()});
const TIER_N=t=>['谢谢惠顾','一等奖','二等奖','三等奖'][t]||String(t);   // 0 是谢谢惠顾
const fmt=t=>{if(!t)return '';const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`};
// CSV：带 BOM，Excel 直接打开不乱码；挡掉以 = + - @ 开头的公式
const cell=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
const csv=rows=>'﻿'+rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
function exportCsv(what){if(what==='all')return{csv:csv([['第几次','时间','结果','奖品','工号','登记时间','图鉴卡','作废'],...st.draws.map(d=>[d.no,fmt(d.t),TIER_N(d.tier),d.name,d.emp||'',fmt(d.et),d.card?'发了':'',d.void?'作废':''])]),name:'现场抽奖-全部记录.csv'};
  const L=st.draws.filter(d=>d.tier>0&&!d.void);return{csv:csv([['工号','几等奖','奖品','抽奖时间','第几次'],...L.map(d=>[d.emp||'（没登记）',TIER_N(d.tier),d.name,fmt(d.t),d.no])]),name:'现场抽奖-中奖名单.csv'}}
const API={
  'GET state':({me})=>[200,{...state(),desk:deskInfo(me)}],
  'POST desk':({me})=>{if(!me)return[400,{err:'bad'}];desk={id:me,at:Date.now()};return[200,{desk:deskInfo(me)}]},
  'POST draw':({body,me})=>notDesk(me)||(()=>{const r=commit(()=>C.draw(st,Date.now(),rnd,body.req));if(r[0]===200&&!r[1].again&&st.draws.length%20===0)try{backup('auto')}catch(e){console.error('备份没存上',e)}return r})(),
  'POST claim':({body,me})=>notDesk(me)||commit(()=>C.claim(st,body.no,body.emp,body.force===true,Date.now())),
  'POST void':({body,me})=>notDesk(me)||commit(()=>C.voidDraw(st,body.no)),
  'GET draws':()=>[200,{draws:st.draws.slice().reverse()}],
  'POST prize':({body})=>commit(()=>C.setPrize(st,body,id())),
  'POST prize/del':({body})=>{const r=commit(()=>C.delPrize(st,body.id));if(r[0]===200)rmImg(r[1].prize.img);return r},
  'POST image':({body})=>setImage(body),
  'POST image/del':({body})=>delImage(body),
  'POST restock':({body})=>commit(()=>C.restock(st,body.id,body.n)),
  'POST settings':({body})=>commit(()=>C.settings(st,body)),
  'POST reset':()=>{try{backup('reset')}catch(e){console.error('备份没存上，不清空',e);return[500,{err:'disk'}]}return commit(()=>C.reset(st))},
  'GET export':({url})=>exportCsv(url.searchParams.get('what'))};

/* ---------- 网页：这个目录里的，加上借猫咖的几个 ---------- */
const OWN=['index.html','admin.html','style.css','desk.js','admin.js','stage.js','sfx.js'];
// 现场音效的录音（sfx.js 去拿）：snd/ 下的 mp3
const SND=/^snd\/[a-z0-9]+\.mp3$/;
const BORROW=['js/cat-sprites.js','js/pixel-text.js','js/scene-kit.js','js/world-kit.js','js/world4-kit.js','js/world-play.js','js/sound.js','js/entry-art.js','fonts/fusion-pixel-12.woff2'];
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.mp3':'audio/mpeg'};
function serveFile(res,p){if(p.startsWith('/img/')){const f=p.slice(5);if(!IMG_NAME.test(f)){res.writeHead(404);return res.end('not found')}
    return fs.readFile(path.join(IMG,f),(e,b)=>{if(e){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':{'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'}[path.extname(f)],'Cache-Control':'max-age=86400','X-Content-Type-Options':'nosniff'});res.end(b)})}
  const rel=p==='/'?'index.html':p.slice(1),f=OWN.includes(rel)||SND.test(rel)?path.join(HERE,rel):BORROW.includes(rel)?path.join(CAT,rel):null;
  if(!f){res.writeHead(404);return res.end('not found')}
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(b)})}

function reply(res,out){if(out&&out.csv!=null){res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(out.name),'Cache-Control':'no-store'});return res.end(out.csv)}
  res.writeHead(out[0],{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(out[1]))}
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://x');if(!u.pathname.startsWith('/api/'))return serveFile(res,u.pathname);
  const h=API[req.method+' '+u.pathname.slice(5)];if(!h){res.writeHead(404,{'Content-Type':'application/json'});return res.end('{"err":"none"}')}
  // 传图片的那个接口放宽到 4MB，别的 16KB
  const MAX=u.pathname==='/api/image'?4e6:16384;let raw='',big=false;req.on('data',d=>{raw+=d;if(raw.length>MAX){big=true;req.destroy()}});
  req.on('end',()=>{if(big)return;let body={};if(raw){try{body=JSON.parse(raw)}catch(e){return reply(res,[400,{err:'bad'}])}}if(!body||typeof body!=='object'||Array.isArray(body))body={};
    let out;try{out=h({body,url:u,me:who(req)})}catch(e){console.error(e);out=[500,{err:'server'}]}reply(res,out)})});
server.listen(PORT,HOST,()=>{const base=`http://${HOST==='0.0.0.0'?'127.0.0.1':HOST}:${PORT}`;
  console.log(`1024 现场抽奖：${base}/\n设置：${base}/admin.html\n数据：${FILE}`);
  if(process.platform==='win32')console.log('别在这个窗口里点鼠标：点了会卡住、抽奖页连不上；万一点了，按一下 Esc 就好。关掉这个窗口，抽奖就停了。');if(!fs.existsSync(path.join(CAT,'js','entry-art.js')))console.error(`找不到 ${CAT}：要和猫咖放在同一个仓库目录里（扭蛋机、像素字是借它的）`)});
