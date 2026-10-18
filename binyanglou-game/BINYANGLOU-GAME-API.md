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

## 《雾散荆州》正式接入（2026-10-18）

主游戏注册 ID 为 `binyang-fenghuo`，配置为 `mode: 'real'`，由
`demo/journey/landmark-binyang-game.js` 创建 iframe：
`../../binyanglou-game/binyanglou-game.html?embed=1&session=<随机会话>`。

嵌入时，已有消息增加 `channel: 'wusan-binyang'`、`session` 和 `run`。
`run` 在每次开始/重开时递增。子页面向当前同源父页面发送消息，目标为
`location.origin`；来自父页面的控制消息也必须符合相同来源、channel 和 session。
不再使用通配目标来源。独立页面的 `BinyanglouGame` API 保持可用。

主游戏桥接先接收本轮 `start`，再接受同轮的 `complete`，同时校验 iframe 窗口、
origin、会话、游戏 ID、完成状态、第三波及城门耐久；失败会使当前轮失效。
完成只处理一次，调用既有 `complete({ completed: true, levelId })`。
顶部“退出守城 · 返回宾阳楼”调用主游戏 `cancel()`，不发放印记。
清理时移除消息监听器和 iframe。

真实成功节点保持为：第三波全部生成、河道无剩余船只且城门耐久大于零，
进入原有结算知识卡流程，收下知识卡后发送 `complete`。
打开页面、点击开战、失败、暂停和重开均不发送完成消息。
子游戏不读写主游戏存档；印记、散雾、盖章和持久化均由主游戏原有流程处理。

入口依次加载基础 CSS 及 v3–v21 累积样式，全部属于运行依赖，应保留。
`AI-PROMPTS-v9.md` 是素材制作参考，`media-manifest.json` 是可选媒体清单，
不属于当前启动依赖；未接入的视频/音频不需补齐。目录及既有素材均保留。

本地验证：在项目根目录运行 `python3 -m http.server 8765 --bind 127.0.0.1`，
打开 `http://127.0.0.1:8765/demo/journey/journey-demo.html`，
选择宾阳楼，抵达后点击“开始探索”，再点击“击鼓开战”。
完整通关需打完三波并收下结算知识卡。退出或失败后返回长卷应无新增印记；
成功后回到长卷应出现古城印记，刷新后仍保留。

相关自动测试：

```sh
node --test demo/journey/test/binyang-integration.test.mjs modules/zhangjuzheng-memorial/test/journey-progress.test.mjs modules/zhangjuzheng-memorial/test/journey-host.test.mjs modules/zhangjuzheng-memorial/test/journey-bridge.test.mjs
```

测试以独立 VM 内的结束状态夹具执行真实的波次结束、整备、结算、知识卡与桥接代码，
不向生产页面暴露通关开关。自动测试不等同于人工完整战斗通关。
