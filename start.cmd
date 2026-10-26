@echo off
chcp 65001 >nul
title 任务看板 - Vite 服务器
cd /d "%~dp0"
echo ==========================================
echo   任务看板 - Vite 开发服务器运行中...
echo   访问地址：http://localhost:8085
echo   关闭此窗口即停止服务器
echo ==========================================
echo.
start "" http://localhost:8085
call npx vite --host 0.0.0.0 --port 8085
pause