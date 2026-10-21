#!/bin/bash
# macOS 上双击启动现场抽奖：等服务起来再开浏览器；关掉这个终端窗口，抽奖就停了
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null || { echo "没装 Node.js：先装 Node.js 18 以上（https://nodejs.org），再双击这个文件。"; read -r; exit 1; }
(sleep 1.5; open http://127.0.0.1:1025/) &
node server.js
