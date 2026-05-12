@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: Auto Sync Script - Media Artikel
:: Two-way sync: Pull then Push
:: ============================================

set "REPO_DIR=c:\Users\LENOVO\Documents\Punya saya\my project\start up\Media Artikel"
set "LOG_FILE=%REPO_DIR%\sync-log.txt"

:: Timestamp
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "DATE=%%a/%%b/%%c"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a:%%b"
set "TIMESTAMP=%DATE% %TIME%"

echo. >> "%LOG_FILE%"
echo ========================================== >> "%LOG_FILE%"
echo [%TIMESTAMP%] Sync dimulai... >> "%LOG_FILE%"

cd /d "%REPO_DIR%"

:: Step 1: Pull dari remote (ambil perubahan terbaru)
echo [%TIMESTAMP%] Pulling dari remote... >> "%LOG_FILE%"
git pull origin main 2>> "%LOG_FILE%" >> "%LOG_FILE%"
if %ERRORLEVEL% NEQ 0 (
    echo [%TIMESTAMP%] ERROR: Pull gagal! Mungkin ada conflict. >> "%LOG_FILE%"
    echo [%TIMESTAMP%] Mencoba pull dengan rebase... >> "%LOG_FILE%"
    git pull --rebase origin main 2>> "%LOG_FILE%" >> "%LOG_FILE%"
    if %ERRORLEVEL% NEQ 0 (
        echo [%TIMESTAMP%] ERROR: Pull rebase juga gagal. Perlu resolve manual. >> "%LOG_FILE%"
        goto :END
    )
)
echo [%TIMESTAMP%] Pull berhasil. >> "%LOG_FILE%"

:: Step 2: Cek apakah ada perubahan lokal
git diff --quiet 2>nul
set "DIFF_RESULT=%ERRORLEVEL%"
git diff --cached --quiet 2>nul
set "CACHED_RESULT=%ERRORLEVEL%"

:: Cek untracked files
for /f %%i in ('git ls-files --others --exclude-standard') do set "UNTRACKED=1"

if "%DIFF_RESULT%"=="0" if "%CACHED_RESULT%"=="0" if not defined UNTRACKED (
    echo [%TIMESTAMP%] Tidak ada perubahan lokal. Sync selesai. >> "%LOG_FILE%"
    goto :END
)

:: Step 3: Add semua perubahan
echo [%TIMESTAMP%] Ada perubahan lokal, menambahkan file... >> "%LOG_FILE%"
git add -A 2>> "%LOG_FILE%" >> "%LOG_FILE%"

:: Step 4: Commit dengan pesan otomatis
set "COMMIT_MSG=Auto-sync: %TIMESTAMP%"
git commit -m "%COMMIT_MSG%" 2>> "%LOG_FILE%" >> "%LOG_FILE%"
if %ERRORLEVEL% NEQ 0 (
    echo [%TIMESTAMP%] Tidak ada yang perlu di-commit. >> "%LOG_FILE%"
    goto :END
)
echo [%TIMESTAMP%] Commit berhasil: %COMMIT_MSG% >> "%LOG_FILE%"

:: Step 5: Push ke remote
echo [%TIMESTAMP%] Pushing ke remote... >> "%LOG_FILE%"
git push origin main 2>> "%LOG_FILE%" >> "%LOG_FILE%"
if %ERRORLEVEL% NEQ 0 (
    echo [%TIMESTAMP%] ERROR: Push gagal! >> "%LOG_FILE%"
    goto :END
)
echo [%TIMESTAMP%] Push berhasil. >> "%LOG_FILE%"

:END
echo [%TIMESTAMP%] Sync selesai. >> "%LOG_FILE%"
echo ========================================== >> "%LOG_FILE%"
endlocal
