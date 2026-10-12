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
