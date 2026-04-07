use super::types::{JsonRpcRequest, JsonRpcResponse};
use hbb_common::log;
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader};

const MAX_HEADER_BYTES: usize = 8 * 1024;

pub struct StdioTransport {
    reader: BufReader<tokio::io::Stdin>,
    writer: tokio::io::Stdout,
}

impl StdioTransport {
    pub fn new() -> Self {
        Self {
            reader: BufReader::new(tokio::io::stdin()),
            writer: tokio::io::stdout(),
        }
    }

    pub async fn read_request(&mut self) -> Option<Result<JsonRpcRequest, String>> {
        let first = match self.read_first_non_whitespace_byte().await {
            Ok(Some(byte)) => byte,
            Ok(None) => return None,
            Err(e) => {
                log::error!("MCP: stdin read error: {}", e);
                return None;
            }
        };

        if matches!(first, b'{' | b'[') {
            return Some(self.read_json_line_request(first).await);
        }

        Some(self.read_framed_request(first).await)
    }

    pub async fn write_response(&mut self, resp: &JsonRpcResponse) {
        match serialize_framed_response(resp) {
            Ok(frame) => {
                if let Err(e) = self.writer.write_all(&frame).await {
                    log::error!("MCP: stdout write error: {}", e);
                    return;
                }
                if let Err(e) = self.writer.flush().await {
                    log::error!("MCP: stdout flush error: {}", e);
                }
            }
            Err(e) => {
                log::error!("MCP: serialize frame error: {}", e);
            }
        }
    }

    async fn read_first_non_whitespace_byte(&mut self) -> Result<Option<u8>, std::io::Error> {
        loop {
            let mut byte = [0_u8; 1];
            let n = self.reader.read(&mut byte).await?;
            if n == 0 {
                return Ok(None);
            }
            if !byte[0].is_ascii_whitespace() {
                return Ok(Some(byte[0]));
            }
        }
    }

    async fn read_json_line_request(&mut self, first: u8) -> Result<JsonRpcRequest, String> {
        let mut body = vec![first];
        loop {
            let mut byte = [0_u8; 1];
            let n = self
                .reader
                .read(&mut byte)
                .await
                .map_err(|e| format!("Failed to read JSON request: {}", e))?;
            if n == 0 || byte[0] == b'\n' {
                break;
            }
            body.push(byte[0]);
        }
        parse_json_request(&body)
    }

    async fn read_framed_request(&mut self, first: u8) -> Result<JsonRpcRequest, String> {
        let mut header = vec![first];
        loop {
            if header.len() > MAX_HEADER_BYTES {
                return Err(format!("MCP headers exceeded {} bytes", MAX_HEADER_BYTES));
            }
            if header.ends_with(b"\r\n\r\n") || header.ends_with(b"\n\n") {
                break;
            }

            let mut byte = [0_u8; 1];
            let n = self
                .reader
                .read(&mut byte)
                .await
                .map_err(|e| format!("Failed to read MCP header bytes: {}", e))?;
            if n == 0 {
                return Err("Unexpected EOF while reading MCP headers".into());
            }
            header.push(byte[0]);
        }

        let content_length = parse_headers_block(&header)?;
        let mut body = vec![0_u8; content_length];
        self.reader
            .read_exact(&mut body)
            .await
            .map_err(|e| format!("Failed to read MCP body: {}", e))?;

        parse_json_request(&body)
    }
}

fn parse_headers_block(header: &[u8]) -> Result<usize, String> {
    let header = std::str::from_utf8(header)
        .map_err(|e| format!("Header block is not valid UTF-8: {}", e))?;
    let mut content_length = None;

    for line in header.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let (name, value) = line
            .split_once(':')
            .ok_or_else(|| format!("Malformed MCP header: {}", line))?;
        if name.eq_ignore_ascii_case("content-length") {
            content_length = Some(
                value
                    .trim()
                    .parse::<usize>()
                    .map_err(|e| format!("Invalid Content-Length '{}': {}", value.trim(), e))?,
            );
        }
    }

    content_length.ok_or_else(|| "Missing Content-Length header".to_string())
}

fn parse_json_request(bytes: &[u8]) -> Result<JsonRpcRequest, String> {
    let body = std::str::from_utf8(bytes)
        .map_err(|e| format!("Request body is not valid UTF-8: {}", e))?
        .trim()
        .trim_start_matches('\u{feff}');
    serde_json::from_str::<JsonRpcRequest>(body).map_err(|e| format!("JSON parse error: {}", e))
}

fn serialize_framed_response(resp: &JsonRpcResponse) -> Result<Vec<u8>, String> {
    let json = serde_json::to_vec(resp).map_err(|e| e.to_string())?;
    let header = format!(
        "Content-Length: {}\r\nContent-Type: application/json\r\n\r\n",
        json.len()
    );
    let mut frame = Vec::with_capacity(header.len() + json.len());
    frame.extend_from_slice(header.as_bytes());
    frame.extend_from_slice(&json);
    Ok(frame)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parses_json_line_mode() {
        let req = parse_json_request(br#"{"jsonrpc":"2.0","id":1,"method":"ping"}"#).unwrap();
        assert_eq!(req.method, "ping");
    }

    #[test]
    fn parses_content_length_header_case_insensitively() {
        let len = parse_headers_block(b"content-length: 42\r\n\r\n").unwrap();
        assert_eq!(len, 42);
    }

    #[test]
    fn serializes_framed_response() {
        let resp = JsonRpcResponse::success(Some(json!(1)), json!({}));
        let frame = serialize_framed_response(&resp).unwrap();
        let text = String::from_utf8(frame).unwrap();
        assert!(text.starts_with("Content-Length: "));
        assert!(text.contains("\r\n\r\n{\"jsonrpc\":\"2.0\""));
    }
}