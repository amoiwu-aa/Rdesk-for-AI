import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hbb/common.dart';
import 'package:flutter_hbb/common/shared_state.dart';
import 'package:flutter_hbb/common/widgets/dialog.dart';
import 'package:flutter_hbb/common/widgets/login.dart';
import 'package:flutter_hbb/consts.dart';
import 'package:flutter_hbb/desktop/widgets/remote_toolbar.dart';
import 'package:flutter_hbb/models/model.dart';
import 'package:flutter_hbb/models/platform_model.dart';
import 'package:flutter_hbb/utils/multi_window_manager.dart';
import 'package:get/get.dart';

bool isEditOsPassword = false;

class TTextMenu {
  final Widget child;
  final VoidCallback? onPressed;
  Widget? trailingIcon;
  bool divider;
  TTextMenu(
      {required this.child,
      required this.onPressed,
      this.trailingIcon,
      this.divider = false});

  Widget getChild() {
    if (trailingIcon != null) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          child,
          trailingIcon!,
        ],
      );
    } else {
      return child;
    }
  }
}

class TRadioMenu<T> {
  final Widget child;
  final T value;
  final T groupValue;
  final ValueChanged<T?>? onChanged;

  TRadioMenu(
      {required this.child,
      required this.value,
      required this.groupValue,
      required this.onChanged});
}

class TToggleMenu {
  final Widget child;
  final bool value;
  final ValueChanged<bool?>? onChanged;
  TToggleMenu(
      {required this.child, required this.value, required this.onChanged});
}

handleOsPasswordEditIcon(
    SessionID sessionId, OverlayDialogManager dialogManager) {
  isEditOsPassword = true;
  showSetOSPassword(
      sessionId, false, dialogManager, null, () => isEditOsPassword = false);
}

handleOsPasswordAction(
    SessionID sessionId, OverlayDialogManager dialogManager) async {
  if (isEditOsPassword) {
    isEditOsPassword = false;
    return;
  }
  final password =
      await bind.sessionGetOption(sessionId: sessionId, arg: 'os-password') ??
          '';
  if (password.isEmpty) {
    showSetOSPassword(sessionId, true, dialogManager, password,
        () => isEditOsPassword = false);
  } else {
    bind.sessionInputOsPassword(sessionId: sessionId, value: password);
  }
}

List<TTextMenu> toolbarControls(BuildContext context, String id, FFI ffi) {
  final ffiModel = ffi.ffiModel;
  final pi = ffiModel.pi;
  final perms = ffiModel.permissions;
  final sessionId = ffi.sessionId;
  final isDefaultConn = ffi.connType == ConnType.defaultConn;

  List<TTextMenu> v = [];
  // elevation
  if (isDefaultConn &&
      perms['keyboard'] != false &&
      ffi.elevationModel.showRequestMenu) {
    v.add(
      TTextMenu(
          child: Text(translate('Request Elevation')),
          onPressed: () =>
              showRequestElevationDialog(sessionId, ffi.dialogManager)),
    );
  }
  // osAccount / osPassword
  if (isDefaultConn && perms['keyboard'] != false) {
    v.add(
      TTextMenu(
        child: Row(children: [
          Text(translate(pi.isHeadless ? 'OS Account' : 'OS Password')),
        ]),
        trailingIcon: Transform.scale(
          scale: (isDesktop || isWebDesktop) ? 0.8 : 1,
          child: IconButton(
            onPressed: () {
              if (isMobile && Navigator.canPop(context)) {
                Navigator.pop(context);
              }
              if (pi.isHeadless) {
                showSetOSAccount(sessionId, ffi.dialogManager);
              } else {
                handleOsPasswordEditIcon(sessionId, ffi.dialogManager);
              }
            },
            icon: Icon(Icons.edit, color: isMobile ? MyTheme.accent : null),
          ),
        ),
        onPressed: () => pi.isHeadless
            ? showSetOSAccount(sessionId, ffi.dialogManager)
            : handleOsPasswordAction(sessionId, ffi.dialogManager),
      ),
    );
  }
  // paste
  if (isDefaultConn &&
      pi.platform != kPeerPlatformAndroid &&
      perms['keyboard'] != false) {
    v.add(TTextMenu(
        child: Text(translate('Send clipboard keystrokes')),
        onPressed: () async {
          ClipboardData? data = await Clipboard.getData(Clipboard.kTextPlain);
          if (data != null && data.text != null) {
            bind.sessionInputString(
                sessionId: sessionId, value: data.text ?? "");
          }
        }));
  }
  // reset canvas
  if (isDefaultConn && isMobile) {
    v.add(TTextMenu(
        child: Text(translate('Reset canvas')),
        onPressed: () => ffi.cursorModel.reset()));
  }

  // https://github.com/rustdesk/rustdesk/pull/9731
  // Does not work for connection established by "accept".
  connectWithToken(
      {bool isFileTransfer = false,
      bool isViewCamera = false,
      bool isTcpTunneling = false,
      bool isTerminal = false}) {
    final connToken = bind.sessionGetConnToken(sessionId: ffi.sessionId);
    connect(context, id,
        isFileTransfer: isFileTransfer,
        isViewCamera: isViewCamera,
        isTerminal: isTerminal,
        isTcpTunneling: isTcpTunneling,
        connToken: connToken);
  }

  if (isDefaultConn && isDesktop) {
    v.add(
      TTextMenu(
          child: Text(translate('Transfer file')),
          onPressed: () => connectWithToken(isFileTransfer: true)),
    );
    v.add(
      TTextMenu(
          child: Text(translate('View camera')),
          onPressed: () => connectWithToken(isViewCamera: true)),
    );
    v.add(
      TTextMenu(
          child: Text('${translate('Terminal')} (beta)'),
          onPressed: () => connectWithToken(isTerminal: true)),
    );
    v.add(
      TTextMenu(
          child: Text(translate('TCP tunneling')),
          onPressed: () => connectWithToken(isTcpTunneling: true)),
    );
  }
  // note
  if (isDefaultConn && !bind.isDisableAccount()) {
    v.add(
      TTextMenu(
          child: Text(translate('Note')),
          onPressed: () async {
            bool isLogin =
                bind.mainGetLocalOption(key: 'access_token').isNotEmpty;
            if (!isLogin) {
              final res = await loginDialog();
              if (res != true) return;
              // Desktop: send message to main window to refresh login status
              // Web: login is required before connection, so no need to refresh
              // Mobile: same isolate, no need to send message
              if (isDesktop) {
                rustDeskWinManager.call(
                    WindowType.Main, kWindowRefreshCurrentUser, "");
              }
            }
            showAuditDialog(ffi);
          }),
    );
  }
  // divider
  if (isDefaultConn && (isDesktop || isWebDesktop)) {
    v.add(TTextMenu(child: Offstage(), onPressed: () {}, divider: true));
  }
  // ctrlAltDel
  if (isDefaultConn &&
      !ffiModel.viewOnly &&
      ffiModel.keyboard &&
      (pi.platform == kPeerPlatformLinux || pi.sasEnabled)) {
    v.add(
      TTextMenu(
          child: Text('${translate("Insert Ctrl + Alt + Del")}'),
          onPressed: () => bind.sessionCtrlAltDel(sessionId: sessionId)),
    );
  }
  // restart
  if (isDefaultConn &&
      perms['restart'] != false &&
      (pi.platform == kPeerPlatformLinux ||
          pi.platform == kPeerPlatformWindows ||
          pi.platform == kPeerPlatformMacOS)) {
    v.add(
      TTextMenu(
          child: Text(translate('Restart remote device')),
          onPressed: () =>
              showRestartRemoteDevice(pi, id, sessionId, ffi.dialogManager)),
    );
  }
  // insertLock
  if (isDefaultConn && !ffiModel.viewOnly && ffi.ffiModel.keyboard) {
    v.add(
      TTextMenu(
          child: Text(translate('Insert Lock')),
          onPressed: () => bind.sessionLockScreen(sessionId: sessionId)),
    );
  }
  // blockUserInput
  if (isDefaultConn &&
      ffi.ffiModel.keyboard &&
      ffi.ffiModel.permissions['block_input'] != false &&
      pi.platform == kPeerPlatformWindows) // privacy-mode != true ??
  {
    v.add(TTextMenu(
        child: Obx(() => Text(translate(
            '${BlockInputState.find(id).value ? 'Unb' : 'B'}lock user input'))),
        onPressed: () {
          RxBool blockInput = BlockInputState.find(id);
          bind.sessionToggleOption(
              sessionId: sessionId,
              value: '${blockInput.value ? 'un' : ''}block-input');
          blockInput.value = !blockInput.value;
        }));
  }
  // switchSides
  if (isDefaultConn &&
      isDesktop &&
      ffiModel.keyboard &&
      pi.platform != kPeerPlatformAndroid &&
      pi.platform != kPeerPlatformMacOS &&
      versionCmp(pi.version, '1.2.0') >= 0 &&
      bind.peerGetSessionsCount(id: id, connType: ffi.connType.index) == 1) {
    v.add(TTextMenu(
        child: Text(translate('Switch Sides')),
        onPressed: () =>
            showConfirmSwitchSidesDialog(sessionId, id, ffi.dialogManager)));
  }
  // refresh
  if (pi.version.isNotEmpty) {
    v.add(TTextMenu(
      child: Text(translate('Refresh')),
      onPressed: () => sessionRefreshVideo(sessionId, pi),
    ));
  }
  // record
  if (!(isDesktop || isWeb) &&
      (ffi.recordingModel.start || (perms["recording"] != false))) {
    v.add(TTextMenu(
        child: Row(
          children: [
            Text(translate(ffi.recordingModel.start
                ? 'Stop session recording'
                : 'Start session recording')),
            Padding(
              padding: EdgeInsets.only(left: 12),
              child: Icon(
                  ffi.recordingModel.start
                      ? Icons.pause_circle_filled
                      : Icons.videocam_outlined,
                  color: MyTheme.accent),
            )
          ],
        ),
        onPressed: () => ffi.recordingModel.toggle()));
  }

  // to-do:
  // 1. Web desktop
  // 2. Mobile, copy the image to the clipboard
  if (isDesktop) {
    final isScreenshotSupported = bind.sessionGetCommonSync(
        sessionId: sessionId, key: 'is_screenshot_supported', param: '');
    if ('true' == isScreenshotSupported) {
      v.add(TTextMenu(
        child: Text(ffi.ffiModel.timerScreenshot != null
            ? '${translate('Taking screenshot')} ...'
            : translate('Take screenshot')),
        onPressed: ffi.ffiModel.timerScreenshot != null
            ? null
            : () {
                if (pi.currentDisplay == kAllDisplayValue) {
                  msgBox(
                      sessionId,
                      'custom-nook-nocancel-hasclose-info',
                      'Take screenshot',
                      'screenshot-merged-screen-not-supported-tip',
                      '',
                      ffi.dialogManager);
                } else {
                  bind.sessionTakeScreenshot(
                      sessionId: sessionId, display: pi.currentDisplay);
                  ffi.ffiModel.timerScreenshot =
                      Timer(Duration(seconds: 30), () {
                    ffi.ffiModel.timerScreenshot = null;
                  });
                }
              },
      ));
    }
  }
  // fingerprint
  if (!(isDesktop || isWebDesktop)) {
    v.add(TTextMenu(
      child: Text(translate('Copy Fingerprint')),
      onPressed: () => onCopyFingerprint(FingerprintState.find(id).value),
    ));
  }
  return v;
}

Future<List<TRadioMenu<String>>> toolbarViewStyle(
    BuildContext context, String id, FFI ffi) async {
  final groupValue =
      await bind.sessionGetViewStyle(sessionId: ffi.sessionId) ?? '';
  void onChanged(String? value) async {
    if (value == null) return;
    bind
        .sessionSetViewStyle(sessionId: ffi.sessionId, value: value)
        .then((_) => ffi.canvasModel.updateViewStyle());
  }

  return [
    TRadioMenu<String>(
        child: Text(translate('Scale original')),
        value: kRemoteViewStyleOriginal,
        groupValue: groupValue,
        onChanged: onChanged),
    TRadioMenu<String>(
        child: Text(translate('Scale adaptive')),
        value: kRemoteViewStyleAdaptive,
        groupValue: groupValue,
        onChanged: onChanged),
    TRadioMenu<String>(
        child: Text(translate('Scale custom')),
        value: kRemoteViewStyleCustom,
        groupValue: groupValue,
        onChanged: onChanged)
  ];
}

Future<List<TRadioMenu<String>>> toolbarImageQuality(
    BuildContext context, String id, FFI ffi) async {
  final groupValue =
      await bind.sessionGetImageQuality(sessionId: ffi.sessionId) ?? '';
  onChanged(String? value) async {
    if (value == null) return;
    await bind.sessionSetImageQuality(sessionId: ffi.sessionId, value: value);
  }

  return [
    TRadioMenu<String>(
        child: Text(translate('Good image quality')),
        value: kRemoteImageQualityBest,
        groupValue: groupValue,
        onChanged: onChanged),
    TRadioMenu<String>(
        child: Text(translate('Balanced')),
        value: kRemoteImageQualityBalanced,
        groupValue: groupValue,
        onChanged: onChanged),
    TRadioMenu<String>(
        child: Text(translate('Optimize reaction time')),
        value: kRemoteImageQualityLow,
        groupValue: groupValue,
        onChanged: onChanged),
    TRadioMenu<String>(
      child: Text(translate('Custom')),
      value: kRemoteImageQualityCustom,
      groupValue: groupValue,
      onChanged: (value) {
        onChanged(value);
        customImageQualityDialog(ffi.sessionId, id, ffi);
      },
    ),
  ];
}

Future<List<TRadioMenu<String>>> toolbarCodec(
    BuildContext context, String id, FFI ffi) async {
  final sessionId = ffi.sessionId;
  final alternativeCodecs =
      await bind.sessionAlternativeCodecs(sessionId: sessionId);
  final groupValue = await bind.sessionGetOption(
          sessionId: sessionId, arg: kOptionCodecPreference) ??
      '';
  bool h264 = false;
  bool h265 = false;
  try {
    final Map codecsJson = jsonDecode(alternativeCodecs);
    h264 = codecsJson['h264'] ?? false;
    h265 = codecsJson['h265'] ?? false;
  } catch (e) {
    debugPrint("Show Codec Preference err=$e");
  }
  if (!h264 && !h265) return [];
  onChanged(String? value) async {
    if (value == null) return;
    await bind.sessionPeerOption(
        sessionId: sessionId, name: kOptionCodecPreference, value: value);
    bind.sessionChangePreferCodec(sessionId: sessionId);
  }

  TRadioMenu<String> radio(String label, String value, bool enabled) {
    return TRadioMenu<String>(
        child: Text(label),
        value: value,
        groupValue: groupValue,
        onChanged: enabled ? onChanged : null);
  }

  var autoLabel = translate('Auto');
  if (groupValue == 'auto' &&
      ffi.qualityMonitorModel.data.codecFormat != null) {
    autoLabel = '$autoLabel (${ffi.qualityMonitorModel.data.codecFormat})';
  }
  return [
    radio(autoLabel, 'auto', true),
    if (h264) radio('H264', 'h264', h264),
    if (h265) radio('H265', 'h265', h265),
  ];
}

Future<void> applyPerformanceMode(
    SessionID sessionId, String id, String mode) async {
  try {
    if (mode == kPerformanceModeGame || mode == kPerformanceModeGameH265 || mode == kPerformanceModeGameAV1) {
      final allowed = await gFFI.userModel.ensureMembershipFeature('high_fps');
      if (!allowed) {
        gFFI.userModel.showMembershipRequiredDialog('游戏增强模式');
        return;
      }
    }
    PerformanceModeState.find(id).value = mode;
    String quality;
    int fps;
    String codec;
    int? customImageQuality;

    switch (mode) {
      case kPerformanceModeMaintenance:
        quality = 'custom';
        fps = 5;
        codec = 'h264'; // Force H264 (CPU path needed for monochrome UV stripping)
        customImageQuality = 5;
        break;
      case kPerformanceModeOffice:
        quality = 'best';
        fps = 15;
        codec = 'scc';
        customImageQuality = null;
        break;
      case kPerformanceModeGame:
        quality = 'best';
        fps = 120;
        codec = 'h264';
        customImageQuality = null;
        if (isWindows) {
          final d3d = await bind.mainGetLocalOption(key: kOptionD3DRender);
          final texture = await bind.mainGetLocalOption(key: kOptionTextureRender);
          if (d3d != 'Y' || texture == 'N') {
            await bind.mainSetLocalOption(
                key: kOptionD3DRender, value: 'Y');
            await bind.mainSetLocalOption(
                key: kOptionTextureRender, value: 'Y');
          }
        }
        break;
      case kPerformanceModeGameH265:
        quality = 'best';
        fps = 120;
        codec = 'h265';
        customImageQuality = null;
        if (isWindows) {
          final d3d = await bind.mainGetLocalOption(key: kOptionD3DRender);
          final texture = await bind.mainGetLocalOption(key: kOptionTextureRender);
          if (d3d != 'Y' || texture == 'N') {
            await bind.mainSetLocalOption(
                key: kOptionD3DRender, value: 'Y');
            await bind.mainSetLocalOption(
                key: kOptionTextureRender, value: 'Y');
          }
        }
        break;
      case kPerformanceModeGameAV1:
        quality = 'best';
        fps = 120;
        codec = 'av1';
        customImageQuality = null;
        break;
      case kPerformanceModeStandard:
      default:
        quality = 'balanced';
        fps = 60;
        codec = 'auto';
        customImageQuality = null;
        break;
    }

    // Step 1: Set codec preference.
    await bind.sessionPeerOption(
        sessionId: sessionId, name: kOptionCodecPreference, value: codec);

    // Step 2: Send quality/fps settings.
    final futures = <Future>[
      bind.sessionSetImageQuality(sessionId: sessionId, value: quality),
      bind.sessionSetCustomFps(sessionId: sessionId, fps: fps),
    ];
    await Future.wait(futures);
    if (customImageQuality != null) {
      await bind.sessionSetCustomImageQuality(
          sessionId: sessionId, value: customImageQuality);
    }

    // Step 3: Update codec preference on server.
    await bind.sessionChangePreferCodec(sessionId: sessionId);

    // Step 4: Send performance-mode (triggers extreme-low-bandwidth + HOT_SWAP).
    await bind.sessionPeerOption(
        sessionId: sessionId, name: 'performance-mode', value: mode);

    // Step 5: Wait for server to complete codec switch, then force keyframe.
    await Future.delayed(const Duration(milliseconds: 300));
    await sessionRefreshVideo(sessionId, gFFI.ffiModel.pi);

    showToast(
        '${performanceModeLabel(mode)}: ${quality.toUpperCase()} / ${fps}fps / ${codec.toUpperCase()}');
  } catch (e, s) {
    debugPrint('[PerfMode] ERROR: $e\n$s');
    showToast('Performance mode error: $e');
  }
}

String performanceModeLabel(String mode) {
  switch (mode) {
    case kPerformanceModeMaintenance:
      return translate('Maintenance');
    case kPerformanceModeOffice:
      return '高清办公阅读模式';
    case kPerformanceModeGame:
      return 'Game (H.264)';
    case kPerformanceModeGameH265:
      return 'Game (H.265)';
    case kPerformanceModeGameAV1:
      return 'Game (AV1)';
    case kPerformanceModeStandard:
    default:
      return translate('Standard');
  }
}

Color performanceModeColor(String mode) {
  switch (mode) {
    case kPerformanceModeMaintenance:
      return Colors.deepPurple;
    case kPerformanceModeOffice:
      return MyTheme.statusInfo;
    case kPerformanceModeGame:
      return MyTheme.statusError;
    case kPerformanceModeGameH265:
      return Colors.deepOrange;
    case kPerformanceModeGameAV1:
      return Colors.teal;
    case kPerformanceModeStandard:
    default:
      return MyTheme.statusGray;
  }
}

Future<List<TToggleMenu>> toolbarCursor(
    BuildContext context, String id, FFI ffi) async {
  List<TToggleMenu> v = [];
  final ffiModel = ffi.ffiModel;
  final pi = ffiModel.pi;
  final sessionId = ffi.sessionId;

  // show remote cursor
  if (pi.platform != kPeerPlatformAndroid &&
      !ffi.canvasModel.cursorEmbedded &&
      !pi.isWayland) {
    final state = ShowRemoteCursorState.find(id);
    final lockState = ShowRemoteCursorLockState.find(id);
    final enabled = !ffiModel.viewOnly;
    final option = 'show-remote-cursor';
    if (pi.currentDisplay == kAllDisplayValue ||
        bind.sessionIsMultiUiSession(sessionId: sessionId)) {
      lockState.value = false;
    }
    v.add(TToggleMenu(
        child: Text(translate('Show remote cursor')),
        value: state.value,
        onChanged: enabled && !lockState.value
            ? (value) async {
                if (value == null) return;
                await bind.sessionToggleOption(
                    sessionId: sessionId, value: option);
                state.value = bind.sessionGetToggleOptionSync(
                    sessionId: sessionId, arg: option);
              }
            : null));
  }
  // follow remote cursor
  if (pi.platform != kPeerPlatformAndroid &&
      !ffi.canvasModel.cursorEmbedded &&
      !pi.isWayland &&
      versionCmp(pi.version, "1.2.4") >= 0 &&
      pi.displays.length > 1 &&
      pi.currentDisplay != kAllDisplayValue &&
      !bind.sessionIsMultiUiSession(sessionId: sessionId)) {
    final option = 'follow-remote-cursor';
    final value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    final showCursorOption = 'show-remote-cursor';
    final showCursorState = ShowRemoteCursorState.find(id);
    final showCursorLockState = ShowRemoteCursorLockState.find(id);
    final showCursorEnabled = bind.sessionGetToggleOptionSync(
        sessionId: sessionId, arg: showCursorOption);
    showCursorLockState.value = value;
    if (value && !showCursorEnabled) {
      await bind.sessionToggleOption(
          sessionId: sessionId, value: showCursorOption);
      showCursorState.value = bind.sessionGetToggleOptionSync(
          sessionId: sessionId, arg: showCursorOption);
    }
    v.add(TToggleMenu(
        child: Text(translate('Follow remote cursor')),
        value: value,
        onChanged: (value) async {
          if (value == null) return;
          await bind.sessionToggleOption(sessionId: sessionId, value: option);
          value = bind.sessionGetToggleOptionSync(
              sessionId: sessionId, arg: option);
          showCursorLockState.value = value;
          if (!showCursorEnabled) {
            await bind.sessionToggleOption(
                sessionId: sessionId, value: showCursorOption);
            showCursorState.value = bind.sessionGetToggleOptionSync(
                sessionId: sessionId, arg: showCursorOption);
          }
        }));
  }
  // follow remote window focus
  if (pi.platform != kPeerPlatformAndroid &&
      !ffi.canvasModel.cursorEmbedded &&
      !pi.isWayland &&
      versionCmp(pi.version, "1.2.4") >= 0 &&
      pi.displays.length > 1 &&
      pi.currentDisplay != kAllDisplayValue &&
      !bind.sessionIsMultiUiSession(sessionId: sessionId)) {
    final option = 'follow-remote-window';
    final value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    v.add(TToggleMenu(
        child: Text(translate('Follow remote window focus')),
        value: value,
        onChanged: (value) async {
          if (value == null) return;
          await bind.sessionToggleOption(sessionId: sessionId, value: option);
          value = bind.sessionGetToggleOptionSync(
              sessionId: sessionId, arg: option);
        }));
  }
  // zoom cursor
  final viewStyle = await bind.sessionGetViewStyle(sessionId: sessionId) ?? '';
  if (!isMobile &&
      pi.platform != kPeerPlatformAndroid &&
      viewStyle != kRemoteViewStyleOriginal) {
    final option = 'zoom-cursor';
    final peerState = PeerBoolOption.find(id, option);
    v.add(TToggleMenu(
      child: Text(translate('Zoom cursor')),
      value: peerState.value,
      onChanged: (value) async {
        if (value == null) return;
        await bind.sessionToggleOption(sessionId: sessionId, value: option);
        peerState.value =
            bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
      },
    ));
  }
  return v;
}

Future<List<TToggleMenu>> toolbarDisplayToggle(
    BuildContext context, String id, FFI ffi) async {
  List<TToggleMenu> v = [];
  final ffiModel = ffi.ffiModel;
  final pi = ffiModel.pi;
  final perms = ffiModel.permissions;
  final sessionId = ffi.sessionId;
  final isDefaultConn = ffi.connType == ConnType.defaultConn;

  // show quality monitor
  final option = 'show-quality-monitor';
  v.add(TToggleMenu(
      value: bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option),
      onChanged: (value) async {
        if (value == null) return;
        await bind.sessionToggleOption(sessionId: sessionId, value: option);
        ffi.qualityMonitorModel.checkShowQualityMonitor(sessionId);
      },
      child: Text(translate('Show quality monitor'))));
  // mute
  if (isDefaultConn && perms['audio'] != false) {
    final option = 'disable-audio';
    final value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    v.add(TToggleMenu(
        value: value,
        onChanged: (value) {
          if (value == null) return;
          bind.sessionToggleOption(sessionId: sessionId, value: option);
        },
        child: Text(translate('Mute'))));
  }
  // file copy and paste
  // If the version is less than 1.2.4, file copy and paste is supported on Windows only.
  final isSupportIfPeer_1_2_3 = versionCmp(pi.version, '1.2.4') < 0 &&
      isWindows &&
      pi.platform == kPeerPlatformWindows;
  // If the version is 1.2.4 or later, file copy and paste is supported when kPlatformAdditionsHasFileClipboard is set.
  final isSupportIfPeer_1_2_4 = versionCmp(pi.version, '1.2.4') >= 0 &&
      bind.mainHasFileClipboard() &&
      pi.platformAdditions.containsKey(kPlatformAdditionsHasFileClipboard);
  if (isDefaultConn &&
      ffiModel.keyboard &&
      perms['file'] != false &&
      (isSupportIfPeer_1_2_3 || isSupportIfPeer_1_2_4)) {
    final enabled = !ffiModel.viewOnly;
    final value = bind.sessionGetToggleOptionSync(
        sessionId: sessionId, arg: kOptionEnableFileCopyPaste);
    v.add(TToggleMenu(
        value: value,
        onChanged: enabled
            ? (value) {
                if (value == null) return;
                bind.sessionToggleOption(
                    sessionId: sessionId, value: kOptionEnableFileCopyPaste);
              }
            : null,
        child: Text(translate('Enable file copy and paste'))));
  }
  // disable clipboard
  if (isDefaultConn && ffiModel.keyboard && perms['clipboard'] != false) {
    final enabled = !ffiModel.viewOnly;
    final option = 'disable-clipboard';
    var value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    if (ffiModel.viewOnly) value = true;
    v.add(TToggleMenu(
        value: value,
        onChanged: enabled
            ? (value) {
                if (value == null) return;
                bind.sessionToggleOption(sessionId: sessionId, value: option);
              }
            : null,
        child: Text(translate('Disable clipboard'))));
  }
  // lock after session end
  if (isDefaultConn && ffiModel.keyboard && !ffiModel.isPeerAndroid) {
    final enabled = !ffiModel.viewOnly;
    final option = 'lock-after-session-end';
    final value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    v.add(TToggleMenu(
        value: value,
        onChanged: enabled
            ? (value) {
                if (value == null) return;
                bind.sessionToggleOption(sessionId: sessionId, value: option);
              }
            : null,
        child: Text(translate('Lock after session end'))));
  }

  if (pi.isSupportMultiDisplay &&
      PrivacyModeState.find(id).isEmpty &&
      pi.displaysCount.value > 1 &&
      bind.mainGetUserDefaultOption(key: kKeyShowMonitorsToolbar) == 'Y') {
    final value =
        bind.sessionGetDisplaysAsIndividualWindows(sessionId: ffi.sessionId) ==
            'Y';
    v.add(TToggleMenu(
        value: value,
        onChanged: (value) {
          if (value == null) return;
          bind.sessionSetDisplaysAsIndividualWindows(
              sessionId: sessionId, value: value ? 'Y' : 'N');
        },
        child: Text(translate('Show displays as individual windows'))));
  }

  final isMultiScreens = !isWeb && (await getScreenRectList()).length > 1;
  if (pi.isSupportMultiDisplay && isMultiScreens) {
    final value = bind.sessionGetUseAllMyDisplaysForTheRemoteSession(
            sessionId: ffi.sessionId) ==
        'Y';
    v.add(TToggleMenu(
        value: value,
        onChanged: (value) {
          if (value == null) return;
          bind.sessionSetUseAllMyDisplaysForTheRemoteSession(
              sessionId: sessionId, value: value ? 'Y' : 'N');
        },
        child: Text(translate('Use all my displays for the remote session'))));
  }

  // i444 not supported with H264/H265 only

  if (isDefaultConn && isMobile) {
    v.addAll(toolbarKeyboardToggles(ffi));
  }

  // view mode (mobile only, desktop is in keyboard menu)
  if (isDefaultConn && isMobile && versionCmp(pi.version, '1.2.0') >= 0) {
    v.add(TToggleMenu(
        value: ffiModel.viewOnly,
        onChanged: (value) async {
          if (value == null) return;
          await bind.sessionToggleOption(
              sessionId: ffi.sessionId, value: kOptionToggleViewOnly);
          ffiModel.setViewOnly(id, value);
        },
        child: Text(translate('View Mode'))));
  }
  return v;
}

var togglePrivacyModeTime = DateTime.now().subtract(const Duration(hours: 1));

List<TToggleMenu> toolbarPrivacyMode(
    RxString privacyModeState, BuildContext context, String id, FFI ffi) {
  final ffiModel = ffi.ffiModel;
  final pi = ffiModel.pi;
  final sessionId = ffi.sessionId;

  getDefaultMenu(Future<void> Function(SessionID sid, String opt) toggleFunc) {
    final enabled = !ffi.ffiModel.viewOnly;
    return TToggleMenu(
        value: privacyModeState.isNotEmpty,
        onChanged: enabled
            ? (value) {
                if (value == null) return;
                if (ffiModel.pi.currentDisplay != 0 &&
                    ffiModel.pi.currentDisplay != kAllDisplayValue) {
                  msgBox(
                      sessionId,
                      'custom-nook-nocancel-hasclose',
                      'info',
                      'Please switch to Display 1 first',
                      '',
                      ffi.dialogManager);
                  return;
                }
                final option = 'privacy-mode';
                toggleFunc(sessionId, option);
              }
            : null,
        child: Text(translate('Privacy mode')));
  }

  final privacyModeImpls =
      pi.platformAdditions[kPlatformAdditionsSupportedPrivacyModeImpl]
          as List<dynamic>?;
  if (privacyModeImpls == null) {
    return [
      getDefaultMenu((sid, opt) async {
        bind.sessionToggleOption(sessionId: sid, value: opt);
        togglePrivacyModeTime = DateTime.now();
      })
    ];
  }
  if (privacyModeImpls.isEmpty) {
    return [];
  }

  if (privacyModeImpls.length == 1) {
    final implKey = (privacyModeImpls[0] as List<dynamic>)[0] as String;
    return [
      getDefaultMenu((sid, opt) async {
        bind.sessionTogglePrivacyMode(
            sessionId: sid, implKey: implKey, on: privacyModeState.isEmpty);
        togglePrivacyModeTime = DateTime.now();
      })
    ];
  } else {
    return privacyModeImpls.map((e) {
      final implKey = (e as List<dynamic>)[0] as String;
      final implName = (e)[1] as String;
      return TToggleMenu(
          child: Text(translate(implName)),
          value: privacyModeState.value == implKey,
          onChanged: (value) {
            if (value == null) return;
            togglePrivacyModeTime = DateTime.now();
            bind.sessionTogglePrivacyMode(
                sessionId: sessionId, implKey: implKey, on: value);
          });
    }).toList();
  }
}

List<TToggleMenu> toolbarKeyboardToggles(FFI ffi) {
  final ffiModel = ffi.ffiModel;
  final pi = ffiModel.pi;
  final sessionId = ffi.sessionId;
  final isDefaultConn = ffi.connType == ConnType.defaultConn;
  List<TToggleMenu> v = [];

  // swap key
  if (ffiModel.keyboard &&
      ((isMacOS && pi.platform != kPeerPlatformMacOS) ||
          (!isMacOS && pi.platform == kPeerPlatformMacOS))) {
    final option = 'allow_swap_key';
    final value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    onChanged(bool? value) {
      if (value == null) return;
      bind.sessionToggleOption(sessionId: sessionId, value: option);
    }

    final enabled = !ffi.ffiModel.viewOnly;
    v.add(TToggleMenu(
        value: value,
        onChanged: enabled ? onChanged : null,
        child: Text(translate('Swap control-command key'))));
  }

  // Relative mouse mode (gaming mode).
  // Only show when server supports MOUSE_TYPE_MOVE_RELATIVE (version >= 1.4.5)
  // Note: This feature is only available in Flutter client. Sciter client does not support this.
  // Web client is not supported yet due to Pointer Lock API integration complexity with Flutter's input system.
  // Wayland is not supported due to cursor warping limitations.
  // Mobile: This option is now in GestureHelp widget, shown only when joystick is visible.
  final isWayland = isDesktop && isLinux && bind.mainCurrentIsWayland();
  if (isDesktop &&
      isDefaultConn &&
      !isWeb &&
      !isWayland &&
      ffiModel.keyboard &&
      !ffiModel.viewOnly &&
      ffi.inputModel.isRelativeMouseModeSupported) {
    v.add(TToggleMenu(
        value: ffi.inputModel.relativeMouseMode.value,
        onChanged: (value) {
          if (value == null) return;
          final previousValue = ffi.inputModel.relativeMouseMode.value;
          final success = ffi.inputModel.setRelativeMouseMode(value);
          if (!success) {
            // Revert the observable toggle to reflect the actual state
            ffi.inputModel.relativeMouseMode.value = previousValue;
          }
        },
        child: Text(translate('Relative mouse mode'))));
  }

  // reverse mouse wheel
  if (ffiModel.keyboard) {
    var optionValue =
        bind.sessionGetReverseMouseWheelSync(sessionId: sessionId) ?? '';
    if (optionValue == '') {
      optionValue = bind.mainGetUserDefaultOption(key: kKeyReverseMouseWheel);
    }
    onChanged(bool? value) async {
      if (value == null) return;
      await bind.sessionSetReverseMouseWheel(
          sessionId: sessionId, value: value ? 'Y' : 'N');
    }

    final enabled = !ffi.ffiModel.viewOnly;
    v.add(TToggleMenu(
        value: optionValue == 'Y',
        onChanged: enabled ? onChanged : null,
        child: Text(translate('Reverse mouse wheel'))));
  }

  // swap left right mouse
  if (ffiModel.keyboard) {
    final option = 'swap-left-right-mouse';
    final value =
        bind.sessionGetToggleOptionSync(sessionId: sessionId, arg: option);
    onChanged(bool? value) {
      if (value == null) return;
      bind.sessionToggleOption(sessionId: sessionId, value: option);
    }

    final enabled = !ffi.ffiModel.viewOnly;
    v.add(TToggleMenu(
        value: value,
        onChanged: enabled ? onChanged : null,
        child: Text(translate('swap-left-right-mouse'))));
  }
  return v;
}

bool showVirtualDisplayMenu(FFI ffi) {
  if (ffi.ffiModel.pi.platform != kPeerPlatformWindows) {
    return false;
  }
  if (!ffi.ffiModel.pi.isInstalled) {
    return false;
  }
  if (ffi.ffiModel.pi.isRDeskIdd || ffi.ffiModel.pi.isAmyuniIdd) {
    return true;
  }
  return false;
}

List<Widget> getVirtualDisplayMenuChildren(
    FFI ffi, String id, VoidCallback? clickCallBack) {
  if (!showVirtualDisplayMenu(ffi)) {
    return [];
  }
  final pi = ffi.ffiModel.pi;
  final privacyModeState = PrivacyModeState.find(id);
  if (pi.isRDeskIdd) {
    final virtualDisplays = ffi.ffiModel.pi.RDeskVirtualDisplays;
    final children = <Widget>[];
    for (var i = 0; i < kMaxVirtualDisplayCount; i++) {
      children.add(Obx(() => CkbMenuButton(
            value: virtualDisplays.contains(i + 1),
            onChanged: privacyModeState.isNotEmpty
                ? null
                : (bool? value) async {
                    if (value != null) {
                      bind.sessionToggleVirtualDisplay(
                          sessionId: ffi.sessionId, index: i + 1, on: value);
                      clickCallBack?.call();
                    }
                  },
            child: Text('${translate('Virtual display')} ${i + 1}'),
            ffi: ffi,
          )));
    }
    children.add(Divider());
    children.add(Obx(() => MenuButton(
          onPressed: privacyModeState.isNotEmpty
              ? null
              : () {
                  bind.sessionToggleVirtualDisplay(
                      sessionId: ffi.sessionId,
                      index: kAllVirtualDisplay,
                      on: false);
                  clickCallBack?.call();
                },
          ffi: ffi,
          child: Text(translate('Plug out all')),
        )));
    return children;
  }
  if (pi.isAmyuniIdd) {
    final count = ffi.ffiModel.pi.amyuniVirtualDisplayCount;
    final children = <Widget>[
      Obx(() => Row(
            children: [
              TextButton(
                onPressed: privacyModeState.isNotEmpty || count == 0
                    ? null
                    : () {
                        bind.sessionToggleVirtualDisplay(
                            sessionId: ffi.sessionId, index: 0, on: false);
                        clickCallBack?.call();
                      },
                child: Icon(Icons.remove),
              ),
              Text(count.toString()),
              TextButton(
                onPressed: privacyModeState.isNotEmpty || count == 4
                    ? null
                    : () {
                        bind.sessionToggleVirtualDisplay(
                            sessionId: ffi.sessionId, index: 0, on: true);
                        clickCallBack?.call();
                      },
                child: Icon(Icons.add),
              ),
            ],
          )),
      Divider(),
      Obx(() => MenuButton(
            onPressed: privacyModeState.isNotEmpty || count == 0
                ? null
                : () {
                    bind.sessionToggleVirtualDisplay(
                        sessionId: ffi.sessionId,
                        index: kAllVirtualDisplay,
                        on: false);
                    clickCallBack?.call();
                  },
            ffi: ffi,
            child: Text(translate('Plug out all')),
          )),
    ];
    return children;
  }
  return [];
}
