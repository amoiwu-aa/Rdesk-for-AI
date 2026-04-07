pub mod dispatcher;
pub mod session;
pub mod tools;
pub mod transport;
pub mod types;

use hbb_common::log;
use session::SessionManager;
use std::time::Duration;
use transport::StdioTransport;
use types::{JsonRpcResponse, PARSE_ERROR};

/// Run the MCP server on stdio.
pub async fn run_server() {
    log::info!("MCP: Starting rdesk-mcp server");

    let session_mgr = SessionManager::new();
    let mut transport = StdioTransport::new();

    // Background cleanup task
    let cleanup_mgr = session_mgr.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            cleanup_mgr.cleanup_expired(Duration::from_secs(30 * 60)).await;
        }
    });

    loop {
        match transport.read_request().await {
            None => {
                log::info!("MCP: stdin closed, shutting down");
                break;
            }
            Some(Err(e)) => {
                if e != "empty line" {
                    log::warn!("MCP: read error: {}", e);
                    let resp = JsonRpcResponse::error(None, PARSE_ERROR, e);
                    transport.write_response(&resp).await;
                }
            }
            Some(Ok(req)) => {
                if let Some(resp) = dispatcher::dispatch(req, &session_mgr).await {
                    transport.write_response(&resp).await;
                }
            }
        }
    }
}