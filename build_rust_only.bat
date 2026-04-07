@echo off
chcp 65001 >nul 2>&1
setlocal

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
for /f "usebackq tokens=*" %%i in (`"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VS_PATH=%%i"
call "%VS_PATH%\VC\Auxiliary\Build\vcvarsall.bat" x64

set "VCPKG_ROOT=C:\vcpkg"
set "BINDGEN_EXTRA_CLANG_ARGS=-IC:\vcpkg\installed\x64-windows-static\include"

cd /d "%~dp0"
cargo build --release --features hwcodec,vram,flutter --lib
if %errorlevel% neq 0 (
    echo RUST BUILD FAILED
    exit /b 1
)
echo RUST BUILD OK
