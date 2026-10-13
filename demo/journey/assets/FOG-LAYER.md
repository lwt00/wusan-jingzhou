# 雾层素材 v1

工具：内置 imagegen（生成白底图后经白底反解 alpha 脚本处理为透明 PNG）。生成日期：2026-10-12。

## 素材清单

| 文件 | 用途 | 尺寸 | 说明 |
| --- | --- | --- | --- |
| `fog-dense-1.png` | 盖建筑的浓雾团，4 站复用，通关后飘散 | 976×976 RGBA | 水彩水墨雾团，边缘羽化透明 |
| `fog-band-1.png` | 开场全屏氛围 / 远景飘移雾带 | 1516×870 RGBA | 长条雾带，底部水印区已裁除，四边宽幅羽化 |

## 提示词

**雾团 A（fog-dense-1.png）：**

```text
Single isolated dense mist cloud sprite on genuinely transparent background. Soft Chinese ink-wash watercolour fog, pale ivory-white with faint blue-grey undertone, horizontally elongated billowing shape, edges feathering gradually to fully transparent, low contrast, matte rice-paper texture. No hard edges, no visible frame, no landscape, no buildings, no text, no humans. Fill 80 percent of the image, generous transparent padding on all sides. Original artistic interpretation.
```

**雾团 B（fog-band-1.png）：**

```text
Single isolated long horizontal drifting fog band on genuinely transparent background. Soft Chinese ink-wash mist, pale ivory with subtle cool grey shading, very wide and thin, wispy tail ends dissolving into transparency, gentle vertical undulation, low contrast, edges fully feathered, no hard cut-off, no frame, no landscape, no buildings, no text, no humans. Wide panoramic format, fog fills the central 85 percent.
```

**雾团 C · 轻薄雾絮（可选点缀，尚未生成）：**

```text
Single isolated wisp of soft mist on genuinely transparent background. Delicate Chinese ink-wash vapour, thin curling ribbon of pale ivory fog, one third of the image height, tapering transparent ends, very low opacity texture, no frame, no background scenery, no text, no humans.
```

## 处理记录

imagegen 输出为白底 RGB，未带 alpha 通道。首次尝试白底反解法（`alpha = 1 - min(r,g,b)/255` 并按预乘白还原颜色）后雾色偏灰蓝且透明度过低，叠在浅色宣纸底图上几乎不可见。改用**密度驱动法**：`alpha = min(1, (255-min(r,g,b))/255 × boost)`（浓雾团 ×2.6、雾带 ×3.2），颜色统一为宣纸白 `rgb(246,246,238)`，GaussianBlur 3~4px 柔化，再四边羽化（雾团 5%/9%、雾带 10%/16%）。雾带裁除了底部 14%（含水印）。

## 三阶段绑定方式（2026-10-13）

原始图片保持不变。在启动时用 Canvas 将原透明纹理的 alpha 按 `1-(1-alpha)^3` 增强一次，生成共享 Pixi 纹理。六层远景雾、每站四层错位局部雾、原有轻雾带与前景流云分别渲染。局部雾不参与点击命中，人物和道路绘制于其上。

- 未完成总览：局部打开程度 0，浓雾和低饱和建筑。
- 抵达/探索面板：打开程度渐进至 0.56，向两侧推开，仍有薄雾；无存档写入。
- 模拟完成：随原有 3.5 秒揭示渐进至 1，局部浓雾只剩微量残留，恢复完整色彩；沿用存档及朱红盖章反馈。
- 未完成时返回：以时间差平滑回到 0；已完成时返回或刷新维持 1。

以上为运动控制参数，视觉遮蔽由纹理密度、多个叠层和空间位移共同形成，不能视为单层 opacity。远景雾采用连续距离权重随邻近地标柔和减弱，不绘制圆形清晰窗口。减少动态效果时直接切换视觉目标，页面隐藏沿用原 ticker 暂停机制。

## 当前区域遮罩（2026-10-13）

全场景流动雾位于建筑、河流、树林及道路上方，人物独立置于其上。四片世界坐标区域构成完整覆盖，边缘权重按高度变化并以 smoothstep 羽化，权重和恒为 1。地标临时拨雾为柔和不规则云团形状；获得印记后按预计算距离从建筑向区域外沿扩散，完成区域权重变为 0。所有进度雾共享同一 Sprite 遮罩，避免遗漏远山或画幅角落。4/4 时雾容器隐藏、前景雾絮透明度归零，无残留遮挡层。

既有 fog-dense-1.png、fog-band-1.png 未修改；额外流动密度纹理和遮罩只在内存生成。640×328 遮罩在同一世界坐标画幅中等比映射；约 20Hz 更新且静止跳过重绘，不创建额外动画循环。
