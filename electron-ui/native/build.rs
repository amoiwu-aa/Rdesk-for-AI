extern crate napi_build;

fn main() {
    napi_build::setup();

    #[cfg(windows)]
    {
        println!("cargo:rustc-link-lib=WtsApi32");
    }
}
