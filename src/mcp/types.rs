use serde::{Deserialize, Serialize};
use serde_json::Value;

/// JSON-RPC 2.0 Request
#[derive(Debug, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: Option<Value>,
    pub method: String,
    #[serde(default)]
    pub params: Value,
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Serialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// MCP tool result envelope
#[derive(Debug, Serialize)]
pub struct McpToolResult {
    pub content: Vec<McpContent>,
    #[serde(rename = "isError", skip_serializing_if = "Option::is_none")]
    pub is_error: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct McpContent {
    #[serde(rename = "type")]
    pub content_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
    #[serde(rename = "mimeType", skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
}

/// MCP tool definition
#[derive(Debug, Serialize)]
pub struct McpToolDef {
    pub name: String,
    pub description: String,
    #[serde(rename = "inputSchema")]
    pub input_schema: Value,
}

// JSON-RPC error codes
pub const PARSE_ERROR: i32 = -32700;
pub const INVALID_REQUEST: i32 = -32600;
pub const METHOD_NOT_FOUND: i32 = -32601;
pub const INVALID_PARAMS: i32 = -32602;
pub const INTERNAL_ERROR: i32 = -32603;
pub const SESSION_NOT_FOUND: i32 = -32000;
pub const CONNECTION_FAILED: i32 = -32001;
pub const AUTH_FAILED: i32 = -32002;
pub const TIMEOUT_ERROR: i32 = -32003;
pub const COMMAND_FAILED: i32 = -32004;

impl JsonRpcResponse {
    pub fn success(id: Option<Value>, result: Value) -> Self {
        Self {
            jsonrpc: "2.0".into(),
            id,
            result: Some(result),
            error: None,
        }
    }

    pub fn error(id: Option<Value>, code: i32, message: impl Into<String>) -> Self {
        Self {
            jsonrpc: "2.0".into(),
            id,
            result: None,
            error: Some(JsonRpcError {
                code,
                message: message.into(),
                data: None,
            }),
        }
    }
}

impl McpToolResult {
    pub fn text(s: impl Into<String>) -> Self {
        Self {
            content: vec![McpContent {
                content_type: "text".into(),
                text: Some(s.into()),
                data: None,
                mime_type: None,
            }],
            is_error: None,
        }
    }

    pub fn error_text(s: impl Into<String>) -> Self {
        Self {
            content: vec![McpContent {
                content_type: "text".into(),
                text: Some(s.into()),
                data: None,
                mime_type: None,
            }],
            is_error: Some(true),
        }
    }

    pub fn image_base64(data: String, mime: &str) -> Self {
        Self {
            content: vec![McpContent {
                content_type: "image".into(),
                text: None,
                data: Some(data),
                mime_type: Some(mime.into()),
            }],
            is_error: None,
        }
    }
}
