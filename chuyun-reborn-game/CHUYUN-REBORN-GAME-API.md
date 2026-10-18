# 《云上荆州博物馆 · 楚韵重生》v2.0 配置接口

运行入口：`index.html` 或兼容入口 `chuyun-reborn-game.html`。

全局传播配置位于 `window.CHUYUN_CONFIG`：`schemaVersion`、`museumLink`、`museumShortLink`、`sisterGameLink`、`seriesName` 与海报参数。

## 文物配置

运行数据位于 `scripts/data.js` 的 `window.CHUYUN_DATA.artifacts`。每件文物包含：

```js
{
  id, order, name, short, era, category, origin,
  image, ratio, hallPosition, observePrompt,
  origin, originStatus, originStory, mapSpot,
  finaleChime, echoes,
  inspection: [{ id, title, x, y, finding, action }],
  hotspots: [{ id, title, x, y, scale, body, observe, chapter }],
  puzzle: { cols, rows, rotationStep, reference, crop: { x, y, w, h } },
  memories: [String],
  quiz: [{ q, opts, a, explain }],
  choice: { prompt, complete, retain },
  verse: { id, text, source },
  ticketQuote
}
```

- 坐标与裁切范围均为相对于照片宽高的 `0–1` 值。
- `inspection` 驱动移动侧光下的病害发现与处理建议。
- `hotspots[].scale` 为点击热点后的照片特写倍率。
- `puzzle.reference` 支持 `always`、`fade`、`fade-fast`。
- 拼图碎片数量为 `cols × rows`，自动从同一张照片生成背景切片。

## 状态与存档

存档键：`chuyun-reborn-v2-full`，当前 `schemaVersion: 2`。

```js
{
  done: { [artifactId]: { stars, score, choice, accuracy, knowledge, time } },
  handbook: { "artifactId:hotspotId": true },
  verses: { [verseId]: { id, text, source } },
  mapCards: { [artifactId]: true },
  seen: { echoes: {}, notices: {}, ceremonies: {} },
  handbookSections: { undergroundRead: false },
  nineSongs: { unlocked: false, viewed: false }
}
```

## 音效接口

`window.MuseumAudio` 提供 `unlock`、`cycleLevel`、`door`、`step`、`light`、`wrong`、`snap`、`page`、`hotspot`、`chime`、`drum`、`finale`。环境音提供静音、轻声、标准三级，全部通过 Web Audio API 实时合成。

## 兼容性

使用 Pointer Events、Canvas 2D、Web Audio、`dialog` 和 `localStorage`。推荐现代 Chrome、Edge、Safari。首次用户手势后才启动声音，以符合移动浏览器自动播放限制。

## 《雾散荆州》嵌入协议（2026-10-18）

正式主游戏使用 `../../chuyun-reborn-game/index.html?embed=1&session=<随机值>`。
主游戏注册 ID：`chuyun-reborn`；桥接脚本：`demo/journey/landmark-museum-game.js`。
兼容入口仍保留；`legacy-v1.html` 不参与正式接入。

新增可选 `scripts/journey-bridge.js`，仅在有效 iframe 嵌入模式显示
“退出修复 · 返回博物馆”。独立打开不显示此按钮、不发送消息。

子页面通过 `parent.postMessage(payload, location.origin)` 发送：

```js
{ channel: 'wusan-museum', gameId: 'chuyun-reborn', session, action: 'start' }
{ channel: 'wusan-museum', gameId: 'chuyun-reborn', session, action: 'cancel' }
{ channel: 'wusan-museum', gameId: 'chuyun-reborn', session, action: 'complete',
  completed: true, artifacts: ['cup', 'pigbox', 'drum'], total: 3 }
```

主游戏验证 `event.origin`、`event.source === iframe.contentWindow`、session、channel、
游戏 ID，且已收到开始事件、三件文物齐全，才一次调用原有 `complete({completed:true,levelId})`。
退出调用 `cancel()`，销毁 iframe 并移除主页面消息监听器。子页面不接收父页面控制命令。

完整通关为三件文物在本次嵌入中均完成真实修复结算，含第三件悬鼓三次击鼓，
并经原有出土地地图/彩蛋流程返回展厅、触发展柜全部点亮。
加载历史收藏、入馆、返回展厅、单件修复、错题或拼图错误均不发送 complete。
原游戏没有独立战败状态，错误影响评分，未新增胜负规则。

嵌入模式以空的本轮 `done` 开始，不读取历史修复作为本次通关，不覆盖独立模式的
`chuyun-reborn-session-v1`；原独立收藏档案 `chuyun-reborn-v2-full` 保留。
不读写主游戏 `wusan-journey-demo-progress-v1`；传承印记、散雾、盖章和存档都交由主游戏。
重新进入文物/放弃修复会使上一修复轮次的待执行结算失效。

本地验证：从项目根目录启动静态服务，打开 `demo/journey/journey-demo.html`，
选择博物馆，抵达后“开始探索”→“入馆”。相关测试：

```sh
node --test demo/journey/test/museum-integration.test.mjs
```
