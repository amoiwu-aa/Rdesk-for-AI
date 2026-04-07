import 'package:flutter/material.dart' as material;
import 'package:flutter/material.dart' hide Dialog;
import 'dart:ui';
import 'package:flutter_hbb/common.dart';
import 'package:flutter_hbb/consts.dart';
import 'package:url_launcher/url_launcher_string.dart';

class RdeskHelpDialog extends StatefulWidget {
  const RdeskHelpDialog({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => const RdeskHelpDialog(),
    );
  }

  @override
  State<RdeskHelpDialog> createState() => _RdeskHelpDialogState();
}

class _RdeskHelpDialogState extends State<RdeskHelpDialog> {
  int _selectedIndex = 0;
  double _dialogWidth = 860;
  double _dialogHeight = 640;

  bool _isDarkSurface(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  Color _cardSurface(BuildContext context) =>
      _isDarkSurface(context) ? const Color(0x991C1C1E) : const Color(0x99F2F2F7);

  Color _borderColor(BuildContext context) =>
      _isDarkSurface(context) ? const Color(0xFF394150) : MyTheme.border;

  Color _sidebarColor(BuildContext context) =>
      _isDarkSurface(context) ? const Color(0x661C1C1E) : const Color(0x66E5E5EA);

  final List<Map<String, dynamic>> _categories = [
    {
      'icon': Icons.rocket_launch_rounded,
      'title': '快速入门',
      'content': _buildQuickStart(),
    },
    {
      'icon': Icons.person_rounded,
      'title': '账户与会员',
      'content': _buildAccountMembership(),
    },
    {
      'icon': Icons.connected_tv_rounded,
      'title': '连接与控制',
      'content': _buildConnectionControl(),
    },
    {
      'icon': Icons.folder_copy_rounded,
      'title': '文件传输',
      'content': _buildFileTransfer(),
    },
    {
      'icon': Icons.tune_rounded,
      'title': '性能模式',
      'content': _buildPerformanceModes(),
    },
    {
      'icon': Icons.smart_toy_rounded,
      'title': 'AI 助手',
      'content': _buildAiAssistant(),
    },
    {
      'icon': Icons.security_rounded,
      'title': '安全与隐私',
      'content': _buildSecurity(),
    },
    {
      'icon': Icons.help_center_rounded,
      'title': '常见问题 (FAQ)',
      'content': _buildFAQ(),
    },
  ];

  @override
  Widget build(BuildContext context) {
    return material.Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: Colors.transparent, // Required for Dialog glassmorphism
      elevation: 0,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Stack(
        children: [
          Container(
            width: _dialogWidth,
            height: _dialogHeight,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: _cardSurface(context),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: _borderColor(context)),
        ),
        child: Row(
          children: [
            // Sidebar
            Container(
              width: 240,
              color: _sidebarColor(context),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    alignment: Alignment.centerLeft,
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: MyTheme.accent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.help_outline_rounded,
                              color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '帮助中心',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Theme.of(context).textTheme.titleLarge?.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _categories.length,
                      itemBuilder: (context, index) {
                        final isSelected = _selectedIndex == index;
                        final category = _categories[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              setState(() {
                                _selectedIndex = index;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? MyTheme.accent.withOpacity(0.12)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    category['icon'] as IconData,
                                    size: 20,
                                    color: isSelected
                                        ? MyTheme.accent
                                        : Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.color
                                            ?.withOpacity(0.6),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      category['title'] as String,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: isSelected
                                            ? FontWeight.w700
                                            : FontWeight.w500,
                                        color: isSelected
                                            ? MyTheme.accent
                                            : Theme.of(context)
                                                .textTheme
                                                .bodyMedium
                                                ?.color,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  // Bottom Support Link
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: OutlinedButton.icon(
                      onPressed: () {
                        launchUrlString('https://rdesk.com/support');
                      },
                      icon: const Icon(Icons.support_agent_rounded, size: 18),
                      label: const Text('联系在线客服'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(42),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Content Divider
            Container(width: 1, color: _borderColor(context)),
            // Main Content Area
            Expanded(
              child: Column(
                children: [
                  // Content Header
                  Container(
                    padding: const EdgeInsets.fromLTRB(32, 24, 24, 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _categories[_selectedIndex]['title'] as String,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Theme.of(context).textTheme.titleLarge?.color,
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close_rounded),
                          tooltip: '关闭',
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: _borderColor(context)),
                  // Content Body
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(32),
                      children: [
                        _categories[_selectedIndex]['content'] as Widget,
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      Positioned(
        bottom: 0,
        right: 0,
        child: MouseRegion(
          cursor: SystemMouseCursors.resizeDownRight,
          child: GestureDetector(
            onPanUpdate: (details) {
              setState(() {
                _dialogWidth = (_dialogWidth + details.delta.dx).clamp(600.0, 1600.0);
                _dialogHeight = (_dialogHeight + details.delta.dy).clamp(400.0, 1200.0);
              });
            },
            child: Container(
              width: 32,
              height: 32,
              color: Colors.transparent,
              child: CustomPaint(
                painter: _ResizeHandlePainter(
                  color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.4) ?? Colors.grey,
                ),
              ),
            ),
          ),
        ),
      ),
    ],
  ),
  ),
  ),
);
  }

  // Helper methods to build content sections
  static Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  static Widget _buildParagraph(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          height: 1.6,
        ),
      ),
    );
  }

  static Widget _buildImagePlaceholder(String label) {
    return Container(
      width: double.infinity,
      height: 160,
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.2), width: 1),
      ),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.image_outlined, size: 40, color: Colors.grey.withOpacity(0.5)),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: Colors.grey.withOpacity(0.6))),
        ],
      ),
    );
  }

  static Widget _buildQuickStart() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('欢迎使用 Rdesk'),
        _buildParagraph('Rdesk 是一款现代、快速且安全的远程桌面控制软件。无论您身在何处，都可以随时随地连接并管理您的设备。'),
        _buildSectionTitle('如何接受控制？'),
        _buildParagraph('1. 将主界面左侧的「本机 ID」和「一次性密码」告知协助者。\n2. 协助者在他们的 Rdesk 中输入您的 ID 和密码即可连接。'),
        _buildImagePlaceholder('图示：本机ID与密码位置'),
        _buildSectionTitle('如何控制其他设备？'),
        _buildParagraph('1. 在顶部的「控制远程设备」输入框中，输入目标设备的 ID。\n2. 点击右侧箭头或按回车键。\n3. 在弹出的密码框中输入目标设备的密码，即可建立连接。'),
      ],
    );
  }

  static Widget _buildAccountMembership() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('账户功能'),
        _buildParagraph('登录 Rdesk 账户后，您可以享受跨设备同步地址簿、设备列表以及高级功能配置等诸多便利。在左侧边栏底部的快速入口即可进行登录。'),
        _buildSectionTitle('专业版会员权益'),
        _buildParagraph('开通 Rdesk 会员后，您可以享受以下高级特性：\n• 无限设备绑定与地址簿同步\n• 高端视频编解码器支持(H264/H265硬件加速)\n• 高清画质与高帧率模式\n• 无限制文件传输速度\n• 优先技术支持'),
        _buildSectionTitle('设备管理'),
        _buildParagraph('在「设置」->「账户与设备」页面中，您可以清晰地查看所有使用当前账号登录的设备，并随时对不需要使用的设备进行解绑，保障账号安全。'),
      ],
    );
  }

  static Widget _buildConnectionControl() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('控制台顶部工具栏'),
        _buildParagraph('在远程控制窗口的顶部中央，隐藏着一个强大的工具栏（鼠标移近或点击小点展开）。其中包含：'),
        _buildParagraph('• 显示器切换：当远程设备有多台显示器时，可自由切换。\n• 画质调节：根据网络状况选择「最佳画质」或「速度优先」。\n• 键盘鼠标控制：包含发送 Ctrl+Alt+Del、快捷键映射等操作。\n• 权限与互动：申请系统提权、发起聊天、录屏等。'),
        _buildImagePlaceholder('图示：顶端工具栏菜单功能展示'),
        _buildSectionTitle('常见快捷键'),
        _buildParagraph('• 全屏切换：[F11]\n• 退出远程：[Ctrl] + [Alt] + [Shift] + [Q]\n• 快速锁定目标主机：[Win] + [L]'),
      ],
    );
  }

  static Widget _buildFileTransfer() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('文件传输模式'),
        _buildParagraph('您有两种方式传输文件：'),
        _buildParagraph('1. 直接在主界面输入 ID 后，点击 ID 框右侧的“文件夹”图标，专门进行文件传输，不显示桌面。\n2. 在桌面控制过程中，使用顶部工具栏的“文件”按钮打开文件传输面板。'),
        _buildImagePlaceholder('图示：通过模式选择图标开启文件传输'),
        _buildSectionTitle('剪贴板同步'),
        _buildParagraph('默认情况下，您可以直接在本地复制文件，然后在远程电脑上粘贴，这使得传输单个/小文件变得异常方便！'),
      ],
    );
  }

  static Widget _buildSecurity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('连接密码说明'),
        _buildParagraph('Rdesk 提供多种密码验证机制以满足不同场景需求：\n\n• 一次性密码：每次服务重启后随机生成，适合偶尔让他人协助。\n• 固定密码：在“设置 -> 安全”中设定。设置后可长期保持不变，适合无人值守访问自己的设备。\n• 仅允许使用固定密码连接：提高安全性，此时一次性密码将失效。'),
        _buildSectionTitle('安全访问授权'),
        _buildParagraph('您可以为连接进行精细化授权：\n• 在“设置 -> 安全 -> 权限”中，可以配置被控端默认不提供文件下载、禁止剪贴板同步等。\n• 您还可以在对方请求连接时，手动点击“接受”或“拒绝”。'),
      ],
    );
  }

  static Widget _buildFAQ() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFAQItem(
          '为什么连接提示“尚未准备好，请检查您的网络连接”？',
          '这通常是因为您的设备无法连接到 Rdesk 注册服务器。请检查您的网络是否正常，是否有防火墙或安全软件拦截了 Rdesk 的请求。',
        ),
        _buildFAQItem(
          '画面比较卡顿怎么办？',
          '在远程窗口上方的工具栏中，找到“显示”设置。尝试将“画质”调整为“速度优先”，并关闭“显示壁纸”选项，或者调低分辨率。',
        ),
        _buildFAQItem(
          '能否实现开机自启和无人值守？',
          '完全可以。在被控端，点击主界面中部的“安装”将其安装为系统服务，并在“设置 -> 安全”中设定一个固定密码。这样不仅能开机自签，锁屏状态下也能直接连接。',
        ),
        _buildFAQItem(
          '无法听到远程电脑的声音？',
          '请检查远程控制窗口上方工具栏中的”声音”开关是否开启。如果仍无声音，请检查被控端系统的默认输出音频设备，部分系统可能需要安装额外的音频驱动。',
        ),
        _buildFAQItem(
          '办公模式下文字很清晰但拖窗口时比较卡？',
          '这是正常现象。办公模式使用 SCC 无损编码器，静止画面极其省流量（~300字节/帧），但大面积运动时带宽会升高。如果需要频繁拖动窗口，建议切换到标准模式或 Game (H.265) 模式。',
        ),
        _buildFAQItem(
          'AI 助手配置了但生成计划失败？',
          '请检查：1) API Base URL 是否正确（需包含 /v1）；2) API Key 是否有效；3) 网络是否能访问该 API 服务；4) Model 名称是否正确。可以在浏览器中访问 Base URL 确认服务可达。',
        ),
        _buildFAQItem(
          'H.265 模式和 H.264 有什么区别？',
          'H.265 (HEVC) 在相同画质下比 H.264 节省约 30-40% 的带宽，但编码延迟略高。如果您的网络带宽有限，推荐使用 H.265；如果追求最低延迟，使用 H.264。',
        ),
        const SizedBox(height: 20),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 10),
          child: Text('更多问题，请访问官方文档：https://rdesk.com/docs', style: TextStyle(color: Colors.blue)),
        )
      ],
    );
  }

  static Widget _buildPerformanceModes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('六种性能模式'),
        _buildParagraph('Rdesk 提供六种性能模式，覆盖从极差网络到专业游戏的全场景需求。在远程控制窗口顶部工具栏的「性能模式」中切换。'),
        _buildSectionTitle('🔧 运维模式'),
        _buildParagraph('编码：H.264 最低画质 | 帧率：5fps | 灰度显示\n\n专为极差网络环境设计。画面转为黑白灰度以极限压缩带宽，仅需约 50-100 KB/s。能看清文字即可，适合紧急远程排障。'),
        _buildSectionTitle('📄 高清办公阅读模式'),
        _buildParagraph('编码：SCC 自研屏幕编码器 | 帧率：15fps | 无损文字\n\n采用自研 Screen Content Codec (SCC)，文字和 UI 以 RGB 无损传输，没有 H.264 的 YUV 色度降采样导致的文字彩色毛刺。静止画面仅占 300 字节/帧，打字、看文档时带宽接近零。'),
        _buildSectionTitle('⚖️ 标准模式'),
        _buildParagraph('编码：H.264 自动 | 帧率：60fps | 均衡画质\n\n默认模式，平衡画质与带宽。适合日常远程办公和一般操作。'),
        _buildSectionTitle('🎮 Game (H.264)'),
        _buildParagraph('编码：H.264 硬件加速 | 帧率：120fps | 最佳画质\n\n低延迟优先。H.264 编码延迟最低，适合对操作响应敏感的游戏和实时操作。'),
        _buildSectionTitle('🎬 Game (H.265)'),
        _buildParagraph('编码：H.265/HEVC 硬件加速 | 帧率：120fps | 最佳画质\n\n同等画质下比 H.264 节省 30-40% 带宽。适合带宽有限但仍需高画质的场景。'),
        _buildSectionTitle('🚀 Game (AV1)'),
        _buildParagraph('编码：AV1（开发中，暂用 H.265）| 帧率：120fps\n\nAV1 是下一代编码标准，比 H.264 节省 50% 带宽。原生支持帧内块复制和调色板模式，屏幕内容压缩效果极佳。rav1e 集成后将自动激活。'),
      ],
    );
  }

  static Widget _buildAiAssistant() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('AI 命令助手'),
        _buildParagraph('Rdesk 内置 AI 智能运维助手，可以用自然语言描述问题，AI 会自动生成排查计划并在远程终端执行命令。'),
        _buildSectionTitle('使用方式'),
        _buildParagraph('1. 在远程控制窗口的顶部工具栏中，点击 AI 助手图标打开独立窗口。\n2. 首次使用需在「AI 设置」中配置 API 接口（支持 OpenAI、Claude、千问、Kimi 等兼容接口）。\n3. 在输入框中描述您的目标，例如："帮我检查这台机器为什么 8080 端口没起来"。\n4. 点击「生成计划」，AI 会分析并生成多步执行计划。'),
        _buildSectionTitle('安全机制'),
        _buildParagraph('• 每条命令都有风险等级标注（低/中/高）\n• 高风险命令（如删除、重启）需要手动确认才会执行\n• 所有命令通过远程 SSH 终端执行，输出实时显示\n• 可随时中止并手动接管'),
        _buildSectionTitle('支持的 AI 接口'),
        _buildParagraph('任何兼容 OpenAI Chat Completions API 的服务均可使用：\n• OpenAI (GPT-4.1 / GPT-4o)\n• Anthropic Claude\n• 阿里千问 (qwen-max)\n• Moonshot Kimi (kimi-k2)\n• 本地部署的 Ollama / vLLM 等'),
      ],
    );
  }

  static Widget _buildFAQItem(String q, String a) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Q: ', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.blue, fontSize: 16)),
              Expanded(child: Text(q, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('A: ', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 16)),
              Expanded(child: Text(a, style: const TextStyle(fontSize: 14, height: 1.5))),
            ],
          ),
        ],
      ),
    );
  }
}

class _ResizeHandlePainter extends CustomPainter {
  final Color color;

  _ResizeHandlePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    
    // Draw two parallel angled lines at the bottom right corner
    canvas.drawLine(
      Offset(size.width - 12, size.height - 6),
      Offset(size.width - 6, size.height - 12),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - 18, size.height - 6),
      Offset(size.width - 6, size.height - 18),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _ResizeHandlePainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
