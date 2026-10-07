@echo off
setlocal
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
start "CloudVault Server" cmd /k "node server.js"
timeout /t 2 >nul
start http://localhost:5000
