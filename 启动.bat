@echo off
chcp 65001 >nul
title 股票复盘系统

cd /d "%~dp0"

:: 检查服务是否已启动（只检查本地监听端口）
netstat -ano | findstr "LISTENING" | findstr ":9998 " >nul
if %errorlevel% equ 0 (
    echo 错误：服务已在运行（端口 9998 被占用）
    echo 请先关闭现有服务后再启动
    pause
    exit /b 1
)

echo 启动股票复盘系统...

:: 启动代理服务 (node)
start /b "" cmd /c "cd /d %~dp0server && node server.js 3001"
timeout /t 2 /nobreak >nul

:: 找到 node 进程 PID
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do set NODE_PID=%%a

:: 启动HTTP服务 (python)
start /b "" python -m http.server 9998
timeout /t 2 /nobreak >nul

:: 找到 python 进程 PID
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9998 "') do set PYTHON_PID=%%a

echo Node PID: %NODE_PID%, Python PID: %PYTHON_PID%

:: 打开浏览器
start http://localhost:9998/html/index.html

echo.
echo 系统已启动！
echo 访问 http://localhost:9998/html/index.html
echo.
echo 按任意键关闭服务...
pause >nul

:: 关闭记录的 PID
if defined NODE_PID taskkill /F /PID %NODE_PID% 2>nul
if defined PYTHON_PID taskkill /F /PID %PYTHON_PID% 2>nul

echo 已关闭！
