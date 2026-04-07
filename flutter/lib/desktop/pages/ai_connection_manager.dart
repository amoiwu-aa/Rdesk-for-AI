import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

import '../../models/model.dart';

class AiConnectionManager {
  static final Map<String, FFI> _connections = {};
  static final Map<String, int> _refCount = {};

  static FFI getConnection({
    required String peerId,
    required String? password,
    required bool? isSharedPassword,
    required bool? forceRelay,
    required String? connToken,
  }) {
    final existing = _connections[peerId];
    if (existing != null && !existing.closed) {
      _refCount[peerId] = (_refCount[peerId] ?? 0) + 1;
      return existing;
    }

    final ffi = FFI(null);
    ffi.start(
      peerId,
      password: password,
      isSharedPassword: isSharedPassword,
      forceRelay: forceRelay,
      connToken: connToken,
      isTerminal: true,
    );
    _connections[peerId] = ffi;
    _refCount[peerId] = 1;
    Get.put<FFI>(ffi, tag: 'ai_$peerId');
    debugPrint('[AiConnectionManager] New AI connection for $peerId');
    return ffi;
  }

  static void releaseConnection(String peerId) {
    final count = _refCount[peerId] ?? 0;
    if (count <= 1) {
      _connections[peerId]?.close();
      _connections.remove(peerId);
      _refCount.remove(peerId);
      if (Get.isRegistered<FFI>(tag: 'ai_$peerId')) {
        Get.delete<FFI>(tag: 'ai_$peerId');
      }
    } else {
      _refCount[peerId] = count - 1;
    }
  }
}
