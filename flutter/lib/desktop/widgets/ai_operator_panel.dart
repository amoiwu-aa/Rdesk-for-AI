import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';

import '../../common.dart';
import '../../common/widgets/dialog.dart';
import '../../models/ai_operator_model.dart';
import '../../models/model.dart';
import '../../models/platform_model.dart';

const _kAiPanelCollapsed = 'ai-panel-collapsed';
const _kAiPanelOpacity = 'ai-panel-opacity';
const kAiPanelDefaultHeight = 340.0;
const kAiPanelExpandedWidth = 320.0;
const kAiPanelCollapsedWidth = 148.0;

class AiOperatorPanel extends StatefulWidget {
  const AiOperatorPanel({
    super.key,
    this.onHeaderDragUpdate,
    this.onHeaderDragEnd,
    this.onCollapsedChanged,
    this.width = kAiPanelExpandedWidth,
    this.height = kAiPanelDefaultHeight,
    this.onResizeUpdate,
    this.onResizeEnd,
    this.opacity = 0.7,
  });

  final ValueChanged<Offset>? onHeaderDragUpdate;
  final VoidCallback? onHeaderDragEnd;
  final ValueChanged<bool>? onCollapsedChanged;
  final double width;
  final double height;
  final ValueChanged<Offset>? onResizeUpdate;
  final VoidCallback? onResizeEnd;
  final double opacity;

  @override
  State<AiOperatorPanel> createState() => _AiOperatorPanelState();
}

class _AiOperatorPanelState extends State<AiOperatorPanel> {
  bool _collapsed = false;
  late double _opacity;

  @override
  void initState() {
    super.initState();
    _collapsed = bind.mainGetLocalOption(key: _kAiPanelCollapsed) == 'Y';
    _opacity =
        double.tryParse(bind.mainGetLocalOption(key: _kAiPanelOpacity)) ??
            widget.opacity;
  }

  void _setCollapsed(bool value) {
    setState(() => _collapsed = value);
    bind.mainSetLocalOption(key: _kAiPanelCollapsed, value: value ? 'Y' : 'N');
    widget.onCollapsedChanged?.call(value);
  }

  void _setOpacity(double value) {
    setState(() => _opacity = value);
    bind.mainSetLocalOption(
        key: _kAiPanelOpacity, value: value.toStringAsFixed(2));
  }

  Future<void> _showAiSettings(BuildContext context, AiOperatorModel model) async {
    final enabled = ValueNotifier<bool>(model.config.enabled);
    final baseUrl = TextEditingController(text: model.config.baseUrl);
    final apiKey = TextEditingController(text: model.config.apiKey);
    final aiModel = TextEditingController(text: model.config.model);
    final systemPrompt = TextEditingController(text: model.config.systemPrompt);
    final ffi = model.parent.target;
    if (ffi == null) return;

    ffi.dialogManager.show((setState, close, dialogContext) {
      Future<void> submit() async {
        await model.saveConfig(AiProviderConfig(
          enabled: enabled.value,
          baseUrl: baseUrl.text.trim(),
          apiKey: apiKey.text.trim(),
          model: aiModel.text.trim(),
          systemPrompt: systemPrompt.text.trim().isEmpty
              ? kDefaultAiSystemPrompt
              : systemPrompt.text.trim(),
        ));
        close();
      }

      return CustomAlertDialog(
        title: const Text('AI 设置'),
        content: SizedBox(
          width: 520,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ValueListenableBuilder<bool>(
                valueListenable: enabled,
                builder: (_, value, __) => CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: value,
                  title: const Text('启用自定义 AI'),
                  subtitle: const Text('支持 OpenAI 兼容的 Chat Completions 接口'),
                  onChanged: (v) {
                    enabled.value = v ?? false;
                    setState(() {});
                  },
                ),
              ),
              TextField(
                controller: baseUrl,
                decoration: const InputDecoration(
                  labelText: 'Base URL',
                  hintText: '例如：https://api.openai.com/v1',
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: apiKey,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'API Key',
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: aiModel,
                decoration: const InputDecoration(
                  labelText: 'Model',
                  hintText: '例如：gpt-4.1 / qwen-max / kimi-k2',
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: systemPrompt,
                minLines: 4,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'System Prompt',
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '注意：命令会发往远端终端执行。请优先使用只读排查命令，高风险命令建议保留人工确认。',
                style: TextStyle(fontSize: 12, color: Colors.orangeAccent),
              ),
            ],
          ),
        ),
        actions: [
          dialogButton('Cancel', onPressed: close, isOutline: true),
          dialogButton('OK', onPressed: submit),
        ],
        onCancel: close,
        onSubmit: submit,
      );
    });
  }

  Color _riskColor(AiCommandRisk risk) {
    switch (risk) {
      case AiCommandRisk.low:
        return Colors.green;
      case AiCommandRisk.medium:
        return Colors.orange;
      case AiCommandRisk.high:
        return Colors.red;
    }
  }

  String _riskText(AiCommandRisk risk) {
    switch (risk) {
      case AiCommandRisk.low:
        return '低风险';
      case AiCommandRisk.medium:
        return '中风险';
      case AiCommandRisk.high:
        return '高风险';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() => Consumer<AiOperatorModel>(
      builder: (context, model, child) {
        final pendingIndex = model.pendingConfirmationStep;
        final pendingStep = pendingIndex != null && model.plan != null
            ? model.plan!.steps[pendingIndex]
            : null;
        final aiAllowed = gFFI.userModel.hasMembershipFeature('ai');

        if (_collapsed) {
          return Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: () => _setCollapsed(false),
              onPanUpdate: widget.onHeaderDragUpdate == null
                  ? null
                  : (details) => widget.onHeaderDragUpdate!(details.delta),
              onPanEnd: widget.onHeaderDragEnd == null
                  ? null
                  : (_) => widget.onHeaderDragEnd!(),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(_opacity),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white.withAlpha(25)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.smart_toy_outlined,
                        color: Colors.white70, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'AI 命令助手',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(width: 6),
                    Icon(Icons.open_with_rounded,
                        color: Colors.white70, size: 14),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_up_rounded,
                        color: Colors.white70, size: 16),
                  ],
                ),
              ),
            ),
          );
        }

        return Container(
          width: widget.width,
          height: widget.height,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(_opacity),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withAlpha(25)),
          ),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          behavior: HitTestBehavior.translucent,
                          onDoubleTap: () => _setCollapsed(true),
                          onPanUpdate: widget.onHeaderDragUpdate == null
                              ? null
                              : (details) => widget.onHeaderDragUpdate!(details.delta),
                          onPanEnd: widget.onHeaderDragEnd == null
                              ? null
                              : (_) => widget.onHeaderDragEnd!(),
                          child: Row(
                            children: [
                              const Text(
                                'AI 命令助手',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withAlpha(12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: const Icon(Icons.open_with_rounded,
                                    color: Colors.white70, size: 14),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      PopupMenuButton<double>(
                        tooltip: '透明度',
                        initialValue: _opacity,
                        color: Colors.black.withAlpha(220),
                        onSelected: _setOpacity,
                        itemBuilder: (context) => const [
                          PopupMenuItem(
                              value: 0.55, child: Text('更透明 55%')),
                          PopupMenuItem(
                              value: 0.70, child: Text('标准 70%')),
                          PopupMenuItem(
                              value: 0.85, child: Text('更清晰 85%')),
                          PopupMenuItem(
                              value: 0.95, child: Text('几乎不透明 95%')),
                        ],
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Icon(Icons.opacity_rounded,
                              color: Colors.white70, size: 14),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        borderRadius: BorderRadius.circular(999),
                        onTap: () => _setCollapsed(true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(18),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '最小化',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.keyboard_arrow_down_rounded,
                                  color: Colors.white70, size: 16),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (!aiAllowed) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.orange.withAlpha(28),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.withAlpha(90)),
                      ),
                      child: const Text(
                        '当前账号未开通 AI 助手会员能力，请续费后使用。',
                        style: TextStyle(color: Colors.orangeAccent),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          model.config.ready
                              ? '当前提供方：${model.config.model}'
                              : '当前提供方：本地规则',
                          style: TextStyle(color: Colors.white.withAlpha(180)),
                        ),
                      ),
                      dialogButton(
                        'AI 设置',
                        onPressed: () => _showAiSettings(context, model),
                        isOutline: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: aiAllowed
                        ? null
                        : () => model.setInlineMembershipMessage('AI 助手'),
                    child: AbsorbPointer(
                      absorbing: !aiAllowed,
                      child: TextField(
                        controller: model.goalController,
                        minLines: 2,
                        maxLines: 4,
                        enabled: aiAllowed,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: aiAllowed
                              ? '例如：帮我检查这台机器为什么 8080 端口没起来'
                              : '开通会员后可使用 AI 命令助手',
                          hintStyle:
                              TextStyle(color: Colors.white.withAlpha(120)),
                          filled: true,
                          fillColor: Colors.white.withAlpha(20),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      dialogButton(
                        model.busy ? '生成中...' : '生成计划',
                        onPressed: model.busy
                            ? null
                            : () async {
                                if (!await gFFI.userModel
                                    .ensureMembershipFeature('ai')) {
                                  model.setInlineMembershipMessage('AI 助手');
                                  return;
                                }
                                model.buildPlan();
                              },
                      ),
                      dialogButton(
                        '执行下一步',
                        onPressed: model.busy || !model.hasPlan
                            ? null
                            : () async {
                                if (!await gFFI.userModel
                                    .ensureMembershipFeature('ai')) {
                                  model.setInlineMembershipMessage('AI 助手');
                                  return;
                                }
                                model.executeNextStep();
                              },
                      ),
                      dialogButton(
                        '继续规划',
                        onPressed: model.busy || model.contextPreview.isEmpty
                            ? null
                            : () async {
                                if (!await gFFI.userModel
                                    .ensureMembershipFeature('ai')) {
                                  model.setInlineMembershipMessage('AI 助手');
                                  return;
                                }
                                model.continuePlanning();
                              },
                      ),
                      dialogButton(
                        '复制输出',
                        onPressed: model.terminalBuffer.isEmpty
                            ? null
                            : model.copyLastOutput,
                        isOutline: true,
                      ),
                      dialogButton(
                        '清空',
                        onPressed: model.busy ? null : model.clearPlan,
                        isOutline: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    model.status,
                    style: TextStyle(color: Colors.white.withAlpha(220)),
                  ),
                  if (model.securityMessage.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.orange.withAlpha(32),
                        borderRadius: BorderRadius.circular(8),
                        border:
                            Border.all(color: Colors.orange.withAlpha(90)),
                      ),
                      child: Text(
                        model.securityMessage,
                        style: const TextStyle(color: Colors.orangeAccent),
                      ),
                    ),
                  ],
                  if (pendingStep != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.red.withAlpha(28),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.withAlpha(80)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '待确认命令',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            pendingStep.title,
                            style: const TextStyle(color: Colors.white70),
                          ),
                          const SizedBox(height: 6),
                          SelectableText(
                            pendingStep.command,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              dialogButton(
                                '确认执行',
                                onPressed: model.busy
                                    ? null
                                    : model.confirmPendingStep,
                              ),
                              dialogButton(
                                '取消',
                                onPressed: model.busy
                                    ? null
                                    : model.cancelPendingStep,
                                isOutline: true,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (model.plan != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      '计划摘要：${model.plan!.summary} (${model.plan!.providerLabel})',
                      style: TextStyle(color: Colors.white.withAlpha(220)),
                    ),
                    const SizedBox(height: 10),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 220),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: model.plan!.steps.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final step = model.plan!.steps[index];
                          final active = model.currentStep == index;
                          return Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: active
                                  ? Colors.white.withAlpha(24)
                                  : Colors.white.withAlpha(14),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: active
                                    ? Colors.lightBlueAccent.withAlpha(180)
                                    : Colors.white.withAlpha(20),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${index + 1}. ${step.title}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: _riskColor(step.risk)
                                            .withAlpha(40),
                                        borderRadius:
                                            BorderRadius.circular(999),
                                      ),
                                      child: Text(
                                        _riskText(step.risk),
                                        style: TextStyle(
                                          color: _riskColor(step.risk),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                SelectableText(
                                  step.command,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  step.reason,
                                  style: TextStyle(
                                      color: Colors.white.withAlpha(180)),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  const Text(
                    '输出摘要',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(10),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: SelectableText(
                      model.outputSummary,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    model.contextStats,
                    style: TextStyle(
                        color: Colors.white.withAlpha(150), fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    '终端输出',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: SingleChildScrollView(
                        child: SelectableText(
                          model.terminalBuffer.isEmpty
                              ? '暂无输出'
                              : model.terminalBuffer,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontFamily: 'monospace',
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: GestureDetector(
                  onPanUpdate: widget.onResizeUpdate == null
                      ? null
                      : (details) => widget.onResizeUpdate!(details.delta),
                  onPanEnd: widget.onResizeEnd == null
                      ? null
                      : (_) => widget.onResizeEnd!(),
                  child: Container(
                    width: 28,
                    height: 28,
                    alignment: Alignment.bottomRight,
                    child: Icon(
                      Icons.open_in_full_rounded,
                      size: 16,
                      color: Colors.white.withAlpha(120),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    ));
  }
}
