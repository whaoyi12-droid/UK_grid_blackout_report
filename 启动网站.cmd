@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。请使用已安装 Node.js 的演示电脑。
  pause
  exit /b 1
)
if not exist dist\index.html (
  echo 尚未生成构建产物。请按 README.md 安装本项目依赖并运行 npm run build。
  pause
  exit /b 1
)
echo 正在启动本地网站：http://127.0.0.1:4173/
echo 保持本窗口开启；结束演示后按 Ctrl+C 停止。
node scripts\serve-local.mjs --open
pause
