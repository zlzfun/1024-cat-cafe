#!/usr/bin/env bash
# 1024 猫咖营业中 · 一键部署（Linux / macOS）。说明见 docs/部署.md。
# 固定挂在已有网站的 /1024-cat-cafe/ 下：猫咖只听本机（127.0.0.1:1024），那个网站的 nginx 把 /1024-cat-cafe/ 转过来。
# 脚本不改 nginx：它生成 nginx-1024-cat-cafe.conf，照打印的步骤装到 nginx 的 snippets/，在网站的 server { } 里 include 它。
#
#   ./deploy.sh                      第一次：检查环境 → 写好配置 → 后台启动 → 生成 nginx 那一段 → 打印步骤、地址和后台口令
#   ./deploy.sh start [选项]          启动（已经在跑就只打印状态）
#     --port 1024                    端口（默认 1024；nginx 那一段跟着改）
#     --data /srv/cat1024-data       数据目录（名册、抽奖登记、后台口令；默认 server/data）
#     --inner https://…              内源主页地址（写进 config.js；只在内网用，别提交到公开仓库）
#     --bots 40                      补位的机器人数（写进 config.js；后台"店里的设置"填过的以后台为准）
#     --host 127.0.0.1               监听地址（默认只听本机，前面是网站的 nginx；写 0.0.0.0 或者内网 IP 就是不经过 nginx、
#                                    同事直接打开 http://这台:端口，见 docs/部署.md 的"不经过 nginx，直接跑"）
#   ./deploy.sh nginx                重新生成、打印 nginx 那一段和装的步骤；看网站的 nginx 用的是不是最新的
#   ./deploy.sh verify https://网站的地址 [--via 127.0.0.1]
#                                    经过网站把页面、脚本、接口、联机、后台都访问一遍，不对的给出该查什么；
#                                    服务器上解析不了网站的域名就加 --via 127.0.0.1（直接连本机的 nginx）。网站的地址记下来，以后 status 也查
#   ./deploy.sh stop | restart | status | logs [-f]
#   ./deploy.sh service              装成 systemd 服务：开机自启、挂了自动拉起（要 sudo，只在 Linux 上）
#   ./deploy.sh uninstall            撤掉：停下，拆掉装过的 systemd 服务；代码和数据留着，删不删你定
#   ./deploy.sh backup               把数据目录打包到 backups/（里面有抽奖登记的个人信息，妥善保管）
#   ./deploy.sh restore 文件          用一份备份恢复数据（先停、再恢复、再启动）
#   ./deploy.sh reset                清空店里的数据（名册、抽奖登记、计数），保留后台口令；会先自动备份
#   ./deploy.sh pack [--with-node 包] [--with-config]
#                                    打一个离线包到 dist/，拷到内网服务器上解开就能用；
#                                    --with-node 把一份 Node 的 linux 二进制包（node-v20…-linux-x64.tar.xz）一起放进去
#   ./deploy.sh check                只检查环境，不启动
#
# 设置记在 deploy.env（不进仓库）：下次 start / restart / service 沿用。
set -euo pipefail
umask 077   # 生成的设置、日志、备份只有自己读得到：共用的服务器上别的账号看不到
cd "$(dirname "$0")"
APP_DIR="$(pwd)"
RUN_DIR="${APP_DIR}/.run"; PID_FILE="${RUN_DIR}/server.pid"; LOG_FILE="${RUN_DIR}/server.log"
ENV_FILE="${APP_DIR}/deploy.env"; UNIT=cat1024; UNIT_FILE="/etc/systemd/system/${UNIT}.service"

c_ok=$'\e[32m'; c_warn=$'\e[33m'; c_err=$'\e[31m'; c_dim=$'\e[2m'; c_0=$'\e[0m'
[ -t 1 ] || { c_ok=; c_warn=; c_err=; c_dim=; c_0=; }
say(){ printf '%s\n' "$*"; }
ok(){ printf '%s✓%s %s\n' "${c_ok}" "${c_0}" "$*"; }
warn(){ printf '%s!%s %s\n' "${c_warn}" "${c_0}" "$*"; }
die(){ printf '%s✗ %s%s\n' "${c_err}" "$*" "${c_0}" >&2; exit 1; }

# ---------- 设置：deploy.env 里的、命令行给的 ----------
# 挂的路径是固定的
BASE=/1024-cat-cafe; NGINX_FILE="${APP_DIR}/nginx-1024-cat-cafe.conf"
PORT=1024; HOST=127.0.0.1; DATA_DIR="${APP_DIR}/server/data"; SITE=; VIA=
[ -f "${ENV_FILE}" ] && . "${ENV_FILE}"
INNER=; BOTS=; WITH_NODE=; WITH_CONFIG=0; FOLLOW=0
# 第一个参数是命令；直接从选项开头（./deploy.sh --inner …）就是 start
CMD=start; case "${1:-}" in -h|--help) CMD=help; shift;; ''|-*) ;; *) CMD="$1"; shift;; esac
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="${2:?--port 后面要写端口}"; shift 2;;
    --host) HOST="${2:?--host 后面要写地址}"; shift 2;;
    --data) DATA_DIR="${2:?--data 后面要写目录}"; shift 2;;
    --inner) INNER="${2:?--inner 后面要写地址}"; shift 2;;
    --bots) BOTS="${2:?--bots 后面要写数字}"; shift 2;;
    --proxy) shift;;  # 以前的参数：现在按 --host 自己定（见下面 DIRECT）
    --with-node) WITH_NODE="${2:?--with-node 后面要写 Node 的二进制包}"; shift 2;;
    --with-config) WITH_CONFIG=1; shift;;
    --via) VIA="${2:?--via 后面要写地址（一般是 127.0.0.1）}"; shift 2;;
    -f) FOLLOW=1; shift;;
    *) if [ "${CMD}" = restore ] && [ -z "${RESTORE_FILE:-}" ]; then RESTORE_FILE="$1"; shift
       elif [ "${CMD}" = verify ] && [ -z "${SITE_ARG:-}" ]; then SITE_ARG="$1"; shift
       else die "认不得的参数：$1（看 ./deploy.sh 开头的说明）"; fi;;
  esac
done
if [ -n "${SITE_ARG:-}" ]; then case "${SITE_ARG}" in http://*|https://*) SITE="${SITE_ARG%/}";; *) die "网站的地址要从 http:// 或 https:// 开头：${SITE_ARG}";; esac; fi
# 只听本机：前面是网站的 nginx，按 nginx 加在 X-Forwarded-For 最后的地址认人（TRUST_PROXY=1）。
# 听 0.0.0.0 或者内网 IP：同事不经过 nginx 直接打开 http://这台:端口（DIRECT=1），这个头谁都能编，不信它
case "${HOST}" in 127.*|::1|localhost) DIRECT=0; TRUST_PROXY=1;; *) DIRECT=1; TRUST_PROXY=0;; esac
case "${PORT}" in ''|*[!0-9]*) die "端口要是数字：${PORT}";; esac
[ -n "${BOTS}" ] && case "${BOTS}" in *[!0-9]*) die "--bots 要是数字：${BOTS}";; esac
case "${DATA_DIR}" in /*) ;; *) DATA_DIR="${APP_DIR}/${DATA_DIR}";; esac
save_env(){ cat > "${ENV_FILE}" <<EOF
# 1024 猫咖 · deploy.sh 记下的设置（不进仓库）
PORT=${PORT}
HOST=${HOST}
DATA_DIR="${DATA_DIR}"
TRUST_PROXY=${TRUST_PROXY}
SITE="${SITE}"
VIA="${VIA}"
EOF
}

# ---------- Node：系统里的，或者离线包里带的 runtime/node ----------
NODE=
find_node(){
  if [ -x "${APP_DIR}/runtime/node/bin/node" ]; then NODE="${APP_DIR}/runtime/node/bin/node"; return; fi
  NODE="$(command -v node || true)"
}
check_node(){
  find_node
  [ -n "${NODE}" ] || die "没找到 Node。装 Node 18 以上（公司软件源，或者把 Node 的二进制包解开放到 ${APP_DIR}/runtime/node），再跑一次。"
  local v; v="$("${NODE}" -v 2>/dev/null | sed 's/^v//')"; local major="${v%%.*}"
  [ "${major:-0}" -ge 18 ] 2>/dev/null || die "Node 版本太旧：v${v}（要 18 以上）"
  ok "Node v${v}（${NODE}）"
}
port_free(){ "${NODE}" -e "const s=require('net').createServer();s.once('error',()=>process.exit(1));s.once('listening',()=>s.close(()=>process.exit(0)));s.listen(${PORT},'${HOST}')" 2>/dev/null; }
health(){ "${NODE}" -e "fetch('http://127.0.0.1:${PORT}/api/health').then(r=>r.ok?r.json():Promise.reject(r.status)).then(j=>{console.log(JSON.stringify(j));process.exit(0)}).catch(()=>process.exit(1))" 2>/dev/null; }

# ---------- nginx 那一段：挂到网站的 /1024-cat-cafe/ 下。只生成文件，不碰 nginx ----------
# 内容变了（第一次、换了端口）NGINX_NEW=1：要把新的这段加进网站、reload nginx
NGINX_NEW=0
write_nginx(){
  local up="${HOST}" tmp="${NGINX_FILE}.tmp"; if [ "${up}" = 0.0.0.0 ]; then up=127.0.0.1; fi
  cat > "${tmp}" <<EOF
# 1024 猫咖：挂在这个网站的 ${BASE}/ 下（deploy.sh 生成，猫咖的端口 ${PORT}）。
# 整段放进网站对外的那个 server { } 里，和别的 location 并列。每一行为什么在：docs/部署.md
# ^~：网站自己按后缀给静态文件的规则（location ~* \\.(js|css)\$ 这种）抢不走猫咖的文件
location ^~ ${BASE}/ {
    proxy_pass http://${up}:${PORT}/;         # 结尾的 / 不能少：去掉 ${BASE} 再转给猫咖
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;    # 联机走 WebSocket，这两行不能少
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_read_timeout 600s;                   # 联机是长连接，别让 nginx 一分钟就掐断
    gzip on;                                   # 只管这一段：第一次进店的下载从约 1.3MB 降到约 650KB
    gzip_types text/css application/javascript text/javascript application/json image/svg+xml text/plain;
    # 这一段有了自己的 add_header，就不继承网站在 server 一级加的头（里面要是有 Content-Security-Policy，猫咖会白屏）
    add_header X-1024-Cat-Cafe 1;
}
EOF
  if [ -f "${NGINX_FILE}" ] && cmp -s "${tmp}" "${NGINX_FILE}"; then rm -f "${tmp}"; else mv "${tmp}" "${NGINX_FILE}"; NGINX_NEW=1; fi
}
# 网站的 nginx 的配置目录，那一段装到它下面的 snippets/：先看 nginx -V 里的 conf-path（系统包装的 nginx 都写了），
# 没写（自己编的、OpenResty……）就看 nginx -t 说的配置文件在哪（只读不改），再没有就按 /etc/nginx
LIVE=
live_init(){ [ -z "${LIVE}" ] || return 0; local c
  c="$(nginx -V 2>&1 | sed -n 's/.*--conf-path=\([^ ]*\).*/\1/p')" || true
  [ -n "${c}" ] || c="$(nginx -t 2>&1 | sed -n 's/.*configuration file \([^ ]*\) .*/\1/p' | head -1)" || true
  if [ -n "${c}" ]; then LIVE="$(dirname "${c}")/snippets/1024-cat-cafe.conf"; else LIVE=/etc/nginx/snippets/1024-cat-cafe.conf; fi; }
nginx_steps(){ live_init
  say "${c_ok}接下来${c_0}：把猫咖挂到网站的 ${BASE}/ 下（脚本不改 nginx：这几步你来，或者交给管这个网站的人。详见 docs/部署.md）"
  say "  1. 找到网站对外的那个 server { }（https 的那个；只做 80 转 443 的那个不用管），把它所在的文件备份到别处（别放在 sites-enabled、conf.d 里）"
  say "  2. sudo mkdir -p -m 755 ${LIVE%/*} && sudo install -m 644 ${NGINX_FILE} ${LIVE}"
  say "  3. 在那个 server { } 里加一行（listen 443 那一行下面就行）：include ${LIVE};"
  say "  4. sudo nginx -t && sudo systemctl reload nginx（-t 没过就别 reload；别用 restart）"
  say "  5. ./deploy.sh verify https://网站的地址"
  say "  ${c_dim}撤：删掉 include 那一行和 ${LIVE}，再 sudo nginx -t && sudo systemctl reload nginx${c_0}"
}
# 网站的 nginx 装的那一份和这里生成的一样吗？换了端口忘了更新，网站那边就是 502
nginx_state(){ live_init
  if [ ! -e "${LIVE}" ]; then say "${c_dim}网站的 nginx 还没装上那一段（没有 ${LIVE}）：./deploy.sh nginx 看步骤${c_0}"
  elif cmp -s "${LIVE}" "${NGINX_FILE}"; then ok "网站的 nginx 装的就是这一段（${LIVE}；include、reload 了没有，用 verify 看）"
  else warn "网站的 nginx 装的那一段（${LIVE}）和这里新生成的不一样：sudo install -m 644 ${NGINX_FILE} ${LIVE} && sudo nginx -t && sudo systemctl reload nginx"; fi; }

# ---------- 经过网站访问一遍：页面、脚本、接口、联机、后台；不对的说该查什么（ONLY=health 只查接口，给 status 用） ----------
VERIFY_JS='const u0=new URL(process.env.SITE),direct=u0.port===String(process.env.PORT),B=direct?"":process.env.BASE,via=process.env.VIA,only=process.env.ONLY,crypto=require("crypto"),zlib=require("zlib"),fs=require("fs");
const M=u0.protocol==="https:"?require("https"):require("http");
const get=(p,h={})=>new Promise(res=>{const r=M.request({host:via||u0.hostname,port:u0.port||(u0.protocol==="https:"?443:80),path:p,method:"GET",servername:u0.hostname,rejectUnauthorized:false,headers:{Host:u0.host,...h}},
    s=>{const b=[];s.on("data",d=>b.push(d));s.on("end",()=>res({st:s.statusCode,h:s.headers,body:Buffer.concat(b)}))});
  r.on("upgrade",(s,k)=>{k.destroy();res({st:s.statusCode,h:s.headers,body:Buffer.alloc(0)})});
  r.setTimeout(8000,()=>r.destroy(new Error("8 秒没应答")));r.on("error",e=>res({err:e.message,h:{},body:Buffer.alloc(0)}));r.end()});
const local=p=>new Promise(res=>require("http").get({host:"127.0.0.1",port:process.env.PORT,path:p},s=>{const b=[];s.on("data",d=>b.push(d));s.on("end",()=>res(Buffer.concat(b)))}).on("error",()=>res(null)));
let bad=0;const say=(c,m,hint,soft)=>{console.log((c?"  ✓ ":soft?"  ! ":"  ✗ ")+m+(!c&&hint?"\n      → "+hint:""));if(!c&&!soft)bad++};
const st=r=>r.err||r.st,end=()=>{console.log(bad?"有 "+bad+" 项不对":"全部正常");process.exit(bad?1:0)};
(async()=>{let r=await get("/");
  if(r.err){say(false,"连不上 "+u0.origin+"："+r.err,direct?"猫咖在不在跑（./deploy.sh status）、听的是不是这个地址（--host）；从别的电脑连不上，多半是服务器的防火墙没放行这个端口":via?"nginx 在不在听这个端口":"服务器上解析不了、或者走不到这个域名：加 --via 127.0.0.1，直接连本机的 nginx");end()}
  if(only==="health"){r=await get(B+"/api/health");process.exit(r.st===200&&/"ok":true/.test(r.body)?0:1)}
  if(direct){say(r.st===200&&r.body.toString().includes("1024 猫咖营业中"),"直接打开 "+u0.origin+"/："+st(r),"这个地址上的不是猫咖：端口对不对（./deploy.sh status）");if(r.st!==200)end()}
  else{say(true,"网站首页 "+u0.origin+"/："+r.st);
    r=await get(B);say(r.st===301&&/\/1024-cat-cafe\/$/.test(r.h.location||""),B+" → "+st(r)+" "+(r.h.location||""),"应该 301 到 "+B+"/：那一段没生效，见下一条");
    r=await get(B+"/");
    say(r.st===200&&r.body.toString().includes("1024 猫咖营业中"),B+"/："+st(r),
      r.st===404?"那一段没生效：include 那一行加在网站对外的 server { } 里了吗（不是只做跳转的那个）？nginx -t、reload 了吗？":
      r.st===502||r.st===504?"nginx 连不上猫咖：./deploy.sh status 看在不在跑；网站装的那一段端口对不对（./deploy.sh nginx）；nginx 的 error.log 里有 (13: Permission denied) 就是 SELinux 拦了，见 docs/部署.md":
      r.st===301||r.st===302||r.st===401||r.st===403?"网站要先登录或者不让访问：见 docs/部署.md 的“网站的 server { } 里，这几样也会管到”":"");
    if(r.st!==200)end();
    say(r.h["x-1024-cat-cafe"]==="1","用的是 deploy.sh 生成的那一段（有 X-1024-Cat-Cafe 头）","没有 X-1024-Cat-Cafe 头：装的那一段被改过？重新装（./deploy.sh nginx）");
    say(!r.h["content-security-policy"],"没带上网站的 Content-Security-Policy","add_header 那一行丢了：猫咖会白屏")}
  r=await get(B+"/api/health");say(r.st===200&&/"ok":true/.test(r.body),B+"/api/health："+(r.st===200?r.body.toString().slice(0,70):st(r)),"接口不通：./deploy.sh status");
  r=await get(B+"/js/app.js",{"Accept-Encoding":"gzip"});let same=false;
  try{const b=r.h["content-encoding"]==="gzip"?zlib.gunzipSync(r.body):r.body,l=await local("/js/app.js");same=!!l&&b.equals(l)}catch(e){}
  say(r.st===200&&same,B+"/js/app.js："+st(r)+(r.st===200&&!same?"（不是猫咖的）":""),direct?"拿到的脚本和这台上的不一样：这个地址上跑的是不是这一份猫咖":"脚本被网站自己的规则抢走了：location 后面的 ^~ 丢了");
  if(!direct)say(r.h["content-encoding"]==="gzip","脚本压缩传（gzip）","没压缩：不影响用，只是第一次进店慢一点（那一段里的 gzip 两行）",true);
  r=await get(B+"/ws",{Connection:"Upgrade",Upgrade:"websocket","Sec-WebSocket-Version":"13","Sec-WebSocket-Key":crypto.randomBytes(16).toString("base64")});
  say(r.st===101,"联机 "+B+"/ws："+st(r),direct?"WebSocket 没接通：猫咖在不在跑；从这台服务器上通、同事那边不通的话，多半是公司的上网代理不放行（WebSocket 过代理要用 CONNECT，很多代理只放行 443）":"WebSocket 没接通：那一段里 Upgrade、Connection 两行；网站前面还有一层负载均衡或 WAF 不放行 WebSocket 的话，找管网络的人");
  let k="";try{k=fs.readFileSync(process.env.KEYF,"utf8").trim()}catch(e){}
  if(k){r=await get(B+"/api/admin/stats",{"X-Admin-Key":k});say(r.st===200,"组织者后台的接口："+st(r),r.st===429?"口令输错太多次，10 分钟后再试":"")}
  end()})();'
verify_run(){ SITE="${SITE}" BASE="${BASE}" PORT="${PORT}" VIA="${VIA}" KEYF="${DATA_DIR}/admin.key" ONLY="${1:-}" "${NODE}" -e "${VERIFY_JS}"; }

# ---------- config.js：给了 --inner / --bots，或者还没有这个文件，就写一份 ----------
# 只改这两样，文件里别的设置（ws、改过的链接……）原样留着；内源主页里有引号、反斜杠也不会写坏（按 JSON 写）
write_config(){
  local f="${APP_DIR}/config.js"
  if [ -f "${f}" ] && [ -z "${INNER}" ] && [ -z "${BOTS}" ]; then ok "config.js 已经有了，不动它"; return; fi
  local out
  out="$(CFG_FILE="${f}" CFG_INNER="${INNER}" CFG_BOTS="${BOTS}" "${NODE}" -e '
    const fs=require("fs"),f=process.env.CFG_FILE;global.window={};let c={api:"api",links:{inner:""},bots:40};
    if(fs.existsSync(f)){try{require(f);c=Object.assign({},window.CAT1024_CONFIG||{})}catch(e){process.stderr.write("config.js 读不出来："+e.message+"\n");process.exit(2)}}
    c.links=Object.assign({},c.links||{});if(process.env.CFG_INNER)c.links.inner=process.env.CFG_INNER;if(!("inner" in c.links))c.links.inner="";
    if(process.env.CFG_BOTS)c.bots=+process.env.CFG_BOTS;if(c.bots==null)c.bots=40;if(c.api==null)c.api="api";
    fs.writeFileSync(f,"/* 1024 猫咖 · 部署配置（deploy.sh 写的；不进仓库）。字段见 config.example.js 和 docs/部署.md 的\"配置项一览\"。 */\nwindow.CAT1024_CONFIG = "+JSON.stringify(c,null,2)+";\n");
    process.stdout.write((c.links.inner||"")+"\t"+c.bots)')" || die "config.js 写不了（先看看它是不是改坏了：node -e \"global.window={};require('./config.js')\"）"
  ok "写好了 config.js（内源主页：${out%%$'\t'*}，机器人：${out##*$'\t'}）"
  [ -z "${out%%$'\t'*}" ] && ok "（内源主页还没配：${c_dim}./deploy.sh restart --inner 'https://…'${c_0}）"
  return 0
}

# 组织者在后台"店里的设置"里填过补位的猫，就以后台为准：给了 --bots 也说一声，免得以为改了
bots_note(){ [ -n "${BOTS}" ] || return 0; local b
  b="$("${NODE}" -e "fetch('http://127.0.0.1:${PORT}/api/settings').then(r=>r.json()).then(j=>{if(Number.isInteger(j.bots))console.log(j.bots)}).catch(()=>{})" 2>/dev/null)" || true
  [ -n "${b}" ] && warn "后台\"店里的设置\"里补位的猫填的是 ${b} 只，以后台为准；要按 config.js 的 ${BOTS} 只，在后台把那一格清空再保存"; return 0; }

# ---------- 跑着没有 ----------
service_on(){ [ -f "${UNIT_FILE}" ] && command -v systemctl >/dev/null 2>&1 && systemctl is-enabled --quiet "${UNIT}" 2>/dev/null; }
# 进程号文件里的进程还在，而且真是这个目录里的猫咖。进程号会被系统回收给别的程序：不认一认，停的时候会停掉别人的进程
cmd_of(){ if [ -r "/proc/$1/cmdline" ]; then tr '\0' ' ' < "/proc/$1/cmdline"; else ps -ww -o args= -p "$1" 2>/dev/null; fi; }
cwd_of(){ if [ -e "/proc/$1/cwd" ]; then readlink "/proc/$1/cwd"; else lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'; fi; }
pid_alive(){ [ -f "${PID_FILE}" ] || return 1; local p; p="$(cat "${PID_FILE}")"
  case "${p}" in ''|*[!0-9]*) return 1;; esac; kill -0 "${p}" 2>/dev/null || return 1
  # 现在用完整路径启动；以前的脚本用相对路径 server/server.js 启动，就看它的工作目录是不是这里
  case "$(cmd_of "${p}")" in *"${APP_DIR}/server/server.js"*) return 0;; *server/server.js*) [ "$(cwd_of "${p}")" = "$(pwd -P)" ];; *) return 1;; esac; }
running(){ if service_on; then systemctl is-active --quiet "${UNIT}"; else pid_alive; fi; }
# 这个服务文件是不是猫咖装的；装的是哪个目录
unit_ours(){ [ -f "${UNIT_FILE}" ] && grep -q '^Description=1024 猫咖营业中$' "${UNIT_FILE}"; }
unit_dir(){ sed -n 's/^WorkingDirectory=//p' "${UNIT_FILE}"; }

# 数据目录只放猫咖自己的东西。--data 指到了放着别的文件的目录：不改它的权限、不往里写、不把别人的文件打进备份
check_data(){ [ -d "${DATA_DIR}" ] || return 0; local f
  for f in "${DATA_DIR}"/* "${DATA_DIR}"/.[!.]*; do [ -e "${f}" ] || continue
    case "${f##*/}" in cats.json|cats.json.tmp|admin.key|lost+found|.DS_Store) ;;
      *) die "数据目录 ${DATA_DIR} 里有不是猫咖的东西（${f##*/}）：给猫咖单独建一个空目录，用 --data 指过去";; esac
  done; }
# 共用的服务器上容易忽略的两件事
warn_root(){ if [ "$(id -u)" = 0 ]; then warn "现在是 root：猫咖用不着 root，只要能写数据目录。共用的服务器上建议换个普通账号来跑"; fi; }
warn_direct(){ [ "${DIRECT}" = 1 ] || return 0
  warn "不经过 nginx、直接对外（http）：抽奖登记的个人信息、后台口令在网上是明文；开张以后别换地址。见 docs/部署.md 的\"不经过 nginx，直接跑\""
  if [ "${HOST}" = 0.0.0.0 ]; then warn "听 0.0.0.0：服务器的每块网卡上都开着（有外网网卡的话外网也打得开）；只给内网用，写 --host 这台的内网 IP"; fi; }
# 直接对外时，同事打开的地址
lan_ip(){ local ip=""
  if command -v hostname >/dev/null 2>&1; then ip="$(hostname -I 2>/dev/null | awk '{print $1}')" || true; fi
  if [ -z "${ip}" ] && command -v ipconfig >/dev/null 2>&1; then ip="$(ipconfig getifaddr en0 2>/dev/null || true)"; fi
  printf '%s' "${ip}"; }
direct_addr(){ local a="${HOST}"; if [ "${a}" = 0.0.0.0 ]; then a="$(lan_ip)"; fi; printf '%s' "${a:-这台的IP}"; }
# verify、status 经过的地址：直接对外的就是 http://这台:端口/，挂在网站下的是 网站/1024-cat-cafe/
site_url(){ case "${SITE##*:}" in "${PORT}") printf '%s/' "${SITE}";; *) printf '%s%s/' "${SITE}" "${BASE}";; esac; }

admin_key(){ if [ -n "${ADMIN_KEY:-}" ]; then printf '%s' "${ADMIN_KEY}"; elif [ -f "${DATA_DIR}/admin.key" ]; then tr -d '\n' < "${DATA_DIR}/admin.key"; fi; }
show_urls(){
  local key; key="$(admin_key)"
  say ""
  if [ "${DIRECT}" = 1 ]; then local a; a="$(direct_addr)"
    say "  店：      http://${a}:${PORT}/          （不经过 nginx，直接打开）"
    say "  后台：    http://${a}:${PORT}/admin.html    口令：${key:-（看 ${DATA_DIR}/admin.key）}"
  else
    say "  店：      https://网站的地址${BASE}/          （nginx 加好那一段以后）"
    say "  后台：    https://网站的地址${BASE}/admin.html    口令：${key:-（看 ${DATA_DIR}/admin.key）}"
    say "  本机检查：http://127.0.0.1:${PORT}/          （只有这台服务器自己打得开）"
    say "  ${c_dim}nginx 那一段：${NGINX_FILE}${c_0}"
  fi
  say "  ${c_dim}数据：${DATA_DIR}    日志：$(service_on && echo "journalctl -u ${UNIT}" || echo "${LOG_FILE}")${c_0}"
  say ""
}
# 启动、装服务以后：网站已经装了那一段，就看它是不是最新的；还没装、又是新生成的（第一次、换了端口），把步骤打出来
after_up(){ show_urls
  if [ "${DIRECT}" = 1 ]; then say "${c_dim}别的电脑打不开：服务器的防火墙要放行 ${PORT} 端口（别人的服务器，改之前先问人）。验一遍：./deploy.sh verify http://$(direct_addr):${PORT}${c_0}"; return 0; fi
  live_init
  if [ -e "${LIVE}" ]; then nginx_state
  elif [ "${NGINX_NEW}" = 1 ]; then nginx_steps
  else say "${c_dim}nginx 那一段没变；网站还没装上的话：./deploy.sh nginx 看步骤${c_0}"; fi; }

wait_up(){ for _ in $(seq 1 40); do if health >/dev/null; then return 0; fi; sleep 0.25; done; return 1; }

do_start(){
  check_node
  [ -f "${APP_DIR}/server/server.js" ] && [ -f "${APP_DIR}/index.html" ] || die "这里不是 1024 猫咖的目录（找不到 server/server.js、index.html）"
  # 已经在跑：给了 --inner / --bots 也照样写进 config.js（页面不缓存，大家刷新就生效，不用重启）
  if running; then [ -n "${INNER}${BOTS}" ] && { find_node; write_config; say "${c_dim}config.js 改了：刷新页面就生效${c_0}"; bots_note; }; ok "已经在跑了"; health >/dev/null && ok "接口正常" || warn "进程在，但接口没应答，看看日志：./deploy.sh logs"; show_urls; return; fi
  check_data; warn_direct
  mkdir -p "${DATA_DIR}" "${RUN_DIR}"; chmod 700 "${DATA_DIR}" 2>/dev/null || true
  write_config
  port_free || die "端口 ${PORT} 被占了。换一个：./deploy.sh start --port 8080（nginx 那一段会跟着改，记得重新加）"
  write_nginx
  if service_on; then sudo systemctl start "${UNIT}"
  else
    warn_root
    say "${c_dim}启动：PORT=${PORT} HOST=${HOST} DATA_DIR=${DATA_DIR} TRUST_PROXY=${TRUST_PROXY}${c_0}"
    # 用完整路径启动：ps 里一眼看得出是哪个目录的猫咖，停的时候也靠它认
    PORT="${PORT}" HOST="${HOST}" DATA_DIR="${DATA_DIR}" TRUST_PROXY="${TRUST_PROXY}" nohup "${NODE}" "${APP_DIR}/server/server.js" >> "${LOG_FILE}" 2>&1 &
    echo $! > "${PID_FILE}"
  fi
  if wait_up; then save_env; ok "开张了"; bots_note; after_up
  else die "十秒内没起来。看日志：./deploy.sh logs"; fi
}

do_stop(){
  if service_on; then sudo systemctl stop "${UNIT}"; ok "停了（systemd）"; return; fi
  if ! pid_alive; then ok "本来就没在跑"; rm -f "${PID_FILE}"; return; fi
  local pid; pid="$(cat "${PID_FILE}")"; kill -TERM "${pid}" 2>/dev/null || true
  for _ in $(seq 1 40); do kill -0 "${pid}" 2>/dev/null || break; sleep 0.25; done
  if kill -0 "${pid}" 2>/dev/null; then warn "十秒还没停，强制结束"; kill -KILL "${pid}" 2>/dev/null || true; fi
  rm -f "${PID_FILE}"; ok "停了（数据已经写回 ${DATA_DIR}）"
}

do_status(){
  find_node
  if running; then ok "在跑（$(service_on && echo "systemd 服务 ${UNIT}" || echo "进程 $(cat "${PID_FILE}")")）"
    local h; if h="$(health)"; then ok "接口正常：${h}"; else warn "接口没应答"; fi; show_urls
    if [ "${DIRECT}" = 0 ] && [ -f "${NGINX_FILE}" ]; then nginx_state; fi
    if [ -n "${SITE}" ]; then if verify_run health >/dev/null 2>&1; then ok "经过 $(site_url)：接口正常"; else warn "经过 $(site_url) 访问不通：./deploy.sh verify 看是哪一步"; fi; fi
  else warn "没在跑。启动：./deploy.sh start"; fi
}

do_logs(){
  if service_on; then if [ "${FOLLOW}" = 1 ]; then journalctl -u "${UNIT}" -f; else journalctl -u "${UNIT}" -n 80 --no-pager; fi; return; fi
  [ -f "${LOG_FILE}" ] || { warn "还没有日志（${LOG_FILE}）"; return; }
  if [ "${FOLLOW}" = 1 ]; then tail -n 40 -f "${LOG_FILE}"; else tail -n 80 "${LOG_FILE}"; fi
}

do_service(){
  [ "$(uname -s)" = Linux ] && command -v systemctl >/dev/null 2>&1 || die "只有带 systemd 的 Linux 能装成服务；别的系统用 ./deploy.sh start"
  check_node; check_data
  # 同名的服务文件已经有了：不是猫咖装的，不覆盖；是另一个目录里的猫咖，说一声再换成这里的
  if [ -f "${UNIT_FILE}" ]; then
    unit_ours || die "${UNIT_FILE} 已经有了，不是猫咖装的：不覆盖它（真要装，改 deploy.sh 开头的 UNIT，换个服务名）"
    local was; was="$(unit_dir)"
    if [ "${was}" != "${APP_DIR}" ]; then warn "这个服务原来跑的是 ${was} 里的猫咖，现在换成这里的（数据目录 ${DATA_DIR}）"; fi
  fi
  warn_direct
  local user; user="$(id -un)"
  if [ "${user}" = root ]; then warn "服务会用 root 跑：猫咖用不着 root。共用的服务器上建议用普通账号来跑 ./deploy.sh service（要 sudo 的地方脚本自己会用）"; fi
  mkdir -p "${DATA_DIR}"; chmod 700 "${DATA_DIR}" 2>/dev/null || true; write_config; save_env; write_nginx
  if pid_alive; then do_stop; fi
  sudo tee "${UNIT_FILE}" >/dev/null <<EOF
[Unit]
Description=1024 猫咖营业中
After=network.target

[Service]
Type=simple
User=${user}
WorkingDirectory=${APP_DIR}
Environment=PORT=${PORT}
Environment=HOST=${HOST}
Environment="DATA_DIR=${DATA_DIR}"
Environment=TRUST_PROXY=${TRUST_PROXY}
ExecStart=${NODE} server/server.js
Restart=on-failure
RestartSec=3
KillSignal=SIGTERM
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
EOF
  sudo chmod 644 "${UNIT_FILE}"   # 脚本的 umask 是 077：服务文件照常给大家读（下次装、拆的时候要认它是不是猫咖的）
  # 用 restart 不用 enable --now：服务已经在跑的时候 --now 什么也不做，换了端口、数据目录不会生效
  sudo systemctl daemon-reload; sudo systemctl enable "${UNIT}"; sudo systemctl restart "${UNIT}"
  if wait_up; then ok "装好了：开机自启，挂了自动拉起（systemctl status ${UNIT}）"; after_up; else die "服务起不来：journalctl -u ${UNIT} -n 50"; fi
}

do_nginx(){ write_nginx
  if [ "${NGINX_NEW}" = 1 ]; then ok "生成了 ${NGINX_FILE}（端口 ${PORT}）"; else ok "${NGINX_FILE} 没变（端口 ${PORT}）"; fi
  say ""; cat "${NGINX_FILE}"; say ""; nginx_steps; nginx_state; }

do_verify(){
  [ -n "${SITE}" ] || die "用法：./deploy.sh verify https://网站的地址 [--via 127.0.0.1]"
  find_node; [ -n "${NODE}" ] || die "没找到 Node"
  health >/dev/null || warn "本机的猫咖没应答（./deploy.sh status）：经过网站多半也不通"
  save_env   # 记下网站的地址：以后 status 也经过网站查一下
  say "经过 $(site_url) 访问一遍${VIA:+（直接连 ${VIA}）}："
  verify_run
}

# 撤掉：只拆脚本自己装的东西（这个目录的 systemd 服务、后台进程）；代码、数据、备份留着，打印出来让你决定
do_uninstall(){
  if unit_ours; then
    local was; was="$(unit_dir)"
    if [ "${was}" = "${APP_DIR}" ]; then
      sudo systemctl stop "${UNIT}" || die "服务停不下来：systemctl status ${UNIT}"
      sudo systemctl disable "${UNIT}" || true
      sudo rm -f "${UNIT_FILE}"; sudo systemctl daemon-reload; sudo systemctl reset-failed "${UNIT}" 2>/dev/null || true
      ok "拆掉了 systemd 服务 ${UNIT}（删了 ${UNIT_FILE}）"
    else warn "systemd 服务 ${UNIT} 跑的是另一个目录（${was}）里的猫咖：不动它。要拆，到那个目录里 ./deploy.sh uninstall"; fi
  fi
  if pid_alive; then do_stop; else ok "后台没有这个目录的猫咖在跑"; fi
  rm -f "${PID_FILE}"
  say ""
  say "猫咖在这台服务器上还剩这些，删不删你定："
  say "  代码、设置、日志：${APP_DIR}"
  say "  数据：${DATA_DIR}（名册和抽奖登记，有个人信息；要留就先 ./deploy.sh backup，把备份拷走）"
  if [ -d "${APP_DIR}/backups" ]; then say "  备份：${APP_DIR}/backups（也有个人信息）"; fi
  live_init
  say "  网站的 nginx 里装的那一段：删掉网站 server { } 里 include ${LIVE} 那一行和这个文件，再 sudo nginx -t && sudo systemctl reload nginx"
  say "除了这些，脚本没在服务器上放别的文件。"
}

do_backup(){
  [ -d "${DATA_DIR}" ] || die "没有数据目录：${DATA_DIR}"
  check_data
  mkdir -p "${APP_DIR}/backups"; local f; f="${APP_DIR}/backups/data-$(date +%Y%m%d-%H%M%S).tar.gz"
  tar czf "${f}" -C "${DATA_DIR}" . ; chmod 600 "${f}" 2>/dev/null || true
  ok "备份好了：${f}"
  warn "备份里有抽奖登记的姓名、工号、联系方式：别外传，活动结束后和数据一起删掉。"
}

do_restore(){
  local f="${RESTORE_FILE:-}"; [ -n "${f}" ] && [ -f "${f}" ] || die "用法：./deploy.sh restore backups/data-….tar.gz"
  check_data; local was=0; if running; then was=1; do_stop; fi
  mkdir -p "${DATA_DIR}"; tar xzf "${f}" -C "${DATA_DIR}"; ok "恢复好了：${f} → ${DATA_DIR}"
  [ "${was}" = 1 ] && do_start || true
}

do_reset(){
  [ -d "${DATA_DIR}" ] || { ok "数据目录本来就是空的"; return; }
  check_data
  say "要清空店里的数据：所有猫的名册、抽奖登记、抽奖记录、店里的计数、后台的\"店里的设置\"（后台口令保留）。"
  printf '确认就输入 RESET：'; local a; read -r a; [ "${a}" = RESET ] || die "没清空"
  do_backup; local was=0; if running; then was=1; do_stop; fi
  rm -f "${DATA_DIR}/cats.json" "${DATA_DIR}/cats.json.tmp"; ok "清空了"
  [ "${was}" = 1 ] && do_start || true
}

do_pack(){
  local stamp; stamp="$(date +%Y%m%d-%H%M)"; local name="1024-cat-cafe-${stamp}"; local tmp; tmp="$(mktemp -d)"; local dst="${tmp}/${name}"
  mkdir -p "${dst}/server" "${dst}/docs"
  cp index.html admin.html config.example.js deploy.sh "${dst}/"; cp -R js "${dst}/js"; cp -R fonts "${dst}/fonts"; cp server/*.js "${dst}/server/"; cp docs/*.md "${dst}/docs/"
  [ "${WITH_CONFIG}" = 1 ] && [ -f config.js ] && cp config.js "${dst}/" && warn "离线包里带了 config.js（有内网地址）：别外传"
  if [ -n "${WITH_NODE}" ]; then [ -f "${WITH_NODE}" ] || die "找不到 Node 的包：${WITH_NODE}"
    mkdir -p "${dst}/runtime/node"; tar xf "${WITH_NODE}" -C "${dst}/runtime/node" --strip-components 1 || die "解不开 ${WITH_NODE}（要 node-v…-linux-x64.tar.xz 这种二进制包）"
    ok "带上了 Node：$("${dst}/runtime/node/bin/node" -v 2>/dev/null || echo "$(basename "${WITH_NODE}")")"; fi
  mkdir -p "${APP_DIR}/dist"; tar czf "${APP_DIR}/dist/${name}.tar.gz" -C "${tmp}" "${name}"; rm -rf "${tmp}"
  ok "打好了：dist/${name}.tar.gz（$(du -h "${APP_DIR}/dist/${name}.tar.gz" | cut -f1)）"
  say "拷到服务器上：tar xzf ${name}.tar.gz && cd ${name} && ./deploy.sh"
}

case "${CMD}" in
  start) do_start;;
  stop) do_stop;;
  restart) do_stop; do_start;;
  status) do_status;;
  logs) do_logs;;
  service) do_service;;
  nginx) do_nginx;;
  verify) do_verify;;
  uninstall) do_uninstall;;
  backup) do_backup;;
  restore) do_restore;;
  reset) do_reset;;
  pack) do_pack;;
  check) check_node; find_node; check_data; port_free && ok "端口 ${PORT} 空着" || warn "端口 ${PORT} 被占了"; ok "数据目录：${DATA_DIR}";;
  -h|--help|help) awk 'NR==1{next} /^#/{sub(/^# ?/,"");print;next} {exit}' "$0";;
  *) die "认不得的命令：${CMD}（./deploy.sh help 看说明）";;
esac
