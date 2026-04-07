// main window right pane

import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_hbb/consts.dart';
import 'package:flutter_hbb/desktop/widgets/popup_menu.dart';
import 'package:flutter_hbb/models/state_model.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:window_manager/window_manager.dart';
import 'package:flutter_hbb/models/peer_model.dart';

import '../../common.dart';
import '../../common/formatter/id_formatter.dart';
import '../../common/widgets/peer_tab_page.dart';
import '../../common/widgets/autocomplete.dart';
import '../../models/platform_model.dart';
import '../../desktop/widgets/material_mod_popup_menu.dart' as mod_menu;

class _RdeskPanelTheme {
  static const BorderRadius panelRadius = BorderRadius.all(Radius.circular(28));
  static const BorderRadius inputRadius = BorderRadius.all(Radius.circular(22));
  static const double pageHorizontalPadding = 28;
  static const double heroFieldHeight = 94;
  static const double connectButtonHeight = 72;
  static const double connectButtonWidth = 136;
  static const double moreButtonWidth = 64;
}

bool _isDarkWorkspace(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark;

Color _panelCardColor(BuildContext context) =>
    _isDarkWorkspace(context) ? const Color(0xFF262A31) : Colors.white;

Color _panelBorderColor(BuildContext context) =>
    _isDarkWorkspace(context) ? const Color(0xFF394150) : MyTheme.border;

Color _panelInputShadow(BuildContext context) =>
    _isDarkWorkspace(context) ? const Color(0x22000000) : const Color(0x0F0F172A);

Color _panelOutlineButtonBorder(BuildContext context) =>
    _isDarkWorkspace(context) ? const Color(0xFF4B5563) : const Color(0xFFB9D4FF);

Color _panelOutlineButtonShadow(BuildContext context) =>
    _isDarkWorkspace(context) ? const Color(0x14000000) : const Color(0x0A2563EB);

class _RdeskWorkspaceFooterSpec {
  final Color dotColor;
  final String message;

  const _RdeskWorkspaceFooterSpec({
    required this.dotColor,
    required this.message,
  });
}

class OnlineStatusWidget extends StatefulWidget {
  const OnlineStatusWidget({Key? key, this.onSvcStatusChanged})
      : super(key: key);

  final VoidCallback? onSvcStatusChanged;

  @override
  State<OnlineStatusWidget> createState() => _OnlineStatusWidgetState();
}

/// State for the connection page.
class _OnlineStatusWidgetState extends State<OnlineStatusWidget> {
  final _svcStopped = Get.find<RxBool>(tag: 'stop-service');
  final _svcIsUsingPublicServer = true.obs;
  Timer? _updateTimer;

  double get em => 14.0;
  double? get height => bind.isIncomingOnly() ? null : em * 3;

  void onUsePublicServerGuide() {
    const url = "https://rustdesk.com/pricing";
    canLaunchUrlString(url).then((can) {
      if (can) {
        launchUrlString(url);
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _updateTimer = periodic_immediate(Duration(seconds: 1), () async {
      updateStatus();
    });
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isIncomingOnly = bind.isIncomingOnly();
    startServiceWidget() => Offstage(
          offstage: !_svcStopped.value,
          child: InkWell(
                  onTap: () async {
                    await start_service(true);
                  },
                  child: Text(translate("Start service"),
                      style: TextStyle(
                          decoration: TextDecoration.underline, fontSize: em)))
              .marginOnly(left: em),
        );

    setupServerWidget() => Flexible(
          child: Offstage(
            offstage: !(!_svcStopped.value &&
                stateGlobal.svcStatus.value == SvcStatus.ready &&
                _svcIsUsingPublicServer.value),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(', ', style: TextStyle(fontSize: em)),
                Flexible(
                  child: InkWell(
                    onTap: onUsePublicServerGuide,
                    child: Row(
                      children: [
                        Flexible(
                          child: Text(
                            translate('setup_server_tip'),
                            style: TextStyle(
                                decoration: TextDecoration.underline,
                                fontSize: em),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              ],
            ),
          ),
        );

    basicWidget() => Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              height: 8,
              width: 8,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: _svcStopped.value ||
                        stateGlobal.svcStatus.value == SvcStatus.connecting
                    ? kColorWarn
                    : (stateGlobal.svcStatus.value == SvcStatus.ready
                        ? Color.fromARGB(255, 50, 190, 166)
                        : Color.fromARGB(255, 224, 79, 95)),
              ),
            ).marginSymmetric(horizontal: em),
            Container(
              width: isIncomingOnly ? 226 : null,
              child: _buildConnStatusMsg(),
            ),
            // stop
            if (!isIncomingOnly) startServiceWidget(),
          ],
        );

    return Container(
      height: height,
      child: Obx(() => isIncomingOnly
          ? Column(
              children: [
                basicWidget(),
                Align(
                        child: startServiceWidget(),
                        alignment: Alignment.centerLeft)
                    .marginOnly(top: 2.0, left: 22.0),
              ],
            )
          : basicWidget()),
    ).paddingOnly(right: isIncomingOnly ? 8 : 0);
  }

  _buildConnStatusMsg() {
    widget.onSvcStatusChanged?.call();
    return Text(
      _svcStopped.value
          ? translate("Service is not running")
          : stateGlobal.svcStatus.value == SvcStatus.connecting
              ? translate("connecting_status")
              : stateGlobal.svcStatus.value == SvcStatus.notReady
                  ? translate("not_ready_status")
                  : translate('Ready'),
      style: TextStyle(fontSize: em),
    );
  }

  updateStatus() async {
    final status =
        jsonDecode(await bind.mainGetConnectStatus()) as Map<String, dynamic>;
    final statusNum = status['status_num'] as int;
    if (statusNum == 0) {
      stateGlobal.svcStatus.value = SvcStatus.connecting;
    } else if (statusNum == -1) {
      stateGlobal.svcStatus.value = SvcStatus.notReady;
    } else if (statusNum == 1) {
      stateGlobal.svcStatus.value = SvcStatus.ready;
    } else {
      stateGlobal.svcStatus.value = SvcStatus.notReady;
    }
    _svcIsUsingPublicServer.value = await bind.mainIsUsingPublicServer();
    try {
      stateGlobal.videoConnCount.value = status['video_conn_count'] as int;
    } catch (_) {}
  }
}

/// Connection page for connecting to a remote peer.
class ConnectionPage extends StatefulWidget {
  const ConnectionPage({Key? key}) : super(key: key);

  @override
  State<ConnectionPage> createState() => _ConnectionPageState();
}

/// State for the connection page.
class _ConnectionPageState extends State<ConnectionPage>
    with SingleTickerProviderStateMixin, WindowListener {
  /// Controller for the id input bar.
  final _idController = IDTextEditingController();

  final RxBool _idInputFocused = false.obs;
  final FocusNode _idFocusNode = FocusNode();
  final TextEditingController _idEditingController = TextEditingController();

  String selectedConnectionType = 'Connect';

  bool isWindowMinimized = false;

  final AllPeersLoader _allPeersLoader = AllPeersLoader();

  // https://github.com/flutter/flutter/issues/157244
  Iterable<Peer> _autocompleteOpts = [];

  final _menuOpen = false.obs;

  @override
  void initState() {
    super.initState();
    _allPeersLoader.init(setState);
    _idFocusNode.addListener(onFocusChanged);
    if (_idController.text.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        final lastRemoteId = await bind.mainGetLastRemoteId();
        if (lastRemoteId != _idController.id) {
          setState(() {
            _idController.id = lastRemoteId;
          });
        }
      });
    }
    Get.put<TextEditingController>(_idEditingController);
    Get.put<IDTextEditingController>(_idController);
    windowManager.addListener(this);
  }

  @override
  void dispose() {
    _idController.dispose();
    windowManager.removeListener(this);
    _allPeersLoader.clear();
    _idFocusNode.removeListener(onFocusChanged);
    _idFocusNode.dispose();
    _idEditingController.dispose();
    if (Get.isRegistered<IDTextEditingController>()) {
      Get.delete<IDTextEditingController>();
    }
    if (Get.isRegistered<TextEditingController>()) {
      Get.delete<TextEditingController>();
    }
    super.dispose();
  }

  @override
  void onWindowEvent(String eventName) {
    super.onWindowEvent(eventName);
    if (eventName == 'minimize') {
      isWindowMinimized = true;
    } else if (eventName == 'maximize' || eventName == 'restore') {
      if (isWindowMinimized && isWindows) {
        // windows can't update when minimized.
        Get.forceAppUpdate();
      }
      isWindowMinimized = false;
    }
  }

  @override
  void onWindowEnterFullScreen() {
    // Remove edge border by setting the value to zero.
    stateGlobal.resizeEdgeSize.value = 0;
  }

  @override
  void onWindowLeaveFullScreen() {
    // Restore edge border to default edge size.
    stateGlobal.resizeEdgeSize.value = stateGlobal.isMaximized.isTrue
        ? kMaximizeEdgeSize
        : windowResizeEdgeSize;
  }

  @override
  void onWindowClose() {
    super.onWindowClose();
    bind.mainOnMainWindowClose();
  }

  void onFocusChanged() {
    _idInputFocused.value = _idFocusNode.hasFocus;
    if (_idFocusNode.hasFocus) {
      if (_allPeersLoader.needLoad) {
        _allPeersLoader.getAllPeers();
      }

      final textLength = _idEditingController.value.text.length;
      // Select all to facilitate removing text, just following the behavior of address input of chrome.
      _idEditingController.selection =
          TextSelection(baseOffset: 0, extentOffset: textLength);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOutgoingOnly = bind.isOutgoingOnly();
    const footerSpec = _RdeskWorkspaceFooterSpec(
      dotColor: MyTheme.statusReady,
      message: 'Rdesk 网络连接稳定，请到端加密已开启',
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        _RdeskPanelTheme.pageHorizontalPadding,
        18,
        _RdeskPanelTheme.pageHorizontalPadding,
        12,
      ),
      child: Column(
        children: [
          _buildRemoteIDTextField(context),
          const SizedBox(height: 18),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: _panelCardColor(context),
                borderRadius: _RdeskPanelTheme.panelRadius,
                border: Border.all(color: _panelBorderColor(context)),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                child: Column(
                  children: [
                    const Expanded(child: PeerTabPage()),
                    const SizedBox(height: 14),
                    _buildWorkspaceFooter(context, footerSpec),
                  ],
                ),
              ),
            ),
          ),
          if (!isOutgoingOnly) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.only(left: 8),
              child: OnlineStatusWidget(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWorkspaceFooter(
    BuildContext context,
    _RdeskWorkspaceFooterSpec spec,
  ) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: spec.dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            spec.message,
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  /// Callback for the connect button.
  /// Connects to the selected peer.
  void onConnect(
      {bool isFileTransfer = false,
      bool isViewCamera = false,
      bool isTerminal = false,
      bool isTcpTunneling = false}) {
    var id = _idController.id;
    connect(context, id,
        isFileTransfer: isFileTransfer,
        isViewCamera: isViewCamera,
        isTerminal: isTerminal,
        isTcpTunneling: isTcpTunneling);
  }

  /// UI for the remote ID TextField.
  /// Search for a peer.
  Widget _buildRemoteIDTextField(BuildContext context) {
    final isFocused = _idInputFocused;
    final textColor = Theme.of(context).textTheme.titleLarge?.color;

    var w = Obx(() => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '远程控制中心',
                  style: TextStyle(
                    fontSize: 25,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
                const SizedBox(width: 8),
                Tooltip(
                  message: translate('id_input_tip'),
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Theme.of(context).dividerColor.withOpacity(0.08),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.help_outline_rounded,
                      size: 14,
                      color: textColor?.withOpacity(0.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: _RdeskPanelTheme.heroFieldHeight,
                    decoration: BoxDecoration(
                      color: _panelCardColor(context),
                      borderRadius: _RdeskPanelTheme.inputRadius,
                      border: Border.all(
                        color: isFocused.value
                            ? MyTheme.accent50
                            : _panelBorderColor(context),
                        width: isFocused.value ? 1.5 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: _panelInputShadow(context),
                          blurRadius: 18,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: RawAutocomplete<Peer>(
                     optionsBuilder: (TextEditingValue textEditingValue) {
                       if (textEditingValue.text == '') {
                         _autocompleteOpts = const Iterable<Peer>.empty();
                      } else if (_allPeersLoader.peers.isEmpty &&
                          !_allPeersLoader.isPeersLoaded) {
                        Peer emptyPeer = Peer(
                          id: '',
                          username: '',
                          hostname: '',
                          alias: '',
                          platform: '',
                          tags: [],
                          hash: '',
                          password: '',
                          forceAlwaysRelay: false,
                          rdpPort: '',
                          rdpUsername: '',
                          loginName: '',
                          device_group_name: '',
                          note: '',
                        );
                        _autocompleteOpts = [emptyPeer];
                      } else {
                        String textWithoutSpaces =
                            textEditingValue.text.replaceAll(" ", "");
                        if (int.tryParse(textWithoutSpaces) != null) {
                          textEditingValue = TextEditingValue(
                            text: textWithoutSpaces,
                            selection: textEditingValue.selection,
                          );
                        }
                        String textToFind = textEditingValue.text.toLowerCase();
                        _autocompleteOpts = _allPeersLoader.peers
                            .where((peer) =>
                                peer.id.toLowerCase().contains(textToFind) ||
                                peer.username
                                    .toLowerCase()
                                    .contains(textToFind) ||
                                peer.hostname
                                    .toLowerCase()
                                    .contains(textToFind) ||
                                peer.alias.toLowerCase().contains(textToFind))
                            .toList();
                      }
                      return _autocompleteOpts;
                    },
                    focusNode: _idFocusNode,
                    textEditingController: _idEditingController,
                     fieldViewBuilder: (
                       BuildContext context,
                       TextEditingController fieldTextEditingController,
                      FocusNode fieldFocusNode,
                      VoidCallback onFieldSubmitted,
                    ) {
                       updateTextAndPreserveSelection(
                           fieldTextEditingController, _idController.text);
                       return TextField(
                            autocorrect: false,
                            enableSuggestions: false,
                            keyboardType: TextInputType.visiblePassword,
                            focusNode: fieldFocusNode,
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 6.2,
                              height: 1.2,
                            ),
                            maxLines: 1,
                            cursorColor: MyTheme.accent,
                            decoration: InputDecoration(
                                filled: false,
                                counterText: '',
                                hintText: isFocused.value
                                    ? null
                                    : '输入远程设备 ID...',
                                hintStyle: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w400,
                                  letterSpacing: 0,
                                  color: textColor?.withOpacity(0.3)
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 30, vertical: 24),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                            ),
                            controller: fieldTextEditingController,
                            inputFormatters: [IDTextInputFormatter()],
                            onChanged: (v) {
                              _idController.id = v;
                            },
                            onSubmitted: (_) {
                              onConnect();
                            },
                          ).workaroundFreezeLinuxMint();
                    },
                    onSelected: (option) {
                      setState(() {
                        _idController.id = option.id;
                        FocusScope.of(context).unfocus();
                      });
                    },
                    optionsViewBuilder: (BuildContext context,
                        AutocompleteOnSelected<Peer> onSelected,
                        Iterable<Peer> options) {
                      options = _autocompleteOpts;
                      double maxHeight = options.length * 60;
                      if (options.length == 1) {
                        maxHeight = 62;
                      } else if (options.length == 3) {
                        maxHeight = 176;
                      } else if (options.length == 4) {
                        maxHeight = 233;
                      }
                      maxHeight = maxHeight.clamp(0, 250);

                       return Align(
                         alignment: Alignment.topLeft,
                         child: Container(
                             decoration: BoxDecoration(
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.12),
                                  blurRadius: 24,
                                  spreadRadius: 2,
                                  offset: Offset(0, 12),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Material(
                                  elevation: 0,
                                  child: ConstrainedBox(
                                    constraints: BoxConstraints(
                                      maxHeight: maxHeight,
                                      maxWidth: 640,
                                    ),
                                    child: _allPeersLoader.peers.isEmpty &&
                                            !_allPeersLoader.isPeersLoaded
                                        ? Container(
                                            height: 80,
                                            child: Center(
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                              ),
                                            ))
                                        : Padding(
                                            padding:
                                                const EdgeInsets.only(top: 8, bottom: 8),
                                            child: ListView(
                                              padding: EdgeInsets.zero,
                                              children: options
                                                  .map((peer) =>
                                                      AutocompletePeerTile(
                                                          onSelect: () =>
                                                              onSelected(peer),
                                                          peer: peer))
                                                  .toList(),
                                            ),
                                          ),
                                  ),
                                ))),
                      );
                    },
                  ),
                ),
                ),
                const SizedBox(width: 16),
                Container(
                  width: _RdeskPanelTheme.connectButtonWidth,
                  height: _RdeskPanelTheme.connectButtonHeight,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                     BoxShadow(
                       color: MyTheme.accent50,
                       blurRadius: 22,
                       offset: const Offset(0, 10),
                     ),
                   ],
                 ),
                  child: ElevatedButton(
                   style: ElevatedButton.styleFrom(
                     backgroundColor: const Color(0xFF3367E9),
                     foregroundColor: Colors.white,
                     shape: RoundedRectangleBorder(
                       borderRadius: BorderRadius.circular(18),
                     ),
                     elevation: 0,
                     textStyle: const TextStyle(
                       fontSize: 18,
                       fontWeight: FontWeight.bold,
                       letterSpacing: 0.5,
                     ),
                   ),
                   onPressed: onConnect,
                    child: const Text('连接'),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  height: _RdeskPanelTheme.connectButtonHeight,
                  width: _RdeskPanelTheme.moreButtonWidth,
                  decoration: BoxDecoration(
                    color: _panelCardColor(context),
                    border: Border.all(color: _panelOutlineButtonBorder(context), width: 1.2),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: _panelOutlineButtonShadow(context),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                   ],
                 ),
                child: Center(
                  child: StatefulBuilder(
                    builder: (context, setState) {
                       var offset = Offset(0, 0);
                       return Obx(() => InkWell(
                             borderRadius: BorderRadius.circular(18),
                             child: _menuOpen.value
                                 ? Transform.rotate(
                                      angle: pi,
                                      child: const Icon(Icons.keyboard_arrow_down_rounded, size: 28, color: Color(0xFF3367E9)),
                                    )
                                 : const Icon(Icons.keyboard_arrow_down_rounded, size: 28, color: Color(0xFF3367E9)),
                             onTapDown: (e) {
                               offset = e.globalPosition;
                             },
                            onTap: () async {
                              _menuOpen.value = true;
                              final x = offset.dx;
                              final y = offset.dy;
                              await mod_menu.showMenu(
                                context: context,
                                position: RelativeRect.fromLTRB(x, y, x, y),
                                items: [
                                  (
                                    'Transfer file',
                                    () => onConnect(isFileTransfer: true)
                                  ),
                                  (
                                    'View camera',
                                    () => onConnect(isViewCamera: true)
                                  ),
                                  (
                                    '${translate('Terminal')} (beta)',
                                    () => onConnect(isTerminal: true)
                                  ),
                                  (
                                    'TCP tunneling',
                                    () => onConnect(isTcpTunneling: true)
                                  ),
                                ].map((e) => MenuEntryButton<String>(
                                          childBuilder: (TextStyle? style) =>
                                              Text(
                                            translate(e.$1),
                                            style: style,
                                          ),
                                          proc: () => e.$2(),
                                          padding: EdgeInsets.symmetric(
                                              horizontal:
                                                  kDesktopMenuPadding.left),
                                          dismissOnClicked: true,
                                        ))
                                    .map((e) => e.build(
                                        context,
                                        const MenuConfig(
                                            commonColor: CustomPopupMenuTheme
                                                .commonColor,
                                            height: 48, 
                                            dividerHeight:
                                                CustomPopupMenuTheme
                                                    .dividerHeight)))
                                    .expand((i) => i)
                                    .toList(),
                                elevation: 8,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)
                                ),
                              ).then((_) {
                                _menuOpen.value = false;
                              });
                            },
                          ));
                    },
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    return Container(alignment: Alignment.centerLeft, child: w);
  }
}
