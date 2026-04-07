/// SCC 编解码器独立验证
/// 运行: cargo test --test scc_demo --features hwcodec,vram -- --nocapture

#[test]
fn scc_encode_decode_roundtrip() {
    let w = 1920;
    let h = 1080;
    let stride = w * 4;
    let frame_size = stride * h;

    println!("=== SCC 编解码器 Demo ===");
    println!("分辨率: {}x{}, 帧大小: {:.2} MB", w, h, frame_size as f64 / 1024.0 / 1024.0);

    // 模拟桌面画面: 大面积纯色背景 + 一个窗口区域 + 文字噪点
    let mut frame1 = vec![0u8; frame_size];
    // 背景: 深蓝色 BGRA
    for y in 0..h {
        for x in 0..w {
            let off = y * stride + x * 4;
            frame1[off] = 0x80;     // B
            frame1[off + 1] = 0x40; // G
            frame1[off + 2] = 0x20; // R
            frame1[off + 3] = 0xFF; // A
        }
    }
    // 白色窗口区域 (400x300 at 100,100)
    for y in 100..400 {
        for x in 100..500 {
            let off = y * stride + x * 4;
            frame1[off] = 0xFF;
            frame1[off + 1] = 0xFF;
            frame1[off + 2] = 0xFF;
            frame1[off + 3] = 0xFF;
        }
    }
    // 文字区域: 随机噪点 (模拟文字渲染)
    for y in 150..350 {
        for x in 150..450 {
            let off = y * stride + x * 4;
            let v = ((x * 7 + y * 13) % 256) as u8;
            frame1[off] = v;
            frame1[off + 1] = v;
            frame1[off + 2] = v;
            frame1[off + 3] = 0xFF;
        }
    }

    // ── 创建编码器 ──
    use scrap::codec::EncoderApi;
    use scrap::scc::{SccEncoderConfig, SccDecoder};

    let cfg = scrap::codec::EncoderCfg::SCC(SccEncoderConfig { width: w, height: h });
    let mut encoder = scrap::scc::SccEncoder::new(cfg, false).expect("创建 SCC 编码器失败");
    let mut decoder = SccDecoder::new();
    let mut rgb = scrap::ImageRgb::new(scrap::ImageFormat::ABGR, 1);

    // ── 编码第 1 帧 (关键帧) ──
    let t0 = std::time::Instant::now();
    let input1 = scrap::EncodeInput::BGRA(&frame1, w, h, stride);
    let vf1 = encoder.encode_to_message(input1, 0).expect("编码帧1失败");
    let encode_time1 = t0.elapsed();

    let scc_data1 = &vf1.sccs().frames[0].data;
    let ratio1 = scc_data1.len() as f64 / frame_size as f64 * 100.0;
    println!("\n--- 帧 1 (关键帧 / 全量) ---");
    println!("  编码耗时: {:?}", encode_time1);
    println!("  原始大小: {:.2} MB", frame_size as f64 / 1024.0 / 1024.0);
    println!("  压缩大小: {:.2} KB ({:.1}%)", scc_data1.len() as f64 / 1024.0, ratio1);

    // ── 解码第 1 帧 ──
    let t1 = std::time::Instant::now();
    let ok = decoder.decode(&scc_data1, &mut rgb).expect("解码帧1失败");
    let decode_time1 = t1.elapsed();
    println!("  解码耗时: {:?}", decode_time1);
    println!("  解码成功: {}, 输出: {}x{}", ok, rgb.w, rgb.h);
    assert!(ok, "关键帧应该返回 true");
    assert_eq!(rgb.w, w);
    assert_eq!(rgb.h, h);

    // ── 编码第 2 帧 (无变化 → 全 skip) ──
    let t2 = std::time::Instant::now();
    let input2 = scrap::EncodeInput::BGRA(&frame1, w, h, stride);
    let vf2 = encoder.encode_to_message(input2, 33).expect("编码帧2失败");
    let encode_time2 = t2.elapsed();

    let scc_data2 = &vf2.sccs().frames[0].data;
    println!("\n--- 帧 2 (无变化 / 全 Skip) ---");
    println!("  编码耗时: {:?}", encode_time2);
    println!("  压缩大小: {} bytes", scc_data2.len());

    let ok2 = decoder.decode(&scc_data2, &mut rgb).expect("解码帧2失败");
    println!("  解码结果: any_dirty={}", ok2);
    assert!(!ok2, "无变化帧应该返回 false (all skip)");

    // ── 编码第 3 帧 (局部变化: 移动一个小窗口) ──
    let mut frame3 = frame1.clone();
    // 移动白色窗口: 从 (100,100) 到 (200,150)
    // 先清除旧位置
    for y in 100..400 {
        for x in 100..500 {
            let off = y * stride + x * 4;
            frame3[off] = 0x80;
            frame3[off + 1] = 0x40;
            frame3[off + 2] = 0x20;
            frame3[off + 3] = 0xFF;
        }
    }
    // 画新位置
    for y in 150..450 {
        for x in 200..600 {
            if x < w {
                let off = y * stride + x * 4;
                frame3[off] = 0xFF;
                frame3[off + 1] = 0xFF;
                frame3[off + 2] = 0xFF;
                frame3[off + 3] = 0xFF;
            }
        }
    }

    let t3 = std::time::Instant::now();
    let input3 = scrap::EncodeInput::BGRA(&frame3, w, h, stride);
    let vf3 = encoder.encode_to_message(input3, 66).expect("编码帧3失败");
    let encode_time3 = t3.elapsed();

    let scc_data3 = &vf3.sccs().frames[0].data;
    let ratio3 = scc_data3.len() as f64 / frame_size as f64 * 100.0;
    println!("\n--- 帧 3 (窗口移动 / 局部变化) ---");
    println!("  编码耗时: {:?}", encode_time3);
    println!("  压缩大小: {:.2} KB ({:.1}%)", scc_data3.len() as f64 / 1024.0, ratio3);

    let t4 = std::time::Instant::now();
    let ok3 = decoder.decode(&scc_data3, &mut rgb).expect("解码帧3失败");
    let decode_time3 = t4.elapsed();
    println!("  解码耗时: {:?}", decode_time3);
    println!("  解码结果: any_dirty={}", ok3);
    assert!(ok3, "有变化帧应该返回 true");

    // ── 验证像素正确性 ──
    // 检查新窗口位置 (250, 200) 应该是白色
    let dst_align = if rgb.align > 0 { rgb.align } else { 1 };
    let dst_stride = (w * 4 + dst_align - 1) & !(dst_align - 1);
    let check_x = 250;
    let check_y = 200;
    let off = check_y * dst_stride + check_x * 4;
    // ABGR format (R,G,B,A after BGRA→ABGR swap)
    let r = rgb.raw[off];
    let g = rgb.raw[off + 1];
    let b = rgb.raw[off + 2];
    let a = rgb.raw[off + 3];
    println!("\n--- 像素验证 ---");
    println!("  位置 ({},{}) RGBA: ({},{},{},{})", check_x, check_y, r, g, b, a);
    assert_eq!((r, g, b), (0xFF, 0xFF, 0xFF), "白色窗口位置应该是白色");
    assert_eq!(a, 0xFF, "Alpha 应该是 255");

    // 检查背景位置 (50, 50) 应该是深蓝色
    let bg_off = 50 * dst_stride + 50 * 4;
    let bg_r = rgb.raw[bg_off];
    let bg_g = rgb.raw[bg_off + 1];
    let bg_b = rgb.raw[bg_off + 2];
    println!("  位置 (50,50) RGB: ({},{},{})", bg_r, bg_g, bg_b);
    // BGRA [0x80,0x40,0x20,0xFF] → ABGR/RGBA [0x20,0x40,0x80,0xFF]
    assert_eq!((bg_r, bg_g, bg_b), (0x20, 0x40, 0x80), "背景应该是深蓝色 (R=0x20,G=0x40,B=0x80)");

    println!("\n✅ SCC 编解码器全部测试通过！");
    println!("   关键帧压缩率: {:.1}%", ratio1);
    println!("   增量帧压缩率: {:.1}%", ratio3);
    println!("   编码速度: 关键帧 {:?}, 增量帧 {:?}", encode_time1, encode_time3);
    println!("   解码速度: {:?}", decode_time3);
}
