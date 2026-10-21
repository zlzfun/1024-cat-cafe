@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo 没装 Node.js：先装 Node.js 18 以上（https://nodejs.org），再双击这个文件。 & pause & exit /b 1)
rem 等服务起来再开浏览器
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:1025/"
rem 老式黑窗口里鼠标点一下会进"选择文字"模式，服务就卡住了，抽奖页连不上。服务开在一个叫 lotto-1024 的新窗口里，只给这个窗口关掉这个模式
reg add "HKCU\Console\lotto-1024" /v QuickEdit /t REG_DWORD /d 0 /f >nul 2>nul
start "lotto-1024" cmd /c "node server.js & pause"
