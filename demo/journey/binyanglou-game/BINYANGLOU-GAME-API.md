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
```

## 同页接入

当游戏 JS 直接运行在主项目页面时，可使用：

```js
window.BinyanglouGame.start();
window.BinyanglouGame.reset();
const state = window.BinyanglouGame.getState();

window.addEventListener('binyanglou-game:complete', (event) => {
  console.log(event.detail.score);
});
```

`window.BinyanglouGame.version` 当前为 `1.0.0`。
