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
