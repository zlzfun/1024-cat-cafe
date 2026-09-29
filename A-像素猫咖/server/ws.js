/* 1024 猫咖 · 零依赖的 WebSocket（RFC 6455 里用得到的那一小部分）：握手、收发文本帧、ping/pong、关闭。
   只收文本帧，不收分片和二进制；浏览器发来的帧必须带掩码；一帧最多 maxPayload 字节，超了直接断开。
   对方收得太慢（发送缓冲积到 1MB）也断开，免得一个卡住的连接拖慢整个进程。
   accept(req, socket, head, {maxPayload}) → 连接对象：on('message', text)、on('close')、send(text)、close(code)。 */
const crypto=require('crypto'),{EventEmitter}=require('events');
const GUID='258EAFA5-E914-47DA-95CA-C5AB0DC85B11',PING_MS=20000,SLOW=1<<20;

function accept(req,socket,head,{maxPayload=4096}={}){
  const k=req.headers['sec-websocket-key'];
  if(!k||String(req.headers.upgrade||'').toLowerCase()!=='websocket'||req.headers['sec-websocket-version']!=='13'){socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');return null}
  const acc=crypto.createHash('sha1').update(k+GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
  socket.setNoDelay(true);return new Conn(socket,head,maxPayload)}

class Conn extends EventEmitter{
  constructor(socket,head,max){super();this.s=socket;this.max=max;this.buf=head&&head.length?Buffer.from(head):Buffer.alloc(0);this.open=true;this.alive=true;this.bytesIn=0;this.bytesOut=0;
    socket.on('data',d=>{this.buf=this.buf.length?Buffer.concat([this.buf,d]):d;this.bytesIn+=d.length;this.parse()});
    socket.on('close',()=>this.gone());socket.on('error',()=>this.gone());
    this.pinger=setInterval(()=>{if(!this.alive)return this.kill();this.alive=false;this.frame(0x9,Buffer.alloc(0))},PING_MS)}
  parse(){while(this.open){const b=this.buf;if(b.length<2)return;const fin=b[0]&0x80,op=b[0]&0x0f,masked=b[1]&0x80;let len=b[1]&0x7f,o=2;
      if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);o=4}else if(len===127){if(b.length<10)return;const hi=b.readUInt32BE(2);if(hi)return this.close(1009);len=b.readUInt32BE(6);o=10}
      if(len>this.max)return this.close(1009);if(!masked)return this.close(1002);if(b.length<o+4+len)return;
      const mask=b.subarray(o,o+4),data=Buffer.from(b.subarray(o+4,o+4+len));for(let i=0;i<len;i++)data[i]^=mask[i&3];this.buf=b.subarray(o+4+len);
      if(!fin||op===0x0||op===0x2)return this.close(1003);
      if(op===0x1)this.emit('message',data.toString('utf8'));else if(op===0x8){this.frame(0x8,data.subarray(0,2));return this.kill()}
      else if(op===0x9)this.frame(0xA,data);else if(op===0xA)this.alive=true}}
  frame(op,data){if(!this.open||this.s.destroyed)return;const n=data.length,h=n<126?Buffer.from([0x80|op,n]):n<65536?Buffer.from([0x80|op,126,n>>8,n&255]):Buffer.concat([Buffer.from([0x80|op,127,0,0,0,0]),Buffer.from([n>>>24,(n>>16)&255,(n>>8)&255,n&255])]);
    this.s.write(Buffer.concat([h,data]));this.bytesOut+=h.length+n;if(this.s.writableLength>SLOW)this.kill()}
  send(text){this.frame(0x1,Buffer.from(text,'utf8'))}
  close(code=1000){if(!this.open)return;const b=Buffer.alloc(2);b.writeUInt16BE(code);this.frame(0x8,b);this.kill()}
  kill(){if(!this.open)return;this.s.end();setTimeout(()=>this.s.destroy(),1000).unref();this.gone()}
  gone(){if(!this.open)return;this.open=false;clearInterval(this.pinger);this.emit('close')}}

module.exports={accept};
