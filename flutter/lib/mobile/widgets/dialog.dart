import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_hbb/common/widgets/setting_widgets.dart';
import 'package:flutter_hbb/common/widgets/toolbar.dart';
import 'package:get/get.dart';

import '../../common.dart';
import '../../models/platform_model.dart';

bool _isDarkSurface(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark;

Color _dialogCardColor(BuildContext context) =>
    _isDarkSurface(context) ? const Color(0xFF262A31) : Colors.white;

Color _dialogBorderColor(BuildContext context) =>
    _isDarkSurface(context) ? const Color(0xFF394150) : MyTheme.border;

Color _dialogSubtleColor(BuildContext context) =>
    _isDarkSurface(context) ? const Color(0xFF2F3743) : MyTheme.grayBg;

void _showSuccess() {
  showToast(translate("Successful"));
}

void _showError() {
  showToast(translate("Error"));
}

void setPermanentPasswordDialog(OverlayDialogManager dialogManager) async {
  final pw = await bind.mainGetPermanentPassword();
  final p0 = TextEditingController(text: pw);
  final p1 = TextEditingController(text: pw);
  var validateLength = false;
  var validateSame = false;
  dialogManager.show((setState, close, context) {
    submit() async {
      close();
      dialogManager.showLoading(translate("Waiting"));
      if (await gFFI.serverModel.setPermanentPassword(p0.text)) {
        dialogManager.dismissAll();
        _showSuccess();
      } else {
        dialogManager.dismissAll();
        _showError();
      }
    }

    return CustomAlertDialog(
      title: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.password_rounded, color: MyTheme.accent),
          Text(translate('Set your own password')).paddingOnly(left: 10),
        ],
      ),
      content: Form(
          autovalidateMode: AutovalidateMode.onUserInteraction,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextFormField(
              autofocus: true,
              obscureText: true,
              keyboardType: TextInputType.visiblePassword,
              decoration: InputDecoration(
                labelText: translate('Password'),
              ),
              controller: p0,
              validator: (v) {
                if (v == null) return null;
                final val = v.trim().length > 5;
                if (validateLength != val) {
                  // use delay to make setState success
                  Future.delayed(Duration(microseconds: 1),
                      () => setState(() => validateLength = val));
                }
                return val
                    ? null
                    : translate('Too short, at least 6 characters.');
              },
            ).workaroundFreezeLinuxMint(),
            TextFormField(
              obscureText: true,
              keyboardType: TextInputType.visiblePassword,
              decoration: InputDecoration(
                labelText: translate('Confirmation'),
              ),
              controller: p1,
              validator: (v) {
                if (v == null) return null;
                final val = p0.text == v;
                if (validateSame != val) {
                  Future.delayed(Duration(microseconds: 1),
                      () => setState(() => validateSame = val));
                }
                return val
                    ? null
                    : translate('The confirmation is not identical.');
              },
            ).workaroundFreezeLinuxMint(),
          ])),
      onCancel: close,
      onSubmit: (validateLength && validateSame) ? submit : null,
      actions: [
        dialogButton(
          'Cancel',
          icon: Icon(Icons.close_rounded),
          onPressed: close,
          isOutline: true,
        ),
        dialogButton(
          'OK',
          icon: Icon(Icons.done_rounded),
          onPressed: (validateLength && validateSame) ? submit : null,
        ),
      ],
    );
  });
}

void setTemporaryPasswordLengthDialog(
    OverlayDialogManager dialogManager) async {
  List<String> lengths = ['6', '8', '10'];
  String length = await bind.mainGetOption(key: "temporary-password-length");
  var index = lengths.indexOf(length);
  if (index < 0) index = 0;
  length = lengths[index];
  dialogManager.show((setState, close, context) {
    setLength(newValue) {
      final oldValue = length;
      if (oldValue == newValue) return;
      setState(() {
        length = newValue;
      });
      bind.mainSetOption(key: "temporary-password-length", value: newValue);
      bind.mainUpdateTemporaryPassword();
      Future.delayed(Duration(milliseconds: 200), () {
        close();
        _showSuccess();
      });
    }

    return CustomAlertDialog(
      title: Text(translate("Set one-time password length")),
      content: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: lengths
              .map(
                (value) => Row(
                  children: [
                    Text(value),
                    Radio(
                        value: value, groupValue: length, onChanged: setLength),
                  ],
                ),
              )
              .toList()),
    );
  }, backDismiss: true, clickMaskDismiss: true);
}

void showServerSettings(OverlayDialogManager dialogManager,
    void Function(VoidCallback) setState) async {
  Map<String, dynamic> options = {};
  try {
    options = jsonDecode(await bind.mainGetOptions());
  } catch (e) {
    print("Invalid server config: $e");
  }
  showServerSettingsWithValue(
      ServerConfig.fromOptions(options), dialogManager, setState);
}

void showServerSettingsWithValue(
    ServerConfig serverConfig,
    OverlayDialogManager dialogManager,
    void Function(VoidCallback)? upSetState) async {
  var isInProgress = false;
  var profileDropdownOpen = false;
  var profileSaveMode = false; // inline save name input
  final idCtrl = TextEditingController(text: serverConfig.idServer);
  final relayCtrl = TextEditingController(text: serverConfig.relayServer);
  final apiCtrl = TextEditingController(text: serverConfig.apiServer);
  final keyCtrl = TextEditingController(text: serverConfig.key);
  final profileNameCtrl = TextEditingController();

  RxString idServerMsg = ''.obs;
  RxString relayServerMsg = ''.obs;
  RxString apiServerMsg = ''.obs;

  final controllers = [idCtrl, relayCtrl, apiCtrl, keyCtrl];
  final errMsgs = [
    idServerMsg,
    relayServerMsg,
    apiServerMsg,
  ];

  // Load saved profiles
  final profiles = await ServerConfig.loadProfiles();
  final selectedProfile = Rxn<String>(null);

  dialogManager.show((setState, close, context) {
    Future<bool> submit() async {
      setState(() {
        isInProgress = true;
      });
      bool ret = await setServerConfig(
          null,
          errMsgs,
          ServerConfig(
              idServer: idCtrl.text.trim(),
              relayServer: relayCtrl.text.trim(),
              apiServer: apiCtrl.text.trim(),
              key: keyCtrl.text.trim()));
      setState(() {
        isInProgress = false;
      });
      return ret;
    }

    void loadProfile(ServerConfig profile) {
      idCtrl.text = profile.idServer;
      relayCtrl.text = profile.relayServer;
      apiCtrl.text = profile.apiServer;
      keyCtrl.text = profile.key;
      idServerMsg.value = '';
      relayServerMsg.value = '';
      apiServerMsg.value = '';
    }

    Future<void> confirmSaveProfile() async {
      final name = profileNameCtrl.text.trim();
      if (name.isEmpty) return;
      profiles.removeWhere((p) => p.name == name);
      profiles.add(ServerConfig(
        name: name,
        idServer: idCtrl.text.trim(),
        relayServer: relayCtrl.text.trim(),
        apiServer: apiCtrl.text.trim(),
        key: keyCtrl.text.trim(),
      ));
      await ServerConfig.saveProfiles(profiles);
      setState(() {
        selectedProfile.value = name;
        profileSaveMode = false;
        profileNameCtrl.clear();
      });
      showToast(translate('Profile saved'));
    }

    Future<void> updateSelectedProfile() async {
      final name = selectedProfile.value;
      if (name == null || name.isEmpty) return;
      final idx = profiles.indexWhere((p) => p.name == name);
      if (idx >= 0) {
        profiles[idx] = ServerConfig(
          name: name,
          idServer: idCtrl.text.trim(),
          relayServer: relayCtrl.text.trim(),
          apiServer: apiCtrl.text.trim(),
          key: keyCtrl.text.trim(),
        );
        await ServerConfig.saveProfiles(profiles);
        showToast(translate('Profile saved'));
      }
    }

    Future<void> deleteSelectedProfile() async {
      final name = selectedProfile.value;
      if (name == null) return;
      profiles.removeWhere((p) => p.name == name);
      await ServerConfig.saveProfiles(profiles);
      setState(() {
        selectedProfile.value = null;
      });
      showToast(translate('Profile deleted'));
    }

    Widget buildField(
        String label, TextEditingController controller, String errorMsg,
        {String? Function(String?)? validator, bool autofocus = false}) {
      if (isDesktop || isWeb) {
        return Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 110,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: _dialogCardColor(context),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _dialogBorderColor(context)),
                ),
                child: TextFormField(
                  controller: controller,
                  decoration: InputDecoration(
                    errorText: errorMsg.isEmpty ? null : errorMsg,
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                  ),
                  validator: validator,
                  autofocus: autofocus,
                ).workaroundFreezeLinuxMint(),
              ),
            ),
          ],
        );
      }

      return TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          errorText: errorMsg.isEmpty ? null : errorMsg,
        ),
        validator: validator,
      ).workaroundFreezeLinuxMint();
    }

    // Profile selector row (fixed height, no dropdown here)
    Widget buildProfileSelectorRow() {
      final currentLabel = (selectedProfile.value == null || selectedProfile.value!.isEmpty)
          ? translate('Current')
          : selectedProfile.value!;
      final isExistingProfile = selectedProfile.value != null &&
          selectedProfile.value!.isNotEmpty;
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      profileDropdownOpen = !profileDropdownOpen;
                      profileSaveMode = false;
                    });
                  },
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: translate('服务器配置'),
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      isDense: true,
                      suffixIcon: Icon(
                        profileDropdownOpen
                            ? Icons.arrow_drop_up
                            : Icons.arrow_drop_down,
                        size: 20,
                      ),
                    ),
                    child: Text(currentLabel, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Tooltip(
                message: translate('Save Profile'),
                child: IconButton(
                  icon: Icon(Icons.save_outlined,
                      size: 20, color: const Color(0xFF64748B)),
                  onPressed: () {
                    setState(() {
                      profileSaveMode = !profileSaveMode;
                      profileDropdownOpen = false;
                    });
                  },
                  padding: EdgeInsets.zero,
                  constraints: BoxConstraints(minWidth: 36, minHeight: 36),
                ),
              ),
              if (isExistingProfile)
                Tooltip(
                  message: translate('Update Profile'),
                  child: IconButton(
                    icon: const Icon(Icons.copy_all_outlined,
                        size: 20, color: Color(0xFF64748B)),
                    onPressed: updateSelectedProfile,
                    padding: EdgeInsets.zero,
                    constraints: BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                ),
              if (isExistingProfile)
                Tooltip(
                  message: translate('Delete Profile'),
                  child: IconButton(
                    icon: const Icon(Icons.delete_outline,
                        size: 20, color: Color(0xFF94A3B8)),
                    onPressed: deleteSelectedProfile,
                    padding: EdgeInsets.zero,
                    constraints: BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                ),
            ],
          ),
          if (profileSaveMode)
            Padding(
              padding: EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: profileNameCtrl,
                      autofocus: true,
                      decoration: InputDecoration(
                        labelText: translate('Profile Name'),
                        hintText: translate('e.g. Company Server'),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        isDense: true,
                      ),
                      onSubmitted: (_) => confirmSaveProfile(),
                    ),
                  ),
                  SizedBox(width: 4),
                  IconButton(
                    icon: Icon(Icons.check, size: 20,
                        color: Colors.green),
                    onPressed: confirmSaveProfile,
                    padding: EdgeInsets.zero,
                    constraints: BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, size: 20),
                    onPressed: () {
                      setState(() {
                        profileSaveMode = false;
                        profileNameCtrl.clear();
                      });
                    },
                    padding: EdgeInsets.zero,
                    constraints: BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                ],
              ),
            ),
        ],
      );
    }

    // Floating dropdown list that overlays on top of form fields
    Widget buildProfileDropdown() {
      return Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: BoxDecoration(
            color: _dialogCardColor(context),
            border: Border.all(
              color: _dialogBorderColor(context),
            ),
            borderRadius: BorderRadius.circular(14),
          ),
          constraints: const BoxConstraints(maxHeight: 180),
          child: ListView(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            children: [
              ListTile(
                dense: true,
                title: Text(translate('Current')),
                selected: selectedProfile.value == null ||
                    selectedProfile.value!.isEmpty,
                onTap: () {
                  loadProfile(serverConfig);
                  setState(() {
                    selectedProfile.value = null;
                    profileDropdownOpen = false;
                  });
                },
              ),
              ...profiles.map((p) => ListTile(
                    dense: true,
                    title: Text(p.name),
                    selected: selectedProfile.value == p.name,
                    onTap: () {
                      loadProfile(p);
                      setState(() {
                        selectedProfile.value = p.name;
                        profileDropdownOpen = false;
                      });
                    },
                  )),
            ],
          ),
        ),
      );
    }

    return CustomAlertDialog(
      title: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: MyTheme.accent.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.dns_rounded, size: 18, color: MyTheme.accent),
                ),
                const SizedBox(width: 12),
                Text(
                  translate('ID/Relay Server'),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          ...ServerConfigImportExportWidgets(controllers, errMsgs),
        ],
      ),
      content: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 560),
        child: Form(
          child: Obx(() => Stack(
                clipBehavior: Clip.none,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      buildProfileSelectorRow(),
                      const SizedBox(height: 14),
                      buildField(translate('ID Server'), idCtrl, idServerMsg.value,
                          autofocus: true),
                      const SizedBox(height: 10),
                      if (!isIOS && !isWeb) ...[
                        buildField(translate('Relay Server'), relayCtrl,
                            relayServerMsg.value),
                        const SizedBox(height: 10),
                      ],
                      buildField(
                        translate('API Server'),
                        apiCtrl,
                        apiServerMsg.value,
                        validator: (v) {
                          if (v != null && v.isNotEmpty) {
                            if (!(v.startsWith('http://') ||
                                v.startsWith("https://"))) {
                              return translate("invalid_http");
                            }
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),
                      buildField('Key', keyCtrl, ''),
                      if (isInProgress)
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: LinearProgressIndicator(),
                        ),
                    ],
                  ),
                  // Dropdown floats over form fields, no height change
                  if (profileDropdownOpen)
                    Positioned(
                      // Below the profile selector row (~52px)
                      top: profileSaveMode ? 100 : 52,
                      left: 0,
                      right: 0,
                      child: buildProfileDropdown(),
                    ),
                ],
              )),
        ),
      ),
      actions: [
        TextButton(
          onPressed: close,
          style: TextButton.styleFrom(
            foregroundColor:
                Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.78),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          ),
          child: const Text(
            '取消',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        ElevatedButton(
          onPressed: () async {
            if (await submit()) {
              close();
              showToast(translate('Successful'));
              upSetState?.call(() {});
            } else {
              showToast(translate('Failed'));
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: MyTheme.accent,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            '确认保存',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  });
}

void setPrivacyModeDialog(
  OverlayDialogManager dialogManager,
  List<TToggleMenu> privacyModeList,
  RxString privacyModeState,
) async {
  dialogManager.dismissAll();
  dialogManager.show((setState, close, context) {
    return CustomAlertDialog(
      title: Text(translate('Privacy mode')),
      content: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: privacyModeList
              .map((value) => CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                    title: value.child,
                    value: value.value,
                    onChanged: value.onChanged,
                  ))
              .toList()),
    );
  }, backDismiss: true, clickMaskDismiss: true);
}
