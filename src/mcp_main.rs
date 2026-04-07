use hbb_common::{env_logger::*, log};

fn main() {
    init_from_env(Env::default().filter_or(DEFAULT_FILTER_ENV, "info"));
    log::info!("rdesk-mcp starting");

    // Use a larger stack size (8MB) to avoid stack overflow during
    // crypto operations and deep call chains in Client::start()
    let rt = tokio::runtime::Builder::new_multi_thread()
        .thread_stack_size(8 * 1024 * 1024)
        .enable_all()
        .build()
        .expect("Failed to build tokio runtime");

    rt.block_on(librdesk::mcp::run_server());
}
