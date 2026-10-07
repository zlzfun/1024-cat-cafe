#!/usr/bin/env bash
# 1024 猫咖营业中 · 一键部署（Linux / macOS）。说明见 docs/部署.md。
#
#   ./deploy.sh                      第一次：检查环境 → 写好配置 → 后台启动 → 打印地址和后台口令
#   ./deploy.sh start [选项]          启动（已经在跑就只打印状态）
#     --port 1024                    端口（默认 1024）
#     --host 0.0.0.0                 监听地址：0.0.0.0 让局域网里别的电脑也能打开；放在反向代理后面用 127.0.0.1
#     --data /srv/cat1024-data       数据目录（名册、抽奖登记、后台口令；默认 server/data）
#     --inner https://…              内源主页地址（写进 config.js；只在内网用，别提交到公开仓库）
#     --bots 40                      补位的机器人数（写进 config.js）
#     --proxy                        放在反向代理（nginx 等）后面
#   ./deploy.sh stop | restart | status | logs [-f]
#   ./deploy.sh service              装成 systemd 服务：开机自启、挂了自动拉起（要 sudo，只在 Linux 上）
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
PORT=1024; HOST=0.0.0.0; DATA_DIR="${APP_DIR}/server/data"; TRUST_PROXY=0
[ -f "${ENV_FILE}" ] && . "${ENV_FILE}"
INNER=; BOTS=; WITH_NODE=; WITH_CONFIG=0; FOLLOW=0
CMD="${1:-start}"; [ $# -gt 0 ] && shift
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="${2:?--port 后面要写端口}"; shift 2;;
    --host) HOST="${2:?--host 后面要写地址}"; shift 2;;
    --data) DATA_DIR="${2:?--data 后面要写目录}"; shift 2;;
    --inner) INNER="${2:?--inner 后面要写地址}"; shift 2;;
    --bots) BOTS="${2:?--bots 后面要写数字}"; shift 2;;
    --proxy) TRUST_PROXY=1; shift;;
    --with-node) WITH_NODE="${2:?--with-node 后面要写 Node 的二进制包}"; shift 2;;
    --with-config) WITH_CONFIG=1; shift;;
    -f) FOLLOW=1; shift;;
    *) if [ "${CMD}" = restore ] && [ -z "${RESTORE_FILE:-}" ]; then RESTORE_FILE="$1"; shift; else die "认不得的参数：$1（看 ./deploy.sh 开头的说明）"; fi;;
  esac
done
case "${PORT}" in ''|*[!0-9]*) die "端口要是数字：${PORT}";; esac
[ -n "${BOTS}" ] && case "${BOTS}" in *[!0-9]*) die "--bots 要是数字：${BOTS}";; esac
case "${DATA_DIR}" in /*) ;; *) DATA_DIR="${APP_DIR}/${DATA_DIR}";; esac
save_env(){ cat > "${ENV_FILE}" <<EOF
# 1024 猫咖 · deploy.sh 记下的设置（不进仓库）
PORT=${PORT}
HOST=${HOST}
DATA_DIR="${DATA_DIR}"
TRUST_PROXY=${TRUST_PROXY}
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
lan_ip(){ local ip=""
  if command -v hostname >/dev/null 2>&1; then ip="$(hostname -I 2>/dev/null | awk '{print $1}')" || true; fi
  if [ -z "${ip}" ] && command -v ipconfig >/dev/null 2>&1; then ip="$(ipconfig getifaddr en0 2>/dev/null || true)"; fi
  printf '%s' "${ip}"; }

# ---------- config.js：给了 --inner / --bots，或者还没有这个文件，就写一份 ----------
write_config(){
  local f="${APP_DIR}/config.js"
  if [ -f "${f}" ] && [ -z "${INNER}" ] && [ -z "${BOTS}" ]; then ok "config.js 已经有了，不动它"; return; fi
  local inner="${INNER}" bots="${BOTS:-40}"
  if [ -f "${f}" ] && [ -z "${INNER}" ]; then inner="$("${NODE}" -e "global.window={};require('${f}');process.stdout.write(((window.CAT1024_CONFIG||{}).links||{}).inner||'')" 2>/dev/null || true)"; fi
  if [ -f "${f}" ] && [ -z "${BOTS}" ]; then bots="$("${NODE}" -e "global.window={};require('${f}');process.stdout.write(String((window.CAT1024_CONFIG||{}).bots??40))" 2>/dev/null || echo 40)"; fi
  inner="${inner//\\/\\\\}"; inner="${inner//\'/\\\'}"
  cat > "${f}" <<EOF
/* 1024 猫咖 · 部署配置（deploy.sh 写的；不进仓库）。字段见 config.example.js。 */
window.CAT1024_CONFIG = {
  api: 'api',
  links: {
    inner: '${inner}',
  },
  bots: ${bots},
};
EOF
  ok "写好了 config.js（内源主页：${inner:-还没配}，机器人：${bots}）"
}

# ---------- 跑着没有 ----------
service_on(){ [ -f "${UNIT_FILE}" ] && command -v systemctl >/dev/null 2>&1 && systemctl is-enabled --quiet "${UNIT}" 2>/dev/null; }
pid_alive(){ [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; }
running(){ if service_on; then systemctl is-active --quiet "${UNIT}"; else pid_alive; fi; }

admin_key(){ if [ -n "${ADMIN_KEY:-}" ]; then printf '%s' "${ADMIN_KEY}"; elif [ -f "${DATA_DIR}/admin.key" ]; then tr -d '\n' < "${DATA_DIR}/admin.key"; fi; }
show_urls(){
  local ip; ip="$(lan_ip)"; local key; key="$(admin_key)"
  say ""
  say "  店：      http://127.0.0.1:${PORT}/"
  if [ "${HOST}" = 0.0.0.0 ] && [ -n "${ip}" ]; then say "  局域网：  http://${ip}:${PORT}/"; fi
  say "  后台：    http://127.0.0.1:${PORT}/admin.html    口令：${key:-（看 ${DATA_DIR}/admin.key）}"
  say "  ${c_dim}数据：${DATA_DIR}    日志：$(service_on && echo "journalctl -u ${UNIT}" || echo "${LOG_FILE}")${c_0}"
  say ""
}

wait_up(){ for _ in $(seq 1 40); do if health >/dev/null; then return 0; fi; sleep 0.25; done; return 1; }

do_start(){
  check_node
  [ -f "${APP_DIR}/server/server.js" ] && [ -f "${APP_DIR}/index.html" ] || die "这里不是 1024 猫咖的目录（找不到 server/server.js、index.html）"
  if running; then ok "已经在跑了"; health >/dev/null && ok "接口正常" || warn "进程在，但接口没应答，看看日志：./deploy.sh logs"; show_urls; return; fi
  mkdir -p "${DATA_DIR}" "${RUN_DIR}"; chmod 700 "${DATA_DIR}" 2>/dev/null || true
  write_config
  port_free || die "端口 ${PORT} 被占了。换一个：./deploy.sh start --port 8080"
  if service_on; then sudo systemctl start "${UNIT}"
  else
    say "${c_dim}启动：PORT=${PORT} HOST=${HOST} DATA_DIR=${DATA_DIR} TRUST_PROXY=${TRUST_PROXY}${c_0}"
    PORT="${PORT}" HOST="${HOST}" DATA_DIR="${DATA_DIR}" TRUST_PROXY="${TRUST_PROXY}" nohup "${NODE}" server/server.js >> "${LOG_FILE}" 2>&1 &
    echo $! > "${PID_FILE}"
  fi
  if wait_up; then save_env; ok "开张了"; show_urls
    [ "${HOST}" = 0.0.0.0 ] && say "${c_dim}别的电脑打不开的话：看看服务器的防火墙有没有放行 ${PORT} 端口。${c_0}"
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
  else warn "没在跑。启动：./deploy.sh start"; fi
}

do_logs(){
  if service_on; then if [ "${FOLLOW}" = 1 ]; then journalctl -u "${UNIT}" -f; else journalctl -u "${UNIT}" -n 80 --no-pager; fi; return; fi
  [ -f "${LOG_FILE}" ] || { warn "还没有日志（${LOG_FILE}）"; return; }
  if [ "${FOLLOW}" = 1 ]; then tail -n 40 -f "${LOG_FILE}"; else tail -n 80 "${LOG_FILE}"; fi
}

do_service(){
  [ "$(uname -s)" = Linux ] && command -v systemctl >/dev/null 2>&1 || die "只有带 systemd 的 Linux 能装成服务；别的系统用 ./deploy.sh start"
  check_node; mkdir -p "${DATA_DIR}"; write_config; save_env
  if pid_alive; then do_stop; fi
  local user; user="$(id -un)"
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
  sudo systemctl daemon-reload; sudo systemctl enable --now "${UNIT}"
  if wait_up; then ok "装好了：开机自启，挂了自动拉起（systemctl status ${UNIT}）"; show_urls; else die "服务起不来：journalctl -u ${UNIT} -n 50"; fi
}

do_backup(){
  [ -d "${DATA_DIR}" ] || die "没有数据目录：${DATA_DIR}"
  mkdir -p "${APP_DIR}/backups"; local f; f="${APP_DIR}/backups/data-$(date +%Y%m%d-%H%M%S).tar.gz"
  tar czf "${f}" -C "${DATA_DIR}" . ; chmod 600 "${f}" 2>/dev/null || true
  ok "备份好了：${f}"
  warn "备份里有抽奖登记的姓名、工号、联系方式：别外传，活动结束后和数据一起删掉。"
}

do_restore(){
  local f="${RESTORE_FILE:-}"; [ -n "${f}" ] && [ -f "${f}" ] || die "用法：./deploy.sh restore backups/data-….tar.gz"
  local was=0; if running; then was=1; do_stop; fi
  mkdir -p "${DATA_DIR}"; tar xzf "${f}" -C "${DATA_DIR}"; ok "恢复好了：${f} → ${DATA_DIR}"
  [ "${was}" = 1 ] && do_start || true
}

do_reset(){
  [ -d "${DATA_DIR}" ] || { ok "数据目录本来就是空的"; return; }
  say "要清空店里的数据：所有猫的名册、抽奖登记、抽奖记录、店里的计数（后台口令保留）。"
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
  backup) do_backup;;
  restore) do_restore;;
  reset) do_reset;;
  pack) do_pack;;
  check) check_node; find_node; port_free && ok "端口 ${PORT} 空着" || warn "端口 ${PORT} 被占了"; ok "数据目录：${DATA_DIR}";;
  -h|--help|help) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//';;
  *) die "认不得的命令：${CMD}（./deploy.sh help 看说明）";;
esac
