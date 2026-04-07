@echo off
set VCPKG_ROOT=C:\vcpkg
set BINDGEN_EXTRA_CLANG_ARGS=-I"C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\ucrt" -I"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\include"
cargo build --release
