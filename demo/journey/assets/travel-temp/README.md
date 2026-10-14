# 电影式赶路临时素材

这里只保存技术占位图层。场景不代表真实景点或真实地理路线，正式建筑照片尚未接入。现有全局画卷素材保留在上一级目录，本场景不加载 terrain-v3.png 或四个建筑。

统一配置：`../../travel-config.js`。渲染与角色运动：`../../travel-scene.js`。资源地址相对于 `journey-demo.html`，不相对于配置文件或素材目录。

| 插槽 | 当前文件/占位 | 建议尺寸 | 背景要求 | 用途 |
| --- | --- | --- | --- | --- |
| sky | sky.svg | 1600×900 或 1920×1080 | 不透明、左右接续 | 天空与宣纸底色，移动最慢 |
| far | far-ridge.png | 2400×800 | PNG alpha，边缘轻柔 | 远山，低饱和、慢速视差 |
| middle | middle-bank.svg | 1600×900 | 天空透明，左右接续 | 中景林木、河岸、山石 |
| road | road.svg | 1600×900 | 道路上方透明，左右接续 | 平直侧视道路，默认地面 y=640 |
| foreground | foreground-willow.png | 1536×1024 | PNG alpha、留边 | 掠过的树石，允许 spacing 留空；靠近人物自动淡化 |
| character | src=null，原探索者风格程序占位 | 单帧 128×192；8 帧可用 1024×192 横条 | PNG alpha，脚底锚点 | 角色，支持静态 PNG 和规则序列帧 |
| 转场 | transition-cloud.png | 1024×1024 | PNG alpha | 出发/抵达云雾，单独在 transition 配置 |

far-ridge.png、foreground-willow.png、transition-cloud.png 是现有原创 Demo 纹理的原样副本；SVG 为本轮原生代码绘制的临时占位。未修改上一级原图。色彩与细节仅用于技术验收，不代表正式美术质量。

## 替换方法

1. 将正式图片放到新目录，例如 `assets/travel-final/`，保留本目录作为可恢复占位。
2. 在 travel-config.js 的 scenes 对应 slots 中修改 src。
3. 调整 x、y、width（环境图层）、scale、opacity、parallax。配置均使用场景世界坐标。width 设置后图片按原始比例缩放；需要特殊高度可设置 height，但应避免拉伸。
4. 路面与脚底必须一起校准：修改场景 groundY，以及 road 的 y/scale。角色 y 是相对于 groundY 的额外偏移；anchorY=1 表示图片底部接地，有底部透明留白时需用 y 修正。
5. 循环环境图层使用 repeat=true，spacing 为重复间距；缺省使用 width。正式重复图两端须自然接续。repeat=false 时图片按视差连续移动，应提供覆盖整个行程的足够宽度。
6. 刷新页面测试。浏览器 Demo 存档不会因替换素材而清除。

### 人物替换示例

```js
character: {
  src: 'assets/travel-final/explorer-walk.png',
  x: 0, y: 0, scale: 0.6, opacity: 1, parallax: 1,
  anchorX: 0.5, anchorY: 1,
  frames: {count: 8, columns: 8, width: 128, height: 192, stride: 144, idle: 0}
}
```

stride 为一整轮步态对应的场景行走距离，控制动画与移动匹配；静态 PNG 使用 frames=null。程序占位 scale=2.8 的单位与 PNG 像素不同，换图后务必调整 scale。规则网格支持多行；暂不读取第三方图集 JSON。帧配置超出图片尺寸时降级静态角色并提示。

### 不同路线使用不同场景

```js
// scenes 新增 partial override，缺省字段与插槽继承 defaultScene。
'river-road': {
  title: '临江驿道', duration: 10, travelDistance: 1600,
  groundY: 640,
  slots: {
    far: {src: 'assets/travel-final/river-mountains.png', opacity: 0.5, parallax: 0.18},
    middle: {src: 'assets/travel-final/river-bank.png', width: 1600}
  }
}
// routes 中绑定，正反向可选择不同配置：
'guanyu->binyang': 'river-road',
'binyang->guanyu': 'river-road'
```

四个稳定 ID：guanyu、binyang、zhangjuzheng、museum。未配置的路线使用 ink-road。当前所有路线复用一组占位。duration 是赶路秒数，travelDistance 是独立场景行进距离；camera.follow、camera.lead 控制平滑跟随和前方留白，与地图道路无关。

## 失败回退

图片解码或请求失败时，各插槽独立降级为开发占位形状，角色降级程序探索者。加载超时为约 4.5 秒，云雾准备阶段仍可跳过或返回。加载完成前中止不会重新弹出旧场景。纹理按路径缓存，重复赶路不重复加载相同资源。模块不调用 localStorage，也不授予印章。
