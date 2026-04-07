# RustDesk 架构级性能优化方案设计

针对深度优化提出的两个核心方向（**2. 抓屏与推流管线拆分 (Zero-copy / DMA)** 和 **3. 消除重复内存拷贝 (网络层内存池化)**），以下是详细的架构优化实施思路和技术路线。

---

## 优化方向一：消除网络层重复内存拷贝（In-place Encryption）

### 🚨 现状与痛点 (Profile)
目前在 `libs/hbb_common/src/tcp.rs` 或 `stream.rs` 中的 `send` 逻辑存在严重的内存分配（堆开销）：

```rust
// 伪代码: 当前逻辑
pub async fn send(&mut self, msg: &impl Message) -> ResultType<()> {
    // 拷贝 1：protobuf 序列化时新建了一次 Vec<u8>
    let mut msg_bytes = msg.write_to_bytes()?;
    if let Some(key) = self.2.as_mut() {
        // 拷贝 2：Sodium secretbox::seal 加密时又新建了一次 Vec<u8>
        msg_bytes = key.enc(&msg_bytes); 
    }
    // 放入 Framed codec 的写缓冲区
    self.send_bytes(bytes::Bytes::from(msg_bytes)).await?;
}
```
**问题：**每一帧或每一个控制消息，都会引发 2~3 次堆分配。虽然底层有 OS 的页优化，但在高频发送（如 60FPS 下切片或高频音频）时，依然会给内存分配器（Allocator）和 CPU L1/L2 缓存带来无用压力，积少成多导致延迟不稳定。

### ✅ 优化方案：In-place 零拷贝网络栈
我们可以借助 `BytesMut` 复用机制和 Sodium 库的底层原地加密方法来实现真正的“**零次新增堆分配**”。

**实施步骤：**
1. **预计算容量并获取 BytesMut**：
   在序列化前，先调用 `msg.compute_size()` 得出 Protobuf payload 大小。再计算加密 MAC 的开销（`secretbox::MACBYTES` 16字节）。
   从复用内存池（或复用前一帧未用尽的 `BytesMut`）中预留 `size + 16` 大小的连续空间。
2. **零分配序列化**：
   不使用 `write_to_bytes`，使用 protobuf 库的高级方法 `CodedOutputStream::vec(&mut bytes_mut)` 直接将内容写入预分配好的 buffer 尾部。
3. **原地加密 (In-place Encryption)**：
   不再使用 `secretbox::seal`（它会分配新内存），改用 `secretbox::seal_detached` 或者通过直接操作 buffer 切片完成多态的原地加密计算。对于加密生成的数据和 MAC 都可以只在这个 `BytesMut` 区域内完成。
4. **冻结（Freeze）并发送**：
   将这个 `BytesMut` 切片调用 `.freeze()` 转为无开销和只读共享的 `Bytes` 直接送入 `tokio::mpsc` 或者 Socket `write`。

**预期收益**：CPU 吞吐能力提升 5~8%，消除高频小包场景的堆碎片化造成的微型 GC 抖动点。

---

## 优化方向二：抓屏与推流管线拆分（Zero-copy / DMA 透传）

### 🚨 现状与痛点 (Profile)
目前的视频捕捉和编码管线是一条强耦合的基于 CPU 内存（System RAM）的流水线：
`GPU 显存 -> DXGI CPU 内存映射 (Scrap) -> 格式转换(BGRA变RGBA) -> 喂入 Vpx 或 FFmpeg (再拷贝) -> 硬件/软编码 -> 网络`。
在 4K 或高分屏场景，光是把原始数据拉回 CPU 的过程，就会吃满 PCIe 带宽，导致非常可怕的 CPU 资源占用和额外的几十毫秒延迟。

### ✅ 优化方案：HW Surface 硬件直通 (DMA Zero-copy)

这部分是重构远控“核心护城河”的关键，主要依赖两套 API 栈脱离 CPU：

**实施步骤：**

#### Phase 1: DXGI Texture 直接关联编码器（Windows 平台）
不使用传统的 `Map/Unmap` 模式拉回系统内存，而是保持画面数据始终存在于 VRAM 中：
1. **获取 GPU 纹理句柄**：通过 DXGI Desktop Duplication API 直接得到 `ID3D11Texture2D`。
2. **零拷贝颜色空间转换 (GPU 端)**：通过 DirectX 11 的视频处理模块（Video Processor）或者一段极其简单的 Compute Shader，在 GPU 内部瞬间完成 RGB(A) 到 NV12 / YUV420 的转换。耗时约 0.1ms。
3. **喂给硬件编码 API (NVENC / AMF / MFT)**：
   - 比如在使用 Windows Media Foundation 或 NVENC 时，不要传入在内存里的 `Vec<u8>`。
   - 注册输入资源类型为 `D3D11_TEXTURE2D` 并在 MFTransform 中做绑源。
   - 编码器也是跑在 GPU 上，会在 GPU 内部吃下这块纹理直接吐出 H.264/H.265 NALU 码流供网络发送。

#### Phase 2: DMA-Buf / GBM 零拷贝（Linux 平台 - Wayland 场景备选）
如果是 Linux 平台，依赖 DRM/KMS 的 DMA-Buf 文件描述符：
1. 抓屏后端（如 PipeWire/Wayland）直接提取画面的 `dma_buf_fd`。
2. 将该 File Descriptor 直通送进 VA-API 硬件编码器（Hardware EncoderSession）。
3. 同样做到只有极其微小的 H.264 压缩比特流抵达 CPU 内存。

**架构变更影响（代码拆分建议）：**
- 现有的 `hbb_common::TraitCapturer` 接口需要被提升/改造，新增一个类似于 `extract_hardware_texture()` 支持。
- 视频生成线程与网络发送逻辑实现彻底解偶（目前在 `video_service.rs` 是包在一起处理的 `handle_one_frame`）。
- 引入新的 `encode_hardware_surface` API。

**预期收益**：
画面的总端到端延迟可**物理级降低 10~30ms**。抓屏阶段 CPU 占用**降低 90%**（从 15% 跌回 1% 左右），极大提升电竞、游戏操作时的极速响应水平。

---

## 🔜 下一步行动建议

1. 第一期先把网络层的**“In-place 发送改造（第 3 点）”**落地，因为风险低、不触动原系统依赖，能在几天内完成替换。
2. 第二期启动实验性质的**“DXGI 纹理零拷贝抓取并直通 NVENC/MFT 编码”**（第 2 点）。这可能需要另起一个专门使用 `windows-rs` / FFmpeg HWaccel 支持的新 Rust 模块来独立测试。
