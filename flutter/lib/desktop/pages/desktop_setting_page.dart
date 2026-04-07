import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart' as material;
import 'package:flutter/material.dart' hide Dialog;
import 'package:flutter/services.dart';
import 'package:flutter_hbb/common.dart';
import 'package:flutter_hbb/common/formatter/id_formatter.dart';
import 'package:flutter_hbb/common/widgets/audio_input.dart';
import 'package:flutter_hbb/common/widgets/setting_widgets.dart';
import 'package:flutter_hbb/consts.dart';
import 'package:flutter_hbb/desktop/pages/desktop_home_page.dart';
import 'package:flutter_hbb/desktop/pages/desktop_tab_page.dart';
import 'package:flutter_hbb/desktop/widgets/remote_toolbar.dart';
import 'package:flutter_hbb/desktop/widgets/tabbar_widget.dart';
import 'package:flutter_hbb/mobile/widgets/dialog.dart';
import 'package:flutter_hbb/models/platform_model.dart';
import 'package:flutter_hbb/models/printer_model.dart';
import 'package:flutter_hbb/models/server_model.dart';
import 'package:flutter_hbb/models/state_model.dart';
import 'package:flutter_hbb/models/ai_operator_model.dart';
import 'package:flutter_hbb/plugin/manager.dart';
import 'package:flutter_hbb/plugin/widgets/desktop_settings.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:url_launcher/url_launcher_string.dart';

import '../../common/widgets/dialog.dart';
import '../../common/widgets/login.dart';

bool _isDarkSurface(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark;

Color _settingsWorkspaceColor(BuildContext context) => _isDarkSurface(context)
    ? const Color(0xFF1C1F24)
    : MyTheme.grayBg;

Color _settingsCardColor(BuildContext context) =>
    _isDarkSurface(context) ? const Color(0xFF262A31) : Colors.white;

Color _settingsSubtleFill(BuildContext context) => _isDarkSurface(context)
    ? const Color(0xFF323844)
    : const Color(0xFFEFF6FF);

Color _settingsSelectedFill(BuildContext context) => _isDarkSurface(context)
    ? const Color(0xFF233047)
    : const Color(0xFFE8F1FF);

Color _settingsBorderColor(BuildContext context) => _isDarkSurface(context)
    ? const Color(0xFF394150)
    : MyTheme.border;

late BuildContext _settingsThemeContext;

const String _kMembershipUpgradeUrl = 'membership-upgrade-url';
const String _kMembershipSupportUrl = 'membership-support-url';
const String _kRdeskPrivacyUrl = 'rdesk-privacy-url';
const String _kRdeskWebsiteUrl = 'rdesk-website-url';
const String _kRdeskDeviceManageUrl = 'rdesk-device-manage-url';
const String _kDefaultRdeskPrivacyUrl = 'https://rdesk.com/privacy';
const String _kDefaultRdeskWebsiteUrl = 'https://rdesk.com';

const double _kTabWidth = 200;
const double _kTabHeight = 42;
const double _kCardFixedWidth = 540;
const double _kCardLeftMargin = 15;
const double _kContentHMargin = 15;
const double _kContentHSubMargin = _kContentHMargin + 33;
const double _kCheckBoxLeftMargin = 10;
const double _kRadioLeftMargin = 10;
const double _kListViewBottomMargin = 15;
const double _kTitleFontSize = 20;
const double _kContentFontSize = 15;
const Color _accentColor = MyTheme.accent;
const String _kSettingPageControllerTag = 'settingPageController';
const String _kSettingPageTabKeyTag = 'settingPageTabKey';
const double _kRdeskSidebarWidth = 324;
const double _kRdeskSidebarActionHeight = 46;
const double _kRdeskSectionRadius = 26;
const double _kRdeskRowMinHeight = 98;

enum _RdeskSettingsNavKey {
  general,
  safety,
  network,
  display,
  plugin,
  account,
  printer,
  about,
}

enum _RdeskSettingControlType {
  toggle,
  select,
  segmented,
  action,
  path,
  custom,
}

class _RdeskSettingsSectionSpec {
  final String title;
  final List<Widget> rows;

  const _RdeskSettingsSectionSpec({
    required this.title,
    required this.rows,
  });
}

class _RdeskSettingRowSpec {
  final String title;
  final String description;
  final _RdeskSettingControlType controlType;

  const _RdeskSettingRowSpec({
    required this.title,
    required this.description,
    required this.controlType,
  });
}

class _RdeskAccountSummaryData {
  final String displayName;
  final String email;
  final String idLabel;
  final String planLabel;
  final bool active;
  final int daysLeft;

  const _RdeskAccountSummaryData({
    required this.displayName,
    required this.email,
    required this.idLabel,
    required this.planLabel,
    required this.active,
    required this.daysLeft,
  });
}

class _RdeskAccountStatCardData {
  final String title;
  final String description;
  final String primaryValue;
  final String secondaryValue;

  const _RdeskAccountStatCardData({
    required this.title,
    required this.description,
    required this.primaryValue,
    required this.secondaryValue,
  });
}

class _RdeskDeviceInfo {
  final String name;
  final String platform;
  final IconData icon;
  final String lastActive;
  final bool isCurrent;
  final String id;

  const _RdeskDeviceInfo({
    required this.name,
    required this.platform,
    required this.icon,
    required this.lastActive,
    required this.isCurrent,
    required this.id,
  });
}

class _RdeskDisplayOptionData {
  final String title;
  final String description;
  final Widget trailing;

  const _RdeskDisplayOptionData({
    required this.title,
    required this.description,
    required this.trailing,
  });
}

class _RdeskNetworkActionRowData {
  final String title;
  final String description;
  final Widget trailing;

  const _RdeskNetworkActionRowData({
    required this.title,
    required this.description,
    required this.trailing,
  });
}

class _RdeskNetworkToggleRowData {
  final IconData icon;
  final Color accentColor;
  final String title;
  final String description;
  final bool value;

  const _RdeskNetworkToggleRowData({
    required this.icon,
    required this.accentColor,
    required this.title,
    required this.description,
    required this.value,
  });
}

class _TabInfo {
  late final SettingsTabKey key;
  late final String label;
  late final IconData unselected;
  late final IconData selected;
  _TabInfo(this.key, this.label, this.unselected, this.selected);
}

enum SettingsTabKey {
  general,
  ai,
  safety,
  network,
  display,
  plugin,
  account,
  printer,
  about,
}

class DesktopSettingPage extends StatefulWidget {
  final SettingsTabKey initialTabkey;
  static final List<SettingsTabKey> tabKeys = [
    SettingsTabKey.general,
    SettingsTabKey.ai,
    if (!isWeb &&
        !bind.isOutgoingOnly() &&
        !bind.isDisableSettings() &&
        bind.mainGetBuildinOption(key: kOptionHideSecuritySetting) != 'Y')
      SettingsTabKey.safety,
    if (!bind.isDisableSettings() &&
        bind.mainGetBuildinOption(key: kOptionHideNetworkSetting) != 'Y')
      SettingsTabKey.network,
    if (!bind.isIncomingOnly()) SettingsTabKey.display,
    if (!isWeb && !bind.isIncomingOnly() && bind.pluginFeatureIsEnabled())
      SettingsTabKey.plugin,
    if (!bind.isDisableAccount()) SettingsTabKey.account,
    if (isWindows &&
        bind.mainGetBuildinOption(key: kOptionHideRemotePrinterSetting) != 'Y')
      SettingsTabKey.printer,
    SettingsTabKey.about,
  ];

  DesktopSettingPage({Key? key, required this.initialTabkey}) : super(key: key);

  @override
  State<DesktopSettingPage> createState() =>
      _DesktopSettingPageState(initialTabkey);

  static void switch2page(SettingsTabKey page) {
    try {
      int index = tabKeys.indexOf(page);
      if (index == -1) {
        return;
      }
      if (Get.isRegistered<PageController>(tag: _kSettingPageControllerTag)) {
        DesktopTabPage.onAddSetting(initialPage: page);
        PageController controller =
            Get.find<PageController>(tag: _kSettingPageControllerTag);
        Rx<SettingsTabKey> selected =
            Get.find<Rx<SettingsTabKey>>(tag: _kSettingPageTabKeyTag);
        selected.value = page;
        controller.jumpToPage(index);
      } else {
        DesktopTabPage.onAddSetting(initialPage: page);
      }
    } catch (e) {
      debugPrintStack(label: '$e');
    }
  }
}

class _DesktopSettingPageState extends State<DesktopSettingPage>
    with
        TickerProviderStateMixin,
        AutomaticKeepAliveClientMixin,
        WidgetsBindingObserver {
  late PageController controller;
  late Rx<SettingsTabKey> selectedTab;

  @override
  bool get wantKeepAlive => true;

  final RxBool _block = false.obs;
  final RxBool _canBeBlocked = false.obs;
  Timer? _videoConnTimer;

  _DesktopSettingPageState(SettingsTabKey initialTabkey) {
    var initialIndex = DesktopSettingPage.tabKeys.indexOf(initialTabkey);
    if (initialIndex == -1) {
      initialIndex = 0;
    }
    selectedTab = DesktopSettingPage.tabKeys[initialIndex].obs;
    Get.put<Rx<SettingsTabKey>>(selectedTab, tag: _kSettingPageTabKeyTag);
    controller = PageController(initialPage: initialIndex);
    Get.put<PageController>(controller, tag: _kSettingPageControllerTag);
    controller.addListener(() {
      if (controller.page != null) {
        int page = controller.page!.toInt();
        if (page < DesktopSettingPage.tabKeys.length) {
          selectedTab.value = DesktopSettingPage.tabKeys[page];
        }
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state == AppLifecycleState.resumed) {
      shouldBeBlocked(_block, canBeBlocked);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _videoConnTimer =
        periodic_immediate(Duration(milliseconds: 1000), () async {
      if (!mounted) {
        return;
      }
      _canBeBlocked.value = await canBeBlocked();
    });
  }

  @override
  void dispose() {
    super.dispose();
    Get.delete<PageController>(tag: _kSettingPageControllerTag);
    Get.delete<RxInt>(tag: _kSettingPageTabKeyTag);
    WidgetsBinding.instance.removeObserver(this);
    _videoConnTimer?.cancel();
  }

  List<_TabInfo> _settingTabs() {
    final List<_TabInfo> settingTabs = <_TabInfo>[];
    for (final tab in DesktopSettingPage.tabKeys) {
      switch (tab) {
        case SettingsTabKey.general:
          settingTabs.add(_TabInfo(
              tab, 'General', Icons.settings_outlined, Icons.settings));
          break;
        case SettingsTabKey.ai:
          settingTabs.add(_TabInfo(
              tab, 'AI Assistant', Icons.smart_toy_outlined, Icons.smart_toy));
          break;
        case SettingsTabKey.safety:
          settingTabs.add(_TabInfo(tab, 'Security',
              Icons.enhanced_encryption_outlined, Icons.enhanced_encryption));
          break;
        case SettingsTabKey.network:
          settingTabs
              .add(_TabInfo(tab, 'Network', Icons.link_outlined, Icons.link));
          break;
        case SettingsTabKey.display:
          settingTabs.add(_TabInfo(tab, 'Display',
              Icons.desktop_windows_outlined, Icons.desktop_windows));
          break;
        case SettingsTabKey.plugin:
          settingTabs.add(_TabInfo(
              tab, 'Plugin', Icons.extension_outlined, Icons.extension));
          break;
        case SettingsTabKey.account:
          settingTabs.add(
              _TabInfo(tab, 'Account', Icons.person_outline, Icons.person));
          break;
        case SettingsTabKey.printer:
          settingTabs
              .add(_TabInfo(tab, 'Printer', Icons.print_outlined, Icons.print));
          break;
        case SettingsTabKey.about:
          settingTabs
              .add(_TabInfo(tab, 'About', Icons.info_outline, Icons.info));
          break;
      }
    }
    return settingTabs;
  }

  List<Widget> _children() {
    final children = List<Widget>.empty(growable: true);
    for (final tab in DesktopSettingPage.tabKeys) {
      switch (tab) {
        case SettingsTabKey.general:
          children.add(const _General());
          break;
        case SettingsTabKey.ai:
          children.add(const _AiSettings());
          break;
        case SettingsTabKey.safety:
          children.add(const _Safety());
          break;
        case SettingsTabKey.network:
          children.add(const _Network());
          break;
        case SettingsTabKey.display:
          children.add(const _Display());
          break;
        case SettingsTabKey.plugin:
          children.add(const _Plugin());
          break;
        case SettingsTabKey.account:
          children.add(const _Account());
          break;
        case SettingsTabKey.printer:
          children.add(const _Printer());
          break;
        case SettingsTabKey.about:
          children.add(const _About());
          break;
      }
    }
    return children;
  }

  Widget _buildBlock({required List<Widget> children}) {
    // check both mouseMoveTime and videoConnCount
    return Obx(() {
      final videoConnBlock =
          _canBeBlocked.value && stateGlobal.videoConnCount > 0;
      return Stack(children: [
        buildRemoteBlock(
          block: _block,
          mask: false,
          use: canBeBlocked,
          child: preventMouseKeyBuilder(
            child: Row(children: children),
            block: videoConnBlock,
          ),
        ),
        if (videoConnBlock)
          Container(
            color: Colors.black.withOpacity(0.5),
          )
      ]);
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    _settingsThemeContext = context;
    return Scaffold(
      backgroundColor: _settingsWorkspaceColor(context),
      body: _buildBlock(
        children: <Widget>[
          SizedBox(
            width: _kRdeskSidebarWidth,
            child: Column(
              children: [
                _header(context),
                Flexible(child: _listView(tabs: _settingTabs())),
              ],
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: Container(
              color: _settingsWorkspaceColor(context),
              child: PageView(
                controller: controller,
                physics: NeverScrollableScrollPhysics(),
                children: _children(),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Container(
      height: 112,
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 14),
      alignment: Alignment.bottomLeft,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              try {
                final tabController = Get.find<DesktopTabController>();
                final homeIndex = tabController.state.value.tabs
                    .indexWhere((tab) => tab.key == kTabLabelHomePage);
                if (homeIndex >= 0) {
                  tabController.jumpTo(homeIndex);
                }
              } catch (_) {}
            }
          },
        child: SizedBox(
          height: _kRdeskSidebarActionHeight,
          child: Row(
            children: [
              Icon(
                Icons.arrow_back_rounded,
                size: 20,
                color: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.color
                    ?.withOpacity(0.72),
              ),
              const SizedBox(width: 10),
              Text(
                '返回主页',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.color
                      ?.withOpacity(0.85),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _listView({required List<_TabInfo> tabs}) {
    final scrollController = ScrollController();
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 18),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 6, 12, 16),
          child: Text(
            '设置中心',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.color
                  ?.withOpacity(0.56),
            ),
          ),
        ),
        ...tabs.map((tab) => _listItem(tab: tab)).toList(),
      ],
    );
  }

  Widget _listItem({required _TabInfo tab}) {
    return Obx(() {
      bool selected = tab.key == selectedTab.value;
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        height: 46,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            if (selectedTab.value != tab.key) {
              int index = DesktopSettingPage.tabKeys.indexOf(tab.key);
              if (index == -1) {
                return;
              }
              controller.jumpToPage(index);
            }
            selectedTab.value = tab.key;
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: selected
                  ? _settingsSelectedFill(context)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(children: [
              Icon(
                selected ? tab.selected : tab.unselected,
                color: selected ? MyTheme.accent : Theme.of(context).iconTheme.color,
                size: 20,
              ),
              const SizedBox(width: 12),
              Text(
                _toChineseTabLabel(tab.key),
                style: TextStyle(
                    color: selected
                        ? MyTheme.accent
                        : Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.color,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 15),
              ),
            ]),
          ),
        ),
      );
    });
  }

  String _toChineseTabLabel(SettingsTabKey key) {
    switch (key) {
      case SettingsTabKey.general:
        return '常规设置';
      case SettingsTabKey.ai:
        return 'AI 助手';
      case SettingsTabKey.safety:
        return '安全';
      case SettingsTabKey.network:
        return '网络';
      case SettingsTabKey.display:
        return '显示';
      case SettingsTabKey.plugin:
        return '插件';
      case SettingsTabKey.account:
        return '账户';
      case SettingsTabKey.printer:
        return '打印机';
      case SettingsTabKey.about:
        return '关于';
    }
  }
}

//#region pages

class _General extends StatefulWidget {
  const _General({Key? key}) : super(key: key);

  @override
  State<_General> createState() => _GeneralState();
}

Widget _buildSettingsPageTitle(
  BuildContext context,
  String title, {
  String? subtitle,
}) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: Theme.of(context).textTheme.titleLarge?.color,
        ),
      ),
      if (subtitle != null) ...[
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.68),
          ),
        ),
      ]
    ],
  );
}

Widget _buildSettingsPageScaffold({
  required BuildContext context,
  required ScrollController controller,
  required String title,
  String? subtitle,
  required List<Widget> children,
}) {
  return ListView(
    controller: controller,
    padding: const EdgeInsets.fromLTRB(34, 28, 34, 28),
    children: [
      _buildSettingsPageTitle(context, title, subtitle: subtitle),
      const SizedBox(height: 18),
      ...children,
    ],
  ).marginOnly(bottom: _kListViewBottomMargin);
}

Widget _buildSettingsPageColumn({
  required BuildContext context,
  required ScrollController controller,
  required String title,
  String? subtitle,
  required List<Widget> children,
}) {
  return SingleChildScrollView(
    controller: controller,
    child: Padding(
      padding: const EdgeInsets.fromLTRB(34, 28, 34, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSettingsPageTitle(context, title, subtitle: subtitle),
          const SizedBox(height: 18),
          ...children,
        ],
      ),
    ),
  ).marginOnly(bottom: _kListViewBottomMargin);
}

Widget _buildSettingsDisplaySegment({
  required BuildContext context,
  required List<Widget> children,
}) {
  return Container(
    padding: const EdgeInsets.all(6),
    decoration: BoxDecoration(
      color: _isDarkSurface(context) ? const Color(0xFF2B313C) : MyTheme.grayBg,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: _settingsBorderColor(context)),
    ),
    child: Row(children: children),
  );
}

Widget _buildSettingsDisplaySegmentItem({
  required BuildContext context,
  required String label,
  required bool selected,
  required VoidCallback? onTap,
}) {
  return InkWell(
    borderRadius: BorderRadius.circular(14),
    onTap: onTap,
    child: Container(
      width: 168,
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: selected ? _settingsCardColor(context) : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        boxShadow: selected
            ? const [
                BoxShadow(
                  color: Color(0x120F172A),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                )
              ]
            : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected
              ? MyTheme.accent
              : Theme.of(context).textTheme.bodyMedium?.color,
        ),
      ),
    ),
  );
}

class _GeneralState extends State<_General> {
  final RxBool serviceStop =
      isWeb ? RxBool(false) : Get.find<RxBool>(tag: 'stop-service');
  RxBool serviceBtnEnabled = true.obs;

  @override
  Widget build(BuildContext context) {
    final scrollController = ScrollController();
    return _buildSettingsPageScaffold(
      context: context,
      controller: scrollController,
      title: '常规设置',
      subtitle: '管理外观、语言、硬件与录制等基础行为',
      children: [
        _buildVisualSection(context),
        if (!isWeb) ...[
          const SizedBox(height: 28),
          _buildHardwareSection(context),
          const SizedBox(height: 28),
          _buildRecordingSection(context),
        ],
        const SizedBox(height: 28),
        _buildBehaviorSection(context),
      ],
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Theme.of(context).textTheme.titleMedium?.color,
        ),
      ),
    );
  }

  Widget _buildSectionCard(
    BuildContext context,
    _RdeskSettingsSectionSpec spec,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(context, spec.title),
        Container(
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(_kRdeskSectionRadius),
            border: Border.all(color: _settingsBorderColor(context)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x080F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              )
            ],
          ),
          child: Column(
            children: [
              for (int i = 0; i < spec.rows.length; i++) ...[
                spec.rows[i],
                if (i != spec.rows.length - 1)
                  Divider(height: 1, color: MyTheme.border),
              ]
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingRow({
    required BuildContext context,
    required String title,
    required String description,
    required Widget trailing,
    EdgeInsetsGeometry padding = const EdgeInsets.symmetric(
      horizontal: 24,
      vertical: 22,
    ),
  }) {
    return Container(
      constraints: const BoxConstraints(minHeight: _kRdeskRowMinHeight),
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.7),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 24),
          trailing,
        ],
      ),
    );
  }

  Widget _buildSelectShell({required Widget child, double width = 260}) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _settingsCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _settingsBorderColor(context)),
      ),
      child: child,
    );
  }

  Widget _buildSegmentShell({required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: _isDarkSurface(context)
            ? const Color(0xFF2B313C)
            : MyTheme.grayBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _settingsBorderColor(context)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: children),
    );
  }

  Widget _buildThemeSegmentOption({
    required BuildContext context,
    required bool selected,
    required IconData icon,
    required String label,
    required VoidCallback? onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? _settingsCardColor(context) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          boxShadow: selected
              ? const [
                  BoxShadow(
                    color: Color(0x120F172A),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: selected
                  ? MyTheme.accent
                  : Theme.of(context).iconTheme.color,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected
                    ? MyTheme.accent
                    : Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVisualSection(BuildContext context) {
    return _buildSectionCard(
      context,
      _RdeskSettingsSectionSpec(
        title: '外观与语言',
        rows: [
          _buildThemeRow(context),
          _buildLanguageRow(context),
        ],
      ),
    );
  }

  Widget _buildThemeRow(BuildContext context) {
    final current = MyTheme.getThemeModePreference().toShortString();
    final isOptFixed = isOptionFixed(kCommConfKeyTheme);
    Future<void> onThemeChanged(String value) async {
      await MyTheme.changeDarkMode(MyTheme.themeModeFromString(value));
      setState(() {});
    }

    return _buildSettingRow(
      context: context,
      title: '界面主题',
      description: '选择您偏好的应用程序外观风格',
      trailing: _buildSegmentShell(
        children: [
          _buildThemeSegmentOption(
            context: context,
            selected: current == 'light',
            icon: Icons.wb_sunny_outlined,
            label: '明亮',
            onTap: isOptFixed ? null : () => onThemeChanged('light'),
          ),
          _buildThemeSegmentOption(
            context: context,
            selected: current == 'dark',
            icon: Icons.dark_mode_outlined,
            label: '黑暗',
            onTap: isOptFixed ? null : () => onThemeChanged('dark'),
          ),
          _buildThemeSegmentOption(
            context: context,
            selected: current == 'system',
            icon: Icons.computer_rounded,
            label: '跟随系统',
            onTap: isOptFixed ? null : () => onThemeChanged('system'),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageRow(BuildContext context) {
    return futureBuilder(future: () async {
      String langs = await bind.mainGetLangs();
      return {'langs': langs};
    }(), hasData: (res) {
      Map<String, String> data = res as Map<String, String>;
      List<dynamic> langsList = jsonDecode(data['langs']!);
      Map<String, String> langsMap = {for (var v in langsList) v[0]: v[1]};
      List<String> keys = langsMap.keys.toList();
      List<String> values = langsMap.values.toList();
      keys.insert(0, defaultOptionLang);
      values.insert(0, translate('Default'));
      String currentKey = bind.mainGetLocalOption(key: kCommConfKeyLang);
      if (!keys.contains(currentKey)) {
        currentKey = defaultOptionLang;
      }
      final isOptFixed = isOptionFixed(kCommConfKeyLang);
      return _buildSettingRow(
        context: context,
        title: '显示语言',
        description: '更改界面的主要语言',
        trailing: _buildSelectShell(
          child: ComboBox(
            keys: keys,
            values: values,
            initialKey: currentKey,
            onChanged: (key) async {
              await bind.mainSetLocalOption(key: kCommConfKeyLang, value: key);
              if (isWeb) reloadCurrentWindow();
              if (!isWeb) reloadAllWindows();
              if (!isWeb) bind.mainChangeLanguage(lang: key);
            },
            enabled: !isOptFixed,
          ),
        ),
      );
    });
  }

  Widget _buildHardwareSection(BuildContext context) {
    return _buildSectionCard(
      context,
      _RdeskSettingsSectionSpec(
        title: '硬件与音频',
        rows: [
          _buildHwcodecRow(context),
          _buildAudioRow(context),
        ],
      ),
    );
  }

  Widget _buildHwcodecRow(BuildContext context) {
    final hwcodec = bind.mainHasHwcodec();
    final vram = bind.mainHasVram();
    if (!(hwcodec || vram)) {
      return const SizedBox.shrink();
    }
    final optionKey = kOptionEnableHwcodec;
    final isOptFixed = isOptionFixed(optionKey);
    final enabled = mainGetBoolOptionSync(optionKey).obs;
    Future<void> toggle() async {
      final next = !enabled.value;
      await mainSetBoolOption(optionKey, next);
      enabled.value = mainGetBoolOptionSync(optionKey);
      if (enabled.value) {
        bind.mainCheckHwcodec();
      }
      setState(() {});
    }

    return Obx(() => _buildSettingRow(
          context: context,
          title: '启用硬件编解码',
          description: '利用 GPU 加速提升画面流畅度并降低 CPU 占用',
          trailing: Switch(
            value: enabled.value,
            onChanged: isOptFixed ? null : (_) => toggle(),
          ),
        ));
  }

  Widget _buildAudioRow(BuildContext context) {
    if (bind.isOutgoingOnly()) {
      return const SizedBox.shrink();
    }
    builder(devices, currentDevice, setDevice) {
      return _buildSettingRow(
        context: context,
        title: '音频输入设备',
        description: '选择用于语音通话和系统声音捕捉的设备',
        trailing: _buildSelectShell(
          width: 256,
          child: ComboBox(
            keys: devices,
            values: devices,
            initialKey: currentDevice,
            onChanged: (key) async {
              setDevice(key);
              setState(() {});
            },
          ),
        ),
      );
    }
    return AudioInput(builder: builder, isCm: false, isVoiceCall: false);
  }

  Widget _buildRecordingSection(BuildContext context) {
    if (isWeb) return const SizedBox.shrink();
    final showRootDir = isWindows && bind.mainIsInstalled();
    return futureBuilder(future: () async {
      String userDir = bind.mainVideoSaveDirectory(root: false);
      String rootDir = showRootDir ? bind.mainVideoSaveDirectory(root: true) : '';
      bool userDirExists = await Directory(userDir).exists();
      bool rootDirExists = showRootDir ? await Directory(rootDir).exists() : false;
      return {
        'user_dir': userDir,
        'root_dir': rootDir,
        'user_dir_exists': userDirExists,
        'root_dir_exists': rootDirExists,
      };
    }(), hasData: (data) {
      final map = data as Map<String, dynamic>;
      final String userDir = map['user_dir'];
      final String rootDir = map['root_dir'];
      final bool userDirExists = map['user_dir_exists'];
      final bool rootDirExists = map['root_dir_exists'];
      final rows = <Widget>[];
      if (!bind.isOutgoingOnly()) {
        rows.add(_buildRecordToggleRow(
          context: context,
          title: '自动录制传入会话',
          description: '当其他人连接到本机时自动开始后台录像',
          optionKey: kOptionAllowAutoRecordIncoming,
          isServer: true,
        ));
      }
      if (!bind.isIncomingOnly()) {
        rows.add(_buildRecordToggleRow(
          context: context,
          title: '自动录制传出会话',
          description: '当本机控制其他设备时自动开始屏幕录制',
          optionKey: kOptionAllowAutoRecordOutgoing,
          isServer: false,
        ));
      }
      if (showRootDir && !bind.isOutgoingOnly()) {
        rows.add(_buildPathRow(
          context: context,
          title: '被控端录像保存位置',
          value: rootDir,
          canOpen: rootDirExists,
          canChange: false,
        ));
      }
      rows.add(_buildPathRow(
        context: context,
        title: showRootDir && !bind.isOutgoingOnly() ? '主控端录像保存位置' : '录像保存位置',
        value: userDir,
        canOpen: userDirExists,
        canChange: !isOptionFixed(kOptionVideoSaveDirectory),
        onChange: () async {
          String? initialDirectory;
          if (await Directory.fromUri(Uri.directory(userDir)).exists()) {
            initialDirectory = userDir;
          }
          String? selectedDirectory = await FilePicker.platform.getDirectoryPath(
              initialDirectory: initialDirectory);
          if (selectedDirectory != null) {
            await bind.mainSetLocalOption(
                key: kOptionVideoSaveDirectory, value: selectedDirectory);
            setState(() {});
          }
        },
      ));

      return _buildSectionCard(
        context,
        _RdeskSettingsSectionSpec(title: '会话录像', rows: rows),
      );
    });
  }

  Widget _buildRecordToggleRow({
    required BuildContext context,
    required String title,
    required String description,
    required String optionKey,
    required bool isServer,
  }) {
    final enabled = (isServer
            ? mainGetBoolOptionSync(optionKey)
            : mainGetLocalBoolOptionSync(optionKey))
        .obs;
    final isOptFixed = isOptionFixed(optionKey);
    Future<void> toggle() async {
      final next = !enabled.value;
      if (isServer) {
        await mainSetBoolOption(optionKey, next);
        enabled.value = mainGetBoolOptionSync(optionKey);
      } else {
        await mainSetLocalBoolOption(optionKey, next);
        enabled.value = mainGetLocalBoolOptionSync(optionKey);
      }
      setState(() {});
    }

    return Obx(() => _buildSettingRow(
          context: context,
          title: title,
          description: description,
          trailing: Switch(
            value: enabled.value,
            onChanged: isOptFixed ? null : (_) => toggle(),
          ),
        ));
  }

  Widget _buildPathRow({
    required BuildContext context,
    required String title,
    required String value,
    required bool canOpen,
    required bool canChange,
    VoidCallback? onChange,
  }) {
    return _buildSettingRow(
      context: context,
      title: title,
      description: '点击路径可快速打开目录，或使用右侧按钮重新选择位置',
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 220,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: _settingsCardColor(context),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _settingsBorderColor(context)),
            ),
            child: InkWell(
              onTap: canOpen ? () => launchUrl(Uri.file(value)) : null,
              child: Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12.5,
                  color: canOpen
                      ? MyTheme.accent
                      : Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color
                          ?.withOpacity(0.65),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          TextButton(
            onPressed: canChange ? onChange : null,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              backgroundColor: _settingsSubtleFill(context),
              foregroundColor: MyTheme.accent,
            ),
            child: const Text('更改目录'),
          ),
        ],
      ),
    );
  }

  Widget _buildBehaviorSection(BuildContext context) {
    final rows = <Widget>[];
    if (!isWeb && !bind.isIncomingOnly()) {
      rows.add(_buildOptionSwitchRow(
        context: context,
        title: '关闭多个标签页时向您确认',
        description: '防止意外关闭所有活动连接导致会话中断',
        optionKey: kOptionEnableConfirmClosingTabs,
        isServer: false,
      ));
    }
    rows.add(_buildOptionSwitchRow(
      context: context,
      title: '自适应码率',
      description: '根据网络状况自动动态调整画质，保证操作流畅度',
      optionKey: kOptionEnableAbr,
      isServer: true,
    ));

    return _buildSectionCard(
      context,
      _RdeskSettingsSectionSpec(title: '高级与行为', rows: rows),
    );
  }

  Widget _buildOptionSwitchRow({
    required BuildContext context,
    required String title,
    required String description,
    required String optionKey,
    required bool isServer,
  }) {
    final enabled = (isServer
            ? mainGetBoolOptionSync(optionKey)
            : mainGetLocalBoolOptionSync(optionKey))
        .obs;
    final isOptFixed = isOptionFixed(optionKey);

    Future<void> toggle() async {
      final next = !enabled.value;
      if (isServer) {
        await mainSetBoolOption(optionKey, next);
        enabled.value = mainGetBoolOptionSync(optionKey);
      } else {
        await mainSetLocalBoolOption(optionKey, next);
        enabled.value = mainGetLocalBoolOptionSync(optionKey);
      }
      setState(() {});
    }

    return Obx(() => _buildSettingRow(
          context: context,
          title: title,
          description: description,
          trailing: Switch(
            value: enabled.value,
            onChanged: isOptFixed ? null : (_) => toggle(),
          ),
        ));
  }

  Widget theme() {
    final current = MyTheme.getThemeModePreference().toShortString();
    onChanged(String value) async {
      await MyTheme.changeDarkMode(MyTheme.themeModeFromString(value));
      setState(() {});
    }

    final isOptFixed = isOptionFixed(kCommConfKeyTheme);
    return _Card(title: 'Theme', children: [
      _Radio<String>(context,
          value: 'light',
          groupValue: current,
          label: 'Light',
          onChanged: isOptFixed ? null : onChanged),
      _Radio<String>(context,
          value: 'dark',
          groupValue: current,
          label: 'Dark',
          onChanged: isOptFixed ? null : onChanged),
      _Radio<String>(context,
          value: 'system',
          groupValue: current,
          label: 'Follow System',
          onChanged: isOptFixed ? null : onChanged),
    ]);
  }

  Widget service() {
    if (bind.isOutgoingOnly()) {
      return const Offstage();
    }

    return _Card(title: 'Service', children: [
      Obx(() => _Button(serviceStop.value ? 'Start' : 'Stop', () {
            () async {
              serviceBtnEnabled.value = false;
              await start_service(serviceStop.value);
              // enable the button after 1 second
              Future.delayed(const Duration(seconds: 1), () {
                serviceBtnEnabled.value = true;
              });
            }();
          }, enabled: serviceBtnEnabled.value))
    ]);
  }

  Widget other() {
    final showAutoUpdate =
        isWindows && bind.mainIsInstalled() && !bind.isCustomClient();
    final children = <Widget>[
      if (!isWeb && !bind.isIncomingOnly())
        _OptionCheckBox(context, 'Confirm before closing multiple tabs',
            kOptionEnableConfirmClosingTabs,
            isServer: false),
      _OptionCheckBox(context, 'Adaptive bitrate', kOptionEnableAbr),
      if (!isWeb) wallpaper(),
      if (!isWeb && !bind.isIncomingOnly()) ...[
        _OptionCheckBox(
          context,
          'Open connection in new tab',
          kOptionOpenNewConnInTabs,
          isServer: false,
        ),
        // though this is related to GUI, but opengl problem affects all users, so put in config rather than local
        if (isLinux)
          Tooltip(
            message: translate('software_render_tip'),
            child: _OptionCheckBox(
              context,
              "Always use software rendering",
              kOptionAllowAlwaysSoftwareRender,
            ),
          ),
        if (!isWeb)
          Tooltip(
            message: translate('texture_render_tip'),
            child: _OptionCheckBox(
              context,
              "Use texture rendering",
              kOptionTextureRender,
              optGetter: bind.mainGetUseTextureRender,
              optSetter: (k, v) async =>
                  await bind.mainSetLocalOption(key: k, value: v ? 'Y' : 'N'),
            ),
          ),
        if (isWindows)
          Tooltip(
            message: translate('d3d_render_tip'),
            child: _OptionCheckBox(
              context,
              "Use D3D rendering",
              kOptionD3DRender,
              isServer: false,
            ),
          ),
        if (!isWeb && !bind.isCustomClient())
          _OptionCheckBox(
            context,
            'Check for software update on startup',
            kOptionEnableCheckUpdate,
            isServer: false,
          ),
        if (showAutoUpdate)
          _OptionCheckBox(
            context,
            'Auto update',
            kOptionAllowAutoUpdate,
            isServer: true,
          ),
        if (isWindows && !bind.isOutgoingOnly())
          _OptionCheckBox(
            context,
            'Capture screen using DirectX',
            kOptionDirectxCapture,
          ),
        if (!bind.isIncomingOnly()) ...[
          _OptionCheckBox(
            context,
            'Enable UDP hole punching',
            kOptionEnableUdpPunch,
            isServer: false,
          ),
          _OptionCheckBox(
            context,
            'Enable IPv6 P2P connection',
            kOptionEnableIpv6Punch,
            isServer: false,
          ),
        ],
      ],
    ];
    if (!isWeb && bind.mainShowOption(key: kOptionAllowLinuxHeadless)) {
      children.add(_OptionCheckBox(
          context, 'Allow linux headless', kOptionAllowLinuxHeadless));
    }
    if (!bind.isDisableAccount()) {
      children.add(_OptionCheckBox(
        context,
        'note-at-conn-end-tip',
        kOptionAllowAskForNoteAtEndOfConnection,
        isServer: false,
        optSetter: (key, value) async {
          if (value && !gFFI.userModel.isLogin) {
            final res = await loginDialog();
            if (res != true) return;
          }
          await mainSetLocalBoolOption(key, value);
        },
      ));
    }
    return _Card(title: 'Other', children: children);
  }

  Widget wallpaper() {
    if (bind.isOutgoingOnly()) {
      return const Offstage();
    }

    return futureBuilder(future: () async {
      final support = await bind.mainSupportRemoveWallpaper();
      return support;
    }(), hasData: (data) {
      if (data is bool && data == true) {
        bool value = mainGetBoolOptionSync(kOptionAllowRemoveWallpaper);
        return Row(
          children: [
            Flexible(
              child: _OptionCheckBox(
                context,
                'Remove wallpaper during incoming sessions',
                kOptionAllowRemoveWallpaper,
                update: (bool v) {
                  setState(() {});
                },
              ),
            ),
            if (value)
              _CountDownButton(
                text: 'Test',
                second: 5,
                onPressed: () {
                  bind.mainTestWallpaper(second: 5);
                },
              )
          ],
        );
      }

      return Offstage();
    });
  }

  Widget hwcodec() {
    final hwcodec = bind.mainHasHwcodec();
    final vram = bind.mainHasVram();
    return Offstage(
      offstage: !(hwcodec || vram),
      child: _Card(title: 'Hardware Codec', children: [
        _OptionCheckBox(
          context,
          'Enable hardware codec',
          kOptionEnableHwcodec,
          update: (bool v) {
            if (v) {
              bind.mainCheckHwcodec();
            }
          },
        )
      ]),
    );
  }

  Widget audio(BuildContext context) {
    if (bind.isOutgoingOnly()) {
      return const Offstage();
    }

    builder(devices, currentDevice, setDevice) {
      final child = ComboBox(
        keys: devices,
        values: devices,
        initialKey: currentDevice,
        onChanged: (key) async {
          setDevice(key);
          setState(() {});
        },
      ).marginOnly(left: _kContentHMargin);
      return _Card(title: 'Audio Input Device', children: [child]);
    }

    return AudioInput(builder: builder, isCm: false, isVoiceCall: false);
  }

  Widget record(BuildContext context) {
    final showRootDir = isWindows && bind.mainIsInstalled();
    return futureBuilder(future: () async {
      String user_dir = bind.mainVideoSaveDirectory(root: false);
      String root_dir =
          showRootDir ? bind.mainVideoSaveDirectory(root: true) : '';
      bool user_dir_exists = await Directory(user_dir).exists();
      bool root_dir_exists =
          showRootDir ? await Directory(root_dir).exists() : false;
      return {
        'user_dir': user_dir,
        'root_dir': root_dir,
        'user_dir_exists': user_dir_exists,
        'root_dir_exists': root_dir_exists,
      };
    }(), hasData: (data) {
      Map<String, dynamic> map = data as Map<String, dynamic>;
      String user_dir = map['user_dir']!;
      String root_dir = map['root_dir']!;
      bool root_dir_exists = map['root_dir_exists']!;
      bool user_dir_exists = map['user_dir_exists']!;
      return _Card(title: 'Recording', children: [
        if (!bind.isOutgoingOnly())
          _OptionCheckBox(context, 'Automatically record incoming sessions',
              kOptionAllowAutoRecordIncoming),
        if (!bind.isIncomingOnly())
          _OptionCheckBox(context, 'Automatically record outgoing sessions',
              kOptionAllowAutoRecordOutgoing,
              isServer: false),
        if (showRootDir && !bind.isOutgoingOnly())
          Row(
            children: [
              Text(
                  '${translate(bind.isIncomingOnly() ? "Directory" : "Incoming")}:'),
              Expanded(
                child: GestureDetector(
                    onTap: root_dir_exists
                        ? () => launchUrl(Uri.file(root_dir))
                        : null,
                    child: Text(
                      root_dir,
                      softWrap: true,
                      style: root_dir_exists
                          ? const TextStyle(
                              decoration: TextDecoration.underline)
                          : null,
                    )).marginOnly(left: 10),
              ),
            ],
          ).marginOnly(left: _kContentHMargin),
        if (!(showRootDir && bind.isIncomingOnly()))
          Row(
            children: [
              Text(
                  '${translate((showRootDir && !bind.isOutgoingOnly()) ? "Outgoing" : "Directory")}:'),
              Expanded(
                child: GestureDetector(
                    onTap: user_dir_exists
                        ? () => launchUrl(Uri.file(user_dir))
                        : null,
                    child: Text(
                      user_dir,
                      softWrap: true,
                      style: user_dir_exists
                          ? const TextStyle(
                              decoration: TextDecoration.underline)
                          : null,
                    )).marginOnly(left: 10),
              ),
              ElevatedButton(
                      onPressed: isOptionFixed(kOptionVideoSaveDirectory)
                          ? null
                          : () async {
                              String? initialDirectory;
                              if (await Directory.fromUri(
                                      Uri.directory(user_dir))
                                  .exists()) {
                                initialDirectory = user_dir;
                              }
                              String? selectedDirectory =
                                  await FilePicker.platform.getDirectoryPath(
                                      initialDirectory: initialDirectory);
                              if (selectedDirectory != null) {
                                await bind.mainSetLocalOption(
                                    key: kOptionVideoSaveDirectory,
                                    value: selectedDirectory);
                                setState(() {});
                              }
                            },
                      child: Text(translate('Change')))
                  .marginOnly(left: 5),
            ],
          ).marginOnly(left: _kContentHMargin),
      ]);
    });
  }

  Widget language() {
    return futureBuilder(future: () async {
      String langs = await bind.mainGetLangs();
      return {'langs': langs};
    }(), hasData: (res) {
      Map<String, String> data = res as Map<String, String>;
      List<dynamic> langsList = jsonDecode(data['langs']!);
      Map<String, String> langsMap = {for (var v in langsList) v[0]: v[1]};
      List<String> keys = langsMap.keys.toList();
      List<String> values = langsMap.values.toList();
      keys.insert(0, defaultOptionLang);
      values.insert(0, translate('Default'));
      String currentKey = bind.mainGetLocalOption(key: kCommConfKeyLang);
      if (!keys.contains(currentKey)) {
        currentKey = defaultOptionLang;
      }
      final isOptFixed = isOptionFixed(kCommConfKeyLang);
      return ComboBox(
        keys: keys,
        values: values,
        initialKey: currentKey,
        onChanged: (key) async {
          await bind.mainSetLocalOption(key: kCommConfKeyLang, value: key);
          if (isWeb) reloadCurrentWindow();
          if (!isWeb) reloadAllWindows();
          if (!isWeb) bind.mainChangeLanguage(lang: key);
        },
        enabled: !isOptFixed,
      ).marginOnly(left: _kContentHMargin);
    });
  }
}

enum _AccessMode {
  custom,
  full,
  view,
}

class _Safety extends StatefulWidget {
  const _Safety({Key? key}) : super(key: key);

  @override
  State<_Safety> createState() => _SafetyState();
}

class _SafetyState extends State<_Safety> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  bool locked = bind.mainIsInstalled();
  final scrollController = ScrollController();

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return _buildSettingsPageScaffold(
      context: context,
      controller: scrollController,
      title: '安全设置',
      subtitle: '管理密码、权限组、远程控制能力与连接防护策略',
      children: [
        _buildSafetyHeaderActions(context),
        const SizedBox(height: 18),
        _buildSafetyLockBanner(context),
        const SizedBox(height: 28),
        preventMouseKeyBuilder(
          block: locked,
          child: Column(
            children: [
              _buildSafetyAuthSection(context),
              const SizedBox(height: 28),
              _buildSafetyPermissionsSection(context),
              const SizedBox(height: 28),
              _buildSafetyNetworkProtectionSection(context),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _toggleSafetyLock() async {
    if (!locked) {
      setState(() => locked = true);
      return;
    }
    final unlockPin = bind.mainGetUnlockPin();
    if (unlockPin.isEmpty || isUnlockPinDisabled()) {
      final checked = await callMainCheckSuperUserPermission();
      if (checked && mounted) {
        setState(() => locked = false);
      }
    } else {
      checkUnlockPinDialog(unlockPin, () {
        if (mounted) {
          setState(() => locked = false);
        }
      });
    }
  }

  Widget _buildSafetyHeaderActions(BuildContext context) {
    if (isChangeIdDisabled()) return const SizedBox.shrink();
    return Align(
      alignment: Alignment.centerRight,
      child: ChangeNotifierProvider.value(
        value: gFFI.serverModel,
        child: Consumer<ServerModel>(
          builder: (context, model, child) {
            return TextButton(
              onPressed: !locked && model.connectStatus > 0 ? changeIdDialog : null,
              style: TextButton.styleFrom(
                backgroundColor: _settingsSubtleFill(context),
                foregroundColor: MyTheme.accent,
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                '更改本机 ID',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildSafetyLockBanner(BuildContext context) {
    final unlocked = !locked;
    final accent = unlocked ? const Color(0xFFF97316) : const Color(0xFF2563EB);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
      decoration: BoxDecoration(
        color: unlocked
            ? const Color(0xFFFFF7ED)
            : _settingsCardColor(context),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: unlocked ? const Color(0xFFFED7AA) : _settingsBorderColor(context),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: accent.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.security_outlined, size: 20, color: accent),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unlocked ? '安全设置已解锁' : '安全设置已锁定',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: unlocked ? accent : Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  unlocked ? '请谨慎修改高危权限配置' : '修改高危权限前需要先验证身份',
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.72),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          ElevatedButton(
            onPressed: _toggleSafetyLock,
            style: ElevatedButton.styleFrom(
              backgroundColor: unlocked ? accent : MyTheme.accent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: Text(
              unlocked ? '立即锁定' : '立即解锁',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetySectionCard({
    required BuildContext context,
    required String title,
    Widget? trailing,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
              ),
              if (trailing != null) trailing,
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: _settingsBorderColor(context)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x080F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              )
            ],
          ),
          child: Column(
            children: [
              for (int i = 0; i < children.length; i++) ...[
                children[i],
                if (i != children.length - 1)
                  Divider(height: 1, color: _settingsBorderColor(context)),
              ]
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSafetyRow({
    required BuildContext context,
    required String title,
    required String description,
    Widget? leading,
    required Widget trailing,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
      child: Row(
        children: [
          if (leading != null) ...[
            leading,
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.72),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          trailing,
        ],
      ),
    );
  }

  Widget _buildSafetyIconBubble(BuildContext context, IconData icon, Color color) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: color.withOpacity(0.10),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 20, color: color),
    );
  }

  Widget _buildSafetyModeCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required bool selected,
    required VoidCallback? onTap,
  }) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 18),
          decoration: BoxDecoration(
            color: selected ? _settingsSelectedFill(context) : _settingsCardColor(context),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? MyTheme.accent50 : _settingsBorderColor(context),
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: selected ? MyTheme.accent : const Color(0xFF94A3B8)),
              const SizedBox(height: 10),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: selected
                      ? MyTheme.accent
                      : Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPermissionToggleTile({
    required BuildContext context,
    required IconData icon,
    required String label,
    required String key,
    bool? fakeValue,
    bool enabled = true,
    bool danger = false,
  }) {
    final isOptFixed = isOptionFixed(key);
    final value = (fakeValue ?? mainGetBoolOptionSync(key)).obs;
    return Obx(() => Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Icon(icon,
                  size: 18,
                  color: danger
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF94A3B8)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: danger
                        ? const Color(0xFFEF4444)
                        : Theme.of(context).textTheme.bodyMedium?.color,
                  ),
                ),
              ),
              Switch(
                value: value.value,
                onChanged: fakeValue != null || !enabled || isOptFixed
                    ? null
                    : (v) async {
                        await mainSetBoolOption(key, v);
                        value.value = mainGetBoolOptionSync(key);
                        setState(() {});
                      },
              ),
            ],
          ),
        ));
  }

  Widget _buildSafetyAuthSection(BuildContext context) {
    return _buildSafetySectionCard(
      context: context,
      title: '密码与身份认证',
      children: [
        _buildSafety2faRow(context),
        _buildSafetyPasswordStrategy(context),
      ],
    );
  }

  Widget _buildSafety2faRow(BuildContext context) {
    final has2fa = bind.mainHasValid2FaSync().obs;
    Future<void> onChanged(bool value) async {
      if (!value) {
        CommonConfirmDialog(gFFI.dialogManager, translate('cancel-2fa-confirm-tip'), () {
          change2fa(callback: () async {
            has2fa.value = bind.mainHasValid2FaSync();
            setState(() {});
          });
        });
      } else {
        change2fa(callback: () async {
          has2fa.value = bind.mainHasValid2FaSync();
          setState(() {});
        });
      }
    }

    return Obx(() => _buildSafetyRow(
          context: context,
          title: '双重身份验证 (2FA)',
          description: '登录和修改重要设置时需要手机验证码',
          trailing: Switch(
            value: has2fa.value,
            onChanged: locked ? null : onChanged,
          ),
        ));
  }

  Widget _buildSafetyPasswordStrategy(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: gFFI.serverModel,
      child: Consumer<ServerModel>(builder: (context, model, child) {
        final usePassword = model.approveMode != 'click';
        final currentMethod = model.verificationMethod;
        final tmpEnabled = currentMethod != kUsePermanentPassword;
        final permEnabled = currentMethod != kUseTemporaryPassword;
        final isNumOPTChangable =
            !isOptionFixed(kOptionAllowNumericOneTimePassword) && tmpEnabled && !locked;

        Future<void> applyMethod(String method) async {
          Future<void> callback() async {
            if (model.approveMode == 'click') {
              await model.setApproveMode(defaultOptionApproveMode);
            }
            await model.setVerificationMethod(method);
            await model.updatePasswordModel();
            setState(() {});
          }

          if (method == kUsePermanentPassword &&
              (await bind.mainGetPermanentPassword()).isEmpty) {
            if (isChangePermanentPasswordDisabled()) {
              await callback();
              return;
            }
            setPasswordDialog(notEmptyCallback: callback);
          } else {
            await callback();
          }
        }

        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 10, 24, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Divider(height: 1, color: _settingsBorderColor(context)),
              const SizedBox(height: 22),
              Text(
                '入站连接密码策略',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  _buildSafetyModeCard(
                    context: context,
                    icon: Icons.refresh_rounded,
                    title: '仅一次性密码',
                    selected: currentMethod == kUseTemporaryPassword,
                    onTap: locked ? null : () => applyMethod(kUseTemporaryPassword),
                  ),
                  const SizedBox(width: 12),
                  _buildSafetyModeCard(
                    context: context,
                    icon: Icons.lock_outline_rounded,
                    title: '仅固定密码',
                    selected: currentMethod == kUsePermanentPassword,
                    onTap: locked ? null : () => applyMethod(kUsePermanentPassword),
                  ),
                  const SizedBox(width: 12),
                  _buildSafetyModeCard(
                    context: context,
                    icon: Icons.key_outlined,
                    title: '两者皆可（推荐）',
                    selected: currentMethod == kUseBothPasswords,
                    onTap: locked ? null : () => applyMethod(kUseBothPasswords),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                decoration: BoxDecoration(
                  color: _settingsSubtleFill(context),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Text(
                      '一次性密码长度',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                      ),
                    ),
                    const SizedBox(width: 16),
                    _buildSettingsDisplaySegment(
                      context: context,
                      children: ['6', '8', '10']
                          .map((value) => _buildSettingsDisplaySegmentItem(
                                context: context,
                                label: '$value 位',
                                selected: model.temporaryPasswordLength == value,
                                onTap: tmpEnabled && !locked
                                    ? () async {
                                        await model.setTemporaryPasswordLength(value);
                                        await model.updatePasswordModel();
                                        setState(() {});
                                      }
                                    : null,
                              ))
                          .toList(),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Checkbox(
                          value: model.allowNumericOneTimePassword,
                          onChanged: isNumOPTChangable
                              ? (_) => model.switchAllowNumericOneTimePassword()
                              : null,
                        ),
                        const Text('仅使用纯数字'),
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '固定密码（无人值守）',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF172554),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '设置后任何知道此密码的人均可随时连接本机',
                            style: TextStyle(
                              fontSize: 13,
                              color: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.color
                                  ?.withOpacity(0.72),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    TextButton(
                      onPressed: permEnabled && !locked && !isChangePermanentPasswordDisabled()
                          ? setPasswordDialog
                          : null,
                      style: TextButton.styleFrom(
                        backgroundColor: _settingsCardColor(context),
                        foregroundColor: MyTheme.accent,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        '设置/修改固定密码',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
              if (!usePassword)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    '当前为点击确认授权模式，选择上方任一密码策略后将自动切换为密码授权。',
                    style: TextStyle(
                      fontSize: 12.5,
                      color: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color
                          ?.withOpacity(0.66),
                    ),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildSafetyPermissionsSection(BuildContext context) {
    String accessMode = bind.mainGetOptionSync(key: kOptionAccessMode);
    if (accessMode.isEmpty) {
      accessMode = defaultOptionAccessMode;
    }
    _AccessMode mode;
    if (accessMode == 'full') {
      mode = _AccessMode.full;
    } else if (accessMode == 'view') {
      mode = _AccessMode.view;
    } else {
      mode = _AccessMode.custom;
    }

    String initialKey;
    bool? fakeValue;
    switch (mode) {
      case _AccessMode.custom:
        initialKey = defaultOptionAccessMode;
        fakeValue = true;
        break;
      case _AccessMode.full:
        initialKey = 'full';
        fakeValue = true;
        break;
      case _AccessMode.view:
        initialKey = 'view';
        fakeValue = false;
        break;
    }

    final items = <Widget>[
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.keyboard_alt_outlined,
          label: '允许控制键盘/鼠标',
          key: kOptionEnableKeyboard,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.content_paste_outlined,
          label: '允许同步剪贴板',
          key: kOptionEnableClipboard,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.insert_drive_file_outlined,
          label: '允许传输文件',
          key: kOptionEnableFileTransfer,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.volume_up_outlined,
          label: '允许传输音频',
          key: kOptionEnableAudio,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.photo_camera_outlined,
          label: '允许查看摄像头',
          key: kOptionEnableCamera,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.code_outlined,
          label: '启用终端指令 (CMD)',
          key: kOptionEnableTerminal,
          fakeValue: fakeValue,
          enabled: !locked),
      if (isWindows)
        _buildPermissionToggleTile(
            context: context,
            icon: Icons.print_outlined,
            label: '启用远程打印机',
            key: kOptionEnableRemotePrinter,
            fakeValue: fakeValue,
            enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.settings_ethernet_outlined,
          label: '允许建立 TCP 隧道',
          key: kOptionEnableTunnel,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.restart_alt_rounded,
          label: '允许远程重启本机',
          key: kOptionEnableRemoteRestart,
          fakeValue: fakeValue,
          enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.videocam_outlined,
          label: '允许录制此会话',
          key: kOptionEnableRecordSession,
          fakeValue: fakeValue,
          enabled: !locked),
      if (isWindows)
        _buildPermissionToggleTile(
            context: context,
            icon: Icons.block_outlined,
            label: '允许阻止本机用户输入',
            key: kOptionEnableBlockInput,
            fakeValue: fakeValue,
            enabled: !locked),
      _buildPermissionToggleTile(
          context: context,
          icon: Icons.tune_outlined,
          label: '允许远程修改配置',
          key: kOptionAllowRemoteConfigModification,
          fakeValue: fakeValue,
          enabled: !locked,
          danger: true),
    ];

    final rows = <Widget>[];
    for (int i = 0; i < items.length; i += 2) {
      rows.add(Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 2),
        child: Row(
          children: [
            Expanded(child: items[i]),
            const SizedBox(width: 28),
            Expanded(child: i + 1 < items.length ? items[i + 1] : const SizedBox()),
          ],
        ),
      ));
    }

    return _buildSafetySectionCard(
      context: context,
      title: '被控端细分权限',
      trailing: SizedBox(
        width: 168,
        child: ComboBox(
          keys: [defaultOptionAccessMode, 'full', 'view'],
          values: const ['自定义权限组', '完全控制', '仅观看'],
          enabled: !locked && !isOptionFixed(kOptionAccessMode),
          initialKey: initialKey,
          onChanged: (mode) async {
            await bind.mainSetOption(key: kOptionAccessMode, value: mode);
            if (mode == defaultOptionAccessMode) {
              mainSetBoolOption(kOptionEnableKeyboard, true);
              mainSetBoolOption(kOptionEnableClipboard, true);
              mainSetBoolOption(kOptionEnableFileTransfer, true);
              mainSetBoolOption(kOptionEnableAudio, true);
              mainSetBoolOption(kOptionEnableCamera, true);
              mainSetBoolOption(kOptionEnableTerminal, true);
              if (isWindows) mainSetBoolOption(kOptionEnableRemotePrinter, true);
              mainSetBoolOption(kOptionEnableTunnel, true);
              mainSetBoolOption(kOptionEnableRemoteRestart, true);
              mainSetBoolOption(kOptionEnableRecordSession, true);
              if (isWindows) mainSetBoolOption(kOptionEnableBlockInput, true);
              mainSetBoolOption(kOptionAllowRemoteConfigModification, true);
            }
            setState(() {});
          },
        ),
      ),
      children: rows,
    );
  }

  Widget _buildSafetyNetworkProtectionSection(BuildContext context) {
    return _buildSafetySectionCard(
      context: context,
      title: '网络与连接防护',
      children: [
        if (isWindows && bind.mainIsInstalled()) _buildRdpShareRow(context),
        _buildDenyLanRow(context),
        _buildDirectIpRow(context),
        _buildWhitelistRow(context),
        _buildAutoDisconnectRow(context),
        if (bind.mainIsInstalled()) _buildConnWindowRow(context),
        if (bind.mainIsInstalled() && !isUnlockPinDisabled()) _buildUnlockPinRow(context),
      ],
    );
  }

  Widget _buildRdpShareRow(BuildContext context) {
    final value = bind.mainIsShareRdp().obs;
    return Obx(() => _buildSafetyRow(
          context: context,
          leading: _buildSafetyIconBubble(context, Icons.check_box_outlined, MyTheme.accent),
          title: '允许 RDP 会话共享',
          description: '允许系统级远程桌面会话共享当前登录环境',
          trailing: Switch(
            value: value.value,
            onChanged: locked
                ? null
                : (v) async {
                    await bind.mainSetShareRdp(enable: v);
                    value.value = bind.mainIsShareRdp();
                    setState(() {});
                  },
          ),
        ));
  }

  Widget _buildDenyLanRow(BuildContext context) {
    final value = (!mainGetBoolOptionSync('enable-lan-discovery')).obs;
    return Obx(() => _buildSafetyRow(
          context: context,
          leading: _buildSafetyIconBubble(context, Icons.public_off_outlined, const Color(0xFF94A3B8)),
          title: '拒绝局域网发现',
          description: '开启后，同局域网内的其他设备无法扫描到本机',
          trailing: Switch(
            value: value.value,
            onChanged: locked || isOptionFixed('enable-lan-discovery')
                ? null
                : (v) async {
                    await mainSetBoolOption('enable-lan-discovery', !v);
                    value.value = !mainGetBoolOptionSync('enable-lan-discovery');
                    setState(() {});
                  },
          ),
        ));
  }

  Widget _buildDirectIpRow(BuildContext context) {
    final enabled = option2bool(kOptionDirectServer,
            bind.mainGetOptionSync(key: kOptionDirectServer))
        .obs;
    final controller = TextEditingController(
        text: bind.mainGetOptionSync(key: kOptionDirectAccessPort));
    final applyEnabled = false.obs;
    return Obx(() => Column(
          children: [
            _buildSafetyRow(
              context: context,
              leading: _buildSafetyIconBubble(context, Icons.wifi_tethering_outlined, MyTheme.accent),
              title: '允许 IP 直接访问',
              description: '开启后，可通过监听端口直接从局域网连接本机',
              trailing: Switch(
                value: enabled.value,
                onChanged: locked || isOptionFixed(kOptionDirectServer)
                    ? null
                    : (v) async {
                        await bind.mainSetOption(
                            key: kOptionDirectServer,
                            value: bool2option(kOptionDirectServer, v));
                        enabled.value = option2bool(kOptionDirectServer,
                            bind.mainGetOptionSync(key: kOptionDirectServer));
                        setState(() {});
                      },
              ),
            ),
            if (enabled.value)
              Padding(
                padding: const EdgeInsets.fromLTRB(80, 0, 24, 18),
                child: Row(
                  children: [
                    const Text('监听端口:'),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 96,
                      child: TextField(
                        controller: controller,
                        enabled: !locked && !isOptionFixed(kOptionDirectAccessPort),
                        onChanged: (_) => applyEnabled.value = true,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(
                              r'^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$')),
                        ],
                        decoration: const InputDecoration(
                          contentPadding:
                              EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                        ),
                      ).workaroundFreezeLinuxMint(),
                    ),
                    const SizedBox(width: 12),
                    Obx(() => ElevatedButton(
                          onPressed: applyEnabled.value &&
                                  !locked &&
                                  !isOptionFixed(kOptionDirectAccessPort)
                              ? () async {
                                  applyEnabled.value = false;
                                  await bind.mainSetOption(
                                      key: kOptionDirectAccessPort,
                                      value: controller.text);
                                }
                              : null,
                          child: const Text('应用'),
                        )),
                  ],
                ),
              ),
          ],
        ));
  }

  Widget _buildWhitelistRow(BuildContext context) {
    final hasWhitelist = whitelistNotEmpty().obs;
    Future<void> update() async {
      hasWhitelist.value = whitelistNotEmpty();
      setState(() {});
    }

    Future<void> onChanged(bool value) async {
      changeWhiteList(callback: update);
    }

    return Obx(() => _buildSafetyRow(
          context: context,
          leading: _buildSafetyIconBubble(context, Icons.checklist_rounded, const Color(0xFF94A3B8)),
          title: '只允许白名单上的 IP 访问',
          description: '配置可访问本机的来源 IP 列表',
          trailing: Switch(
            value: hasWhitelist.value,
            onChanged: locked || isOptionFixed(kOptionWhitelist)
                ? null
                : (v) => onChanged(v),
          ),
        ));
  }

  Widget _buildAutoDisconnectRow(BuildContext context) {
    final enabled = option2bool(kOptionAllowAutoDisconnect,
            bind.mainGetOptionSync(key: kOptionAllowAutoDisconnect))
        .obs;
    final controller = TextEditingController(
        text: bind.mainGetOptionSync(key: kOptionAutoDisconnectTimeout));
    final applyEnabled = false.obs;
    return Obx(() => Column(
          children: [
            _buildSafetyRow(
              context: context,
              leading: _buildSafetyIconBubble(context, Icons.timer_outlined, const Color(0xFF94A3B8)),
              title: '自动关闭不活跃的会话',
              description: '长时间无操作时自动断开连接，降低风险',
              trailing: Switch(
                value: enabled.value,
                onChanged: locked || isOptionFixed(kOptionAllowAutoDisconnect)
                    ? null
                    : (v) async {
                        await bind.mainSetOption(
                            key: kOptionAllowAutoDisconnect,
                            value: bool2option(kOptionAllowAutoDisconnect, v));
                        enabled.value = option2bool(
                            kOptionAllowAutoDisconnect,
                            bind.mainGetOptionSync(key: kOptionAllowAutoDisconnect));
                        setState(() {});
                      },
              ),
            ),
            if (enabled.value)
              Padding(
                padding: const EdgeInsets.fromLTRB(80, 0, 24, 18),
                child: Row(
                  children: [
                    const Text('超时分钟:'),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 96,
                      child: TextField(
                        controller: controller,
                        enabled: !locked && !isOptionFixed(kOptionAutoDisconnectTimeout),
                        onChanged: (_) => applyEnabled.value = true,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(
                              r'^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$')),
                        ],
                        decoration: const InputDecoration(
                          hintText: '10',
                          contentPadding:
                              EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                        ),
                      ).workaroundFreezeLinuxMint(),
                    ),
                    const SizedBox(width: 12),
                    Obx(() => ElevatedButton(
                          onPressed: applyEnabled.value &&
                                  !locked &&
                                  !isOptionFixed(kOptionAutoDisconnectTimeout)
                              ? () async {
                                  applyEnabled.value = false;
                                  await bind.mainSetOption(
                                      key: kOptionAutoDisconnectTimeout,
                                      value: controller.text);
                                }
                              : null,
                          child: const Text('应用'),
                        )),
                  ],
                ),
              ),
          ],
        ));
  }

  Widget _buildConnWindowRow(BuildContext context) {
    final value = bind.mainGetOptionSync(key: 'allow-only-conn-window-open') == 'Y';
    return _buildSafetyRow(
      context: context,
      leading: _buildSafetyIconBubble(context, Icons.tab_outlined, const Color(0xFF94A3B8)),
      title: '仅当窗口打开时允许连接',
      description: '连接管理窗口关闭后，阻止新的远程会话接入',
      trailing: Switch(
        value: value,
        onChanged: locked || isOptionFixed('allow-only-conn-window-open')
            ? null
            : (v) async {
                await bind.mainSetOption(
                    key: 'allow-only-conn-window-open', value: v ? 'Y' : 'N');
                setState(() {});
              },
      ),
    );
  }

  Widget _buildUnlockPinRow(BuildContext context) {
    final unlockPin = bind.mainGetUnlockPin().obs;
    Future<void> update() async {
      unlockPin.value = bind.mainGetUnlockPin();
      setState(() {});
    }

    Future<void> onChanged(bool value) async {
      changeUnlockPinDialog(unlockPin.value, update);
    }

    return Obx(() => _buildSafetyRow(
          context: context,
          leading: _buildSafetyIconBubble(context, Icons.key_outlined, const Color(0xFF94A3B8)),
          title: '使用 PIN 码解锁设置',
          description: '进入安全及高级设置页面前输入预设密码验证身份',
          trailing: Switch(
            value: unlockPin.value.isNotEmpty,
            onChanged: locked || isOptionFixed(kOptionWhitelist)
                ? null
                : (v) => onChanged(v),
          ),
        ));
  }

  Widget tfa() {
    bool enabled = !locked;
    // Simple temp wrapper for PR check
    tmpWrapper() {
      RxBool has2fa = bind.mainHasValid2FaSync().obs;
      RxBool hasBot = bind.mainHasValidBotSync().obs;
      update() async {
        has2fa.value = bind.mainHasValid2FaSync();
        setState(() {});
      }

      onChanged(bool? checked) async {
        if (checked == false) {
          CommonConfirmDialog(
              gFFI.dialogManager, translate('cancel-2fa-confirm-tip'), () {
            change2fa(callback: update);
          });
        } else {
          change2fa(callback: update);
        }
      }

      final tfa = GestureDetector(
        child: InkWell(
          child: Obx(() => Row(
                children: [
                  Checkbox(
                          value: has2fa.value,
                          onChanged: enabled ? onChanged : null)
                      .marginOnly(right: 5),
                  Expanded(
                      child: Text(
                    translate('enable-2fa-title'),
                    style:
                        TextStyle(color: disabledTextColor(context, enabled)),
                  ))
                ],
              )),
        ),
        onTap: () {
          onChanged(!has2fa.value);
        },
      ).marginOnly(left: _kCheckBoxLeftMargin);
      if (!has2fa.value) {
        return tfa;
      }
      updateBot() async {
        hasBot.value = bind.mainHasValidBotSync();
        setState(() {});
      }

      onChangedBot(bool? checked) async {
        if (checked == false) {
          CommonConfirmDialog(
              gFFI.dialogManager, translate('cancel-bot-confirm-tip'), () {
            changeBot(callback: updateBot);
          });
        } else {
          changeBot(callback: updateBot);
        }
      }

      final bot = GestureDetector(
        child: Tooltip(
          waitDuration: Duration(milliseconds: 300),
          message: translate("enable-bot-tip"),
          child: InkWell(
              child: Obx(() => Row(
                    children: [
                      Checkbox(
                              value: hasBot.value,
                              onChanged: enabled ? onChangedBot : null)
                          .marginOnly(right: 5),
                      Expanded(
                          child: Text(
                        translate('Telegram bot'),
                        style: TextStyle(
                            color: disabledTextColor(context, enabled)),
                      ))
                    ],
                  ))),
        ),
        onTap: () {
          onChangedBot(!hasBot.value);
        },
      ).marginOnly(left: _kCheckBoxLeftMargin + 30);

      final trust = Row(
        children: [
          Flexible(
            child: Tooltip(
              waitDuration: Duration(milliseconds: 300),
              message: translate("enable-trusted-devices-tip"),
              child: _OptionCheckBox(context, "Enable trusted devices",
                  kOptionEnableTrustedDevices,
                  enabled: !locked, update: (v) {
                setState(() {});
              }),
            ),
          ),
          if (mainGetBoolOptionSync(kOptionEnableTrustedDevices))
            ElevatedButton(
                onPressed: locked
                    ? null
                    : () {
                        manageTrustedDeviceDialog();
                      },
                child: Text(translate('Manage trusted devices')))
        ],
      ).marginOnly(left: 30);

      return Column(
        children: [tfa, bot, trust],
      );
    }

    return tmpWrapper();
  }

  Widget changeId() {
    return ChangeNotifierProvider.value(
        value: gFFI.serverModel,
        child: Consumer<ServerModel>(builder: ((context, model, child) {
          return _Button('Change ID', changeIdDialog,
              enabled: !locked && model.connectStatus > 0);
        })));
  }

  Widget permissions(context) {
    bool enabled = !locked;
    // Simple temp wrapper for PR check
    tmpWrapper() {
      String accessMode = bind.mainGetOptionSync(key: kOptionAccessMode);
      _AccessMode mode;
      if (accessMode == 'full') {
        mode = _AccessMode.full;
      } else if (accessMode == 'view') {
        mode = _AccessMode.view;
      } else {
        mode = _AccessMode.custom;
      }
      String initialKey;
      bool? fakeValue;
      switch (mode) {
        case _AccessMode.custom:
          initialKey = '';
          fakeValue = null;
          break;
        case _AccessMode.full:
          initialKey = 'full';
          fakeValue = true;
          break;
        case _AccessMode.view:
          initialKey = 'view';
          fakeValue = false;
          break;
      }

      return _Card(title: 'Permissions', children: [
        ComboBox(
            keys: [
              defaultOptionAccessMode,
              'full',
              'view',
            ],
            values: [
              translate('Custom'),
              translate('Full Access'),
              translate('Screen Share'),
            ],
            enabled: enabled && !isOptionFixed(kOptionAccessMode),
            initialKey: initialKey,
            onChanged: (mode) async {
              await bind.mainSetOption(key: kOptionAccessMode, value: mode);
              setState(() {});
            }).marginOnly(left: _kContentHMargin),
        Column(
          children: [
            _OptionCheckBox(
                context, 'Enable keyboard/mouse', kOptionEnableKeyboard,
                enabled: enabled, fakeValue: fakeValue),
            if (isWindows)
              _OptionCheckBox(
                  context, 'Enable remote printer', kOptionEnableRemotePrinter,
                  enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(context, 'Enable clipboard', kOptionEnableClipboard,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(
                context, 'Enable file transfer', kOptionEnableFileTransfer,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(context, 'Enable audio', kOptionEnableAudio,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(context, 'Enable camera', kOptionEnableCamera,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(context, 'Enable terminal', kOptionEnableTerminal,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(
                context, 'Enable TCP tunneling', kOptionEnableTunnel,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(
                context, 'Enable remote restart', kOptionEnableRemoteRestart,
                enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(
                context, 'Enable recording session', kOptionEnableRecordSession,
                enabled: enabled, fakeValue: fakeValue),
            if (isWindows)
              _OptionCheckBox(context, 'Enable blocking user input',
                  kOptionEnableBlockInput,
                  enabled: enabled, fakeValue: fakeValue),
            _OptionCheckBox(context, 'Enable remote configuration modification',
                kOptionAllowRemoteConfigModification,
                enabled: enabled, fakeValue: fakeValue),
          ],
        ),
      ]);
    }

    return tmpWrapper();
  }

  Widget password(BuildContext context) {
    return ChangeNotifierProvider.value(
        value: gFFI.serverModel,
        child: Consumer<ServerModel>(builder: ((context, model, child) {
          List<String> passwordKeys = [
            kUseTemporaryPassword,
            kUsePermanentPassword,
            kUseBothPasswords,
          ];
          List<String> passwordValues = [
            translate('Use one-time password'),
            translate('Use permanent password'),
            translate('Use both passwords'),
          ];
          bool tmpEnabled = model.verificationMethod != kUsePermanentPassword;
          bool permEnabled = model.verificationMethod != kUseTemporaryPassword;
          String currentValue =
              passwordValues[passwordKeys.indexOf(model.verificationMethod)];
          List<Widget> radios = passwordValues
              .map((value) => _Radio<String>(
                    context,
                    value: value,
                    groupValue: currentValue,
                    label: value,
                    onChanged: locked
                        ? null
                        : ((value) async {
                            callback() async {
                              await model.setVerificationMethod(
                                  passwordKeys[passwordValues.indexOf(value)]);
                              await model.updatePasswordModel();
                            }

                            if (value ==
                                    passwordValues[passwordKeys
                                        .indexOf(kUsePermanentPassword)] &&
                                (await bind.mainGetPermanentPassword())
                                    .isEmpty) {
                              if (isChangePermanentPasswordDisabled()) {
                                await callback();
                                return;
                              }
                              setPasswordDialog(notEmptyCallback: callback);
                            } else {
                              await callback();
                            }
                          }),
                  ))
              .toList();

          var onChanged = tmpEnabled && !locked
              ? (value) {
                  if (value != null) {
                    () async {
                      await model.setTemporaryPasswordLength(value.toString());
                      await model.updatePasswordModel();
                    }();
                  }
                }
              : null;
          List<Widget> lengthRadios = ['6', '8', '10']
              .map((value) => GestureDetector(
                    child: Row(
                      children: [
                        Radio(
                            value: value,
                            groupValue: model.temporaryPasswordLength,
                            onChanged: onChanged),
                        Text(
                          value,
                          style: TextStyle(
                              color: disabledTextColor(
                                  context, onChanged != null)),
                        ),
                      ],
                    ).paddingOnly(right: 10),
                    onTap: () => onChanged?.call(value),
                  ))
              .toList();

          final isOptFixedNumOTP =
              isOptionFixed(kOptionAllowNumericOneTimePassword);
          final isNumOPTChangable = !isOptFixedNumOTP && tmpEnabled && !locked;
          final numericOneTimePassword = GestureDetector(
            child: InkWell(
                child: Row(
              children: [
                Checkbox(
                        value: model.allowNumericOneTimePassword,
                        onChanged: isNumOPTChangable
                            ? (bool? v) {
                                model.switchAllowNumericOneTimePassword();
                              }
                            : null)
                    .marginOnly(right: 5),
                Expanded(
                    child: Text(
                  translate('Numeric one-time password'),
                  style: TextStyle(
                      color: disabledTextColor(context, isNumOPTChangable)),
                ))
              ],
            )),
            onTap: isNumOPTChangable
                ? () => model.switchAllowNumericOneTimePassword()
                : null,
          ).marginOnly(left: _kContentHSubMargin - 5);

          final modeKeys = <String>[
            'password',
            'click',
            defaultOptionApproveMode
          ];
          final modeValues = [
            translate('Accept sessions via password'),
            translate('Accept sessions via click'),
            translate('Accept sessions via both'),
          ];
          var modeInitialKey = model.approveMode;
          if (!modeKeys.contains(modeInitialKey)) {
            modeInitialKey = defaultOptionApproveMode;
          }
          final usePassword = model.approveMode != 'click';

          final isApproveModeFixed = isOptionFixed(kOptionApproveMode);
          return _Card(title: 'Password', children: [
            ComboBox(
              enabled: !locked && !isApproveModeFixed,
              keys: modeKeys,
              values: modeValues,
              initialKey: modeInitialKey,
              onChanged: (key) => model.setApproveMode(key),
            ).marginOnly(left: _kContentHMargin),
            if (usePassword) radios[0],
            if (usePassword)
              _SubLabeledWidget(
                  context,
                  'One-time password length',
                  Row(
                    children: [
                      ...lengthRadios,
                    ],
                  ),
                  enabled: tmpEnabled && !locked),
            if (usePassword) numericOneTimePassword,
            if (usePassword) radios[1],
            if (usePassword && !isChangePermanentPasswordDisabled())
              _SubButton('Set permanent password', setPasswordDialog,
                  permEnabled && !locked),
            // if (usePassword)
            //   hide_cm(!locked).marginOnly(left: _kContentHSubMargin - 6),
            if (usePassword) radios[2],
          ]);
        })));
  }

  Widget more(BuildContext context) {
    bool enabled = !locked;
    return _Card(title: 'Security', children: [
      shareRdp(context, enabled),
      _OptionCheckBox(context, 'Deny LAN discovery', 'enable-lan-discovery',
          reverse: true, enabled: enabled),
      ...directIp(context),
      whitelist(),
      ...autoDisconnect(context),
      if (bind.mainIsInstalled())
        _OptionCheckBox(context, 'allow-only-conn-window-open-tip',
            'allow-only-conn-window-open',
            reverse: false, enabled: enabled),
      if (bind.mainIsInstalled() && !isUnlockPinDisabled()) unlockPin()
    ]);
  }

  shareRdp(BuildContext context, bool enabled) {
    onChanged(bool b) async {
      await bind.mainSetShareRdp(enable: b);
      setState(() {});
    }

    bool value = bind.mainIsShareRdp();
    return Offstage(
      offstage: !(isWindows && bind.mainIsInstalled()),
      child: GestureDetector(
          child: Row(
            children: [
              Checkbox(
                      value: value,
                      onChanged: enabled ? (_) => onChanged(!value) : null)
                  .marginOnly(right: 5),
              Expanded(
                child: Text(translate('Enable RDP session sharing'),
                    style:
                        TextStyle(color: disabledTextColor(context, enabled))),
              )
            ],
          ).marginOnly(left: _kCheckBoxLeftMargin),
          onTap: enabled ? () => onChanged(!value) : null),
    );
  }

  List<Widget> directIp(BuildContext context) {
    TextEditingController controller = TextEditingController();
    update(bool v) => setState(() {});
    RxBool applyEnabled = false.obs;
    return [
      _OptionCheckBox(context, 'Enable direct IP access', kOptionDirectServer,
          update: update, enabled: !locked),
      () {
        // Simple temp wrapper for PR check
        tmpWrapper() {
          bool enabled = option2bool(kOptionDirectServer,
              bind.mainGetOptionSync(key: kOptionDirectServer));
          if (!enabled) applyEnabled.value = false;
          controller.text =
              bind.mainGetOptionSync(key: kOptionDirectAccessPort);
          final isOptFixed = isOptionFixed(kOptionDirectAccessPort);
          return Offstage(
            offstage: !enabled,
            child: _SubLabeledWidget(
              context,
              'Port',
              Row(children: [
                SizedBox(
                  width: 95,
                  child: TextField(
                    controller: controller,
                    enabled: enabled && !locked && !isOptFixed,
                    onChanged: (_) => applyEnabled.value = true,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(
                          r'^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$')),
                    ],
                    decoration: const InputDecoration(
                      hintText: '21118',
                      contentPadding:
                          EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    ),
                  ).workaroundFreezeLinuxMint().marginOnly(right: 15),
                ),
                Obx(() => ElevatedButton(
                      onPressed: applyEnabled.value &&
                              enabled &&
                              !locked &&
                              !isOptFixed
                          ? () async {
                              applyEnabled.value = false;
                              await bind.mainSetOption(
                                  key: kOptionDirectAccessPort,
                                  value: controller.text);
                            }
                          : null,
                      child: Text(
                        translate('Apply'),
                      ),
                    ))
              ]),
              enabled: enabled && !locked && !isOptFixed,
            ),
          );
        }

        return tmpWrapper();
      }(),
    ];
  }

  Widget whitelist() {
    bool enabled = !locked;
    // Simple temp wrapper for PR check
    tmpWrapper() {
      RxBool hasWhitelist = whitelistNotEmpty().obs;
      update() async {
        hasWhitelist.value = whitelistNotEmpty();
      }

      onChanged(bool? checked) async {
        changeWhiteList(callback: update);
      }

      final isOptFixed = isOptionFixed(kOptionWhitelist);
      return GestureDetector(
        child: Tooltip(
          message: translate('whitelist_tip'),
          child: Obx(() => Row(
                children: [
                  Checkbox(
                          value: hasWhitelist.value,
                          onChanged: enabled && !isOptFixed ? onChanged : null)
                      .marginOnly(right: 5),
                  Offstage(
                    offstage: !hasWhitelist.value,
                    child: MouseRegion(
                      child: const Icon(Icons.warning_amber_rounded,
                              color: Color.fromARGB(255, 255, 204, 0))
                          .marginOnly(right: 5),
                      cursor: SystemMouseCursors.click,
                    ),
                  ),
                  Expanded(
                      child: Text(
                    translate('Use IP Whitelisting'),
                    style:
                        TextStyle(color: disabledTextColor(context, enabled)),
                  ))
                ],
              )),
        ),
        onTap: enabled
            ? () {
                onChanged(!hasWhitelist.value);
              }
            : null,
      ).marginOnly(left: _kCheckBoxLeftMargin);
    }

    return tmpWrapper();
  }

  Widget hide_cm(bool enabled) {
    return ChangeNotifierProvider.value(
        value: gFFI.serverModel,
        child: Consumer<ServerModel>(builder: (context, model, child) {
          final enableHideCm = model.approveMode == 'password' &&
              model.verificationMethod == kUsePermanentPassword;
          onHideCmChanged(bool? b) {
            if (b != null) {
              bind.mainSetOption(
                  key: 'allow-hide-cm', value: bool2option('allow-hide-cm', b));
            }
          }

          return Tooltip(
              message: enableHideCm ? "" : translate('hide_cm_tip'),
              child: GestureDetector(
                onTap:
                    enableHideCm ? () => onHideCmChanged(!model.hideCm) : null,
                child: Row(
                  children: [
                    Checkbox(
                            value: model.hideCm,
                            onChanged: enabled && enableHideCm
                                ? onHideCmChanged
                                : null)
                        .marginOnly(right: 5),
                    Expanded(
                      child: Text(
                        translate('Hide connection management window'),
                        style: TextStyle(
                            color: disabledTextColor(
                                context, enabled && enableHideCm)),
                      ),
                    ),
                  ],
                ),
              ));
        }));
  }

  List<Widget> autoDisconnect(BuildContext context) {
    TextEditingController controller = TextEditingController();
    update(bool v) => setState(() {});
    RxBool applyEnabled = false.obs;
    return [
      _OptionCheckBox(
          context, 'auto_disconnect_option_tip', kOptionAllowAutoDisconnect,
          update: update, enabled: !locked),
      () {
        bool enabled = option2bool(kOptionAllowAutoDisconnect,
            bind.mainGetOptionSync(key: kOptionAllowAutoDisconnect));
        if (!enabled) applyEnabled.value = false;
        controller.text =
            bind.mainGetOptionSync(key: kOptionAutoDisconnectTimeout);
        final isOptFixed = isOptionFixed(kOptionAutoDisconnectTimeout);
        return Offstage(
          offstage: !enabled,
          child: _SubLabeledWidget(
            context,
            'Timeout in minutes',
            Row(children: [
              SizedBox(
                width: 95,
                child: TextField(
                  controller: controller,
                  enabled: enabled && !locked && !isOptFixed,
                  onChanged: (_) => applyEnabled.value = true,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(
                        r'^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$')),
                  ],
                  decoration: const InputDecoration(
                    hintText: '10',
                    contentPadding:
                        EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                  ),
                ).workaroundFreezeLinuxMint().marginOnly(right: 15),
              ),
              Obx(() => ElevatedButton(
                    onPressed:
                        applyEnabled.value && enabled && !locked && !isOptFixed
                            ? () async {
                                applyEnabled.value = false;
                                await bind.mainSetOption(
                                    key: kOptionAutoDisconnectTimeout,
                                    value: controller.text);
                              }
                            : null,
                    child: Text(
                      translate('Apply'),
                    ),
                  ))
            ]),
            enabled: enabled && !locked && !isOptFixed,
          ),
        );
      }(),
    ];
  }

  Widget unlockPin() {
    bool enabled = !locked;
    RxString unlockPin = bind.mainGetUnlockPin().obs;
    update() async {
      unlockPin.value = bind.mainGetUnlockPin();
    }

    onChanged(bool? checked) async {
      changeUnlockPinDialog(unlockPin.value, update);
    }

    final isOptFixed = isOptionFixed(kOptionWhitelist);
    return GestureDetector(
      child: Obx(() => Row(
            children: [
              Checkbox(
                      value: unlockPin.isNotEmpty,
                      onChanged: enabled && !isOptFixed ? onChanged : null)
                  .marginOnly(right: 5),
              Expanded(
                  child: Text(
                translate('Unlock with PIN'),
                style: TextStyle(color: disabledTextColor(context, enabled)),
              ))
            ],
          )),
      onTap: enabled
          ? () {
              onChanged(!unlockPin.isNotEmpty);
            }
          : null,
    ).marginOnly(left: _kCheckBoxLeftMargin);
  }
}

class _Network extends StatefulWidget {
  const _Network({Key? key}) : super(key: key);

  @override
  State<_Network> createState() => _NetworkState();
}

class _NetworkState extends State<_Network> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  bool locked = !isWeb && bind.mainIsInstalled();

  final scrollController = ScrollController();

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return _buildSettingsPageScaffold(
      context: context,
      controller: scrollController,
      title: '网络设置',
      subtitle: '配置服务器、代理与网络传输策略',
      children: [
        _lock(locked, 'Unlock Network Settings', () {
          locked = false;
          setState(() => {});
        }),
        preventMouseKeyBuilder(
          block: locked,
          child: Column(children: [network(context)]),
        ),
      ],
    );
  }

  Widget network(BuildContext context) {
    final hideServer =
        bind.mainGetBuildinOption(key: kOptionHideServerSetting) == 'Y';
    final hideProxy =
        isWeb || bind.mainGetBuildinOption(key: kOptionHideProxySetting) == 'Y';
    final hideWebSocket = isWeb ||
        bind.mainGetBuildinOption(key: kOptionHideWebSocketSetting) == 'Y';

    if (hideServer && hideProxy && hideWebSocket) {
      return Offstage();
    }

    final outgoingOnly = bind.isOutgoingOnly();

    return futureBuilder(
      future: bind.mainIsUsingPublicServer(),
      hasData: (isUsingPublicServer) {
        final serverChildren = <Widget>[];
        if (!hideServer) {
          final currentServer = bind.mainGetOptionSync(key: 'custom-rendezvous-server');
          serverChildren.add(_buildNetworkActionRow(
            context,
            icon: Icons.dns_outlined,
            accentColor: MyTheme.accent,
            title: 'ID / 中继服务器',
            description: '使用自建的服务器进行连接打洞与流量中转',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (currentServer.trim().isNotEmpty)
                  Container(
                    constraints: const BoxConstraints(maxWidth: 132),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: _settingsSubtleFill(context),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      currentServer.trim(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color
                            ?.withOpacity(0.78),
                      ),
                    ),
                  ),
                if (currentServer.trim().isNotEmpty) const SizedBox(width: 12),
                SizedBox(
                  width: 72,
                  child: TextButton(
                    onPressed: locked
                        ? null
                        : () => showServerSettings(gFFI.dialogManager, setState),
                    style: TextButton.styleFrom(
                      backgroundColor: _settingsSubtleFill(context),
                      foregroundColor: MyTheme.accent,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      '配置',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ));
        }
        if (!hideProxy) {
          serverChildren.add(futureBuilder(future: bind.mainGetSocks(), hasData: (data) {
            final hasSocks = (data as List).isNotEmpty;
            return _buildNetworkActionRow(
              context,
              icon: Icons.public_outlined,
              accentColor: const Color(0xFF6366F1),
              title: 'Socks5 / Http(s) 代理',
              description: '通过指定的代理服务器路由所有远程流量',
              trailing: SizedBox(
                width: 188,
                child: TextButton(
                  onPressed: locked ? null : changeSocks5Proxy,
                  style: TextButton.styleFrom(
                    backgroundColor: _settingsSubtleFill(context),
                  foregroundColor: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.color,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        hasSocks ? '已配置代理' : '无代理 (直连系统)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                  ],
                  ),
                ),
              ),
            );
          }));
        }

        final strategyChildren = <Widget>[];
        if (!hideWebSocket) {
          strategyChildren.add(_buildNetworkToggleRow(
            context,
            data: _RdeskNetworkToggleRowData(
              icon: Icons.show_chart_rounded,
              accentColor: const Color(0xFF10B981),
              title: '使用 WebSocket',
              description: '在受限的防火墙网络环境下，通过标准 Web 端口穿越',
              value: mainGetBoolOptionSync(kOptionAllowWebSocket),
            ),
            onChanged: locked || isOptionFixed(kOptionAllowWebSocket)
                ? null
                : (value) {
                    mainSetBoolOption(kOptionAllowWebSocket, value);
                    setState(() {});
                  },
            showHint: true,
          ));
        }
        if (!isUsingPublicServer) {
          strategyChildren.add(_buildNetworkToggleRow(
            context,
            data: _RdeskNetworkToggleRowData(
              icon: Icons.security_outlined,
              accentColor: const Color(0xFFEF4444),
              title: '允许回退到不安全的 TLS 连接',
              description: '当现代加密标准不可用时允许降级连接（不推荐开启）',
              value: mainGetBoolOptionSync(kOptionAllowInsecureTLSFallback),
            ),
            onChanged: locked || isOptionFixed(kOptionAllowInsecureTLSFallback)
                ? null
                : (value) {
                    mainSetBoolOption(kOptionAllowInsecureTLSFallback, value);
                    setState(() {});
                  },
            showHint: true,
          ));
          if (!outgoingOnly) {
            final disableUdp = bind.mainGetOptionSync(key: kOptionDisableUdp) == 'Y';
            final directIp = option2bool(
                kOptionDirectServer, bind.mainGetOptionSync(key: kOptionDirectServer));
            strategyChildren.add(_buildNetworkToggleRow(
              context,
              data: _RdeskNetworkToggleRowData(
                icon: Icons.sync_alt_rounded,
                accentColor: const Color(0xFFF97316),
                title: '禁用 UDP',
                description: '强制使用 TCP 进行所有流媒体传输，可能会增加画面延迟',
                value: disableUdp,
              ),
              onChanged: locked || isOptionFixed(kOptionDisableUdp)
                  ? null
                  : (value) async {
                      await bind.mainSetOption(
                          key: kOptionDisableUdp, value: value ? 'Y' : 'N');
                      setState(() {});
                    },
              showHint: true,
            ));
            strategyChildren.add(_buildNetworkToggleRow(
              context,
              data: _RdeskNetworkToggleRowData(
                icon: Icons.wifi_tethering_outlined,
                accentColor: MyTheme.accent,
                title: '允许 IP 直连',
                description: '如果在同一局域网内，尝试直接通过 IP 连接以绕过中继服务器',
                value: directIp,
              ),
              onChanged: locked || isOptionFixed(kOptionDirectServer)
                  ? null
                  : (value) async {
                      await bind.mainSetOption(
                          key: kOptionDirectServer,
                          value: bool2option(kOptionDirectServer, value));
                      setState(() {});
                    },
              showHint: true,
            ));
          }
        }

        if (serverChildren.isEmpty && strategyChildren.isEmpty) {
          return const Offstage();
        }

        return Column(
          children: [
            if (serverChildren.isNotEmpty)
              _buildNetworkSectionCard(
                context,
                title: '服务器与路由',
                children: serverChildren,
              ),
            if (serverChildren.isNotEmpty && strategyChildren.isNotEmpty)
              const SizedBox(height: 28),
            if (strategyChildren.isNotEmpty)
              _buildNetworkSectionCard(
                context,
                title: '传输协议策略',
                children: strategyChildren,
              ),
          ],
        );
      },
    );
  }

  Widget _buildNetworkSectionCard(
    BuildContext context, {
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).textTheme.titleMedium?.color,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: _settingsBorderColor(context)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x080F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            children: [
              for (int i = 0; i < children.length; i++) ...[
                children[i],
                if (i != children.length - 1)
                  Divider(height: 1, color: _settingsBorderColor(context)),
              ]
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNetworkActionRow(
    BuildContext context, {
    required IconData icon,
    required Color accentColor,
    required String title,
    required String description,
    required Widget trailing,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.10),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 20, color: accentColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.72),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          trailing,
        ],
      ),
    );
  }

  Widget _buildNetworkToggleRow(
    BuildContext context, {
    required _RdeskNetworkToggleRowData data,
    required ValueChanged<bool>? onChanged,
    bool showHint = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: data.accentColor.withOpacity(0.10),
              shape: BoxShape.circle,
            ),
            child: Icon(data.icon, size: 20, color: data.accentColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        data.title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Theme.of(context).textTheme.titleMedium?.color,
                        ),
                      ),
                    ),
                    if (showHint) ...[
                      const SizedBox(width: 6),
                      Icon(
                        Icons.help_outline_rounded,
                        size: 14,
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color
                            ?.withOpacity(0.56),
                      ),
                    ]
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  data.description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.72),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Switch(value: data.value, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _Display extends StatefulWidget {
  const _Display({Key? key}) : super(key: key);

  @override
  State<_Display> createState() => _DisplayState();
}

class _DisplayState extends State<_Display> {
  @override
  Widget build(BuildContext context) {
    final scrollController = ScrollController();
    return _buildSettingsPageScaffold(
      context: context,
      controller: scrollController,
      title: '显示与控制',
      subtitle: '管理远程会话中的显示效果、隐私策略与控制行为',
      children: [
        _buildDisplayPerformanceSection(context),
        const SizedBox(height: 28),
        _buildSessionPrivacySection(context),
        const SizedBox(height: 28),
        _buildCursorControlSection(context),
        const SizedBox(height: 28),
        _buildWindowToolbarSection(context),
      ],
    );
  }

  Widget _buildDisplaySectionCard({
    required BuildContext context,
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).textTheme.titleMedium?.color,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: _settingsBorderColor(context)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x080F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              )
            ],
          ),
          child: Column(
            children: [
              for (int i = 0; i < children.length; i++) ...[
                children[i],
                if (i != children.length - 1)
                  Divider(height: 1, color: _settingsBorderColor(context)),
              ]
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDisplayRow({
    required BuildContext context,
    required String title,
    required String description,
    Widget? leading,
    required Widget trailing,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (leading != null) ...[
            leading,
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.72),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          trailing,
        ],
      ),
    );
  }

  Widget _buildDisplayOptionSelect(
    BuildContext context, {
    required List<String> keys,
    required List<String> values,
    required String initialKey,
    required ValueChanged<String> onChanged,
    bool enabled = true,
    double width = 240,
  }) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _settingsCardColor(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _settingsBorderColor(context)),
      ),
      child: ComboBox(
        keys: keys,
        values: values,
        initialKey: initialKey,
        onChanged: onChanged,
        enabled: enabled,
      ),
    );
  }

  Widget _buildToggleIconBubble(IconData icon) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: _isDarkSurface(context)
            ? const Color(0xFF2E3541)
            : const Color(0xFFF1F5F9),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 20, color: const Color(0xFF64748B)),
    );
  }

  Widget _buildSettingsSwitch({
    required bool value,
    required ValueChanged<bool>? onChanged,
  }) {
    return Switch(value: value, onChanged: onChanged);
  }

  Widget _buildMiniToggleRow({
    required BuildContext context,
    required String title,
    required bool value,
    required ValueChanged<bool>? onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),
          ),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }

  Widget _buildDisplayPerformanceSection(BuildContext context) {
    final viewStyleValue = bind.mainGetUserDefaultOption(key: kOptionViewStyle);
    final imageQualityValue = bind.mainGetUserDefaultOption(key: kOptionImageQuality);
    final codecValue = bind.mainGetUserDefaultOption(key: kOptionCodecPreference);
    final viewFixed = isOptionFixed(kOptionViewStyle);
    final qualityFixed = isOptionFixed(kOptionImageQuality);
    final codecFixed = isOptionFixed(kOptionCodecPreference);

    return _buildDisplaySectionCard(
      context: context,
      title: '显示与性能',
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '默认显示方式',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).textTheme.titleMedium?.color,
                      ),
                    ),
                    const SizedBox(height: 14),
                    _buildSettingsDisplaySegment(
                      context: context,
                      children: [
                        _buildSettingsDisplaySegmentItem(
                          context: context,
                          label: '原始尺寸',
                          selected: viewStyleValue == kRemoteViewStyleOriginal,
                          onTap: viewFixed
                              ? null
                              : () async {
                                  await bind.mainSetUserDefaultOption(
                                      key: kOptionViewStyle,
                                      value: kRemoteViewStyleOriginal);
                                  setState(() {});
                                },
                        ),
                        _buildSettingsDisplaySegmentItem(
                          context: context,
                          label: '适应窗口',
                          selected: viewStyleValue == kRemoteViewStyleAdaptive,
                          onTap: viewFixed
                              ? null
                              : () async {
                                  await bind.mainSetUserDefaultOption(
                                      key: kOptionViewStyle,
                                      value: kRemoteViewStyleAdaptive);
                                  setState(() {});
                                },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 28),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '默认图像质量',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).textTheme.titleMedium?.color,
                      ),
                    ),
                    const SizedBox(height: 14),
                    _buildDisplayOptionSelect(
                      context,
                      keys: [
                        kRemoteImageQualityBalanced,
                        kRemoteImageQualityBest,
                        kRemoteImageQualityLow,
                        kRemoteImageQualityCustom,
                      ],
                      values: const ['平衡模式（默认）', '高质量', '低延迟', '自定义'],
                      initialKey: imageQualityValue,
                      enabled: !qualityFixed,
                      onChanged: (value) async {
                        await bind.mainSetUserDefaultOption(
                            key: kOptionImageQuality, value: value);
                        setState(() {});
                      },
                      width: 346,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        _buildDisplayRow(
          context: context,
          title: '硬件编解码器',
          description: '手动指定传输协议编码',
          trailing: _buildDisplayOptionSelect(
            context,
            keys: const ['auto', 'h264', 'h265'],
            values: const ['自动选择（推荐）', 'H264', 'H265'],
            initialKey: codecValue,
            enabled: !codecFixed,
            onChanged: (value) async {
              await bind.mainSetUserDefaultOption(
                  key: kOptionCodecPreference, value: value);
              setState(() {});
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSessionPrivacySection(BuildContext context) {
    final viewOnly = bind.mainGetUserDefaultOption(key: kOptionViewOnly) == 'Y';
    final privacyMode = bind.mainGetUserDefaultOption(key: kOptionPrivacyMode) == 'Y';
    final fileCopy = bind.mainGetUserDefaultOption(key: kOptionEnableFileCopyPaste) == 'Y';
    final disableClipboard = bind.mainGetUserDefaultOption(key: kOptionDisableClipboard) == 'Y';
    final lockAfter = bind.mainGetUserDefaultOption(key: kOptionLockAfterSessionEnd) == 'Y';
    final persistentTerminal = bind.mainGetUserDefaultOption(key: kOptionTerminalPersistent) == 'Y';

    Future<void> setLocalToggle(String key, bool value) async {
      await bind.mainSetUserDefaultOption(
          key: key,
          value: value
              ? 'Y'
              : (key == kOptionEnableFileCopyPaste ? 'N' : defaultOptionNo));
      setState(() {});
    }

    return _buildDisplaySectionCard(
      context: context,
      title: '会话权限与隐私',
      children: [
        _buildDisplayRow(
          context: context,
          leading: _buildToggleIconBubble(Icons.visibility_outlined),
          title: '浏览模式（仅观看）',
          description: '仅接收画面，禁止主控端的鼠标和键盘输入',
          trailing: _buildSettingsSwitch(
            value: viewOnly,
            onChanged: isOptionFixed(kOptionViewOnly)
                ? null
                : (value) => setLocalToggle(kOptionViewOnly, value),
          ),
        ),
        _buildDisplayRow(
          context: context,
          leading: _buildToggleIconBubble(Icons.visibility_off_outlined),
          title: '隐私模式',
          description: '连接时被控端屏幕将熄屏，保护您的操作隐私',
          trailing: _buildSettingsSwitch(
            value: privacyMode,
            onChanged: isOptionFixed(kOptionPrivacyMode)
                ? null
                : (value) => setLocalToggle(kOptionPrivacyMode, value),
          ),
        ),
        _buildDisplayRow(
          context: context,
          leading: _buildToggleIconBubble(Icons.assignment_outlined),
          title: '剪贴板权限',
          description: '禁用剪贴板同步以阻断文本复制',
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 120,
                child: CheckboxListTile(
                  value: fileCopy,
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('允许文件拷贝', style: TextStyle(fontSize: 14)),
                  onChanged: isOptionFixed(kOptionEnableFileCopyPaste)
                      ? null
                      : (value) => setLocalToggle(
                          kOptionEnableFileCopyPaste, value ?? false),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 132,
                child: CheckboxListTile(
                  value: disableClipboard,
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('彻底禁用剪贴板', style: TextStyle(fontSize: 14)),
                  onChanged: isOptionFixed(kOptionDisableClipboard)
                      ? null
                      : (value) => setLocalToggle(
                          kOptionDisableClipboard, value ?? false),
                ),
              ),
            ],
          ),
        ),
        _buildDisplayRow(
          context: context,
          leading: _buildToggleIconBubble(Icons.lock_outline_rounded),
          title: '会话结束后锁定远程电脑',
          description: '会话结束后自动锁定远端，提高安全性',
          trailing: _buildSettingsSwitch(
            value: lockAfter,
            onChanged: isOptionFixed(kOptionLockAfterSessionEnd)
                ? null
                : (value) => setLocalToggle(kOptionLockAfterSessionEnd, value),
          ),
        ),
        _buildDisplayRow(
          context: context,
          leading: _buildToggleIconBubble(Icons.link_rounded),
          title: '断开连接时保持终端会话',
          description: '终端断开后仍保留会话上下文，便于稍后恢复',
          trailing: _buildSettingsSwitch(
            value: persistentTerminal,
            onChanged: isOptionFixed(kOptionTerminalPersistent)
                ? null
                : (value) => setLocalToggle(kOptionTerminalPersistent, value),
          ),
        ),
      ],
    );
  }

  Widget _buildCursorControlSection(BuildContext context) {
    final trackpadValue = int.tryParse(
            bind.mainGetUserDefaultOption(key: kKeyTrackpadSpeed)) ??
        kDefaultTrackpadSpeed;
    final showCursor = bind.mainGetUserDefaultOption(key: kOptionShowRemoteCursor) == 'Y';
    final followCursor = bind.mainGetUserDefaultOption(key: kOptionFollowRemoteCursor) == 'Y';
    final zoomCursor = bind.mainGetUserDefaultOption(key: kOptionZoomCursor) == 'Y';
    final reverseWheel = bind.mainGetUserDefaultOption(key: kKeyReverseMouseWheel) == 'Y';
    final swapButtons = bind.mainGetUserDefaultOption(key: kOptionSwapLeftRightMouse) == 'Y';

    Future<void> setLocalToggle(String key, bool value) async {
      await bind.mainSetUserDefaultOption(key: key, value: value ? 'Y' : defaultOptionNo);
      setState(() {});
    }

    final curSpeed = SimpleWrapper(trackpadValue);
    void onDebouncer(int v) {
      bind.mainSetUserDefaultOption(key: kKeyTrackpadSpeed, value: v.toString());
    }

    return _buildDisplaySectionCard(
      context: context,
      title: '光标与鼠标控制',
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 22, 24, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '默认触控板速度',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).textTheme.titleMedium?.color,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _settingsSubtleFill(context),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$trackpadValue%',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              TrackpadSpeedWidget(value: curSpeed, onDebouncer: onDebouncer),
              const SizedBox(height: 8),
              const Row(
                children: [
                  Text('慢', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                  Spacer(),
                  Text('快', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                ],
              ),
            ],
          ),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '显示远程光标',
          value: showCursor,
          onChanged: isOptionFixed(kOptionShowRemoteCursor)
              ? null
              : (value) => setLocalToggle(kOptionShowRemoteCursor, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '跟随远程光标',
          value: followCursor,
          onChanged: isOptionFixed(kOptionFollowRemoteCursor)
              ? null
              : (value) => setLocalToggle(kOptionFollowRemoteCursor, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '缩放光标',
          value: zoomCursor,
          onChanged: isOptionFixed(kOptionZoomCursor)
              ? null
              : (value) => setLocalToggle(kOptionZoomCursor, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '鼠标滚轮反向',
          value: reverseWheel,
          onChanged: isOptionFixed(kKeyReverseMouseWheel)
              ? null
              : (value) => setLocalToggle(kKeyReverseMouseWheel, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '交换鼠标左右键',
          value: swapButtons,
          onChanged: isOptionFixed(kOptionSwapLeftRightMouse)
              ? null
              : (value) => setLocalToggle(kOptionSwapLeftRightMouse, value),
        ),
      ],
    );
  }

  Widget _buildWindowToolbarSection(BuildContext context) {
    final scrollStyle = bind.mainGetUserDefaultOption(key: kOptionScrollStyle);
    final showDisplays = bind.mainGetUserDefaultOption(
            key: kKeyShowDisplaysAsIndividualWindows) ==
        'Y';
    final useAllDisplays = bind.mainGetUserDefaultOption(
            key: kKeyUseAllMyDisplaysForTheRemoteSession) ==
        'Y';
    final followWindow = bind.mainGetUserDefaultOption(key: kOptionFollowRemoteWindow) == 'Y';
    final showMonitors = bind.mainGetUserDefaultOption(key: kKeyShowMonitorsToolbar) == 'Y';
    final collapseToolbar = bind.mainGetUserDefaultOption(key: kOptionCollapseToolbar) == 'Y';
    final showQuality = bind.mainGetUserDefaultOption(key: kOptionShowQualityMonitor) == 'Y';

    Future<void> setLocalToggle(String key, bool value) async {
      await bind.mainSetUserDefaultOption(key: key, value: value ? 'Y' : defaultOptionNo);
      setState(() {});
    }

    return _buildDisplaySectionCard(
      context: context,
      title: '窗口与工具栏行为',
      children: [
        _buildDisplayRow(
          context: context,
          title: '默认滚动方式',
          description: '控制远程桌面的默认滚动与边缘滚动行为',
          trailing: _buildDisplayOptionSelect(
            context,
            keys: const [
              kRemoteScrollStyleAuto,
              kRemoteScrollStyleBar,
              kRemoteScrollStyleEdge,
            ],
            values: const ['自动滚动', '滚动条', '边缘滚动'],
            initialKey: scrollStyle,
            enabled: !isOptionFixed(kOptionScrollStyle),
            onChanged: (value) async {
              await bind.mainSetUserDefaultOption(key: kOptionScrollStyle, value: value);
              setState(() {});
            },
          ),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '跟随远程窗口焦点',
          value: followWindow,
          onChanged: isOptionFixed(kOptionFollowRemoteWindow)
              ? null
              : (value) => setLocalToggle(kOptionFollowRemoteWindow, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '在单个窗口中打开所有显示器',
          value: !showDisplays,
          onChanged: isOptionFixed(kKeyShowDisplaysAsIndividualWindows)
              ? null
              : (value) => setLocalToggle(kKeyShowDisplaysAsIndividualWindows, !value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '将我的所有显示器用于远程会话',
          value: useAllDisplays,
          onChanged: isOptionFixed(kKeyUseAllMyDisplaysForTheRemoteSession)
              ? null
              : (value) => setLocalToggle(kKeyUseAllMyDisplaysForTheRemoteSession, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '自动折叠工具栏',
          value: collapseToolbar,
          onChanged: isOptionFixed(kOptionCollapseToolbar)
              ? null
              : (value) => setLocalToggle(kOptionCollapseToolbar, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '在工具栏上显示监视器图标',
          value: showMonitors,
          onChanged: isOptionFixed(kKeyShowMonitorsToolbar)
              ? null
              : (value) => setLocalToggle(kKeyShowMonitorsToolbar, value),
        ),
        _buildMiniToggleRow(
          context: context,
          title: '显示实时网络与质量监测器',
          value: showQuality,
          onChanged: isOptionFixed(kOptionShowQualityMonitor)
              ? null
              : (value) => setLocalToggle(kOptionShowQualityMonitor, value),
        ),
      ],
    );
  }

  Widget viewStyle(BuildContext context) {
    final isOptFixed = isOptionFixed(kOptionViewStyle);
    onChanged(String value) async {
      await bind.mainSetUserDefaultOption(key: kOptionViewStyle, value: value);
      setState(() {});
    }

    final groupValue = bind.mainGetUserDefaultOption(key: kOptionViewStyle);
    return _Card(title: 'Default View Style', children: [
      _Radio(context,
          value: kRemoteViewStyleOriginal,
          groupValue: groupValue,
          label: 'Scale original',
          onChanged: isOptFixed ? null : onChanged),
      _Radio(context,
          value: kRemoteViewStyleAdaptive,
          groupValue: groupValue,
          label: 'Scale adaptive',
          onChanged: isOptFixed ? null : onChanged),
    ]);
  }

  Widget scrollStyle(BuildContext context) {
    final isOptFixed = isOptionFixed(kOptionScrollStyle);
    onChanged(String value) async {
      await bind.mainSetUserDefaultOption(
          key: kOptionScrollStyle, value: value);
      setState(() {});
    }

    final groupValue = bind.mainGetUserDefaultOption(key: kOptionScrollStyle);

    onEdgeScrollEdgeThicknessChanged(double value) async {
      await bind.mainSetUserDefaultOption(
          key: kOptionEdgeScrollEdgeThickness, value: value.round().toString());
      setState(() {});
    }

    return _Card(title: 'Default Scroll Style', children: [
      _Radio(context,
          value: kRemoteScrollStyleAuto,
          groupValue: groupValue,
          label: 'ScrollAuto',
          onChanged: isOptFixed ? null : onChanged),
      _Radio(context,
          value: kRemoteScrollStyleBar,
          groupValue: groupValue,
          label: 'Scrollbar',
          onChanged: isOptFixed ? null : onChanged),
      if (!isWeb) ...[
        _Radio(context,
            value: kRemoteScrollStyleEdge,
            groupValue: groupValue,
            label: 'ScrollEdge',
            onChanged: isOptFixed ? null : onChanged),
        Offstage(
            offstage: groupValue != kRemoteScrollStyleEdge,
            child: EdgeThicknessControl(
              value: double.tryParse(bind.mainGetUserDefaultOption(
                      key: kOptionEdgeScrollEdgeThickness)) ??
                  100.0,
              onChanged: isOptionFixed(kOptionEdgeScrollEdgeThickness)
                  ? null
                  : onEdgeScrollEdgeThicknessChanged,
            )),
      ],
    ]);
  }

  Widget imageQuality(BuildContext context) {
    onChanged(String value) async {
      await bind.mainSetUserDefaultOption(
          key: kOptionImageQuality, value: value);
      setState(() {});
    }

    final isOptFixed = isOptionFixed(kOptionImageQuality);
    final groupValue = bind.mainGetUserDefaultOption(key: kOptionImageQuality);
    return _Card(title: 'Default Image Quality', children: [
      _Radio(context,
          value: kRemoteImageQualityBest,
          groupValue: groupValue,
          label: 'Good image quality',
          onChanged: isOptFixed ? null : onChanged),
      _Radio(context,
          value: kRemoteImageQualityBalanced,
          groupValue: groupValue,
          label: 'Balanced',
          onChanged: isOptFixed ? null : onChanged),
      _Radio(context,
          value: kRemoteImageQualityLow,
          groupValue: groupValue,
          label: 'Optimize reaction time',
          onChanged: isOptFixed ? null : onChanged),
      _Radio(context,
          value: kRemoteImageQualityCustom,
          groupValue: groupValue,
          label: 'Custom',
          onChanged: isOptFixed ? null : onChanged),
      Offstage(
        offstage: groupValue != kRemoteImageQualityCustom,
        child: customImageQualitySetting(),
      )
    ]);
  }

  Widget trackpadSpeed(BuildContext context) {
    final initSpeed =
        (int.tryParse(bind.mainGetUserDefaultOption(key: kKeyTrackpadSpeed)) ??
            kDefaultTrackpadSpeed);
    final curSpeed = SimpleWrapper(initSpeed);
    void onDebouncer(int v) {
      bind.mainSetUserDefaultOption(
          key: kKeyTrackpadSpeed, value: v.toString());
      // It's better to notify all sessions that the default speed is changed.
      // But it may also be ok to take effect in the next connection.
    }

    return _Card(title: 'Default trackpad speed', children: [
      TrackpadSpeedWidget(
        value: curSpeed,
        onDebouncer: onDebouncer,
      ),
    ]);
  }

  Widget codec(BuildContext context) {
    onChanged(String value) async {
      await bind.mainSetUserDefaultOption(
          key: kOptionCodecPreference, value: value);
      setState(() {});
    }

    final groupValue =
        bind.mainGetUserDefaultOption(key: kOptionCodecPreference);
    var hwRadios = [];
    final isOptFixed = isOptionFixed(kOptionCodecPreference);
    try {
      final Map codecsJson = jsonDecode(bind.mainSupportedHwdecodings());
      final h264 = codecsJson['h264'] ?? false;
      final h265 = codecsJson['h265'] ?? false;
      if (h264) {
        hwRadios.add(_Radio(context,
            value: 'h264',
            groupValue: groupValue,
            label: 'H264',
            onChanged: isOptFixed ? null : onChanged));
      }
      if (h265) {
        hwRadios.add(_Radio(context,
            value: 'h265',
            groupValue: groupValue,
            label: 'H265',
            onChanged: isOptFixed ? null : onChanged));
      }
    } catch (e) {
      debugPrint("failed to parse supported hwdecodings, err=$e");
    }
    return _Card(title: 'Default Codec', children: [
      _Radio(context,
          value: 'auto',
          groupValue: groupValue,
          label: 'Auto',
          onChanged: isOptFixed ? null : onChanged),
      ...hwRadios,
    ]);
  }

  Widget privacyModeImpl(BuildContext context) {
    final supportedPrivacyModeImpls = bind.mainSupportedPrivacyModeImpls();
    late final List<dynamic> privacyModeImpls;
    try {
      privacyModeImpls = jsonDecode(supportedPrivacyModeImpls);
    } catch (e) {
      debugPrint('failed to parse supported privacy mode impls, err=$e');
      return Offstage();
    }
    if (privacyModeImpls.length < 2) {
      return Offstage();
    }

    final key = 'privacy-mode-impl-key';
    onChanged(String value) async {
      await bind.mainSetOption(key: key, value: value);
      setState(() {});
    }

    String groupValue = bind.mainGetOptionSync(key: key);
    if (groupValue.isEmpty) {
      groupValue = bind.mainDefaultPrivacyModeImpl();
    }
    return _Card(
      title: 'Privacy mode',
      children: privacyModeImpls.map((impl) {
        final d = impl as List<dynamic>;
        return _Radio(context,
            value: d[0] as String,
            groupValue: groupValue,
            label: d[1] as String,
            onChanged: onChanged);
      }).toList(),
    );
  }

  Widget otherRow(String label, String key) {
    final value = bind.mainGetUserDefaultOption(key: key) == 'Y';
    final isOptFixed = isOptionFixed(key);
    onChanged(bool b) async {
      await bind.mainSetUserDefaultOption(
          key: key,
          value: b
              ? 'Y'
              : (key == kOptionEnableFileCopyPaste ? 'N' : defaultOptionNo));
      setState(() {});
    }

    return GestureDetector(
        child: Row(
          children: [
            Checkbox(
                    value: value,
                    onChanged: isOptFixed ? null : (_) => onChanged(!value))
                .marginOnly(right: 5),
            Expanded(
              child: Text(translate(label)),
            )
          ],
        ).marginOnly(left: _kCheckBoxLeftMargin),
        onTap: isOptFixed ? null : () => onChanged(!value));
  }

  Widget other(BuildContext context) {
    final children =
        otherDefaultSettings().map((e) => otherRow(e.$1, e.$2)).toList();
    return _Card(title: 'Other Default Options', children: children);
  }
}

class _Account extends StatefulWidget {
  const _Account({Key? key}) : super(key: key);

  @override
  State<_Account> createState() => _AccountState();
}

class _AccountState extends State<_Account> {
  late final TextEditingController _upgradeUrlController;
  late final TextEditingController _supportUrlController;

  @override
  void initState() {
    super.initState();
    _upgradeUrlController =
        TextEditingController(text: bind.mainGetOptionSync(key: _kMembershipUpgradeUrl));
    _supportUrlController =
        TextEditingController(text: bind.mainGetOptionSync(key: _kMembershipSupportUrl));
    Future.delayed(const Duration(milliseconds: 50), () {
      if (mounted && gFFI.userModel.userName.value.isNotEmpty) {
        gFFI.userModel.refreshCurrentUser();
      }
    });
  }

  @override
  void dispose() {
    _upgradeUrlController.dispose();
    _supportUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scrollController = ScrollController();
    return _buildSettingsPageScaffold(
      context: context,
      controller: scrollController,
      title: '账户管理',
      subtitle: '查看会员、设备绑定情况与账户操作入口',
      children: [
        _buildAccountManagement(context),
      ],
    );
  }

  Widget _buildAccountManagement(BuildContext context) {
    return Obx(() {
      final isLogin = gFFI.userModel.userName.value.isNotEmpty;
      if (!isLogin) {
        return _Card(
          title: '账户中心',
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '当前尚未登录账户，登录后可同步会员权益与设备信息。',
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color
                          ?.withOpacity(0.72),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _Button('登录', loginDialog),
                ],
              ),
            )
          ],
        );
      }

      return futureBuilder(
          future: _buildAccountSummary(),
          hasData: (data) {
            final summary = data as _RdeskAccountSummaryData;
            final expiryCard = _RdeskAccountStatCardData(
              title: '订阅计划',
              description: summary.active
                  ? '您的${summary.planLabel}将于 ${gFFI.userModel.membershipExpiresAt.value.isEmpty ? '-' : gFFI.userModel.membershipExpiresAt.value} 到期。'
                  : '当前账号尚未开通或会员已过期。',
              primaryValue: gFFI.userModel.membershipExpiresAt.value.isEmpty
                  ? '-'
                  : gFFI.userModel.membershipExpiresAt.value,
              secondaryValue: summary.active ? '立即续费' : '去开通会员',
            );
            const devicesCard = _RdeskAccountStatCardData(
              title: '已绑定设备',
              description: '可在多台设备上登录此账号以同步地址簿。',
              primaryValue: '4',
              secondaryValue: '管理设备',
            );

            return Column(
              children: [
                _buildAccountHero(context, summary),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: _buildAccountStatCard(
                        context,
                        data: expiryCard,
                        icon: Icons.workspace_premium_outlined,
                        accentColor: MyTheme.accent,
                        secondarySuffix: '',
                        onTap: () async {
                          final url = await bind.mainGetOption(key: _kMembershipUpgradeUrl);
                          if (url.trim().isNotEmpty) {
                            _showRenewConfirmDialog(context, summary, url.trim());
                          } else {
                            _showConfigUrlDialog(context, '会员续费链接', _kMembershipUpgradeUrl);
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildAccountStatCard(
                        context,
                        data: devicesCard,
                        icon: Icons.devices_other_outlined,
                        accentColor: const Color(0xFF10B981),
                        secondarySuffix: '/ 100 台',
                        onTap: () async {
                          _showDeviceManagementDialog(context);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildLogoutDangerCard(context),
              ],
            );
          });
    });
  }

  Future<_RdeskAccountSummaryData> _buildAccountSummary() async {
    final displayName = gFFI.userModel.userName.value;
    final email = '${displayName.toLowerCase()}@company.com';
    final serverId = await bind.mainGetMyId();
    final planName = gFFI.userModel.membershipPlanName.value.isEmpty
        ? '免费版'
        : gFFI.userModel.membershipPlanName.value;
    return _RdeskAccountSummaryData(
      displayName: displayName,
      email: email,
      idLabel: formatID(serverId),
      planLabel: planName,
      active: gFFI.userModel.membershipActive.value,
      daysLeft: gFFI.userModel.membershipDaysLeft.value,
    );
  }

  Widget _buildAccountHero(
    BuildContext context,
    _RdeskAccountSummaryData summary,
  ) {
    final badgeText = summary.active
        ? '${summary.planLabel} (${summary.planLabel == '免费版' ? 'Free' : 'Pro'})'
        : '${summary.planLabel} (Expired)';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(32, 28, 32, 28),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2F64E9), Color(0xFF4B43D2)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x223B82F6),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.12),
              border: Border.all(color: Colors.white.withOpacity(0.25)),
            ),
            child: Text(
              summary.displayName.isEmpty ? 'R' : summary.displayName.characters.first,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 28),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        summary.displayName,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFBBF24),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badgeText,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF4A2C00),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  summary.email,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.16)),
                  ),
                  child: Text(
                    'ID: ${summary.idLabel}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white.withOpacity(0.95),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          OutlinedButton(
            onPressed: () => showToast('编辑资料功能待接入'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: BorderSide(color: Colors.white.withOpacity(0.28)),
              backgroundColor: Colors.white.withOpacity(0.08),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              '编辑资料',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountStatCard(
    BuildContext context, {
    required _RdeskAccountStatCardData data,
    required IconData icon,
    required Color accentColor,
    required Future<void> Function() onTap,
    required String secondarySuffix,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
      decoration: BoxDecoration(
        color: _settingsCardColor(context),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _settingsBorderColor(context)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x080F172A),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 22, color: accentColor),
              const SizedBox(width: 10),
              Text(
                data.title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            data.description,
            style: TextStyle(
              fontSize: 13,
              height: 1.45,
              color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.72),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                data.primaryValue,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).textTheme.titleLarge?.color,
                ),
              ),
              if (secondarySuffix.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 6, bottom: 2),
                  child: Text(
                    secondarySuffix,
                    style: TextStyle(
                      fontSize: 13,
                      color: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color
                          ?.withOpacity(0.58),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: onTap,
              style: TextButton.styleFrom(
                backgroundColor: _settingsSubtleFill(context),
                foregroundColor: MyTheme.accent,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                data.secondaryValue,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 立即续费 – 续费确认弹窗
  void _showRenewConfirmDialog(
    BuildContext context,
    _RdeskAccountSummaryData summary,
    String renewUrl,
  ) {
    showDialog(
      context: context,
      builder: (ctx) {
        return material.Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Container(
            width: 440,
            padding: const EdgeInsets.all(0),
            decoration: BoxDecoration(
              color: _settingsCardColor(context),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: _settingsBorderColor(context)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(28, 24, 28, 20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF2F64E9), Color(0xFF4B43D2)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(28),
                      topRight: Radius.circular(28),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.workspace_premium_rounded,
                            size: 26, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            summary.active ? '续费订阅' : '开通会员',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Rdesk 会员计划',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.78),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Body
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 24, 28, 12),
                  child: Column(
                    children: [
                      _renewInfoRow('当前套餐', summary.planLabel),
                      if (summary.active && gFFI.userModel.membershipExpiresAt.value.isNotEmpty)
                        _renewInfoRow('到期时间', gFFI.userModel.membershipExpiresAt.value),
                      if (summary.active)
                        _renewInfoRow('剩余天数', '${summary.daysLeft} 天'),
                      _renewInfoRow('状态', summary.active ? '有效' : '已过期/未开通'),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFFED7AA)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline_rounded,
                                size: 18, color: Color(0xFFF59E0B)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                summary.active
                                    ? '续费后有效期将自动延长，不影响当前使用。'
                                    : '开通会员后即可解锁全部高级功能。',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF92400E),
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Actions
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 8, 28, 24),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Theme.of(context).textTheme.bodyMedium?.color,
                            side: BorderSide(color: _settingsBorderColor(context)),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text('取消',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            Navigator.of(ctx).pop();
                            await launchUrlString(renewUrl);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MyTheme.accent,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          icon: const Icon(Icons.open_in_new_rounded, size: 18),
                          label: Text(
                            summary.active ? '前往续费' : '前往开通',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 15),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _renewInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.6),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).textTheme.titleMedium?.color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 管理设备 – 设备管理弹窗
  void _showDeviceManagementDialog(BuildContext context) {
    // Mock device list – in production, fetch from server API
    final devices = <_RdeskDeviceInfo>[
      _RdeskDeviceInfo(
        name: '我的电脑 (当前设备)',
        platform: 'Windows 11',
        icon: Icons.desktop_windows_rounded,
        lastActive: '在线',
        isCurrent: true,
        id: 'dev-001',
      ),
      _RdeskDeviceInfo(
        name: '办公室台式机',
        platform: 'Windows 10',
        icon: Icons.desktop_windows_rounded,
        lastActive: '2天前',
        isCurrent: false,
        id: 'dev-002',
      ),
      _RdeskDeviceInfo(
        name: 'MacBook Pro',
        platform: 'macOS 14.2',
        icon: Icons.laptop_mac_rounded,
        lastActive: '5小时前',
        isCurrent: false,
        id: 'dev-003',
      ),
      _RdeskDeviceInfo(
        name: 'Linux Server',
        platform: 'Ubuntu 22.04',
        icon: Icons.dns_rounded,
        lastActive: '1周前',
        isCurrent: false,
        id: 'dev-004',
      ),
    ];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx2, setDialogState) {
            return material.Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
              child: Container(
                width: 520,
                constraints: const BoxConstraints(maxHeight: 600),
                decoration: BoxDecoration(
                  color: _settingsCardColor(context),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: _settingsBorderColor(context)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(28, 24, 28, 20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF059669), Color(0xFF10B981)],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(28),
                          topRight: Radius.circular(28),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.devices_rounded,
                                size: 26, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '设备管理',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '已绑定 ${devices.length} / 100 台设备',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.white.withOpacity(0.78),
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            icon: Icon(Icons.close_rounded,
                                color: Colors.white.withOpacity(0.8)),
                          ),
                        ],
                      ),
                    ),
                    // Device list
                    Flexible(
                      child: ListView.separated(
                        shrinkWrap: true,
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                        itemCount: devices.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, index) {
                          final dev = devices[index];
                          return Container(
                            padding: const EdgeInsets.fromLTRB(18, 16, 14, 16),
                            decoration: BoxDecoration(
                              color: dev.isCurrent
                                  ? const Color(0xFFF0FDF4)
                                  : _settingsCardColor(context),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: dev.isCurrent
                                    ? const Color(0xFFBBF7D0)
                                    : _settingsBorderColor(context),
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: dev.isCurrent
                                        ? const Color(0xFF10B981).withOpacity(0.12)
                                        : _settingsSubtleFill(context),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(dev.icon,
                                      size: 22,
                                      color: dev.isCurrent
                                          ? const Color(0xFF10B981)
                                          : const Color(0xFF64748B)),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Flexible(
                                            child: Text(
                                              dev.name,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w700,
                                                color: Theme.of(context)
                                                    .textTheme
                                                    .titleMedium
                                                    ?.color,
                                              ),
                                            ),
                                          ),
                                          if (dev.isCurrent) ...[
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF10B981),
                                                borderRadius:
                                                    BorderRadius.circular(999),
                                              ),
                                              child: const Text(
                                                '当前',
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w700,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${dev.platform}  ·  ${dev.lastActive}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.color
                                              ?.withOpacity(0.6),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!dev.isCurrent)
                                  TextButton(
                                    onPressed: () {
                                      _showUnbindConfirmDialog(ctx2, dev, () {
                                        setDialogState(() {
                                          devices.removeAt(index);
                                        });
                                      });
                                    },
                                    style: TextButton.styleFrom(
                                      foregroundColor: const Color(0xFFEF4444),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 14, vertical: 10),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                    child: const Text(
                                      '解绑',
                                      style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    // Footer
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F9FF),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFBAE6FD)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline_rounded,
                                size: 18, color: Color(0xFF0284C7)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                '解绑设备后，该设备将无法继续使用会员同步功能。解绑不影响设备上已有数据。',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF0369A1),
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showUnbindConfirmDialog(
    BuildContext parentCtx,
    _RdeskDeviceInfo device,
    VoidCallback onConfirm,
  ) {
    showDialog(
      context: parentCtx,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.link_off_rounded,
                    size: 18, color: Color(0xFFEF4444)),
              ),
              const SizedBox(width: 12),
              const Text('确认解绑设备',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '确定要解绑「${device.name}」吗？',
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 8),
              Text(
                '解绑后该设备将无法使用会员同步功能，地址簿数据仍保留。',
                style: TextStyle(
                  fontSize: 13,
                  color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.6),
                  height: 1.4,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                onConfirm();
                showToast('设备「${device.name}」已解绑');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('确认解绑',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        );
      },
    );
  }

  /// URL未配置时 – 引导用户配置链接
  void _showConfigUrlDialog(
    BuildContext context,
    String labelName,
    String optionKey,
  ) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) {
        return material.Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Container(
            width: 420,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: _settingsCardColor(context),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: _settingsBorderColor(context)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.link_rounded,
                          size: 20, color: Color(0xFFF59E0B)),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      '配置$labelName',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).textTheme.titleLarge?.color,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  '当前尚未配置$labelName，请输入链接地址:',
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.7),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: 'https://your-domain.com/...',
                    filled: true,
                    fillColor: _settingsSubtleFill(context),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: _settingsBorderColor(context)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: _settingsBorderColor(context)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: MyTheme.accent, width: 1.5),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('取消'),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () async {
                        final value = controller.text.trim();
                        if (value.isEmpty) {
                          showToast('请输入有效链接');
                          return;
                        }
                        await bind.mainSetOption(key: optionKey, value: value);
                        Navigator.of(ctx).pop();
                        showToast('已保存');
                        await launchUrlString(value);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MyTheme.accent,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('保存并打开',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLogoutDangerCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
      decoration: BoxDecoration(
        color: _settingsCardColor(context),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '退出登录',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFEF4444),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '退出后本机将失去会员同步与地址簿同步能力。',
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.72),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          OutlinedButton.icon(
            onPressed: logOutConfirmDialog,
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFEF4444),
              side: const BorderSide(color: Color(0xFFFECACA)),
              backgroundColor: const Color(0xFFFFF5F5),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            icon: const Icon(Icons.logout_rounded),
            label: const Text(
              '退出账户',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget accountAction() {
    return Obx(() => _Button(
        gFFI.userModel.userName.value.isEmpty ? 'Login' : 'Logout',
        () => {
              gFFI.userModel.userName.value.isEmpty
                  ? loginDialog()
                  : logOutConfirmDialog()
            }));
  }

  Widget useInfo() {
    text(String key, String value) {
      return Align(
        alignment: Alignment.centerLeft,
        child: SelectionArea(child: Text('${translate(key)}: $value'))
            .marginSymmetric(vertical: 4),
      );
    }

    return Obx(() => Offstage(
          offstage: gFFI.userModel.userName.value.isEmpty,
          child: Column(
            children: [
              text('Username', gFFI.userModel.userName.value),
              if (gFFI.userModel.membershipPlanName.value.isNotEmpty)
                text('Membership',
                    '${gFFI.userModel.membershipPlanName.value} (${gFFI.userModel.membershipActive.value ? 'Active' : 'Expired'})'),
              if (gFFI.userModel.membershipExpiresAt.value.isNotEmpty)
                text('Expires', gFFI.userModel.membershipExpiresAt.value),
              if (gFFI.userModel.membershipPlanName.value.isNotEmpty)
                text('Days remaining',
                    gFFI.userModel.membershipDaysLeft.value.toString()),
              // text('Group', gFFI.groupModel.groupName.value),
            ],
          ),
        )).marginOnly(left: 18, top: 16);
  }

  Widget membershipCenter() {
    final textColor = Theme.of(context).textTheme.bodyMedium?.color;
    return Obx(() {
      if (gFFI.userModel.userName.value.isEmpty) {
        return const Offstage();
      }
      final features = gFFI.userModel.enabledMembershipFeatureLabels;
      final planName = gFFI.userModel.membershipPlanName.value;
      final active = gFFI.userModel.membershipActive.value;
      final daysLeft = gFFI.userModel.membershipDaysLeft.value;
      final isExpiringSoon = active && daysLeft > 0 && daysLeft <= 7;
      final status = active
          ? (isExpiringSoon ? '即将到期' : '已开通')
          : '未开通/已过期';
      final statusColor = active
          ? (isExpiringSoon ? Colors.orange : Colors.green)
          : Colors.redAccent;
      final bannerText = !active
          ? '当前会员未生效，部分高级功能将不可用。'
          : isExpiringSoon
              ? '会员即将在 $daysLeft 天内到期，请及时续费。'
              : '会员状态正常，当前高级功能可继续使用。';
      final bannerBg = !active
          ? Colors.redAccent.withOpacity(0.08)
          : isExpiringSoon
              ? Colors.orange.withOpacity(0.10)
              : Colors.green.withOpacity(0.08);
      return Container(
        margin: const EdgeInsets.only(left: 18, top: 18, right: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Theme.of(context).cardColor,
          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.workspace_premium_rounded, color: statusColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  '会员中心',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: textColor),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: bannerBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    active
                        ? (isExpiringSoon
                            ? Icons.schedule_rounded
                            : Icons.verified_rounded)
                        : Icons.warning_amber_rounded,
                    color: statusColor,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      bannerText,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: statusColor,
                        fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  borderRadius: BorderRadius.circular(999),
                  onTap: () => gFFI.userModel.refreshCurrentUser(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).dividerColor.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.refresh_rounded,
                            size: 14,
                            color: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.color
                                ?.withOpacity(0.7)),
                        const SizedBox(width: 4),
                        Text(
                          '刷新会员状态',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.color
                                ?.withOpacity(0.75),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            ),
            const SizedBox(height: 12),
            _membershipRow('当前套餐', planName.isEmpty ? '免费版' : planName),
            _membershipRow('到期时间', gFFI.userModel.membershipExpiresAt.value.isEmpty ? '-' : gFFI.userModel.membershipExpiresAt.value),
            _membershipRow('剩余天数', planName.isEmpty ? '0' : gFFI.userModel.membershipDaysLeft.value.toString()),
            const SizedBox(height: 12),
            Text(
              '已开通权益',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: textColor?.withOpacity(0.75)),
            ),
            const SizedBox(height: 8),
            if (features.isEmpty)
              Text('当前暂无高级会员权益', style: TextStyle(fontSize: 13, color: textColor?.withOpacity(0.55)))
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: features
                    .map((e) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            e,
                            style: const TextStyle(fontSize: 12, color: Colors.blue, fontWeight: FontWeight.w500),
                          ),
                        ))
                    .toList(),
              ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _membershipActionButton(
                  label: active ? (isExpiringSoon ? '去续费' : '查看续费入口') : '去开通会员',
                  primary: true,
                  onTap: () async {
                    final url = await bind.mainGetOption(key: _kMembershipUpgradeUrl);
                    if (url.trim().isNotEmpty) {
                      await launchUrlString(url.trim());
                    } else {
                      showToast('请先在客户端配置会员续费链接');
                    }
                  },
                ),
                _membershipActionButton(
                  label: '联系管理员',
                  onTap: () async {
                    final url = await bind.mainGetOption(key: _kMembershipSupportUrl);
                    if (url.trim().isNotEmpty) {
                      await launchUrlString(url.trim());
                    } else {
                      showToast('请先在客户端配置管理员联系链接');
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      );
    });
  }

  Widget _membershipActionButton({
    required String label,
    required Future<void> Function() onTap,
    bool primary = false,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: primary ? _accentColor : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: primary ? _accentColor : Theme.of(context).dividerColor.withOpacity(0.5),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: primary ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color,
          ),
        ),
      ),
    );
  }

  Widget _membershipRow(String label, String value) {
    final color = Theme.of(context).textTheme.bodyMedium?.color;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Text(
              '$label:',
              style: TextStyle(fontSize: 13, color: color?.withOpacity(0.55)),
            ),
          ),
          Expanded(
            child: SelectionArea(
              child: Text(
                value,
                style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w500),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget membershipLinks() {
    final textColor = Theme.of(context).textTheme.bodyMedium?.color;
    Future<void> saveLink(String key, String value) async {
      await bind.mainSetOption(key: key, value: value.trim());
      showToast('已保存');
    }

    return Container(
      margin: const EdgeInsets.only(left: 18, top: 16, right: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '会员入口配置',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textColor),
          ),
          const SizedBox(height: 10),
          _membershipLinkField(
            title: '续费链接',
            hint: 'https://your-domain.com/pricing',
            controller: _upgradeUrlController,
            onSave: () => saveLink(_kMembershipUpgradeUrl, _upgradeUrlController.text),
          ),
          const SizedBox(height: 12),
          _membershipLinkField(
            title: '联系管理员链接',
            hint: 'https://your-domain.com/support',
            controller: _supportUrlController,
            onSave: () => saveLink(_kMembershipSupportUrl, _supportUrlController.text),
          ),
        ],
      ),
    );
  }

  Widget _membershipLinkField({
    required String title,
    required String hint,
    required TextEditingController controller,
    required Future<void> Function() onSave,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: hint,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: onSave,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('保存'),
            ),
          ],
        ),
      ],
    );
  }
}

class _Checkbox extends StatefulWidget {
  final String label;
  final bool Function() getValue;
  final Future<void> Function(bool) setValue;

  const _Checkbox(
      {Key? key,
      required this.label,
      required this.getValue,
      required this.setValue})
      : super(key: key);

  @override
  State<_Checkbox> createState() => _CheckboxState();
}

class _CheckboxState extends State<_Checkbox> {
  var value = false;

  @override
  initState() {
    super.initState();
    value = widget.getValue();
  }

  @override
  Widget build(BuildContext context) {
    onChanged(bool b) async {
      await widget.setValue(b);
      setState(() {
        value = widget.getValue();
      });
    }

    return GestureDetector(
      child: Row(
        children: [
          Expanded(
            child: Text(
              translate(widget.label),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
          Switch(
            value: value,
            onChanged: (_) => onChanged(!value),
          ),
        ],
      ).marginOnly(left: _kCheckBoxLeftMargin),
      onTap: () => onChanged(!value),
    );
  }
}

class _Plugin extends StatefulWidget {
  const _Plugin({Key? key}) : super(key: key);

  @override
  State<_Plugin> createState() => _PluginState();
}

class _PluginState extends State<_Plugin> {
  @override
  Widget build(BuildContext context) {
    bind.pluginListReload();
    final scrollController = ScrollController();
    return ChangeNotifierProvider.value(
      value: pluginManager,
      child: Consumer<PluginManager>(builder: (context, model, child) {
        final children = model.plugins.isEmpty
            ? <Widget>[
                _Card(title: 'Plugins', children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
                    child: Text(
                      '当前没有可显示的插件。',
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color
                            ?.withOpacity(0.72),
                      ),
                    ),
                  )
                ])
              ]
            : model.plugins.map((entry) => pluginCard(entry)).toList();
        return _buildSettingsPageScaffold(
          context: context,
          controller: scrollController,
          title: '插件',
          subtitle: '查看并管理已安装的扩展组件',
          children: children,
        );
      }),
    );
  }

  Widget pluginCard(PluginInfo plugin) {
    return ChangeNotifierProvider.value(
      value: plugin,
      child: Consumer<PluginInfo>(
        builder: (context, model, child) => DesktopSettingsCard(plugin: model),
      ),
    );
  }

  Widget accountAction() {
    return Obx(() => _Button(
        gFFI.userModel.userName.value.isEmpty ? 'Login' : 'Logout',
        () => {
              gFFI.userModel.userName.value.isEmpty
                  ? loginDialog()
                  : logOutConfirmDialog()
            }));
  }
}

class _Printer extends StatefulWidget {
  const _Printer({super.key});

  @override
  State<_Printer> createState() => __PrinterState();
}

class __PrinterState extends State<_Printer> {
  @override
  Widget build(BuildContext context) {
    final scrollController = ScrollController();
    return _buildSettingsPageScaffold(
      context: context,
      controller: scrollController,
      title: '打印机设置',
      subtitle: '配置传入与传出打印作业的默认行为',
      children: [
        outgoing(context),
        const SizedBox(height: 28),
        incoming(context),
      ],
    );
  }

  Widget outgoing(BuildContext context) {
    final isSupportPrinterDriver =
        bind.mainGetCommonSync(key: 'is-support-printer-driver') == 'true';

    Widget tipOsNotSupported() {
      return _buildPrinterNoticeCard(
        context,
        icon: Icons.error_outline_rounded,
        title: '当前系统暂不支持 Rdesk 打印机驱动',
        description: translate('printer-os-requirement-tip'),
        color: const Color(0xFFF97316),
      );
    }

    Widget tipClientNotInstalled() {
      return _buildPrinterNoticeCard(
        context,
        icon: Icons.info_outline_rounded,
        title: '请先安装 Rdesk 客户端',
        description: translate('printer-requires-installed-{$appName}-client-tip'),
        color: const Color(0xFF2563EB),
      );
    }

    Widget tipPrinterNotInstalled() {
      final failedMsg = ''.obs;
      platformFFI.registerEventHandler(
          'install-printer-res', 'install-printer-res', (evt) async {
        if (evt['success'] as bool) {
          setState(() {});
        } else {
          failedMsg.value = evt['msg'] as String;
        }
      }, replace: true);
      return Obx(() => Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            decoration: BoxDecoration(
              color: _settingsCardColor(context),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: _settingsBorderColor(context)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x080F172A),
                  blurRadius: 14,
                  offset: Offset(0, 6),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFF7ED),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.error_outline_rounded,
                          color: Color(0xFFF97316)),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '未安装 Rdesk 打印机',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            failedMsg.value.isEmpty
                                ? translate('printer-{$appName}-not-installed-tip')
                                : failedMsg.value,
                            style: TextStyle(
                              fontSize: 13,
                              color: failedMsg.value.isEmpty
                                  ? Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.color
                                      ?.withOpacity(0.72)
                                  : Colors.red,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      failedMsg.value = '';
                      bind.mainSetCommon(key: 'install-printer', value: '');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: MyTheme.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    icon: const Icon(Icons.install_desktop_outlined),
                    label: const Text(
                      '安装 Rdesk 打印机',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ));
    }

    Widget tipReady() {
      return _buildPrinterNoticeCard(
        context,
        icon: Icons.check_circle_outline_rounded,
        title: 'Rdesk 打印机已安装',
        description: translate('printer-{$appName}-ready-tip'),
        color: const Color(0xFF10B981),
      );
    }

    final installed = bind.mainIsInstalled();
    // `is-printer-installed` may fail, but it's rare case.
    // Add additional error message here if it's really needed.
    final isPrinterInstalled =
        bind.mainGetCommonSync(key: 'is-printer-installed') == 'true';

    final List<Widget> children = [];
    if (!isSupportPrinterDriver) {
      children.add(tipOsNotSupported());
    } else {
      children.addAll([
        if (!installed) tipClientNotInstalled(),
        if (installed && !isPrinterInstalled) tipPrinterNotInstalled(),
        if (installed && isPrinterInstalled) tipReady()
      ]);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            '传出的打印任务',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).textTheme.titleMedium?.color,
            ),
          ),
        ),
        ...children,
      ],
    );
  }

  Widget incoming(BuildContext context) {
    onRadioChanged(String value) async {
      await bind.mainSetLocalOption(
          key: kKeyPrinterIncomingJobAction, value: value);
      setState(() {});
    }

    PrinterOptions printerOptions = PrinterOptions.load();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            '传入的打印任务',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).textTheme.titleMedium?.color,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: _settingsBorderColor(context)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x080F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              )
            ],
          ),
          child: Column(
            children: [
              const SizedBox(height: 8),
              _buildIncomingPrinterOptionCard(
                context,
                value: kValuePrinterIncomingJobDismiss,
                groupValue: printerOptions.action,
                title: '拒绝',
                description: '不允许其他设备连接到本机的打印机',
                onChanged: onRadioChanged,
              ),
              _buildIncomingPrinterOptionCard(
                context,
                value: kValuePrinterIncomingJobDefault,
                groupValue: printerOptions.action,
                title: '使用默认的打印机执行',
                description: '自动路由中到系统默认的首选打印机',
                onChanged: onRadioChanged,
                selectedStyle: true,
              ),
              _buildIncomingPrinterOptionCard(
                context,
                value: kValuePrinterIncomingJobSelected,
                groupValue: printerOptions.action,
                title: '使用选择的打印机执行',
                description: '手动指定一个接收传入任务的打印设备',
                onChanged: onRadioChanged,
              ),
              if (printerOptions.printerNames.isNotEmpty &&
                  printerOptions.action == kValuePrinterIncomingJobSelected)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _settingsCardColor(context),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _settingsBorderColor(context)),
                    ),
                    child: ComboBox(
                      initialKey: printerOptions.printerName,
                      keys: printerOptions.printerNames,
                      values: printerOptions.printerNames,
                      enabled: true,
                      onChanged: (value) async {
                        await bind.mainSetLocalOption(
                            key: kKeyPrinterSelected, value: value);
                        setState(() {});
                      },
                    ),
                  ),
                ),
              Divider(height: 1, color: _settingsBorderColor(context)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '使用选择的打印机自动执行',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Theme.of(context).textTheme.titleMedium?.color,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '开启后，传入的打印任务将直接进入队列而不再弹窗确认',
                            style: TextStyle(
                              fontSize: 13,
                              color: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.color
                                  ?.withOpacity(0.72),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Switch(
                      value: mainGetLocalBoolOptionSync(kKeyPrinterAllowAutoPrint),
                      onChanged: printerOptions.action == kValuePrinterIncomingJobDismiss
                          ? null
                          : (v) async {
                              await mainSetLocalBoolOption(kKeyPrinterAllowAutoPrint, v);
                              setState(() {});
                            },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPrinterNoticeCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
    required Color color,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      decoration: BoxDecoration(
        color: _settingsCardColor(context),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: _settingsBorderColor(context)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x080F172A),
            blurRadius: 14,
            offset: Offset(0, 6),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.10),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.color
                        ?.withOpacity(0.72),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIncomingPrinterOptionCard(
    BuildContext context, {
    required String value,
    required String groupValue,
    required String title,
    required String description,
    required ValueChanged<String> onChanged,
    bool selectedStyle = false,
  }) {
    final selected = groupValue == value;
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => onChanged(value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
          decoration: BoxDecoration(
            color: selected ? _settingsSelectedFill(context) : _settingsCardColor(context),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? MyTheme.accent : _settingsBorderColor(context),
              width: selected ? 1.6 : 1.0,
            ),
          ),
          child: Row(
            children: [
              Radio<String>(
                value: value,
                groupValue: groupValue,
                onChanged: (v) {
                  if (v != null) onChanged(v);
                },
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: selected
                            ? MyTheme.accent
                            : Theme.of(context).textTheme.titleMedium?.color,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color
                            ?.withOpacity(0.72),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _About extends StatefulWidget {
  const _About({Key? key}) : super(key: key);

  @override
  State<_About> createState() => _AboutState();
}

class _AboutState extends State<_About> {
  @override
  Widget build(BuildContext context) {
    return futureBuilder(future: () async {
      final license = await bind.mainGetLicense();
      final version = await bind.mainGetVersion();
      final buildDate = await bind.mainGetBuildDate();
      final fingerprint = await bind.mainGetFingerprint();
      return {
        'license': license,
        'version': version,
        'buildDate': buildDate,
        'fingerprint': fingerprint
      };
    }(), hasData: (data) {
      final license = data['license'].toString();
      final version = data['version'].toString();
      final buildDate = data['buildDate'].toString();
      final fingerprint = data['fingerprint'].toString();
      final scrollController = ScrollController();
      final links = <({IconData icon, String title, VoidCallback onTap})>[
        (
          icon: Icons.shield_outlined,
          title: '隐私声明 (Privacy Statement)',
          onTap: () async {
            final customUrl = await bind.mainGetOption(key: _kRdeskPrivacyUrl);
            final url = customUrl.trim().isNotEmpty ? customUrl.trim() : _kDefaultRdeskPrivacyUrl;
            launchUrlString(url);
          }
        ),
        (
          icon: Icons.language_rounded,
          title: '官方网站 (Website)',
          onTap: () async {
            final customUrl = await bind.mainGetOption(key: _kRdeskWebsiteUrl);
            final url = customUrl.trim().isNotEmpty ? customUrl.trim() : _kDefaultRdeskWebsiteUrl;
            launchUrlString(url);
          }
        ),
      ];
      return _buildSettingsPageColumn(
        context: context,
        controller: scrollController,
        title: '关于',
        subtitle: '查看版本信息、隐私政策与版权说明',
        children: [
          Container(
            width: _kCardFixedWidth + 140,
            decoration: BoxDecoration(
              color: _settingsCardColor(context),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: _settingsBorderColor(context)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x080F172A),
                  blurRadius: 14,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 28, 28, 24),
                  child: Row(
                    children: [
                      Container(
                        width: 82,
                        height: 82,
                        decoration: BoxDecoration(
                          color: MyTheme.accent,
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [
                            BoxShadow(
                              color: MyTheme.accent50,
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.devices_rounded,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 22),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Rdesk',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: Theme.of(context).textTheme.titleLarge?.color,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Remote Desktop Control Software',
                              style: TextStyle(
                                fontSize: 15,
                                color: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.color
                                    ?.withOpacity(0.72),
                              ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                Divider(height: 1, color: _settingsBorderColor(context)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 24, 28, 18),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildAboutStat(
                              context,
                              title: '版本号',
                              value: version,
                            ),
                          ),
                          Expanded(
                            child: _buildAboutStat(
                              context,
                              title: '构建日期',
                              value: buildDate,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      if (!isWeb)
                        _buildAboutFingerprint(context, fingerprint),
                      const SizedBox(height: 20),
                      ...links.map((link) => Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: _buildAboutLinkCard(
                              context,
                              icon: link.icon,
                              title: link.title,
                              onTap: link.onTap,
                            ),
                          )),
                    ],
                  ),
                ),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(28, 20, 28, 28),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF2F64E9), Color(0xFF4B43D2)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(30),
                      bottomRight: Radius.circular(30),
                    ),
                  ),
                  child: SelectionArea(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Copyright © ${DateTime.now().toString().substring(0, 4)} Purslane Ltd.',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          translate('Slogan_tip').replaceAll('DeskConnect', 'Rdesk'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          license,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.82),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              ],
            ),
          )
        ],
      );
    });
  }

  Widget _buildAboutStat(
    BuildContext context, {
    required String title,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 13,
            color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.6),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Theme.of(context).textTheme.titleLarge?.color,
          ),
        ),
      ],
    );
  }

  Widget _buildAboutFingerprint(BuildContext context, String fingerprint) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _settingsCardColor(context),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _settingsBorderColor(context)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.fingerprint_rounded,
                        size: 18, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 8),
                    Text(
                      '设备安全指纹',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SelectionArea(
                  child: Text(
                    fingerprint,
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color
                          ?.withOpacity(0.82),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: fingerprint));
              showToast(translate('Copied'));
            },
            icon: const Icon(Icons.copy_all_outlined),
          ),
        ],
      ),
    );
  }

  Widget _buildAboutLinkCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        decoration: BoxDecoration(
          color: _settingsCardColor(context),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: _settingsBorderColor(context)),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _settingsSubtleFill(context),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 18, color: const Color(0xFF64748B)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
            ),
            const Icon(Icons.open_in_new_rounded, size: 18, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }
}

//#endregion

//#region components

// ignore: non_constant_identifier_names
Widget _Card(
    {required String title,
    required List<Widget> children,
    List<Widget>? title_suffix}) {
  return Row(
    children: [
      Flexible(
        child: SizedBox(
          width: _kCardFixedWidth + 140,
          child: Container(
            decoration: BoxDecoration(
              color: _settingsCardColor(_settingsThemeContext),
              borderRadius: BorderRadius.circular(_kRdeskSectionRadius),
              border: Border.all(
                  color: _settingsBorderColor(_settingsThemeContext)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x080F172A),
                  blurRadius: 14,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 22, 24, 14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          translate(title),
                          textAlign: TextAlign.start,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Theme.of(_settingsThemeContext)
                                .textTheme
                                .titleMedium
                                ?.color,
                          ),
                        ),
                      ),
                      ...?title_suffix,
                    ],
                  ),
                ),
                Divider(
                    height: 1,
                    color: _settingsBorderColor(_settingsThemeContext)),
                ...children.map(
                  (e) => Padding(
                    padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
                    child: e,
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ).marginOnly(left: _kCardLeftMargin, top: 18),
        ),
      ),
    ],
  );
}

// ignore: non_constant_identifier_names
Widget _OptionCheckBox(
  BuildContext context,
  String label,
  String key, {
  Function(bool)? update,
  bool reverse = false,
  bool enabled = true,
  Icon? checkedIcon,
  bool? fakeValue,
  bool isServer = true,
  bool Function()? optGetter,
  Future<void> Function(String, bool)? optSetter,
}) {
  getOpt() => optGetter != null
      ? optGetter()
      : (isServer
          ? mainGetBoolOptionSync(key)
          : mainGetLocalBoolOptionSync(key));
  bool value = getOpt();
  final isOptFixed = isOptionFixed(key);
  if (reverse) value = !value;
  var ref = value.obs;
  onChanged(option) async {
    if (option != null) {
      if (reverse) option = !option;
      final setter =
          optSetter ?? (isServer ? mainSetBoolOption : mainSetLocalBoolOption);
      await setter(key, option);
      final readOption = getOpt();
      if (reverse) {
        ref.value = !readOption;
      } else {
        ref.value = readOption;
      }
      update?.call(readOption);
    }
  }

  if (fakeValue != null) {
    ref.value = fakeValue;
    enabled = false;
  }

  return GestureDetector(
    child: Obx(
      () => Row(
        children: [
          Expanded(
            child: Text(
              translate(label),
              style: TextStyle(
                fontSize: 14,
                color: disabledTextColor(context, enabled),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (checkedIcon != null && ref.value) checkedIcon.marginOnly(right: 8),
          Switch(
            value: ref.value,
            onChanged: enabled && !isOptFixed ? onChanged : null,
          ),
        ],
      ),
    ).marginOnly(left: _kCheckBoxLeftMargin),
    onTap: enabled && !isOptFixed
        ? () {
            onChanged(!ref.value);
          }
        : null,
  );
}

// ignore: non_constant_identifier_names
Widget _Radio<T>(BuildContext context,
    {required T value,
    required T groupValue,
    required String label,
    required Function(T value)? onChanged,
    bool autoNewLine = true}) {
  final onChange2 = onChanged != null
      ? (T? value) {
          if (value != null) {
            onChanged(value);
          }
        }
      : null;
  return GestureDetector(
    child: Row(
      children: [
        Radio<T>(
          value: value,
          groupValue: groupValue,
          onChanged: onChange2,
          visualDensity: const VisualDensity(horizontal: -2, vertical: -2),
        ),
        Expanded(
          child: Text(translate(label),
                  overflow: autoNewLine ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: disabledTextColor(context, onChange2 != null)))
              .marginOnly(left: 5),
        ),
      ],
    ).marginOnly(left: _kRadioLeftMargin),
    onTap: () => onChange2?.call(value),
  );
}

class WaylandCard extends StatefulWidget {
  const WaylandCard({Key? key}) : super(key: key);

  @override
  State<WaylandCard> createState() => _WaylandCardState();
}

class _WaylandCardState extends State<WaylandCard> {
  final restoreTokenKey = 'wayland-restore-token';

  @override
  Widget build(BuildContext context) {
    return futureBuilder(
      future: bind.mainHandleWaylandScreencastRestoreToken(
          key: restoreTokenKey, value: "get"),
      hasData: (restoreToken) {
        final children = [
          if (restoreToken.isNotEmpty)
            _buildClearScreenSelection(context, restoreToken),
        ];
        return Offstage(
          offstage: children.isEmpty,
          child: _Card(title: 'Wayland', children: children),
        );
      },
    );
  }

  Widget _buildClearScreenSelection(BuildContext context, String restoreToken) {
    onConfirm() async {
      final msg = await bind.mainHandleWaylandScreencastRestoreToken(
          key: restoreTokenKey, value: "clear");
      gFFI.dialogManager.dismissAll();
      if (msg.isNotEmpty) {
        msgBox(gFFI.sessionId, 'custom-nocancel', 'Error', msg, '',
            gFFI.dialogManager);
      } else {
        setState(() {});
      }
    }

    showConfirmMsgBox() => msgBoxCommon(
            gFFI.dialogManager,
            'Confirmation',
            Text(
              translate('confirm_clear_Wayland_screen_selection_tip'),
            ),
            [
              dialogButton('OK', onPressed: onConfirm),
              dialogButton('Cancel',
                  onPressed: () => gFFI.dialogManager.dismissAll())
            ]);

    return _Button(
      'Clear Wayland screen selection',
      showConfirmMsgBox,
      tip: 'clear_Wayland_screen_selection_tip',
      style: ButtonStyle(
        backgroundColor: MaterialStateProperty.all<Color>(
            Theme.of(context).colorScheme.error.withOpacity(0.75)),
      ),
    );
  }
}

// ignore: non_constant_identifier_names
Widget _Button(String label, Function() onPressed,
    {bool enabled = true, String? tip, ButtonStyle? style}) {
  var button = ElevatedButton(
    onPressed: enabled ? onPressed : null,
    child: Text(
      translate(label),
    ).marginSymmetric(horizontal: 14),
    style: style ??
        ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
  );
  StatefulWidget child;
  if (tip == null) {
    child = button;
  } else {
    child = Tooltip(message: translate(tip), child: button);
  }
  return Row(children: [
    child,
  ]).marginOnly(left: _kContentHMargin);
}

// ignore: non_constant_identifier_names
Widget _SubButton(String label, Function() onPressed, [bool enabled = true]) {
  return Row(
    children: [
      ElevatedButton(
        onPressed: enabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          translate(label),
        ).marginSymmetric(horizontal: 15),
      ),
    ],
  ).marginOnly(left: _kContentHSubMargin);
}

// ignore: non_constant_identifier_names
Widget _SubLabeledWidget(BuildContext context, String label, Widget child,
    {bool enabled = true}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      SizedBox(
        width: 160,
        child: Text(
          '${translate(label)}: ',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: disabledTextColor(context, enabled),
          ),
        ),
      ),
      const SizedBox(
        width: 10,
      ),
      Expanded(child: child),
    ],
  ).marginOnly(left: _kContentHSubMargin);
}

Widget _lock(
  bool locked,
  String label,
  Function() onUnlock,
) {
  return Offstage(
      offstage: !locked,
      child: Row(
        children: [
          Flexible(
            child: SizedBox(
              width: _kCardFixedWidth + 140,
              child: Container(
                decoration: BoxDecoration(
                  color: _settingsCardColor(_settingsThemeContext),
                  borderRadius: BorderRadius.circular(_kRdeskSectionRadius),
                  border: Border.all(
                      color: _settingsBorderColor(_settingsThemeContext)),
                ),
                padding: const EdgeInsets.all(14),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: SizedBox(
                      height: 25,
                      child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.security_sharp,
                              size: 20,
                            ),
                            Text(translate(label)).marginOnly(left: 5),
                          ]).marginSymmetric(vertical: 2)),
                  onPressed: () async {
                    final unlockPin = bind.mainGetUnlockPin();
                    if (unlockPin.isEmpty || isUnlockPinDisabled()) {
                      bool checked = await callMainCheckSuperUserPermission();
                      if (checked) {
                        onUnlock();
                      }
                    } else {
                      checkUnlockPinDialog(unlockPin, onUnlock);
                    }
                  },
                ),
              ).marginOnly(left: _kCardLeftMargin),
            ).marginOnly(top: 10),
          ),
        ],
      ));
}

_LabeledTextField(
    BuildContext context,
    String label,
    TextEditingController controller,
    String errorText,
    bool enabled,
    bool secure) {
  return Table(
    columnWidths: const {
      0: FixedColumnWidth(150),
      1: FlexColumnWidth(),
    },
    defaultVerticalAlignment: TableCellVerticalAlignment.middle,
    children: [
      TableRow(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: Text(
              '${translate(label)}:',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 16,
                color: disabledTextColor(context, enabled),
              ),
            ),
          ),
          TextField(
            controller: controller,
            enabled: enabled,
            obscureText: secure,
            autocorrect: false,
            decoration: InputDecoration(
              errorText: errorText.isNotEmpty ? errorText : null,
            ),
            style: TextStyle(
              color: disabledTextColor(context, enabled),
            ),
          ).workaroundFreezeLinuxMint(),
        ],
      ),
    ],
  ).marginOnly(bottom: 8);
}

class _CountDownButton extends StatefulWidget {
  _CountDownButton({
    Key? key,
    required this.text,
    required this.second,
    required this.onPressed,
  }) : super(key: key);
  final String text;
  final VoidCallback? onPressed;
  final int second;

  @override
  State<_CountDownButton> createState() => _CountDownButtonState();
}

class _CountDownButtonState extends State<_CountDownButton> {
  bool _isButtonDisabled = false;

  late int _countdownSeconds = widget.second;

  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdownTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_countdownSeconds <= 0) {
        setState(() {
          _isButtonDisabled = false;
        });
        timer.cancel();
      } else {
        setState(() {
          _countdownSeconds--;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: _isButtonDisabled
          ? null
          : () {
              widget.onPressed?.call();
              setState(() {
                _isButtonDisabled = true;
                _countdownSeconds = widget.second;
              });
              _startCountdownTimer();
            },
      child: Text(
        _isButtonDisabled ? '$_countdownSeconds s' : translate(widget.text),
      ),
    );
  }
}

//#endregion

//#region dialogs

void changeSocks5Proxy() async {
  var socks = await bind.mainGetSocks();

  String proxy = '';
  String proxyMsg = '';
  String username = '';
  String password = '';
  if (socks.length == 3) {
    proxy = socks[0];
    username = socks[1];
    password = socks[2];
  }
  var proxyController = TextEditingController(text: proxy);
  var userController = TextEditingController(text: username);
  var pwdController = TextEditingController(text: password);
  RxBool obscure = true.obs;

  // proxy settings
  // The following option is a not real key, it is just used for custom client advanced settings.
  const String optionProxyUrl = "proxy-url";
  final isOptFixed = isOptionFixed(optionProxyUrl);

  var isInProgress = false;
  gFFI.dialogManager.show((setState, close, context) {
    submit() async {
      setState(() {
        proxyMsg = '';
        isInProgress = true;
      });
      cancel() {
        setState(() {
          isInProgress = false;
        });
      }

      proxy = proxyController.text.trim();
      username = userController.text.trim();
      password = pwdController.text.trim();

      if (proxy.isNotEmpty) {
        String domainPort = proxy;
        if (domainPort.contains('://')) {
          domainPort = domainPort.split('://')[1];
        }
        proxyMsg = translate(await bind.mainTestIfValidServer(
            server: domainPort, testWithProxy: false));
        if (proxyMsg.isEmpty) {
          // ignore
        } else {
          cancel();
          return;
        }
      }
      await bind.mainSetSocks(
          proxy: proxy, username: username, password: password);
      close();
    }

    return CustomAlertDialog(
      title: Text(translate('Socks5/Http(s) Proxy')),
      content: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 500),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (!isMobile)
                  ConstrainedBox(
                    constraints: const BoxConstraints(minWidth: 140),
                    child: Align(
                        alignment: Alignment.centerRight,
                        child: Row(
                          children: [
                            Text(
                              translate('Server'),
                            ).marginOnly(right: 4),
                            Tooltip(
                              waitDuration: Duration(milliseconds: 0),
                              message: translate("default_proxy_tip"),
                              child: Icon(
                                Icons.help_outline_outlined,
                                size: 16,
                                color: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.color
                                    ?.withOpacity(0.5),
                              ),
                            ),
                          ],
                        )).marginOnly(right: 10),
                  ),
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      errorText: proxyMsg.isNotEmpty ? proxyMsg : null,
                      labelText: isMobile ? translate('Server') : null,
                      helperText:
                          isMobile ? translate("default_proxy_tip") : null,
                      helperMaxLines: isMobile ? 3 : null,
                    ),
                    controller: proxyController,
                    autofocus: true,
                    enabled: !isOptFixed,
                  ).workaroundFreezeLinuxMint(),
                ),
              ],
            ).marginOnly(bottom: 8),
            Row(
              children: [
                if (!isMobile)
                  ConstrainedBox(
                      constraints: const BoxConstraints(minWidth: 140),
                      child: Text(
                        '${translate("Username")}:',
                        textAlign: TextAlign.right,
                      ).marginOnly(right: 10)),
                Expanded(
                  child: TextField(
                    controller: userController,
                    decoration: InputDecoration(
                      labelText: isMobile ? translate('Username') : null,
                    ),
                    enabled: !isOptFixed,
                  ).workaroundFreezeLinuxMint(),
                ),
              ],
            ).marginOnly(bottom: 8),
            Row(
              children: [
                if (!isMobile)
                  ConstrainedBox(
                      constraints: const BoxConstraints(minWidth: 140),
                      child: Text(
                        '${translate("Password")}:',
                        textAlign: TextAlign.right,
                      ).marginOnly(right: 10)),
                Expanded(
                  child: Obx(() => TextField(
                        obscureText: obscure.value,
                        decoration: InputDecoration(
                            labelText: isMobile ? translate('Password') : null,
                            suffixIcon: IconButton(
                                onPressed: () => obscure.value = !obscure.value,
                                icon: Icon(obscure.value
                                    ? Icons.visibility_off
                                    : Icons.visibility))),
                        controller: pwdController,
                        enabled: !isOptFixed,
                        maxLength: bind.mainMaxEncryptLen(),
                      ).workaroundFreezeLinuxMint()),
                ),
              ],
            ),
            // NOT use Offstage to wrap LinearProgressIndicator
            if (isInProgress)
              const LinearProgressIndicator().marginOnly(top: 8),
          ],
        ),
      ),
      actions: [
        dialogButton('Cancel', onPressed: close, isOutline: true),
        if (!isOptFixed) dialogButton('OK', onPressed: submit),
      ],
      onSubmit: submit,
      onCancel: close,
    );
  });
}

//#endregion
class _AiSettings extends StatefulWidget {
  const _AiSettings({Key? key}) : super(key: key);

  @override
  State<_AiSettings> createState() => _AiSettingsState();
}

class _AiSettingsState extends State<_AiSettings> {
  final _scrollController = ScrollController();
  late AiProviderConfig config;
  
  String currentApiType = 'openai';
  final baseUrl = TextEditingController();
  final apiKey = TextEditingController();
  final aiModel = TextEditingController();
  final systemPrompt = TextEditingController();
  List<Map<String, String>> _customAgents = [];
  List<Map<String, String>> _customSkills = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    final raw = await bind.mainGetOption(key: 'ai-provider-config');
    if (raw.isNotEmpty) {
      try {
        config = AiProviderConfig.fromJson(jsonDecode(raw));
      } catch (e) {
        config = AiProviderConfig();
      }
    } else {
      config = AiProviderConfig();
    }
    
    currentApiType = config.apiType;
    baseUrl.text = config.baseUrl;
    apiKey.text = config.apiKey;
    aiModel.text = config.model;
    systemPrompt.text = config.systemPrompt;
    
    _customAgents = [...config.customAgents];
    _customSkills = [...config.customSkills];
    
    setState(() {
      _loading = false;
    });
  }

  void _saveConfig() async {
    config = AiProviderConfig(
      enabled: true, 
      apiType: currentApiType, 
      baseUrl: baseUrl.text.trim(), 
      apiKey: apiKey.text.trim(), 
      model: aiModel.text.trim(), 
      systemPrompt: systemPrompt.text.trim(),
      customAgents: _customAgents,
      customSkills: _customSkills,
    );
    await bind.mainSetOption(
      key: 'ai-provider-config',
      value: jsonEncode(config.toJson()),
    );
    // show toast
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI 设置已保存'), behavior: SnackBarBehavior.floating));
  }

  void _editItem(bool isSkill, {int? index}) {
    final list = isSkill ? _customSkills : _customAgents;
    final item = index != null ? list[index] : null;
    final nameCtrl = TextEditingController(text: item?['name'] ?? '');
    final promptCtrl = TextEditingController(text: item?['prompt'] ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(item == null ? (isSkill ? '创建新技能' : '创建新智能体') : (isSkill ? '编辑技能' : '编辑智能体'), style: const TextStyle(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 13),
                decoration: InputDecoration(
                  labelText: isSkill ? '技能名称' : '智能体名称', 
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: promptCtrl,
                maxLines: 8,
                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 13),
                decoration: InputDecoration(
                  labelText: isSkill ? '技能操作指令/指引' : '角色设定/限定提示词', 
                  border: const OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isEmpty || promptCtrl.text.trim().isEmpty) return;
              setState(() {
                final newItem = {'name': nameCtrl.text.trim(), 'prompt': promptCtrl.text.trim()};
                if (index != null) {
                  list[index] = newItem;
                } else {
                  list.add(newItem);
                }
              });
              Navigator.pop(context);
            },
            child: const Text('保存'),
          ),
        ],
      )
    );
  }

  Widget _buildListSection(String title, String subtitle, List<Map<String, String>> items, {required bool isSkill}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
             Column(
               crossAxisAlignment: CrossAxisAlignment.start,
               children: [
                 Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                 const SizedBox(height: 4),
                 Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
               ],
             ),
             ElevatedButton.icon(
               onPressed: () => _editItem(isSkill), 
               icon: const Icon(Icons.add, size: 16), 
               label: const Text('创建'),
               style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
               ),
             )
          ]
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _settingsBorderColor(context)),
          ),
          child: items.isEmpty ? 
             const Padding(
               padding: EdgeInsets.all(24.0),
               child: Center(child: Text('暂无自定义项，请点击右上方创建', style: TextStyle(color: Colors.grey, fontSize: 13))),
             ) : 
             ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                separatorBuilder: (context, index) => Divider(height: 1, color: _settingsBorderColor(context)),
                itemBuilder: (context, index) {
                   final item = items[index];
                   return ListTile(
                     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                     title: Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                     subtitle: Text(item['prompt'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.grey, height: 1.5)),
                     trailing: Row(
                       mainAxisSize: MainAxisSize.min,
                       children: [
                         IconButton(
                           icon: const Icon(Icons.edit, size: 18, color: Colors.blue),
                           tooltip: '编辑',
                           onPressed: () => _editItem(isSkill, index: index),
                         ),
                         IconButton(
                           icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                           tooltip: '删除',
                           onPressed: () {
                             setState(() {
                               items.removeAt(index);
                             });
                           },
                         ),
                       ],
                     ),
                   );
                },
             ),
        )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return _buildSettingsPageScaffold(
      context: context,
      controller: _scrollController,
      title: 'AI 助手',
      subtitle: '全局 AI 提供商状态与工作流预设配置',
      children: [
        _buildSettingsPageTitle(context, '大模型 API 配置'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _settingsBorderColor(context)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                value: currentApiType,
                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 14),
                decoration: const InputDecoration(labelText: 'API 接口类型', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'openai', child: Text('OpenAI 兼容接口 (ChatGPT, Qwen, Kimi)')),
                  DropdownMenuItem(value: 'anthropic', child: Text('Anthropic 接口 (Claude 3.5 Sonnet 等)')),
                ],
                onChanged: (v) {
                   if (v != null) setState(() => currentApiType = v);
                },
              ),
              const SizedBox(height: 16),
              TextField(controller: baseUrl, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 14), decoration: const InputDecoration(labelText: 'Base URL', hintText: '例如 https://api.openai.com/v1', border: OutlineInputBorder())),
              const SizedBox(height: 16),
              TextField(controller: apiKey, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 14), obscureText: true, decoration: const InputDecoration(labelText: 'API Key', border: OutlineInputBorder())),
              const SizedBox(height: 16),
              TextField(controller: aiModel, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 14), decoration: InputDecoration(labelText: '模型名称 (Model)', hintText: currentApiType == 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o / qwen-max', border: const OutlineInputBorder())),
            ],
          ),
        ),
        
        const SizedBox(height: 32),
        _buildSettingsPageTitle(context, '系统底层设定'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _settingsCardColor(context),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _settingsBorderColor(context)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('基础指令拦截与安全基线', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(controller: systemPrompt, maxLines: 3, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 13), decoration: const InputDecoration(border: OutlineInputBorder())),
            ],
          ),
        ),

        const SizedBox(height: 32),
        _buildListSection('自定义智能体', '设定专属的工作流扮演角色', _customAgents, isSkill: false),
        const SizedBox(height: 32),
        _buildListSection('自定义技能库', '挂载预置的操作指引块', _customSkills, isSkill: true),
        
        const SizedBox(height: 24),
        Align(
          alignment: Alignment.centerRight,
          child: ElevatedButton(
            onPressed: _saveConfig,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('保存 AI 设置', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }
}

