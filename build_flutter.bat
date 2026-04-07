@echo off
chcp 65001 >nul 2>&1
setlocal

REM Dynamically locate Visual Studio using vswhere
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "%VSWHERE%" (
    echo ERROR: vswhere not found. Please install Visual Studio Build Tools.
    pause
    exit /b 1
)
for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VS_PATH=%%i"
if not defined VS_PATH (
    echo ERROR: Visual Studio with C++ tools not found.
    pause
    exit /b 1
)
call "%VS_PATH%\VC\Auxiliary\Build\vcvarsall.bat" x64
set "FLUTTER_BIN="
where flutter >nul 2>nul
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where flutter') do (
        set "FLUTTER_BIN=%%~dpi"
        goto flutter_found
    )
)
if exist "C:\Users\wuxiang\flutter\bin\flutter.bat" set "FLUTTER_BIN=C:\Users\wuxiang\flutter\bin\"
if not defined FLUTTER_BIN if exist "D:\rustdesk\flutter\bin\flutter.bat" set "FLUTTER_BIN=D:\rustdesk\flutter\bin\"
if not defined FLUTTER_BIN if exist "%USERPROFILE%\flutter\bin\flutter.bat" set "FLUTTER_BIN=%USERPROFILE%\flutter\bin\"
:flutter_found
if not defined FLUTTER_BIN (
    echo ERROR: flutter.bat not found. Please install Flutter or add it to PATH.
    pause
    exit /b 1
)
REM Ensure cargo is in PATH (may be lost after vcvarsall.bat)
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    if exist "D:\rustdesk\cargo\.cargo\bin\cargo.exe" (
        set "PATH=D:\rustdesk\cargo\.cargo\bin;%PATH%"
    ) else if exist "%USERPROFILE%\.cargo\bin\cargo.exe" (
        set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
    )
)
set "PATH=%FLUTTER_BIN%;%PATH%"
set "VCPKG_ROOT=C:\vcpkg"
set "VCPKG_INSTALLED_ROOT=C:\vcpkg\installed"
set "BINDGEN_EXTRA_CLANG_ARGS=-IC:\vcpkg\installed\x64-windows-static\include"
set CPATH=%INCLUDE%

cd /d "%~dp0"

echo ========================================
echo  RDesk Flutter Build (H.264/H.265/AV1)
echo  Features: hwcodec + vram + av1 + flutter
echo ========================================
echo.
echo  [1] Build only (no installer)
echo  [2] Build + installer (.exe)
echo  [3] Clean + Build (clear Flutter cache first)
echo  [4] Clean + Build + installer
echo.
set /p choice=Select (1/2/3/4):

if "%choice%"=="3" goto do_clean
if "%choice%"=="4" goto do_clean
goto skip_clean

:do_clean
echo.
echo Cleaning Rust build cache...
cd /d "%~dp0"
cargo clean
echo Rust cache cleared.
echo.
echo Cleaning Flutter build cache...
cd /d "%~dp0\flutter"
call flutter clean
cd /d "%~dp0"
echo Flutter cache cleared.
echo.

:skip_clean

if "%choice%"=="2" goto build_installer
if "%choice%"=="4" goto build_installer
goto build_only

:build_installer
echo.
echo Building with installer...
python build.py --flutter --hwcodec --vram --av1
goto build_done

:build_only
echo.
echo Building without installer...
python build.py --flutter --hwcodec --vram --av1 --skip-portable-pack

:build_done

if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD SUCCESS!
if "%choice%"=="2" (
    echo  Installer: rdesk-*-install.exe (RDesk)
)
echo  Portable:  flutter\build\windows\x64\runner\Release\rdesk.exe (RDesk)
echo ========================================
pause
