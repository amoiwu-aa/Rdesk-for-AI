use hbb_common::config::{Config, LocalConfig, PeerConfig};

/// Get this device's ID.
/// On desktop, this communicates via IPC with the service process.
pub fn get_id() -> String {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        librustdesk::ipc::get_id()
    }
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        Config::get_id()
    }
}

/// Get an option value by key from the global config
pub fn get_option(key: &str) -> String {
    Config::get_option(key)
}

/// Set an option value in the global config
pub fn set_option(key: &str, value: &str) {
    Config::set_option(key.to_owned(), value.to_owned());
}

/// Get local option (stored in local config file)
pub fn get_local_option(key: &str) -> String {
    LocalConfig::get_option(key)
}

/// Set local option
pub fn set_local_option(key: &str, value: &str) {
    LocalConfig::set_option(key.to_owned(), value.to_owned());
}

/// Get RustDesk version
pub fn get_version() -> String {
    hbb_common::get_version_from_url("")
}

/// Get peer config as JSON
pub fn get_peer(id: &str) -> String {
    let c = PeerConfig::load(id);
    serde_json::to_string(&c).unwrap_or_default()
}

/// Check if peer has a saved password
pub fn peer_has_password(id: &str) -> bool {
    !PeerConfig::load(id).password.is_empty()
}

/// Get all options as JSON string
pub fn get_options() -> String {
    let options = Config::get_options();
    serde_json::to_string(&options).unwrap_or_default()
}

/// Set multiple options from JSON string
pub fn set_options(json: &str) {
    if let Ok(m) = serde_json::from_str::<std::collections::HashMap<String, String>>(json) {
        for (k, v) in m {
            Config::set_option(k, v);
        }
    }
}

/// Trigger LAN peer discovery
pub fn discover() {
    std::thread::spawn(move || {
        let _ = librustdesk::lan::discover();
    });
}

/// Get LAN peers as JSON
pub fn get_lan_peers() -> String {
    let peers = hbb_common::config::LanPeers::load().peers;
    serde_json::to_string(&peers).unwrap_or_default()
}
