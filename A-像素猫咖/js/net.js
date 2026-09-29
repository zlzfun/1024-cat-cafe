/* 1024 猫咖 · 联机（浏览器这一侧的连接）。设计见 docs/联机.md。
   Net.start({onMsg, onState}) 进店以后调；断了自动重连（1、2、4……最多隔 30 秒）；服务端说 bye 就不再重连。
   Net.send(obj)：没连上时直接丢掉（状态每 0.1 秒会再发，别的消息丢了也无妨）。
   Net.status：'off' 本机模式 / 'connecting' / 'on' / 'down' 断着在重连 / 'bye' 服务端让走。 */
const Net=(()=>{
let ws=null,h={},status='off',wait=1,retryT=0,stopped=false;
function set(s,why){if(status===s)return;status=s;h.onState&&h.onState(s,why)}
function open(){const url=Account.wsUrl(),token=Account.token();if(!url||!token||stopped){set('off');return}
  set('connecting');let w;try{w=new WebSocket(url)}catch(e){return retry()}ws=w;
  w.onopen=()=>w.send(JSON.stringify({t:'hi',token}));
  w.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}if(!m||typeof m.t!=='string')return;
    if(m.t==='welcome'){wait=1;set('on')}if(m.t==='bye'){stopped=true;set('bye',m.why)}h.onMsg&&h.onMsg(m)};
  w.onclose=()=>{if(ws!==w)return;ws=null;if(stopped){if(status!=='bye')set('off');return}set('down');retry()};
  w.onerror=()=>{}}
function retry(){clearTimeout(retryT);retryT=setTimeout(open,wait*1000);wait=Math.min(30,wait*2)}
return{
  start(handlers){h=handlers||{};stopped=false;wait=1;if(!ws)open()},
  stop(){stopped=true;clearTimeout(retryT);if(ws){const w=ws;ws=null;w.close()}set('off')},
  send(o){if(ws&&ws.readyState===1&&status==='on')ws.send(JSON.stringify(o))},
  get status(){return status},get on(){return status==='on'}}})();
