$env:VCPKG_ROOT = 'C:\vcpkg'
$env:BINDGEN_EXTRA_CLANG_ARGS = @"
"-IC:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\ucrt" "-IC:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\include"
"@

# Build Flutter version
python build.py --flutter
