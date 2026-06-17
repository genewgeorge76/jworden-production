@echo off
echo ===================================================
echo Starting Local Next.js dev server for jwordenasphaltpaving.com
echo Make sure you have edited your hosts file:
echo C:\Windows\System32\drivers\etc\hosts
echo and added:
echo 127.0.0.1 jwordenasphaltpaving.com
echo 127.0.0.1 www.jwordenasphaltpaving.com
echo ===================================================
cd /d "%~dp0\jwordenasphaltpaving"
echo Running on port 80 (Requires Administrator/Elevated Command Prompt)...
npm run dev -- -p 80
pause
