import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hbb/common.dart' hide Dialog;
import 'package:flutter_hbb/consts.dart';
import 'package:flutter_hbb/utils/multi_window_manager.dart';
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

import '../../models/model.dart';
import '../../models/ai_operator_model.dart';
import '../pages/ai_connection_manager.dart';
import '../pages/desktop_setting_page.dart';
import '../widgets/ai_operator_panel.dart';

class DesktopAiAssistantScreen extends StatefulWidget {
  final Map<String, dynamic> params;

  const DesktopAiAssistantScreen({Key? key, required this.params})
      : super(key: key);

  @override
  State<DesktopAiAssistantScreen> createState() =>
      _DesktopAiAssistantScreenState();
}

class _DesktopAiAssistantScreenState extends State<DesktopAiAssistantScreen>
    with WindowListener {
  late String _peerId;
  late FFI _ffi;
  late String _windowTitle;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    rustDeskWinManager.setMethodHandler(_handleWindowMethod);
    _bootstrapFromParams(widget.params);
  }

  void _bootstrapFromParams(Map<String, dynamic> params) {
    _peerId = params['id']?.toString() ?? '';
    _ffi = AiConnectionManager.getConnection(
      peerId: _peerId,
      password: params['password']?.toString(),
      isSharedPassword: params['isSharedPassword'] == true,
      forceRelay: params['forceRelay'] == true,
      connToken: params['connToken']?.toString(),
    );
    _windowTitle = getWindowNameWithId(
      _peerId,
      overrideType: WindowType.AiAssistant,
    );
    WindowController.fromWindowId(windowId()).setTitle(_windowTitle);
  }

  Future<dynamic> _handleWindowMethod(MethodCall call, int fromWindowId) async {
    debugPrint(
        '[AI Assistant] call ${call.method} with args ${call.arguments} from window $fromWindowId');
    if (call.method == kWindowEventNewAiAssistant) {
      final args = call.arguments is String
          ? jsonDecode(call.arguments) as Map<String, dynamic>
          : Map<String, dynamic>.from(call.arguments as Map);
      final nextPeerId = args['id']?.toString() ?? '';
      if (nextPeerId.isEmpty) return false;
      if (_peerId == nextPeerId) {
        windowOnTop(windowId());
        return true;
      }
      final previousPeerId = _peerId;
      final nextFfi = AiConnectionManager.getConnection(
        peerId: nextPeerId,
        password: args['password']?.toString(),
        isSharedPassword: args['isSharedPassword'] == true,
        forceRelay: args['forceRelay'] == true,
        connToken: args['connToken']?.toString(),
      );
      setState(() {
        _peerId = nextPeerId;
        _ffi = nextFfi;
        _windowTitle = getWindowNameWithId(
          _peerId,
          overrideType: WindowType.AiAssistant,
        );
      });
      await WindowController.fromWindowId(windowId()).setTitle(_windowTitle);
      AiConnectionManager.releaseConnection(previousPeerId);
      windowOnTop(windowId());
      return true;
    } else if (call.method == kWindowEventActiveSession) {
      if (call.arguments?.toString() == _peerId) {
        windowOnTop(windowId());
        return true;
      }
      return false;
    } else if (call.method == 'onDestroy') {
      _disposeCurrentConnection();
      return null;
    } else if (call.method == kWindowActionRebuild) {
      reloadCurrentWindow();
      return null;
    }
    return null;
  }

  void _disposeCurrentConnection() {
    final peerId = _peerId;
    if (peerId.isNotEmpty) {
      AiConnectionManager.releaseConnection(peerId);
      _peerId = '';
    }
  }

  @override
  void onWindowClose() async {
    await saveWindowPosition(
      WindowType.AiAssistant,
      windowId: windowId(),
      flush: true,
    );
    _disposeCurrentConnection();
    final controller = WindowController.fromWindowId(windowId());
    await controller.hide();
    await rustDeskWinManager
        .call(WindowType.Main, kWindowEventHide, {"id": windowId()});
    super.onWindowClose();
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    _disposeCurrentConnection();
    super.dispose();
  }

  int windowId() {
    return widget.params['windowId'];
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _ffi.aiOperatorModel),
      ],
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Container(
          decoration: const BoxDecoration(
            color: Color(0xF4F9FAFB),
          ),
          child: Column(
            children: [
              // Custom draggable title bar
              _DraggableTitleBar(
                windowId: windowId(),
                child: Container(
                  height: 48,
                  color: Colors.transparent,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.blueAccent.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.smart_toy, color: Colors.blueAccent, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _windowTitle,
                          style: const TextStyle(color: Color(0xFF1F2937), fontSize: 13, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        )
                      ),
                      _WindowCloseButton(onClose: () => onWindowClose()),
                    ],
                  ),
                ),
              ),
              // Body
              Expanded(
                child: Consumer<AiOperatorModel>(
                  builder: (context, model, _) => _AiAssistantBody(model: model, ffi: _ffi),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WindowCloseButton extends StatefulWidget {
  final VoidCallback onClose;
  const _WindowCloseButton({Key? key, required this.onClose}) : super(key: key);
  @override
  State<_WindowCloseButton> createState() => _WindowCloseButtonState();
}

class _WindowCloseButtonState extends State<_WindowCloseButton> {
  bool _hovering = false;
  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovering = true),
      onExit: (_) => setState(() => _hovering = false),
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: widget.onClose,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: _hovering ? const Color(0xFFE81123) : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(
            Icons.close,
            color: _hovering ? Colors.white : const Color(0xFF6B7280),
            size: 16,
          ),
        ),
      ),
    );
  }
}

class _AiAssistantBody extends StatefulWidget {
  final AiOperatorModel model;
  final FFI ffi;
  const _AiAssistantBody({required this.model, required this.ffi});

  @override
  State<_AiAssistantBody> createState() => _AiAssistantBodyState();
}

class _AiAssistantBodyState extends State<_AiAssistantBody> {
  final ScrollController _scrollController = ScrollController();
  final ScrollController _terminalScrollController = ScrollController();

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
    if (_terminalScrollController.hasClients && _terminalScrollController.position.maxScrollExtent > 0) {
      _terminalScrollController.animateTo(
        _terminalScrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  void initState() {
    super.initState();
    widget.model.addListener(_onModelUpdate);
  }

  @override
  void dispose() {
    widget.model.removeListener(_onModelUpdate);
    _scrollController.dispose();
    _terminalScrollController.dispose();
    super.dispose();
  }

  void _onModelUpdate() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  @override
  Widget build(BuildContext context) {
    final model = widget.model;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Left Column: Native Terminal Output
        Expanded(
          flex: 4,
          child: Container(
            color: const Color(0xFF0F172A),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    border: Border(bottom: BorderSide(color: Color(0xFF334155))),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.terminal, color: Color(0xFF94A3B8), size: 16),
                      SizedBox(width: 8),
                      Text('Terminal Output', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    controller: _terminalScrollController,
                    padding: const EdgeInsets.all(16),
                    child: SelectableText(
                      model.globalTerminalBuffer.trim().isEmpty ? '等待执行命令...\n' : model.globalTerminalBuffer,
                      style: const TextStyle(color: Color(0xFFE2E8F0), fontFamily: 'monospace', fontSize: 13, height: 1.5),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F172A),
                    border: Border(top: BorderSide(color: Color(0xFF334155))),
                  ),
                  child: TextField(
                    style: const TextStyle(color: Color(0xFFE2E8F0), fontFamily: 'monospace', fontSize: 13),
                    cursorColor: Colors.blueAccent,
                    decoration: const InputDecoration(
                      hintText: '手动输入命令直接发送到此终端...',
                      hintStyle: TextStyle(color: Color(0xFF475569)),
                      border: InputBorder.none,
                      isDense: true,
                      filled: true,
                      fillColor: Colors.transparent,
                    ),
                    onSubmitted: (val) {
                      if (val.trim().isNotEmpty) {
                        model.sendManualCommand(val);
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        
        Container(width: 1, color: const Color(0xFFE5E7EB)),
        
        // Right Column: Chat Interface
        Expanded(
          flex: 5,
          child: Column(
            children: [
              // Chat Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8, height: 8,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: model.config.ready ? Colors.green : Colors.orange),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      model.config.ready ? 'Model: ${model.config.model}' : '尚未配置 API（点击设置）',
                      style: const TextStyle(color: Color(0xFF4B5563), fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _showHistorySessions(context, model),
                icon: const Icon(Icons.history, size: 16, color: Color(0xFF6B7280)),
                label: const Text('历史', style: TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: () => model.clearPlan(),
                icon: const Icon(Icons.add, size: 16, color: Color(0xFF6B7280)),
                label: const Text('新对话', style: TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: () => _showAiSettings(context),
                icon: const Icon(Icons.settings_outlined, size: 16, color: Color(0xFF6B7280)),
                label: const Text('设置', style: TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ),
        
        // Chat History Area
        Expanded(
          child: Container(
            color: Colors.white.withAlpha(150),
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              physics: const BouncingScrollPhysics(),
              children: [
                if (model.chatHistory.isEmpty && !model.hasPlan && !model.busy && model.terminalBuffer.isEmpty && model.activeGoal.isEmpty)
                  _buildEmptyState(),
                  
                for (final msg in model.chatHistory)
                  if (msg.role == ChatRole.user && !msg.text.startsWith('[Agent Context]'))
                    _buildUserBubble(msg.text)
                  else if (msg.role == ChatRole.ai)
                    _buildHistoricalAiBubble(msg),
                  
                if (model.activeGoal.isNotEmpty && !model.activeGoal.startsWith('[Agent Context]') && !model.chatHistory.any((m) => m.role == ChatRole.user && m.text == model.activeGoal))
                  _buildUserBubble(model.activeGoal),
                  
                if (model.busy && !model.hasPlan)
                  _buildAiLoadingBubble(),
                  
                if (model.hasPlan)
                  _buildAiPlanBubble(model),
              ],
            ),
          ),
        ),
        
        // Bottom Action & Input Area
        Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          decoration: const BoxDecoration(
            color: Color(0xFFF9FAFB),
            border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (model.securityMessage.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFFCA5A5))),
                  child: Row(children: [
                    const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(model.securityMessage, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13))),
                  ]),
                ),
                
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withAlpha(10), blurRadius: 10, offset: const Offset(0, 2)),
                  ],
                  border: Border.all(color: model.autoPilot ? Colors.blueAccent.withAlpha(100) : const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 12, right: 12, top: 12),
                      child: Row(
                        children: [
                          PopupMenuButton<String>(
                            tooltip: '切换 Agent 角色模型',
                            onSelected: (v) => model.setActiveAgent(v),
                            itemBuilder: (ctx) => model.config.customAgents.map((e) => e['name'] ?? '未命名角色')
                                .toSet()
                                .map((a) => PopupMenuItem(value: a, child: Text(a, style: const TextStyle(fontSize: 12)))).toList(),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
                              child: Row(children: [
                                  const Icon(Icons.support_agent, size: 12, color: Colors.blueAccent),
                                  const SizedBox(width: 4),
                                  Text(model.activeAgent, style: const TextStyle(fontSize: 11, color: Colors.blueAccent, fontWeight: FontWeight.w500)),
                                  const Icon(Icons.arrow_drop_down, size: 14, color: Colors.blueAccent)
                              ])
                            )
                          ),
                          const SizedBox(width: 8),
                          PopupMenuButton<String>(
                            tooltip: '挂载专业技能包 (Skill)',
                            onSelected: (v) => model.toggleSkill(v),
                            itemBuilder: (ctx) => model.config.customSkills.map((e) => e['name'] ?? '未命名技能')
                                .toSet()
                                .map((a) => PopupMenuItem(value: a, child: Row(mainAxisSize: MainAxisSize.min, children: [
                                  Icon(model.activeSkills.contains(a) ? Icons.check_box : Icons.check_box_outline_blank, size: 14, color: Colors.blueAccent),
                                  const SizedBox(width: 6),
                                  Text(a, style: const TextStyle(fontSize: 12))
                                ]))).toList(),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(6)),
                              child: Row(children: [
                                  const Icon(Icons.extension, size: 12, color: Color(0xFF6B7280)),
                                  const SizedBox(width: 4),
                                  Text(model.activeSkills.isEmpty ? '挂载 Skill' : '${model.activeSkills.length} 技能', style: const TextStyle(fontSize: 11, color: Color(0xFF4B5563))),
                                  const Icon(Icons.arrow_drop_down, size: 14, color: Color(0xFF6B7280))
                              ])
                            )
                          ),
                          const Spacer(),
                          GestureDetector(
                            onTap: () => _showAiSettings(context),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12),
                              child: Icon(Icons.settings, size: 16, color: Color(0xFF9CA3AF))
                            )
                          ),
                          const Text('Auto-pilot 自动领航: ', style: TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                          SizedBox(
                            height: 16, width: 28,
                            child: Transform.scale(scale: 0.5, child: Switch(value: model.autoPilot, onChanged: (v)=>model.toggleAutoPilot(v)))
                          )
                        ]
                      )
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Focus(
                            onKeyEvent: (node, event) {
                              if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.enter && !HardwareKeyboard.instance.isShiftPressed) {
                                if (!model.busy && model.goalController.text.trim().isNotEmpty) {
                                  model.buildPlan();
                                }
                                return KeyEventResult.handled;
                              }
                              return KeyEventResult.ignored;
                            },
                            child: TextField(
                              controller: model.goalController,
                              minLines: 1, maxLines: 5,
                              textInputAction: TextInputAction.none,
                              style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14, height: 1.5),
                              decoration: const InputDecoration(
                                hintText: '给 AI 发送指令... (Enter发送)',
                                hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Container(
                            decoration: BoxDecoration(
                              color: model.busy ? const Color(0xFFE5E7EB) : Colors.black,
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.arrow_upward, color: Colors.white, size: 18),
                              onPressed: model.busy ? null : () => model.buildPlan(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  model.busy ? model.status : '命令已发送: ${model.chatHistory.where((m) => m.role == ChatRole.user).length} 轮对话',
                  style: TextStyle(color: model.busy ? Colors.blueAccent : const Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w500),
                ),
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



  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 48),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blueAccent.withAlpha(20),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.smart_toy_outlined, color: Colors.blueAccent, size: 48),
          ),
          const SizedBox(height: 20),
          const Text('我是你的远程 AI 助手', style: TextStyle(color: Color(0xFF1F2937), fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('你可以让我以对话的形式帮你检查网络或诊断远程主机的各类故障', style: TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildUserBubble(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                borderRadius: BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16), bottomRight: Radius.circular(16)),
              ),
              child: SelectableText(text, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14, height: 1.5)),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 36, height: 36,
            decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFE5E7EB)),
            child: const Icon(Icons.person, color: Color(0xFF6B7280), size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildAiLoadingBubble() {
    return _buildAiBubble(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blueAccent)),
          SizedBox(width: 12),
          Text('正在规划操作...', style: TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildAiPlanBubble(AiOperatorModel model) {
    final plan = model.plan!;
    return _buildAiBubble(
      builder: (context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SelectableText(plan.summary, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14, height: 1.5)),
          const SizedBox(height: 12),
          
          ...List.generate(plan.steps.length, (i) {
             final step = plan.steps[i];
             final isDone = i <= model.currentStep && (!model.executing || i != model.currentStep);
             final isRunning = i == model.currentStep && model.executing;
             final isNextToRun = i == model.currentStep + 1 && !model.executing;
             
             return Container(
               margin: const EdgeInsets.only(bottom: 12),
               decoration: BoxDecoration(
                 color: const Color(0xFF1E293B),
                 borderRadius: BorderRadius.circular(8),
               ),
               child: Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: [
                   Padding(
                     padding: const EdgeInsets.all(12),
                     child: Text(step.title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                   ),
                   if (step.command.isNotEmpty)
                     Container(
                       width: double.infinity,
                       padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12),
                       child: SelectableText(step.command, style: const TextStyle(color: Color(0xFFF8FAFC), fontFamily: 'monospace', fontSize: 13, height: 1.4)),
                     ),
                   Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                     decoration: const BoxDecoration(
                       border: Border(top: BorderSide(color: Color(0xFF334155))),
                     ),
                     child: Row(
                       children: [
                         if (isDone)
                           Row(children: const [Icon(Icons.check, color: Colors.green, size: 14), SizedBox(width: 4), Text('已执行', style: TextStyle(color: Colors.green, fontSize: 12))])
                         else if (isRunning)
                           Row(children: const [SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blueAccent)), SizedBox(width: 6), Text('执行中...', style: TextStyle(color: Colors.blueAccent, fontSize: 12))])
                         else if (model.securityMessage.isNotEmpty && isNextToRun)
                           Expanded(child: Row(
                             children: [
                               const Icon(Icons.block, color: Colors.red, size: 14), 
                               const SizedBox(width: 4), 
                               Expanded(child: Text(model.securityMessage, style: const TextStyle(color: Colors.red, fontSize: 12), overflow: TextOverflow.ellipsis)),
                               if (model.securityMessage != '极其危险的命令，系统已绝对拦截')
                                 TextButton(
                                   onPressed: () => model.executeNextStep(),
                                   style: TextButton.styleFrom(
                                     minimumSize: Size.zero,
                                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                     backgroundColor: Colors.blueAccent,
                                     foregroundColor: Colors.white,
                                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4))
                                   ),
                                   child: const Text('授权运行', style: TextStyle(fontSize: 12)),
                                 )
                             ]
                           ))
                         else
                           Row(children: const [SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF64748B))), SizedBox(width: 6), Text('等待执行...', style: TextStyle(color: Color(0xFF64748B), fontSize: 12))]),
                       ],
                     )
                   )
                 ]
               )
             );
          })
        ]
      )
    );
  }

  Widget _buildHistoricalAiBubble(AiChatTurn msg) {
    return _buildAiBubble(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (msg.text.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SelectableText(msg.text, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14, height: 1.5)),
            ),
          if (msg.plan != null && msg.plan!.steps.isNotEmpty)
            ...msg.plan!.steps.map((step) => Container(
               margin: const EdgeInsets.only(bottom: 12),
               decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(8)),
               child: Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: [
                   Padding(padding: const EdgeInsets.all(12), child: Text(step.title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12))),
                   if (step.command.isNotEmpty)
                     Container(
                       width: double.infinity, padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12),
                       child: SelectableText(step.command, style: const TextStyle(color: Color(0xFFF8FAFC), fontFamily: 'monospace', fontSize: 13, height: 1.4)),
                     ),
                   Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                     decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF334155)))),
                     child: Row(children: const [Icon(Icons.check, color: Colors.green, size: 14), SizedBox(width: 4), Text('已执行', style: TextStyle(color: Colors.green, fontSize: 12))]),
                   )
                 ]
               )
            )).toList()
        ],
      )
    );
  }

  void _showHistorySessions(BuildContext context, AiOperatorModel model) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text('历史会话', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          content: Container(
            width: 400,
            height: 400,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.withAlpha(50)),
            ),
            child: model.sessions.isEmpty
                ? const Center(child: Text('暂无历史会话', style: TextStyle(color: Colors.grey)))
                : ListView.separated(
                    itemCount: model.sessions.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, thickness: 1),
                    itemBuilder: (ctx, index) {
                      final session = model.sessions[index];
                      final date = DateTime.fromMillisecondsSinceEpoch(session.updatedAt);
                      final dStr = '${date.month}-${date.day} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
                      return ListTile(
                        leading: Icon(
                          Icons.chat_bubble_outline, 
                          color: session.id == model.currentSessionId ? Colors.blueAccent : Colors.grey,
                          size: 20
                        ),
                        title: Text(session.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        subtitle: Text(dStr, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        selected: session.id == model.currentSessionId,
                        selectedTileColor: Colors.blueAccent.withAlpha(20),
                        onTap: () {
                          model.switchSession(session.id);
                          Navigator.of(ctx).pop();
                          Future.delayed(const Duration(milliseconds: 100), () => _scrollToBottom());
                        },
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('关闭')),
          ],
        );
      },
    );
  }

  void _showAiSettings(BuildContext context) {
    final model = widget.model;
    String currentApiType = model.config.apiType;
    final baseUrl = TextEditingController(text: model.config.baseUrl);
    final apiKey = TextEditingController(text: model.config.apiKey);
    final aiModel = TextEditingController(text: model.config.model);
    final systemPrompt = TextEditingController(text: model.config.systemPrompt);
    final customAgentsCtrl = TextEditingController(text: model.config.customAgents.map((e) => '${e["name"]}=${e["prompt"]}').join('\n'));
    final customSkillsCtrl = TextEditingController(text: model.config.customSkills.map((e) => '${e["name"]}=${e["prompt"]}').join('\n'));

    Widget buildCard(String title, String subtitle, List<Widget> children) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          ],
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
          const SizedBox(height: 28),
        ],
      );
    }

    showDialog(context: context, builder: (ctx) => StatefulBuilder(
      builder: (context, setState) => Dialog(
        backgroundColor: const Color(0xFFF9FAFB),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: SizedBox(
          width: 640,
          height: 720,
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(32, 28, 32, 16),
                alignment: Alignment.centerLeft,
                child: const Text('AI 设置中心', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF1F2937))),
              ),
              // Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  children: [
                    buildCard('大模型 API 配置', '配置连接到兼容 OpenAI 或 Anthropic 的后台服务', [
                      DropdownButtonFormField<String>(
                        value: currentApiType,
                        style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14),
                        decoration: const InputDecoration(labelText: 'API 接口类型', border: OutlineInputBorder(), labelStyle: TextStyle(color: Color(0xFF6B7280))),
                        items: const [
                          DropdownMenuItem(value: 'openai', child: Text('OpenAI 兼容接口')),
                          DropdownMenuItem(value: 'anthropic', child: Text('Anthropic 接口')),
                        ],
                        onChanged: (v) { if (v != null) setState(() => currentApiType = v); },
                      ),
                      const SizedBox(height: 16),
                      TextField(controller: baseUrl, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14), decoration: const InputDecoration(labelText: 'Base URL', border: OutlineInputBorder(), labelStyle: TextStyle(color: Color(0xFF6B7280)))),
                      const SizedBox(height: 16),
                      TextField(controller: apiKey, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14), obscureText: true, decoration: const InputDecoration(labelText: 'API Key', border: OutlineInputBorder(), labelStyle: TextStyle(color: Color(0xFF6B7280)))),
                      const SizedBox(height: 16),
                      TextField(controller: aiModel, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14), decoration: InputDecoration(labelText: 'Model', hintText: currentApiType == 'anthropic' ? 'claude-sonnet-4-5-20250514' : 'gpt-4o / qwen-max', border: const OutlineInputBorder(), labelStyle: const TextStyle(color: Color(0xFF6B7280)))),
                    ]),

                    buildCard('个性化编排 (Agent & Skill)', '自定义 AI 的工作流设定与预设技能', [
                      const Text('基础设定：系统级别底层约定，所有状态下都会遵守', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                      const SizedBox(height: 8),
                      TextField(controller: systemPrompt, maxLines: 3, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 13), decoration: const InputDecoration(border: OutlineInputBorder())),
                      const SizedBox(height: 20),
                      
                      const Text('自定义 Agent (格式 - 名字=限定提示词)：每行一个', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                      const SizedBox(height: 8),
                      TextField(controller: customAgentsCtrl, maxLines: 4, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 13), decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Linux极客=严格要求使用 bash 命令进行检修\n注册表修复大师=重点诊断HKLM键值系统...')),
                      const SizedBox(height: 20),

                      const Text('自定义 Skill技能组 (格式 - 名字=技能指令)：每行一个', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                      const SizedBox(height: 8),
                      TextField(controller: customSkillsCtrl, maxLines: 4, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 13), decoration: const InputDecoration(border: OutlineInputBorder(), hintText: '全盘提权杀毒=请立刻使用 admin 模式全盘排查异常\n...')),
                    ]),
                  ],
                ),
              ),
              // Footer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(16), bottomRight: Radius.circular(16)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(onPressed: () => Navigator.pop(ctx), style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)), child: const Text('取消', style: TextStyle(color: Color(0xFF6B7280)))),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        final newAgents = customAgentsCtrl.text.split('\n').where((e) => e.contains('=')).map((e) {
                          final p = e.split('=');
                          return {'name': p[0].trim(), 'prompt': p.sublist(1).join('=').trim()};
                        }).toList();
                        final newSkills = customSkillsCtrl.text.split('\n').where((e) => e.contains('=')).map((e) {
                          final p = e.split('=');
                          return {'name': p[0].trim(), 'prompt': p.sublist(1).join('=').trim()};
                        }).toList();

                        model.saveConfig(AiProviderConfig(
                          enabled: true, 
                          apiType: currentApiType, 
                          baseUrl: baseUrl.text.trim(), 
                          apiKey: apiKey.text.trim(), 
                          model: aiModel.text.trim(), 
                          systemPrompt: systemPrompt.text.trim(),
                          customAgents: newAgents,
                          customSkills: newSkills,
                        ));
                        Navigator.pop(ctx);
                      }, 
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent, 
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ), 
                      child: const Text('保存配置', style: TextStyle(fontWeight: FontWeight.bold))
                    ),
                  ],
                ),
              ),
            ],
          )
        ),
      ),
    ));
  }

  Widget _buildAiBubble({Widget? child, WidgetBuilder? builder, IconData icon = Icons.smart_toy}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: Colors.blueAccent.withAlpha(20),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.blueAccent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: child != null ? child : Builder(builder: builder!),
            ),
          ),
        ],
      ),
    );
  }

}

/// Smooth draggable title bar for multi-window sub-windows.
/// Uses delta accumulation + throttle to avoid jitter from coordinate feedback.
class _DraggableTitleBar extends StatelessWidget {
  final int windowId;
  final Widget child;
  const _DraggableTitleBar({required this.windowId, required this.child});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onPanStart: (_) {
        WindowController.fromWindowId(windowId).startDragging();
      },
      child: child,
    );
  }
}
