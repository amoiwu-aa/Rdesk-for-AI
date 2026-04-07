<p align="center">
  <h1 align="center">Rdesk-for-AI (Windows Edition)</h1>
  <p align="center">
    <b>基于 Rust & Flutter 构建的智能化远控终端（Windows 专版）</b><br>
    <i>引入了前沿原生拖拽跨系统传输技术与专属 AI 控制台系统。</i>
  </p>
</p>

> **免责与申明 (Notice):**
> 本项目核心远控链路衍生自优秀的开源项目 `RustDesk` (遵从 AGPL-3.0 协议)。为了探索智能化远控的最佳实践，我们对其进行了深度魔改，专注于 Windows 端的体验突破。

## ✨ 核心独家特性 (Core Features)

* **🤖 AI 操作员模型 (AI Operator Model)**: 引入了高度定制化的 AI 助手模型，通过底层 Rust 的边界限制，能够持久化管理 AI 会话历史，并通过严格裁剪原始终端上下文，实现了极优的内存占用 (Memory-optimized terminal context management)。
* **📁 原生拖拽级联 (Native Drag-and-Drop)**: 在原有简单的文件传输基础上重构了 File Manager 逻辑，打通了宿主机的 OS 级别桥接，真正实现了极度顺滑的原生拖动文件跨端传输。
* **⚡ 专精 Windows (Windows Optimized)**: 去除了冗余的多平台历史包袱，集中火力对 Windows 原生体验、甚至 SSH 深度控制系统进行了深层定制。

---

## 🛠️ 构建与编译 (How to Build)

### 环境依赖
* Rust 环境 (建议最新稳定版)
* Flutter (用于编译全新的融合态客户端前端)
* C++ 编译环境 (vcpkg: libvpx, libyuv, opus 等)

### 一键构建 (Windows)
```powershell
python3 build.py --flutter
```

## 📸 运行截图 (Screenshots)
*(全新的 Windows 融合版 AI UI 界面截图正在赶来的路上，敬请期待...)*
