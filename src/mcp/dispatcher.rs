use super::session::SessionManager;
use super::tools;
use super::types::*;
use hbb_common::log;
use serde_json::{json, Value};

fn tool_definitions() -> Vec<McpToolDef> {
    vec![
        McpToolDef {
            name: "connect_terminal".into(),
            description: "Connect to a remote RustDesk peer and open a terminal session".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "peer_id": { "type": "string", "description": "Remote RustDesk peer ID (numeric)" },
                    "password": { "type": "string", "description": "Remote peer's RustDesk password" }
                },
                "required": ["peer_id", "password"]
            }),
        },
        McpToolDef {
            name: "run_command".into(),
            description: "Execute a command on a connected remote terminal and return the output".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "session_id": { "type": "string", "description": "Session ID from connect_terminal" },
                    "command": { "type": "string", "description": "Command to execute" }
                },
                "required": ["session_id", "command"]
            }),
        },
        McpToolDef {
            name: "close_terminal".into(),
            description: "Close a remote terminal session".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "session_id": { "type": "string", "description": "Session ID to close" }
                },
                "required": ["session_id"]
            }),
        },
        McpToolDef {
            name: "get_peer_info".into(),
            description: "Get information about a remote RustDesk peer (OS, hostname, version)".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "peer_id": { "type": "string", "description": "Remote RustDesk peer ID" },
                    "password": { "type": "string", "description": "Remote peer's RustDesk password" }
                },
                "required": ["peer_id", "password"]
            }),
        },
    ]
}

pub async fn dispatch(req: JsonRpcRequest, session_mgr: &SessionManager) -> Option<JsonRpcResponse> {
    let id = req.id.clone();

    if req.jsonrpc != "2.0" {
        return Some(JsonRpcResponse::error(
            id,
            INVALID_REQUEST,
            format!("Unsupported JSON-RPC version: {}", req.jsonrpc),
        ));
    }

    match req.method.as_str() {
        "initialize" => Some(handle_initialize(id)),
        "notifications/initialized" => None,
        "tools/list" => Some(handle_tools_list(id)),
        "tools/call" => Some(handle_tools_call(id, req.params, session_mgr).await),
        "ping" => Some(JsonRpcResponse::success(id, json!({}))),
        _ => Some(JsonRpcResponse::error(
            id,
            METHOD_NOT_FOUND,
            format!("Unknown method: {}", req.method),
        )),
    }
}

fn handle_initialize(id: Option<Value>) -> JsonRpcResponse {
    JsonRpcResponse::success(
        id,
        json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {
                    "listChanged": false
                }
            },
            "serverInfo": {
                "name": "rdesk-mcp",
                "version": env!("CARGO_PKG_VERSION")
            }
        }),
    )
}

fn handle_tools_list(id: Option<Value>) -> JsonRpcResponse {
    JsonRpcResponse::success(id, json!({ "tools": tool_definitions() }))
}

async fn handle_tools_call(
    id: Option<Value>,
    params: Value,
    session_mgr: &SessionManager,
) -> JsonRpcResponse {
    let tool_name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let arguments = params.get("arguments").cloned().unwrap_or(json!({}));

    log::info!("MCP: tools/call name={}", tool_name);

    let result = match tool_name {
        "connect_terminal" => tools::terminal::connect_terminal(arguments, session_mgr).await,
        "run_command" => tools::terminal::run_command(arguments, session_mgr).await,
        "close_terminal" => tools::terminal::close_terminal(arguments, session_mgr).await,
        "get_peer_info" => tools::terminal::get_peer_info(arguments, session_mgr).await,
        _ => McpToolResult::error_text(format!("Unknown tool: {}", tool_name)),
    };

    JsonRpcResponse::success(id, serde_json::to_value(result).unwrap_or(json!(null)))
}