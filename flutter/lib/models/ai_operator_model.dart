import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hbb/utils/http_service.dart' as http;

import '../common.dart';
import 'model.dart';
import 'platform_model.dart';
import 'terminal_model.dart';

const _kAiProviderConfig = 'ai-provider-config';
const kDefaultAiSystemPrompt =
    'You are an autonomous AI Agent for remote maintenance. '
    'Return strict JSON only. '
    'Break tasks into safe, minimal step-by-step terminal commands. '
    'If the user goal is fully achieved or no further action is needed, leave the "steps" array empty to signal completion. '
    'Prefer inspection commands first. '
    'Use Windows PowerShell commands unless the user clearly asks for Linux/macOS shell. '
    'Never include markdown fences.';

enum AiCommandRisk { low, medium, high }

const kDefaultCustomAgents = [
  {'name': '🛠️ 通用维护助手', 'prompt': '你是精通Windows/Linux系统维护的桌面终端专家。请全面检查系统状态并优先给出典型的排查命令。'},
  {'name': '🕵️ 安全审计员', 'prompt': '你是资深网络安全专家。请重点关注系统是否存在后门、漏洞、多余特权账号或不安全的配置。'},
  {'name': '💻 代码/脚本专家', 'prompt': '你是架构师级别的程序员，精通各种脚本语言。请侧重于通过编写高效、健壮的 PowerShell、Bash 或 Python 脚本自动化解决特定问题。'}
];

const kDefaultCustomSkills = [
  {'name': '常见终端诊断库', 'prompt': '必须使用 PowerShell 原生命令进行问题诊断（例如 Get-NetTCPConnection 代替 netstat）。'},
  {'name': '危险操作脱敏规则', 'prompt': '拦截并警告任何尝试格式化磁盘、修改核心注册表、删除系统目录的高危命令。'}
];

class AiProviderConfig {
  AiProviderConfig({
    this.enabled = false,
    this.apiType = 'openai',
    this.baseUrl = '',
    this.apiKey = '',
    this.model = '',
    this.systemPrompt = kDefaultAiSystemPrompt,
    this.customAgents = kDefaultCustomAgents,
    this.customSkills = kDefaultCustomSkills,
  });

  final bool enabled;
  final String apiType;
  final String baseUrl;
  final String apiKey;
  final String model;
  final String systemPrompt;
  final List<Map<String, String>> customAgents;
  final List<Map<String, String>> customSkills;

  bool get ready =>
      enabled && baseUrl.trim().isNotEmpty && model.trim().isNotEmpty;

  Map<String, dynamic> toJson() => {
        'enabled': enabled,
        'api_type': apiType,
        'base_url': baseUrl,
        'api_key': apiKey,
        'model': model,
        'system_prompt': systemPrompt,
        'custom_agents': customAgents,
        'custom_skills': customSkills,
      };

  factory AiProviderConfig.fromJson(Map<String, dynamic> json) {
    var agents = (json['custom_agents'] as List<dynamic>?)?.map((e) => Map<String, String>.from(e)).toList() ?? [];
    if (agents.isEmpty) {
      agents = kDefaultCustomAgents;
    }
    var skills = (json['custom_skills'] as List<dynamic>?)?.map((e) => Map<String, String>.from(e)).toList() ?? [];
    if (skills.isEmpty) {
      skills = kDefaultCustomSkills;
    }
    return AiProviderConfig(
      enabled: json['enabled'] == true,
      apiType: json['api_type']?.toString() ?? 'openai',
      baseUrl: json['base_url']?.toString() ?? '',
      apiKey: json['api_key']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      systemPrompt: json['system_prompt']?.toString() ?? kDefaultAiSystemPrompt,
      customAgents: agents,
      customSkills: skills,
    );
  }
}

class AiCommandStep {
  AiCommandStep({
    required this.title,
    required this.command,
    required this.reason,
    required this.risk,
    this.requiresConfirmation = false,
  });

  final String title;
  final String command;
  final String reason;
  final AiCommandRisk risk;
  final bool requiresConfirmation;

  Map<String, dynamic> toJson() => {
        'title': title,
        'command': command,
        'reason': reason,
        'risk': risk.name,
        'requires_confirmation': requiresConfirmation,
      };

  factory AiCommandStep.fromJson(Map<String, dynamic> json) {
    final riskValue = (json['risk']?.toString() ?? 'low').toLowerCase();
    final risk = AiCommandRisk.values.firstWhere(
      (e) => e.name == riskValue,
      orElse: () => AiCommandRisk.low,
    );
    return AiCommandStep(
      title: json['title']?.toString() ?? '未命名步骤',
      command: json['command']?.toString() ?? '',
      reason: json['reason']?.toString() ?? '',
      risk: risk,
      requiresConfirmation: json['requires_confirmation'] == true,
    );
  }
}

class AiCommandPlan {
  AiCommandPlan({
    required this.goal,
    required this.shell,
    required this.summary,
    required this.steps,
    this.providerLabel = 'Local',
    this.needsTerminalOutput = false,
  });

  final String goal;
  final String shell;
  final String summary; // Mapped from reply_to_user
  final List<AiCommandStep> steps;
  final String providerLabel;
  final bool needsTerminalOutput;

  factory AiCommandPlan.fromJson(Map<String, dynamic> json) {
    final rawSteps = (json['steps'] as List<dynamic>? ?? []);
    return AiCommandPlan(
      goal: json['goal']?.toString() ?? '',
      shell: json['shell']?.toString() ?? 'powershell',
      summary: json['reply_to_user']?.toString() ?? json['summary']?.toString() ?? '',
      providerLabel: json['provider']?.toString() ?? 'Custom AI',
      needsTerminalOutput: json['needs_terminal_output'] == true,
      steps: rawSteps
          .whereType<Map>()
          .map((e) => AiCommandStep.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
    );
  }
}

enum ChatRole { user, ai }

class AiChatTurn {
  AiChatTurn({
    required this.role,
    required this.text,
    this.plan,
    this.terminalOutput,
  });

  final ChatRole role;
  final String text;
  final AiCommandPlan? plan;
  final String? terminalOutput;

  Map<String, dynamic> toJson() => {
    'role': role == ChatRole.user ? 'user' : 'ai',
    'text': text,
    if (terminalOutput != null) 'terminalOutput': terminalOutput,
    'plan': plan != null ? {
      'goal': plan!.goal,
      'shell': plan!.shell,
      'summary': plan!.summary,
      'provider': plan!.providerLabel,
      'needs_terminal_output': plan!.needsTerminalOutput,
      'steps': plan!.steps.map((e) => e.toJson()).toList(),
    } : null,
  };

  factory AiChatTurn.fromJson(Map<String, dynamic> json) {
    return AiChatTurn(
      role: json['role'] == 'user' ? ChatRole.user : ChatRole.ai,
      text: json['text']?.toString() ?? '',
      plan: json['plan'] != null ? AiCommandPlan.fromJson(Map<String, dynamic>.from(json['plan'])) : null,
      terminalOutput: json['terminalOutput']?.toString(),
    );
  }
}

class AiChatSession {
  final String id;
  String title;
  int updatedAt;
  List<AiChatTurn> history;
  
  AiChatSession({
    required this.id,
    required this.title,
    required this.updatedAt,
    required this.history,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'updatedAt': updatedAt,
    'history': history.map((e) => e.toJson()).toList(),
  };

  factory AiChatSession.fromJson(Map<String, dynamic> json) => AiChatSession(
    id: json['id'] as String? ?? DateTime.now().millisecondsSinceEpoch.toString(),
    title: json['title'] as String? ?? '未命名诊断',
    updatedAt: json['updatedAt'] as int? ?? DateTime.now().millisecondsSinceEpoch,
    history: (json['history'] as List?)?.map((e) => AiChatTurn.fromJson(Map<String, dynamic>.from(e))).toList() ?? [],
  );
}

class AiOperatorModel with ChangeNotifier {
  AiOperatorModel(this.parent) {
    _initModel();
  }

  Future<void> _initModel() async {
    await loadConfig();
    await _loadHistory();
  }

  final WeakReference<FFI> parent;
  final TextEditingController goalController = TextEditingController();

  final List<AiChatSession> _sessions = [];
  List<AiChatSession> get sessions => _sessions;

  String _currentSessionId = DateTime.now().millisecondsSinceEpoch.toString();
  String get currentSessionId => _currentSessionId;

  final List<AiChatTurn> _chatHistory = [];
  String _activeGoal = '';
  String _activeAgent = kDefaultCustomAgents.first['name']!;
  final List<String> _activeSkills = [];
  AiCommandPlan? _plan;
  bool _busy = false;
  bool _executing = false;
  bool _configLoaded = false;
  bool _autoPilot = false; // Agent Auto-Workflow mode
  int _currentStep = -1;
  int? _pendingConfirmationStep;
  String _status = '请输入目标';
  String _terminalBuffer = '';
  String _globalTerminalBuffer = '';
  String _securityMessage = '';
  String _outputSummary = '暂无输出摘要';
  String _contextPreview = '';
  String _contextStats = '暂无上下文';
  final List<String> _logs = [];

  AiProviderConfig _config = AiProviderConfig();
  TerminalModel? _terminalModel;
  StreamSubscription<String>? _terminalSubscription;
  int _nextTerminalId = 9001;
  bool _disposed = false;

  static const int _maxStoredOutputChars = 12000;
  static const int _maxAiContextChars = 4000;
  static const int _summaryScanLines = 80;
  static const int _summaryTailLines = 20;

  static final List<RegExp> _blockedPatterns = [
    RegExp(r'(^|\s)format(\.exe)?(\s|$)', caseSensitive: false),
    RegExp(r'(^|\s)diskpart(\s|$)', caseSensitive: false),
    RegExp(r'bcdedit\s+/delete', caseSensitive: false),
    RegExp(r'cipher\s+/w', caseSensitive: false),
    RegExp(r'rm\s+-rf\s+/', caseSensitive: false),
    RegExp(r'Remove-Item\b.*System32', caseSensitive: false),
    RegExp(r'reg\s+delete\s+HKLM\\SYSTEM', caseSensitive: false),
  ];

  static final List<RegExp> _sensitivePatterns = [
    RegExp(r'(^|\s)(shutdown|restart-computer|stop-computer)(\s|$)',
        caseSensitive: false),
    RegExp(r'(^|\s)(remove-item|del|erase)(\s|$)', caseSensitive: false),
    RegExp(r'(^|\s)reg\s+(add|delete)(\s|$)', caseSensitive: false),
    RegExp(r'(^|\s)sc\s+delete(\s|$)', caseSensitive: false),
    RegExp(r'(^|\s)net\s+user(\s|$)', caseSensitive: false),
    RegExp(r'(^|\s)set-executionpolicy(\s|$)', caseSensitive: false),
    RegExp(r'Invoke-WebRequest|curl|wget', caseSensitive: false),
  ];

  static final RegExp _importantLinePattern = RegExp(
    r'error|failed|failure|denied|refused|exception|timeout|not found|stopped|listen|running|warning',
    caseSensitive: false,
  );

  AiCommandPlan? get plan => _plan;
  bool get busy => _busy;
  bool get executing => _executing;
  bool get configLoaded => _configLoaded;
  int get currentStep => _currentStep;
  int? get pendingConfirmationStep => _pendingConfirmationStep;
  String get status => _status;
  String get terminalBuffer => _terminalBuffer;
  String get globalTerminalBuffer => _globalTerminalBuffer;
  String get securityMessage => _securityMessage;
  String get outputSummary => _outputSummary;
  String get contextPreview => _contextPreview;
  String get contextStats => _contextStats;
  String get activeAgent => _activeAgent;
  List<String> get activeSkills => List.unmodifiable(_activeSkills);
  AiProviderConfig get config => _config;
  List<String> get logs => List.unmodifiable(_logs);
  List<AiChatTurn> get chatHistory => List.unmodifiable(_chatHistory);
  String get activeGoal => _activeGoal;
  bool get hasPlan => _plan != null;
  bool get awaitingConfirmation => _pendingConfirmationStep != null;
  bool get autoPilot => _autoPilot;

  void setActiveAgent(String agent) {
    _activeAgent = agent;
    notifyListeners();
  }

  void toggleSkill(String skill) {
    if (_activeSkills.contains(skill)) {
      _activeSkills.remove(skill);
    } else {
      _activeSkills.add(skill);
    }
    notifyListeners();
  }

  void toggleAutoPilot(bool value) {
    _autoPilot = value;
    if (_autoPilot && hasPlan && !_busy && !awaitingConfirmation) {
      _triggerNextAgentLoop();
    }
    notifyListeners();
  }

  void executeNextStep() {
    final plan = _plan;
    if (plan == null) return;
    final nextIndex = _currentStep + 1;
    if (nextIndex < plan.steps.length) {
      _pendingConfirmationStep = null;
      _securityMessage = '';
      executeStep(nextIndex, confirmed: true);
    }
  }

  void interrupt() {
    _status = '操作已被用户中断';
    _appendLog('用户主动打断了 AI 的生成或执行流程');
    _plan?.steps.clear(); // Ensure no more steps execute
    _pendingConfirmationStep = null;
    _securityMessage = '';
    _busy = false;
    _executing = false;
    _autoPilot = false; // Turn off autopilot on interrupt
    notifyListeners();
  }

  void _triggerNextAgentLoop() {
    final currentPlan = _plan;
    if (_busy || awaitingConfirmation || currentPlan == null) return;
    if (!_autoPilot && !currentPlan.needsTerminalOutput) return;

    Future.delayed(const Duration(seconds: 1), () {
      if (_disposed) return;
      if (!_autoPilot && !currentPlan.needsTerminalOutput) return;
      
      if (_currentStep + 1 < currentPlan.steps.length) {
        executeNextStep();
      } else {
        // Plan fully executed. Wait longer for terminal output, then continue autonomously.
        Future.delayed(const Duration(seconds: 3), () {
          if (!awaitingConfirmation && !_disposed && !_busy) {
            continuePlanning();
          }
        });
      }
    });
  }

  Future<void> loadConfig() async {
    final raw = await bind.mainGetOption(key: _kAiProviderConfig);
    if (raw.isNotEmpty) {
      try {
        _config = AiProviderConfig.fromJson(
          Map<String, dynamic>.from(jsonDecode(raw) as Map),
        );
      } catch (_) {}
    }
    _configLoaded = true;
    notifyListeners();
  }

  Future<void> saveConfig(AiProviderConfig config) async {
    _config = config;
    await bind.mainSetOption(
      key: _kAiProviderConfig,
      value: jsonEncode(config.toJson()),
    );
    _appendLog(config.ready ? '已更新 AI 提供方配置' : '已保存 AI 配置');
    notifyListeners();
  }

  Future<void> _saveHistory() async {
    final id = parent.target?.id;
    if (id == null || id.isEmpty) return;
    try {
      final listToSave = List<AiChatTurn>.from(_chatHistory);
      if (_plan != null || _activeGoal.isNotEmpty) {
        listToSave.add(AiChatTurn(
          role: ChatRole.ai,
          text: _plan?.summary ?? '任务强制中断或未知状态',
          plan: _plan,
          terminalOutput: _terminalBuffer.isEmpty ? null : _terminalBuffer,
        ));
      }

      final trimmedHistory = listToSave.length > 100 
          ? listToSave.sublist(listToSave.length - 100) 
          : listToSave;
      
      final sessionIndex = _sessions.indexWhere((s) => s.id == _currentSessionId);
      final firstUserAction = _chatHistory.firstWhere((t) => t.role == ChatRole.user, orElse: () => AiChatTurn(role: ChatRole.user, text: '新诊断任务')).text;
      final shortenedTitle = firstUserAction.length > 20 ? '${firstUserAction.substring(0, 20)}...' : firstUserAction;

      if (sessionIndex >= 0) {
        _sessions[sessionIndex].history = trimmedHistory;
        _sessions[sessionIndex].updatedAt = DateTime.now().millisecondsSinceEpoch;
        _sessions[sessionIndex].title = shortenedTitle;
      } else {
        _sessions.insert(0, AiChatSession(
          id: _currentSessionId,
          title: shortenedTitle,
          updatedAt: DateTime.now().millisecondsSinceEpoch,
          history: trimmedHistory,
        ));
      }

      _sessions.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      if (_sessions.length > 30) _sessions.removeLast();

      final storageList = _sessions.map((e) => e.toJson()).toList();
      await bind.mainSetPeerOption(id: id, key: 'ai_operator_sessions', value: jsonEncode(storageList));
    } catch (e) {
      debugPrint('Failed to save AI history: $e');
    }
  }

  Future<void> _loadHistory() async {
    final id = parent.target?.id;
    if (id == null || id.isEmpty) return;
    try {
      final rawOld = await bind.mainGetPeerOption(id: id, key: 'ai_operator_memory');
      final rawNew = await bind.mainGetPeerOption(id: id, key: 'ai_operator_sessions');
      
      _sessions.clear();
      if (rawNew.isNotEmpty) {
        final List<dynamic> list = jsonDecode(rawNew);
        _sessions.addAll(list.map((e) => AiChatSession.fromJson(Map<String, dynamic>.from(e))));
      } else if (rawOld.isNotEmpty) {
        // Migration from old single-session format
        final List<dynamic> list = jsonDecode(rawOld);
        final history = list.map((e) => AiChatTurn.fromJson(Map<String, dynamic>.from(e))).toList();
        _sessions.add(AiChatSession(
          id: _currentSessionId,
          title: history.isNotEmpty ? history.first.text : '历史会话',
          updatedAt: DateTime.now().millisecondsSinceEpoch,
          history: history
        ));
      }

      if (_sessions.isNotEmpty) {
        _currentSessionId = _sessions.first.id;
        _chatHistory.clear();
        _chatHistory.addAll(_sessions.first.history);
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load AI history: $e');
    }
  }

  void switchSession(String sessionId) {
    final s = _sessions.firstWhere((s) => s.id == sessionId, orElse: () => _sessions.first);
    _currentSessionId = s.id;
    _chatHistory.clear();
    _chatHistory.addAll(s.history);
    _plan = null;
    _currentStep = -1;
    _pendingConfirmationStep = null;
    _securityMessage = '';
    _status = '已恢复会话：${s.title}';
    _terminalBuffer = '';
    _globalTerminalBuffer = '会话恢复，等待新指令...\n';
    _outputSummary = '暂无输出摘要';
    goalController.clear();
    notifyListeners();
  }

  void _appendLog(String text) {
    _logs.insert(0, text);
    if (_logs.length > 100) {
      _logs.removeLast();
    }
    notifyListeners();
  }

  void setInlineMembershipMessage(String capability) {
    _securityMessage = '$capability 需要开通会员后使用。';
    _status = '请刷新会员状态或前往账户页查看当前套餐';
    notifyListeners();
  }

  void _setStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<void> buildPlan() async {
    final goal = goalController.text.trim();
    if (goal.isEmpty) {
      _setStatus('请先输入目标');
      return;
    }

    if (_activeGoal.isNotEmpty || _plan != null || _terminalBuffer.isNotEmpty) {
      _chatHistory.add(AiChatTurn(
        role: ChatRole.ai,
        text: _plan?.summary ?? '（任务强制中断/本地规则）',
        plan: _plan,
        terminalOutput: _terminalBuffer.isEmpty ? null : _terminalBuffer,
      ));
      _plan = null;
      _currentStep = -1;
      _terminalBuffer = '';
      _contextStats = '暂无上下文';
      _outputSummary = '暂无输出摘要';
    }

    _activeGoal = goal;
    _chatHistory.add(AiChatTurn(role: ChatRole.user, text: goal));
    goalController.clear();

    _busy = true;
    notifyListeners();
    try {
      if (_config.ready) {
        _plan = await _buildRemotePlan(_activeGoal);
      } else {
        _plan = _buildLocalPlan(_activeGoal);
      }
      _currentStep = -1;
      _pendingConfirmationStep = null;
      _securityMessage = '';
      _status = '已生成命令计划';
    } catch (e) {
      _plan = _buildLocalPlan(goal);
      _currentStep = -1;
      _pendingConfirmationStep = null;
      _securityMessage = '';
      _appendLog('自定义 AI 生成失败，已回退本地规则：$e');
      _status = '自定义 AI 不可用，已回退本地规则';
    } finally {
      _busy = false;
      notifyListeners();
      _saveHistory();
      if (_plan != null && _plan!.steps.isNotEmpty) {
        _autoRunSteps();
      }
    }
  }

  Future<AiCommandPlan> _buildRemotePlan(
    String goal, {
    String previousOutput = '',
    AiCommandPlan? currentPlan,
  }) async {
    final contextText = previousOutput.isEmpty ? _contextPreview : previousOutput;
    
    final payloadJsonStr = jsonEncode({
      'goal': goal,
      'current_plan': currentPlan == null
          ? null
          : {
              'summary': currentPlan.summary,
              'shell': currentPlan.shell,
              'steps': currentPlan.steps.map((e) => e.toJson()).toList(),
            },
      'recent_terminal_output': contextText,
      'context_stats': _contextStats,
      'required_schema': {
        'reply_to_user': 'string (Direct response to user. Briefly explain what you are doing, or provide the final answer)',
        'needs_terminal_output': 'boolean (Set to true if you need to execute commands and read the terminal output to answer the user. Set to false if no commands are needed or the task is fully complete)',
        'steps': [
          {
            'title': 'string',
            'command': 'string',
            'reason': 'string',
            'risk': 'low|medium|high'
          }
        ] // (Can be empty array [] if no commands are needed)
      }
    });

    final String urlStr;
    final Map<String, String> headers;
    final Map<String, dynamic> body;

    final messages = <Map<String, String>>[];
    
    // Embed UI-selected Agent and Skills
    final customAgentOpt = _config.customAgents.where((e) => e['name'] == _activeAgent).toList();
    final agentPrompt = customAgentOpt.isNotEmpty ? customAgentOpt.first['prompt'] : '';
    final dynamicPersona = customAgentOpt.isNotEmpty && agentPrompt!.isNotEmpty ? '\n\n【当前主身份代理】：$_activeAgent。\n$agentPrompt' : '';
    
    final selectedSkillPrompts = _activeSkills.map((s) {
       final matched = _config.customSkills.where((cs) => cs['name'] == s).toList();
       return matched.isNotEmpty ? '- $s (强制要求: ${matched.first["prompt"]})' : '- $s';
    }).join('\n');
    final dynamicSkills = _activeSkills.isEmpty ? '' : '\n\n【已加载强化技能库】：\n$selectedSkillPrompts\n如果当前任务相关，请**必须优先**参考和使用前述挂载的专业技能。';
    
    final totalSystemPrompt = '${_config.systemPrompt}$dynamicPersona$dynamicSkills';

    messages.add({'role': 'system', 'content': totalSystemPrompt});    
    // Add history
    for (final turn in _chatHistory) {
      if (turn.text.startsWith('[Agent Context]')) continue;
      messages.add({
        'role': turn.role == ChatRole.user ? 'user' : 'assistant',
        'content': turn.role == ChatRole.user 
            ? turn.text 
            : (turn.plan != null ? '${turn.plan!.summary}\n【我之前已执行过的指令】:\n${turn.plan!.steps.map((s) => s.command).join('\n')}' : turn.text),
      });
    }
    
    // Add current goal
    messages.add({'role': 'user', 'content': payloadJsonStr});

    if (_config.apiType == 'anthropic') {
      urlStr = _normalizeAnthropicUrl(_config.baseUrl);
      headers = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      };
      if (_config.apiKey.trim().isNotEmpty) {
        headers['x-api-key'] = _config.apiKey.trim();
      }
      body = {
        'model': _config.model,
        'max_tokens': 4000,
        'temperature': 0.2,
        'system': totalSystemPrompt,
        'messages': messages.where((m) => m['role'] != 'system').toList(),
      };
    } else {
      urlStr = _normalizeChatUrl(_config.baseUrl);
      headers = {
        'Content-Type': 'application/json',
        if (_config.apiKey.trim().isNotEmpty)
          'Authorization': 'Bearer ${_config.apiKey.trim()}',
      };
      body = {
        'model': _config.model,
        'temperature': 0.2,
        'messages': messages,
      };
    }

    final uri = Uri.parse(urlStr);
    final resp = await http.post(uri, headers: headers, body: jsonEncode(body));
    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw Exception('HTTP ${resp.statusCode}: ${resp.body}');
    }

    final decoded = jsonDecode(resp.body) as Map<String, dynamic>;
    String text;

    if (_config.apiType == 'anthropic') {
      final content = decoded['content'] as List<dynamic>?;
      if (content == null || content.isEmpty) throw Exception('No content returned by Anthropic');
      text = content.first['text'] as String;
    } else {
      final choices = decoded['choices'] as List<dynamic>?;
      if (choices == null || choices.isEmpty) throw Exception('No choices returned by OpenAI API');
      final message = Map<String, dynamic>.from(choices.first['message'] as Map);
      final content = message['content'];
      if (content is String) {
        text = content;
      } else if (content is List && content.isNotEmpty) {
        text = (content.first['text'] ?? '').toString();
      } else {
        throw Exception('Invalid content from API');
      }
    }

    // Attempt to strip out markdown fences if the API mistakenly wrapped the JSON payload
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.substring(7);
    } else if (text.startsWith('```')) {
      text = text.substring(3);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    final parsed = Map<String, dynamic>.from(jsonDecode(text) as Map);
    return AiCommandPlan.fromJson(parsed);
  }

  String _normalizeChatUrl(String baseUrl) {
    if (baseUrl.trim().isEmpty) return 'https://api.openai.com/v1/chat/completions';
    final trimmed = baseUrl.trim();
    if (trimmed.endsWith('/chat/completions')) return trimmed;
    if (trimmed.endsWith('/v1')) return '$trimmed/chat/completions';
    if (trimmed.endsWith('/')) return '${trimmed}v1/chat/completions';
    return '$trimmed/v1/chat/completions';
  }

  String _normalizeAnthropicUrl(String baseUrl) {
    if (baseUrl.trim().isEmpty) return 'https://api.anthropic.com/v1/messages';
    final trimmed = baseUrl.trim();
    if (trimmed.endsWith('/messages')) return trimmed;
    if (trimmed.endsWith('/v1')) return '$trimmed/messages';
    if (trimmed.endsWith('/')) return '${trimmed}v1/messages';
    return '$trimmed/v1/messages';
  }

  Future<void> clearPlan() async {
    // 1. Force save the current session state before clearing
    await _saveHistory();

    // 2. Fork a new session
    _currentSessionId = DateTime.now().millisecondsSinceEpoch.toString();

    _plan = null;
    _currentStep = -1;
    _pendingConfirmationStep = null;
    _executing = false;
    _autoPilot = false; // Reset autopilot on clear
    _securityMessage = '';
    _status = '新会话已开启';
    _chatHistory.clear();
    _activeGoal = '';
    _terminalBuffer = '';
    _globalTerminalBuffer = '会话已重置，等待新指令...\n';
    _contextStats = '暂无上下文';
    _outputSummary = '暂无输出摘要';
    goalController.clear();
    
    // 3. Save the new blank session to registry
    await _saveHistory(); 
    notifyListeners();
  }


  String? _blockedReason(String command) {
    for (final pattern in _blockedPatterns) {
      if (pattern.hasMatch(command)) return '极其危险的命令，系统已绝对拦截';
    }
    return null;
  }

  bool _needsConfirmation(AiCommandStep step) {
    if (step.risk == AiCommandRisk.high) return true;
    for (final pattern in _sensitivePatterns) {
      if (pattern.hasMatch(step.command)) return true;
    }
    // If autoPilot (Full Auto Mode) is OFF, EVERY step needs user confirmation
    if (!_autoPilot) return true;
    return false;
  }

  String _confirmationReason(AiCommandStep step) {
    if (step.risk == AiCommandRisk.high || _sensitivePatterns.any((p) => p.hasMatch(step.command))) {
      return '危险操作：包含删除、重启、修改系统或网络下载敏感操作';
    }
    return '等待执行授权 (安全确认模式)';
  }

  /// Auto-execute all steps in the current plan sequentially.
  /// This is called after plan generation and after each step completes.
  void _autoRunSteps() {
    Future.delayed(const Duration(milliseconds: 800), () {
      if (_disposed || _busy) return;
      final plan = _plan;
      if (plan == null) return;
      final nextIndex = _currentStep + 1;
      if (nextIndex < plan.steps.length) {
        final step = plan.steps[nextIndex];
        if (_needsConfirmation(step)) {
          _pendingConfirmationStep = nextIndex;
          _securityMessage = _confirmationReason(step);
          _status = '等待用户授权执行该步骤';
          notifyListeners();
        } else {
          executeStep(nextIndex);
        }
      } else if (_autoPilot || plan.needsTerminalOutput) {
        // All steps done. If AI requested terminal feedback (or autopilot is on), trigger loop
        _triggerNextAgentLoop();
      }
    });
  }

  AiCommandPlan _buildLocalPlan(String goal) {
    final lower = goal.toLowerCase();
    if (lower.contains('端口') || lower.contains('port')) {
      return AiCommandPlan(
        goal: goal,
        shell: 'powershell',
        summary: '先查看监听和连接，再确认进程与服务状态。',
        providerLabel: 'Local Fallback',
        steps: [
          AiCommandStep(
            title: '查看监听端口',
            command: 'Get-NetTCPConnection -State Listen | Sort-Object LocalPort',
            reason: '确认目标端口是否已经监听',
            risk: AiCommandRisk.low,
          ),
          AiCommandStep(
            title: '查看网络连接',
            command: 'Get-NetTCPConnection | Sort-Object LocalPort',
            reason: '排查端口占用和连接状态',
            risk: AiCommandRisk.low,
          ),
          AiCommandStep(
            title: '查看进程概况',
            command: 'Get-Process | Sort-Object ProcessName',
            reason: '找出可能相关的进程',
            risk: AiCommandRisk.low,
          ),
        ],
      );
    }
    if (lower.contains('服务') || lower.contains('service')) {
      return AiCommandPlan(
        goal: goal,
        shell: 'powershell',
        summary: '先看服务整体状态，再聚焦停止的服务。',
        providerLabel: 'Local Fallback',
        steps: [
          AiCommandStep(
            title: '查看全部服务',
            command: 'Get-Service | Sort-Object Status, DisplayName',
            reason: '快速确认服务整体状态',
            risk: AiCommandRisk.low,
          ),
          AiCommandStep(
            title: '查看停止的服务',
            command:
                r"Get-Service | Where-Object {$_.Status -eq 'Stopped'} | Sort-Object DisplayName",
            reason: '定位异常停止的服务',
            risk: AiCommandRisk.low,
          ),
        ],
      );
    }
    if (lower.contains('日志') || lower.contains('log')) {
      return AiCommandPlan(
        goal: goal,
        shell: 'powershell',
        summary: '先看系统日志，再看应用日志。',
        providerLabel: 'Local Fallback',
        steps: [
          AiCommandStep(
            title: '查看系统日志',
            command: 'Get-EventLog -LogName System -Newest 50',
            reason: '检查系统级错误信息',
            risk: AiCommandRisk.low,
          ),
          AiCommandStep(
            title: '查看应用日志',
            command: 'Get-EventLog -LogName Application -Newest 50',
            reason: '补充应用层错误信息',
            risk: AiCommandRisk.low,
          ),
        ],
      );
    }
    return AiCommandPlan(
      goal: goal,
      shell: 'powershell',
      summary: '这是第一版本地规则计划，先给出安全的系统概览命令。',
      providerLabel: 'Local Fallback',
      steps: [
        AiCommandStep(
          title: '查看系统信息',
          command:
              'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsHardwareAbstractionLayer',
          reason: '确认系统基础环境',
          risk: AiCommandRisk.low,
        ),
        AiCommandStep(
          title: '查看网络配置',
          command: 'ipconfig /all',
          reason: '补充网络环境信息',
          risk: AiCommandRisk.low,
        ),
      ],
    );
  }

  Future<TerminalModel?> _ensureTerminal() async {
    final ffi = parent.target;
    if (ffi == null) return null;
    if (_terminalModel != null) return _terminalModel;

    final terminal = TerminalModel(ffi, _nextTerminalId++);
    ffi.registerTerminalModel(terminal.terminalId, terminal);
    _terminalSubscription?.cancel();
    _terminalSubscription = terminal.outputStream.listen((chunk) {
      final stripped = _stripAnsi(chunk);
      _terminalBuffer += stripped;
      if (_terminalBuffer.length > _maxStoredOutputChars) {
        _terminalBuffer =
            _terminalBuffer.substring(_terminalBuffer.length - _maxStoredOutputChars);
      }
      _globalTerminalBuffer += stripped;
      if (_globalTerminalBuffer.length > 50000) {
        _globalTerminalBuffer = _globalTerminalBuffer.substring(_globalTerminalBuffer.length - 50000);
      }
      _refreshOutputDerivedState();
      notifyListeners();
    });
    await terminal.openTerminal();
    _terminalModel = terminal;
    return terminal;
  }

  String _stripAnsi(String input) {
    return input.replaceAll(RegExp(r'\x1B\[[0-9;?]*[A-Za-z]'), '');
  }

  void _refreshOutputDerivedState() {
    final normalized = _terminalBuffer.replaceAll('\r', '');
    final lines = normalized
        .split('\n')
        .map((e) => e.trimRight())
        .where((e) => e.trim().isNotEmpty)
        .toList();
    if (lines.isEmpty) {
      _outputSummary = '暂无输出摘要';
      _contextPreview = '';
      _contextStats = '暂无上下文';
      return;
    }

    final scanStart = lines.length > _summaryScanLines
        ? lines.length - _summaryScanLines
        : 0;
    final recentLines = lines.sublist(scanStart);
    final important = recentLines.where((e) => _importantLinePattern.hasMatch(e)).toList();
    final tail = lines.sublist(lines.length > _summaryTailLines
        ? lines.length - _summaryTailLines
        : 0);

    final summaryLines = <String>[];
    summaryLines.add('总行数：${lines.length}');
    final errorCount = recentLines.where((e) => RegExp(r'error|failed|exception|denied', caseSensitive: false).hasMatch(e)).length;
    if (errorCount > 0) {
      summaryLines.add('最近重点错误/失败行：$errorCount');
    }
    if (important.isNotEmpty) {
      summaryLines.add('关键输出：');
      summaryLines.addAll(important.take(8).map((e) => '- $e'));
    } else {
      summaryLines.add('最近输出：');
      summaryLines.addAll(tail.take(8).map((e) => '- $e'));
    }
    _outputSummary = summaryLines.join('\n');

    final contextSections = [
      'Summary:\n$_outputSummary',
      'Tail:\n${tail.join('\n')}',
    ].join('\n\n');
    _contextPreview = contextSections.length > _maxAiContextChars
        ? contextSections.substring(contextSections.length - _maxAiContextChars)
        : contextSections;
    _contextStats =
        '原始 ${lines.length} 行 / ${normalized.length} 字符，发送上下文 ${_contextPreview.length} 字符';
  }

  Future<void> executeStep(int index, {bool confirmed = false}) async {
    if (_disposed) return;
    final plan = _plan;
    if (plan == null || index < 0 || index >= plan.steps.length) return;

    final step = plan.steps[index];
    final blocked = _blockedReason(step.command);
    if (blocked != null) {
      _pendingConfirmationStep = index;
      _securityMessage = blocked;
      _autoPilot = false;
      _status = '高危拒绝：已拦截操作';
      notifyListeners();
      return;
    }
    
    if (!confirmed && _needsConfirmation(step)) {
      _pendingConfirmationStep = index;
      _securityMessage = _confirmationReason(step);
      _status = '等待用户授权执行该步骤';
      notifyListeners();
      return;
    }
    _busy = true;
    _executing = true;
    _currentStep = index;
    _pendingConfirmationStep = null;
    _securityMessage = '';
    _status = '正在执行：${step.title}';
    notifyListeners();
    try {
      final terminal = await _ensureTerminal();
      if (terminal == null) {
        _status = '终端不可用';
        return;
      }
      _appendLog('执行步骤 ${index + 1}: ${step.title}');
      await terminal.sendCommand(step.command);
      _status = '命令已发送：${step.title}';
    } finally {
      _busy = false;
      _executing = false;
      notifyListeners();
      _saveHistory();
      
      // Always auto-advance to next step
      if (_securityMessage.isEmpty) {
        _autoRunSteps();
      }
    }
  }

  Future<void> sendManualCommand(String command) async {
    final terminal = await _ensureTerminal();
    if (terminal == null) return;
    _appendLog('用户手动输入: $command');
    await terminal.sendCommand(command);
  }

  Future<void> confirmPendingStep() async {
    final index = _pendingConfirmationStep;
    if (index == null) return;
    await executeStep(index, confirmed: true);
  }

  void cancelPendingStep() {
    _appendLog('已取消待确认步骤');
    _pendingConfirmationStep = null;
    _securityMessage = '';
    _status = '已取消该高风险步骤';
    notifyListeners();
  }

  Future<void> continuePlanning() async {
    if (_contextPreview.trim().isEmpty) {
      _setStatus('当前没有足够终端输出，无法继续规划');
      return;
    }
    if (!_config.ready) {
      _setStatus('请先配置自定义 AI，续规划需要外部模型');
      return;
    }

    final contextStr = _contextPreview;

    if (_activeGoal.isNotEmpty || _plan != null || _terminalBuffer.isNotEmpty) {
      _chatHistory.add(AiChatTurn(
        role: ChatRole.ai,
        text: _plan?.summary ?? '',
        plan: _plan,
      ));
      _plan = null;
      _currentStep = -1;
      _terminalBuffer = '';
      _contextStats = '暂无上下文';
      _outputSummary = '暂无输出摘要';
      _saveHistory();
    }

    _activeGoal = '[Agent Context] 分析终端反馈日志并生成下一步修复计划';
    _chatHistory.add(AiChatTurn(role: ChatRole.user, text: _activeGoal));
    _saveHistory();

    _busy = true;
    notifyListeners();
    try {
      _plan = await _buildRemotePlan(
        _activeGoal,
        previousOutput: contextStr,
      );
      _currentStep = -1;
      _pendingConfirmationStep = null;
      _securityMessage = '';
      _appendLog('已基于输出摘要重新规划');
      _status = '已根据终端输出摘要生成下一轮计划';
    } catch (e) {
      _autoPilot = false;
      _appendLog('续规划失败：$e');
      _status = '续规划失败，请检查 AI 配置或接口返回';
    } finally {
      _busy = false;
      notifyListeners();
      _saveHistory();
      
      if (_plan != null && _plan!.steps.isNotEmpty) {
        _autoRunSteps();
      } else if (_autoPilot) {
        if (_plan == null || _plan!.steps.isEmpty) {
          _autoPilot = false;
          _status = 'Agent: 目标已达成，任务结束';
          _appendLog('自主循环结束：计划达成');
          notifyListeners();
        } else {
          _triggerNextAgentLoop();
        }
      }
    }
  }

  Future<void> copyLastOutput() async {
    if (_terminalBuffer.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: _terminalBuffer));
    _status = '终端输出已复制';
    notifyListeners();
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    goalController.dispose();
    _terminalSubscription?.cancel();
    final ffi = parent.target;
    final terminal = _terminalModel;
    if (ffi != null && terminal != null) {
      ffi.unregisterTerminalModel(terminal.terminalId);
      terminal.dispose();
    }
    super.dispose();
  }
}
