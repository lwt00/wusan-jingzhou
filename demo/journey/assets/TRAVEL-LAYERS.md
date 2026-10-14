# 近景赶路图层（2026-10-13）

工具：内置 imagegen，透明背景生成。原创氛围景物，不代表荆州具体山体、真实植被布局或文物。未裁剪、重编码或覆盖任何既有图片；生成原文件保留在 Codex generated_images，选定文件原样复制到本目录。

| 文件 | 尺寸 | 用途 | 透明背景 |
| --- | --- | --- | --- |
| travel-foreground-v1.png | 1536×1024 | 柳竹、山石、草木前景；复用为少量左右装饰 | 原始 alpha 保留 |
| travel-ridge-v1.png | 2172×724 | 独立远山层，慢速视差 | 原始 alpha 保留 |

既有 terrain-v3.png、四张建筑图层、雾纹理继续复用。中景不是重新绘制的横版道路，仍沿用全景坐标；前景树石属于艺术装饰，不参与碰撞。靠近人物的前景会淡化，避免遮挡角色。

## 实际生成提示词

### 前景

Original transparent game scenery asset for a refined Chinese pale ink-and-watercolour 2.5D journey. One isolated foreground vignette: slender willow and bamboo stems on left, airy drooping leaves, low weathered scholar rocks and a little grass along bottom, large empty transparent negative space on right. Exact genuine transparent background everywhere outside plants and rocks, not a white rectangle. Side-view / gentle eye-level 3/4 landscape prop, not overhead. Muted moss green, warm grey ink, pale ochre, intricate natural leaf and stone detail, soft ink-brush grain compatible with pale rice-paper Chinese landscape. Restrained low contrast but darker than distant mountains. No people, architecture, text, seal, watermark or sky. Frame whole foliage and ground rocks, no cut-off, generous transparent margin. Wide 1536 by 1024 composition. This is an original atmospheric decorative layer, no identifiable real landmark.

### 远山

Original transparent panoramic distant mountain ridge game layer, Chinese pale ink-and-watercolour landscape. Very wide low mountain silhouettes with several softly overlapping ridges, mist-soft blue-grey and jade-grey washes, understated fine brush detail, extremely low saturation, airy poetic atmosphere, genuinely transparent sky and foreground outside the mountain shapes. Single continuous mountain range with gently varying height, tallest near left-middle, tails fading into transparent mist at both edges, no hard rectangle edge. Eye-level side-view horizon. For distant 2.5D slow parallax in pale ink landscape. No buildings, people, words, watermark, frames, map, strong gradients or lights. Original scenery, not depiction of a particular mountain in actual Jingzhou. Wide panoramic composition.

## 后续素材需求

- 连续的侧视/三分之四视角道路与河岸中景，适配真实建筑前庭；按原路线分段衔接。
- 2～3 组不同的透明树石前景，减少同一柳竹重复，统一透视和地面接触关系。
- 与场景一致的正式探索者行走序列帧。目前继续使用程序角色，未宣称完成精细人物美术。
- 如需大幅推近或严格中心跟随，应扩展场景两端，当前相机仍受原画幅边界约束。
