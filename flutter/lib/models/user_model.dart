import 'dart:async';
import 'dart:convert';

import 'package:bot_toast/bot_toast.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hbb/common/hbbs/hbbs.dart';
import 'package:flutter_hbb/models/ab_model.dart';
import 'package:get/get.dart';

import '../common.dart';
import '../common/widgets/dialog.dart';
import '../utils/http_service.dart' as http;
import 'model.dart';
import 'platform_model.dart';

bool refreshingUser = false;

class UserModel {
  final RxString userName = ''.obs;
  final RxBool isAdmin = false.obs;
  final RxString networkError = ''.obs;
  final RxString membershipPlanName = ''.obs;
  final RxString membershipStatus = ''.obs;
  final RxString membershipExpiresAt = ''.obs;
  final RxInt membershipDaysLeft = 0.obs;
  final RxBool membershipActive = false.obs;
  final RxMap<String, dynamic> membershipFeatures = <String, dynamic>{}.obs;
  Timer? _membershipRefreshTimer;
  bool get isLogin => userName.isNotEmpty;

  List<String> get enabledMembershipFeatureLabels {
    if (!membershipActive.value) return const [];
    const labels = {
      'ai': 'AI 助手',
      'high_fps': '游戏增强 / 高帧率',
      'recording': '录屏',
      'address_book_pro': '地址簿高级功能',
    };
    return membershipFeatures.entries
        .where((e) => e.value == true)
        .map((e) => labels[e.key] ?? e.key)
        .toList();
  }

  String get membershipSummary {
    if (membershipPlanName.value.isEmpty) return '当前账号未开通会员';
    final state = membershipActive.value ? '已开通' : '已过期';
    final expires = membershipExpiresAt.value.isEmpty
        ? ''
        : '\n到期时间：${membershipExpiresAt.value}';
    final days = membershipPlanName.value.isEmpty
        ? ''
        : '\n剩余天数：${membershipDaysLeft.value}';
    return '当前套餐：${membershipPlanName.value} ($state)$expires$days';
  }

  bool hasMembershipFeature(String key) {
    if (!membershipActive.value) return false;
    return membershipFeatures[key] == true;
  }

  Future<bool> ensureMembershipFeature(String key) async {
    if (hasMembershipFeature(key)) return true;
    await Future<void>.delayed(Duration.zero);
    await refreshCurrentUser();
    return hasMembershipFeature(key);
  }

  void showMembershipRequiredDialog(String capability) {
    showToast('$capability 需要开通会员后使用。\n$membershipSummary');
  }
  WeakReference<FFI> parent;

  UserModel(this.parent) {
    userName.listen((p0) {
      // When user name becomes empty, show login button
      // When user name becomes non-empty:
      //  For _updateLocalUserInfo, network error will be set later
      //  For login success, should clear network error
      networkError.value = '';
      if (p0.isEmpty) {
        _stopMembershipRefreshTimer();
      } else {
        _startMembershipRefreshTimer();
      }
    });
  }

  void _startMembershipRefreshTimer() {
    _membershipRefreshTimer ??=
        Timer.periodic(const Duration(minutes: 1), (_) => refreshCurrentUser());
  }

  void _stopMembershipRefreshTimer() {
    _membershipRefreshTimer?.cancel();
    _membershipRefreshTimer = null;
  }

  static const _kAccessToken = 'access_token';
  static const _kRefreshToken = 'refresh_token';
  static const _kAccessTokenExpiresAt = 'access_token_expires_at';
  static const _kRefreshTokenExpiresAt = 'refresh_token_expires_at';
  static const kLoginUsername = 'login_username';
  static const kLoginPassword = 'login_password';
  static const kLoginRememberAccount = 'login_remember_account';
  static const kLoginRememberPassword = 'login_remember_password';
  static const kLoginAutoLogin = 'login_auto_login';

  static String getSavedUsername() =>
      bind.mainGetLocalOption(key: kLoginUsername);
  static String getSavedPassword() =>
      bind.mainGetLocalOption(key: kLoginPassword);
  static bool getRememberAccount() =>
      bind.mainGetLocalOption(key: kLoginRememberAccount) != 'N';
  static bool getRememberPassword() =>
      bind.mainGetLocalOption(key: kLoginRememberPassword) == 'Y';
  static bool getAutoLogin() =>
      bind.mainGetLocalOption(key: kLoginAutoLogin) == 'Y';

  static Future<void> saveLoginPreferences({
    required String username,
    required String password,
    required bool rememberAccount,
    required bool rememberPassword,
    required bool autoLogin,
  }) async {
    await bind.mainSetLocalOption(
        key: kLoginRememberAccount, value: rememberAccount ? 'Y' : 'N');
    await bind.mainSetLocalOption(
        key: kLoginRememberPassword, value: rememberPassword ? 'Y' : 'N');
    await bind.mainSetLocalOption(
        key: kLoginAutoLogin, value: autoLogin ? 'Y' : 'N');
    await bind.mainSetLocalOption(
        key: kLoginUsername, value: rememberAccount ? username : '');
    await bind.mainSetLocalOption(
        key: kLoginPassword, value: rememberPassword ? password : '');
  }

  Future<void> storeTokens(LoginResponse resp) async {
    if (resp.access_token != null) {
      await bind.mainSetLocalOption(key: _kAccessToken, value: resp.access_token!);
    }
    if (resp.refresh_token != null) {
      await bind.mainSetLocalOption(key: _kRefreshToken, value: resp.refresh_token!);
    }
    if (resp.expires_in != null) {
      final at = DateTime.now()
          .add(Duration(seconds: resp.expires_in!))
          .millisecondsSinceEpoch
          .toString();
      await bind.mainSetLocalOption(key: _kAccessTokenExpiresAt, value: at);
    }
    if (resp.refresh_expires_in != null) {
      final rt = DateTime.now()
          .add(Duration(seconds: resp.refresh_expires_in!))
          .millisecondsSinceEpoch
          .toString();
      await bind.mainSetLocalOption(key: _kRefreshTokenExpiresAt, value: rt);
    }
  }

  bool _willExpireSoon(String key, {Duration threshold = const Duration(minutes: 10)}) {
    final raw = bind.mainGetLocalOption(key: key);
    if (raw.isEmpty) return true;
    final millis = int.tryParse(raw);
    if (millis == null) return true;
    final expireAt = DateTime.fromMillisecondsSinceEpoch(millis);
    return DateTime.now().add(threshold).isAfter(expireAt);
  }

  Future<bool> tryRefreshToken() async {
    final refreshToken = bind.mainGetLocalOption(key: _kRefreshToken);
    if (refreshToken.isEmpty) return false;
    final refreshExpireAt = bind.mainGetLocalOption(key: _kRefreshTokenExpiresAt);
    if (refreshExpireAt.isNotEmpty && _willExpireSoon(_kRefreshTokenExpiresAt, threshold: Duration.zero)) {
      await reset(resetOther: true);
      return false;
    }
    try {
      final url = await bind.mainGetApiServer();
      final resp = await http.post(
        Uri.parse('$url/api/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'refresh_token': refreshToken,
          'id': await bind.mainGetMyId(),
          'uuid': await bind.mainGetUuid(),
        }),
      );
      if (resp.statusCode != 200) return false;
      final body = jsonDecode(decode_http_response(resp));
      if (body['error'] != null) return false;
      final loginResponse = LoginResponse.fromJson(Map<String, dynamic>.from(body));
      if (loginResponse.access_token == null || loginResponse.access_token!.isEmpty) {
        return false;
      }
      await storeTokens(loginResponse);
      return true;
    } catch (e) {
      debugPrint('Failed to refresh token: $e');
      return false;
    }
  }

  Future<void> refreshCurrentUser() async {
    if (bind.isDisableAccount()) return;
    networkError.value = '';
    if (_willExpireSoon(_kAccessToken)) {
      await tryRefreshToken();
    }
      final token = bind.mainGetLocalOption(key: _kAccessToken);
      if (token == '') {
        await updateOtherModels();
        return;
      }
    _updateLocalUserInfo();
    final url = await bind.mainGetApiServer();
    final body = {
      'id': await bind.mainGetMyId(),
      'uuid': await bind.mainGetUuid()
    };
    if (refreshingUser) return;
    try {
      refreshingUser = true;
      final http.Response response;
      try {
        response = await http.post(Uri.parse('$url/api/currentUser'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token'
            },
            body: json.encode(body));
      } catch (e) {
        networkError.value = e.toString();
        rethrow;
      }
      refreshingUser = false;
      final status = response.statusCode;
      if (status == 401 || status == 400) {
        final refreshed = await tryRefreshToken();
        if (!refreshed) {
          reset(resetOther: status == 401);
        }
        return;
      }
      final data = json.decode(decode_http_response(response));
      final error = data['error'];
      if (error != null) {
        throw error;
      }

      final user = UserPayload.fromJson(data);
      _parseAndUpdateUser(user);
    } catch (e) {
      debugPrint('Failed to refreshCurrentUser: $e');
    } finally {
      refreshingUser = false;
      await updateOtherModels();
    }
  }

  static Map<String, dynamic>? getLocalUserInfo() {
    final userInfo = bind.mainGetLocalOption(key: 'user_info');
    if (userInfo == '') {
      return null;
    }
    try {
      return json.decode(userInfo);
    } catch (e) {
      debugPrint('Failed to get local user info "$userInfo": $e');
    }
    return null;
  }

  _updateLocalUserInfo() {
    final userInfo = getLocalUserInfo();
    if (userInfo != null) {
      userName.value = userInfo['name'];
    }
  }

  Future<void> reset({bool resetOther = false}) async {
    await bind.mainSetLocalOption(key: _kAccessToken, value: '');
    await bind.mainSetLocalOption(key: _kRefreshToken, value: '');
    await bind.mainSetLocalOption(key: _kAccessTokenExpiresAt, value: '');
    await bind.mainSetLocalOption(key: _kRefreshTokenExpiresAt, value: '');
    await bind.mainSetLocalOption(key: 'user_info', value: '');
    if (resetOther) {
      await gFFI.abModel.reset();
      await gFFI.groupModel.reset();
    }
    userName.value = '';
    membershipPlanName.value = '';
    membershipStatus.value = '';
    membershipExpiresAt.value = '';
    membershipDaysLeft.value = 0;
    membershipActive.value = false;
    membershipFeatures.clear();
    _stopMembershipRefreshTimer();
  }

  _parseAndUpdateUser(UserPayload user) {
    userName.value = user.name;
    isAdmin.value = user.isAdmin;
    final membership = user.membership;
    membershipPlanName.value = membership?['plan_name']?.toString() ?? '';
    membershipStatus.value = membership?['status']?.toString() ?? '';
    membershipExpiresAt.value = membership?['expires_at']?.toString() ?? '';
    membershipDaysLeft.value = membership?['days_left'] is int
        ? membership!['days_left'] as int
        : int.tryParse(membership?['days_left']?.toString() ?? '0') ?? 0;
    membershipActive.value = membership?['is_active'] == true;
    membershipFeatures.value = membership?['features'] is Map<String, dynamic>
        ? Map<String, dynamic>.from(membership!['features'])
        : (membership?['features'] is Map
            ? Map<String, dynamic>.from(membership!['features'])
            : <String, dynamic>{});
    bind.mainSetLocalOption(key: 'user_info', value: jsonEncode(user));
    if (isWeb) {
      // ugly here, tmp solution
      bind.mainSetLocalOption(key: 'verifier', value: user.verifier ?? '');
    }
  }

  // update ab and group status
  static Future<void> updateOtherModels() async {
    await Future.wait([
      gFFI.abModel.pullAb(force: ForcePullAb.listAndCurrent, quiet: false),
      gFFI.groupModel.pull()
    ]);
  }

  Future<void> logOut({String? apiServer}) async {
    final tag = gFFI.dialogManager.showLoading(translate('Waiting'));
    try {
      final url = apiServer ?? await bind.mainGetApiServer();
      final authHeaders = getHttpHeaders();
      authHeaders['Content-Type'] = "application/json";
      await http
          .post(Uri.parse('$url/api/logout'),
              body: jsonEncode({
                'refresh_token': bind.mainGetLocalOption(key: _kRefreshToken),
                'id': await bind.mainGetMyId(),
                'uuid': await bind.mainGetUuid(),
              }),
              headers: authHeaders)
          .timeout(Duration(seconds: 2));
    } catch (e) {
      debugPrint("request /api/logout failed: err=$e");
    } finally {
      await reset(resetOther: true);
      gFFI.dialogManager.dismissByTag(tag);
    }
  }

  /// throw [RequestException]
  Future<LoginResponse> login(LoginRequest loginRequest) async {
    final url = await bind.mainGetApiServer();
    final resp = await http.post(Uri.parse('$url/api/login'),
        body: jsonEncode(loginRequest.toJson()));

    final Map<String, dynamic> body;
    try {
      body = jsonDecode(decode_http_response(resp));
    } catch (e) {
      debugPrint("login: jsonDecode resp body failed: ${e.toString()}");
      if (resp.statusCode != 200) {
        BotToast.showText(
            contentColor: Colors.red, text: 'HTTP ${resp.statusCode}');
      }
      rethrow;
    }
    if (resp.statusCode != 200) {
      throw RequestException(resp.statusCode, body['error'] ?? '');
    }
    if (body['error'] != null) {
      throw RequestException(0, body['error']);
    }

    return getLoginResponseFromAuthBody(body);
  }

  LoginResponse getLoginResponseFromAuthBody(Map<String, dynamic> body) {
    final LoginResponse loginResponse;
    try {
      loginResponse = LoginResponse.fromJson(body);
    } catch (e) {
      debugPrint("login: jsonDecode LoginResponse failed: ${e.toString()}");
      rethrow;
    }

    final isLogInDone = loginResponse.type == HttpType.kAuthResTypeToken &&
        loginResponse.access_token != null;
    if (isLogInDone && loginResponse.user != null) {
      _parseAndUpdateUser(loginResponse.user!);
      storeTokens(loginResponse);
      _startMembershipRefreshTimer();
    }

    return loginResponse;
  }

  static Future<List<dynamic>> queryOidcLoginOptions() async {
    try {
      final url = await bind.mainGetApiServer();
      if (url.trim().isEmpty) return [];
      final resp = await http.get(Uri.parse('$url/api/login-options'));
      final List<String> ops = [];
      for (final item in jsonDecode(resp.body)) {
        ops.add(item as String);
      }
      for (final item in ops) {
        if (item.startsWith('common-oidc/')) {
          return jsonDecode(item.substring('common-oidc/'.length));
        }
      }
      return ops
          .where((item) => item.startsWith('oidc/'))
          .map((item) => {'name': item.substring('oidc/'.length)})
          .toList();
    } catch (e) {
      debugPrint(
          "queryOidcLoginOptions: jsonDecode resp body failed: ${e.toString()}");
      return [];
    }
  }

  void dispose() {
    _stopMembershipRefreshTimer();
  }
}
