use crate::client::Interface;
use crate::mcp::session::{connect_and_auth, spawn_stream_task, SessionManager, TerminalSession};
use crate::mcp::types::McpToolResult;
use hbb_common::{
    log,
    message_proto::*,
    rendezvous_proto::ConnType,
};
use serde_json::Value;
use std::time::{Duration, Instant};
use uuid::Uuid;

/// Strip ANSI escape sequences from terminal output.
fn strip_ansi(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\x1b' {
            // ESC sequence
            match chars.peek() {
                Some('[') => {
                    chars.next(); // consume '['
                    // CSI sequence: consume until a letter A-Z or a-z
                    while let Some(&ch) = chars.peek() {
                        chars.next();
                        if ch.is_ascii_alphabetic() || ch == '~' {
                            break;
                        }
                    }
                }
                Some(']') => {
                    chars.next(); // consume ']'
                    // OSC sequence: consume until ST (\x1b\\ or \x07)
                    while let Some(&ch) = chars.peek() {
                        if ch == '\x07' {
                            chars.next();
                            break;
                        }
                        if ch == '\x1b' {
                            chars.next();
                            if chars.peek() == Some(&'\\') {
                                chars.next();
                            }
                            break;
                        }
                        chars.next();
                    }
                }
                _ => {
                    // Other ESC sequence, skip next char
                    chars.next();
                }
            }
        } else if c == '\r' {
            // Skip carriage returns
            continue;
        } else {
            result.push(c);
        }
    }
    result
}

fn get_str(args: &Value, key: &str) -> Result<String, McpToolResult> {
    args.get(key)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| McpToolResult::error_text(format!("Missing required parameter: {}", key)))
}

/// Connect to a remote peer and open a terminal session.
pub async fn connect_terminal(args: Value, mgr: &SessionManager) -> McpToolResult {
    let peer_id = match get_str(&args, "peer_id") {
        Ok(v) => v,
        Err(e) => return e,
    };
    let password = match get_str(&args, "password") {
        Ok(v) => v,
        Err(e) => return e,
    };

    log::info!("MCP: connect_terminal peer_id={}", peer_id);

    let authed = match connect_and_auth(&peer_id, &password, ConnType::TERMINAL).await {
        Ok(a) => a,
        Err(e) => return McpToolResult::error_text(format!("Connection failed: {}", e)),
    };

    let session_id = Uuid::new_v4().to_string();
    let terminal_id = 1;
    let lc = authed.bridge.get_lch();

    // Spawn background stream task — it owns the stream
    let (cmd_tx, mut output_rx) = spawn_stream_task(
        authed.stream,
        authed.receiver,
        authed._keep,
        session_id.clone(),
    );

    // Send OpenTerminal command
    let mut open_msg = Message::new();
    open_msg.set_terminal_action(TerminalAction {
        union: Some(terminal_action::Union::Open(OpenTerminal {
            terminal_id,
            rows: 24,
            cols: 80,
            ..Default::default()
        })),
        ..Default::default()
    });
    if cmd_tx.send(open_msg).is_err() {
        return McpToolResult::error_text("Failed to send open terminal command");
    }

    // Wait for TerminalOpened response
    let timeout_dur = Duration::from_secs(10);
    let start = Instant::now();
    loop {
        if start.elapsed() > timeout_dur {
            return McpToolResult::error_text("Timeout waiting for terminal to open");
        }
        match tokio::time::timeout(Duration::from_millis(100), output_rx.recv()).await {
            Ok(Some(data)) => {
                let text = String::from_utf8_lossy(&data);
                if text.starts_with("__TERMINAL_OPENED__:") {
                    break; // Success
                } else if text.starts_with("__TERMINAL_OPEN_FAILED__:") {
                    let err = text.trim_start_matches("__TERMINAL_OPEN_FAILED__:");
                    return McpToolResult::error_text(format!("Terminal open failed: {}", err));
                }
                // Other data during open — ignore (or it's early output)
            }
            Ok(None) => {
                return McpToolResult::error_text("Stream closed before terminal opened");
            }
            Err(_) => {
                // Timeout on this recv, try again
                continue;
            }
        }
    }

    let session = TerminalSession {
        peer_id: peer_id.clone(),
        terminal_id,
        cmd_tx,
        output_rx,
        lc,
        created_at: Instant::now(),
    };

    mgr.add(session_id.clone(), session).await;

    McpToolResult::text(serde_json::json!({
        "session_id": session_id,
        "peer_id": peer_id,
        "terminal_id": terminal_id,
        "status": "connected"
    }).to_string())
}

/// Execute a command on a connected terminal and return the output.
pub async fn run_command(args: Value, mgr: &SessionManager) -> McpToolResult {
    let session_id = match get_str(&args, "session_id") {
        Ok(v) => v,
        Err(e) => return e,
    };
    let command = match get_str(&args, "command") {
        Ok(v) => v,
        Err(e) => return e,
    };

    log::info!("MCP: run_command session={} cmd={}", session_id, command);

    // Use a short sentinel to avoid terminal line wrapping
    let sentinel = format!("_MCPD{}_", &Uuid::new_v4().simple().to_string()[..8]);

    let terminal_id = match mgr.with_session(&session_id, |s| s.terminal_id).await {
        Some(id) => id,
        None => return McpToolResult::error_text("Session not found"),
    };

    // Drain any existing output first
    mgr.with_session(&session_id, |s| {
        while s.output_rx.try_recv().is_ok() {}
    }).await;

    // Helper to send terminal data
    let send_data = |_mgr: &SessionManager, tid: i32, data: Vec<u8>| {
        let mut msg = Message::new();
        msg.set_terminal_action(TerminalAction {
            union: Some(terminal_action::Union::Data(TerminalData {
                terminal_id: tid,
                data: data.into(),
                compressed: false,
                ..Default::default()
            })),
            ..Default::default()
        });
        msg
    };

    // Step 1: Send the command with \r\n
    let cmd_bytes = format!("{}\r\n", command).into_bytes();
    let msg = send_data(mgr, terminal_id, cmd_bytes);
    let sent = mgr.with_session(&session_id, |s| s.cmd_tx.send(msg).is_ok()).await;
    if sent != Some(true) {
        return McpToolResult::error_text("Failed to send command");
    }

    // Step 2: Wait for the command to execute
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Step 3: Send the sentinel echo as a separate command
    let sentinel_bytes = format!("echo {}\r\n", sentinel).into_bytes();
    let msg = send_data(mgr, terminal_id, sentinel_bytes);
    let sent = mgr.with_session(&session_id, |s| s.cmd_tx.send(msg).is_ok()).await;
    if sent != Some(true) {
        return McpToolResult::error_text("Failed to send sentinel");
    }

    // Step 4: Collect output until we see the sentinel in the echo OUTPUT
    let timeout_dur = Duration::from_secs(30);
    let start = Instant::now();
    let mut output = Vec::new();

    loop {
        if start.elapsed() > timeout_dur {
            let raw = String::from_utf8_lossy(&output);
            let clean = strip_ansi(&raw);
            return McpToolResult::error_text(format!(
                "Command timed out (30s). Partial output:\n{}",
                clean
            ));
        }

        let chunk = mgr.with_session(&session_id, |s| {
            s.output_rx.try_recv().ok()
        }).await;

        match chunk {
            Some(Some(data)) => {
                output.extend_from_slice(&data);
                let raw = String::from_utf8_lossy(&output);
                let clean = strip_ansi(&raw);
                // Look for the sentinel on its own line (the echo OUTPUT),
                // not inside the echoed command "echo _MCPDxxxx_".
                // The echo output will be "\n_MCPDxxxx_\n" as a standalone line.
                let needle = format!("\n{}\n", sentinel);
                if let Some(pos) = clean.find(&needle) {
                    let before_sentinel = &clean[..pos];
                    let cleaned = clean_command_output(before_sentinel, &command);
                    return McpToolResult::text(cleaned);
                }
                // Also check if sentinel is at the very end (no trailing newline yet)
                let needle_end = format!("\n{}", sentinel);
                if clean.ends_with(&needle_end) {
                    let pos = clean.len() - needle_end.len();
                    let before_sentinel = &clean[..pos];
                    let cleaned = clean_command_output(before_sentinel, &command);
                    return McpToolResult::text(cleaned);
                }
            }
            _ => {
                let exists = mgr.with_session(&session_id, |_| ()).await;
                if exists.is_none() {
                    return McpToolResult::error_text("Session disconnected");
                }
                tokio::time::sleep(Duration::from_millis(50)).await;
            }
        }
    }
}

/// Clean command output: strip echoed commands, prompts, and sentinel lines.
fn clean_command_output(raw: &str, command: &str) -> String {
    let lines: Vec<&str> = raw.lines().collect();
    let mut result = Vec::new();
    let cmd_first_line = command.lines().next().unwrap_or("");

    for line in &lines {
        let trimmed = line.trim();
        // Skip empty lines at start
        if result.is_empty() && trimmed.is_empty() {
            continue;
        }
        // Skip lines that look like shell prompts (PS C:\...>, $, #, >)
        if trimmed.starts_with("PS ") && trimmed.contains('>') {
            continue;
        }
        // Skip echoed command (only if it looks like a prompt line with the command)
        if !cmd_first_line.is_empty() && trimmed.ends_with(cmd_first_line) {
            continue;
        }
        // Skip sentinel-related lines
        if trimmed.contains("_MCPD") || trimmed.contains("echo _MCPD") {
            continue;
        }
        // Skip PowerShell continuation prompts
        if trimmed == ">>" || trimmed.starts_with(">> ") {
            continue;
        }
        result.push(*line);
    }

    // Trim trailing empty lines
    while result.last().map_or(false, |l| l.trim().is_empty()) {
        result.pop();
    }

    result.join("\n").trim().to_string()
}

/// Close a remote terminal session.
pub async fn close_terminal(args: Value, mgr: &SessionManager) -> McpToolResult {
    let session_id = match get_str(&args, "session_id") {
        Ok(v) => v,
        Err(e) => return e,
    };

    log::info!("MCP: close_terminal session={}", session_id);

    // Send close message before removing
    let close_sent = mgr.with_session(&session_id, |s| {
        let mut msg = Message::new();
        msg.set_terminal_action(TerminalAction {
            union: Some(terminal_action::Union::Close(CloseTerminal {
                terminal_id: s.terminal_id,
                ..Default::default()
            })),
            ..Default::default()
        });
        s.cmd_tx.send(msg).is_ok()
    }).await;

    if close_sent.is_none() {
        return McpToolResult::error_text("Session not found");
    }

    // Give the stream task a moment to process the close
    tokio::time::sleep(Duration::from_millis(100)).await;

    mgr.remove(&session_id).await;

    McpToolResult::text(serde_json::json!({
        "session_id": session_id,
        "status": "closed"
    }).to_string())
}

/// Get information about a remote peer.
pub async fn get_peer_info(args: Value, _mgr: &SessionManager) -> McpToolResult {
    let peer_id = match get_str(&args, "peer_id") {
        Ok(v) => v,
        Err(e) => return e,
    };
    let password = match get_str(&args, "password") {
        Ok(v) => v,
        Err(e) => return e,
    };

    log::info!("MCP: get_peer_info peer_id={}", peer_id);

    let authed = match connect_and_auth(&peer_id, &password, ConnType::TERMINAL).await {
        Ok(a) => a,
        Err(e) => return McpToolResult::error_text(format!("Connection failed: {}", e)),
    };

    // Extract peer info from the login config handler
    let lc = authed.bridge.get_lch();
    let lc_read = lc.read().unwrap();
    let hostname = lc_read.info.hostname.clone();
    let username = lc_read.info.username.clone();
    let platform = lc_read.info.platform.clone();
    let version = lc_read.version;
    drop(lc_read);

    McpToolResult::text(serde_json::json!({
        "peer_id": peer_id,
        "hostname": hostname,
        "username": username,
        "platform": platform,
        "version": version,
        "status": "ok"
    }).to_string())
}
