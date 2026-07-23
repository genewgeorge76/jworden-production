@echo off
setlocal enabledelayedexpansion

set AHREFS_SCRIPT=  ^<script async src="https://analytics.ahrefs.com/analytics.js" data-key="MA0xXk8V07eABgubrbsJPQ"^>^</script^>

for /r %%F in (*.html) do (
  findstr /M "MA0xXk8V07eABgubrbsJPQ" "%%F" >nul
  if errorlevel 1 (
    powershell -Command "(Get-Content '%%F') -replace '</head>', '%AHREFS_SCRIPT%`n</head>' | Set-Content '%%F'"
    echo Added Ahrefs to %%F
  ) else (
    echo Ahrefs already in %%F
  )
)

echo Done. Go to GitHub Desktop and commit changes.
pause

Save it (Ctrl+S)
Close the editor

Now double-click the inject-ahrefs.bat file in File Explorer. It runs automatically and injects Ahrefs into all HTML files.
Tell me when it's done.
