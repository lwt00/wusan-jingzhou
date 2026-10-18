# 宾阳楼子游戏接入说明

正式入口：`binyanglou-game.html`。游戏不依赖第三方库、全局存档或主项目样式。

## 推荐：iframe 接入

```html
<iframe id="binyanglou-game" src="./binyanglou-game/binyanglou-game.html" title="宾阳楼·烽火守城"></iframe>
<script>
  const gameFrame = document.querySelector('#binyanglou-game');

  window.addEventListener('message', (event) => {
    if (event.source !== gameFrame.contentWindow) return;
    if (event.data?.source !== 'binyanglou-game') return;

    if (event.data.type === 'complete') {
      // 在这里写入团队主项目的通关存档或跳转逻辑
      console.log('宾阳楼通关', event.data.score);
    }
  });

  // 主项目可主动控制游戏
  gameFrame.contentWindow.postMessage({ source: 'binyanglou-host', type: 'start' }, '*');
</script>
```

### 游戏发出的消息

| type | 含义 |
| --- | --- |
| `ready` | 页面已就绪 |
| `start` | 本轮开始 |
| `wave` | 进入新波次 |
| `complete` | 通关 |
| `fail` | 守城失败 |
| `state` | 对 `get-state` 的响应 |

消息通用字段：`source`、`type`、`gameId`、`status`、`wave`、`totalWaves`、`wall`、`score`。

### 主项目可发送的消息

```js
{ source: 'binyanglou-host', type: 'start' }
{ source: 'binyanglou-host', type: 'reset' }
{ source: 'binyanglou-host', type: 'get-state' }
{ source: 'binyanglou-host', type: 'pause' }
{ source: 'binyanglou-host', type: 'resume' }
```

## 同页接入

当游戏 JS 直接运行在主项目页面时，可使用：

```js
window.BinyanglouGame.start();
window.BinyanglouGame.reset();
window.BinyanglouGame.pause();
window.BinyanglouGame.resume();
const state = window.BinyanglouGame.getState();

window.addEventListener('binyanglou-game:complete', (event) => {
  console.log(event.detail.score);
});
```

`window.BinyanglouGame.version` 当前为 `11.4.2`。通关结果额外返回 `supplies`、`signal`、`weapon`、`player`、`knowledgeCards`、`merchantReveals`、`merchantBreaches`、`civilianHits`、`signalsUsed`、`goodSignals`、`qteFails`、`breaches`、`rating` 和 `upgrades`。`rating.dimensions` 包含 `spy`、`civilian`、`defense`、`signal` 四项文化行为评分。

## 操作

- 键盘：WASD 沿城头移动/前后探身，Shift 疾跑，方向键独立瞄准，Tab 锁定最近敌船，空格发射，Q 火油齐射，Z/X/C 切换破甲弩、火矢和投石，烽火令满 100 后按 1/2/3 实时发出齐射、火攻或援军指令。
- 鼠标：移动瞄准，点击战场发射。
- 触摸：屏幕方向键、发射键和火油技能键。

## 可选视频与音频素材

当可灵/即梦生成无缝水面视频后，将文件放到 `assets/moat-water-loop.mp4`，并在 `#water-video` 内加入：

```html
<source src="assets/moat-water-loop.mp4" type="video/mp4">
```

战鼓音乐建议命名为 `assets/battle-calm.mp3` 和 `assets/battle-boss.mp3`。当前版本不引用不存在的媒体文件，因此不会产生 404 错误。

9.0 版的完整视频、BGM 与音效文件名见 `media-manifest.json`。这些文件均为可选资源：放入后再由主项目的音频管理器或本游戏后续版本加载；当前不主动请求不存在的文件。
