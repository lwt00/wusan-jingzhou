# 关羽祠华容道接入（2026-10-16）

正式入口：`http://127.0.0.1:8767/demo/journey/journey-demo.html`，在项目根目录提供同源 HTTP 服务。

## 接口与目录

保留根目录 `guanyu-shrine/`。`landmark-config.js` 将关羽祠配置为 `guanyu-huarong`，入口在 `landmark-view.js` 后加载 `landmark-guanyu-game.js`。适配器通过现有 `WusanLandmarkGames.register` 注册 `mount({container, levelId, complete, cancel})`，返回卸载函数。

iframe 地址为 `../../guanyu-shrine/index.html?embed=1&session=<随机会话>`。仅小游戏插槽添加全屏样式，不覆盖其他景点。主游戏状态提示改为正式小游戏说明。

华容道沿用原有规则：曹操从底部出口离开触发 `huarong:complete`，文化卡提供领取按钮，用户领取才发送 `{channel: 'wusan-guanyu', session, action: 'complete'}`；中途返回发送 `cancel`。父页面同时校验 `event.source`、同源 origin、频道、会话及动作，单会话只结算一次，卸载移除监听和 iframe。

适配器只调用原主游戏 `complete({completed:true, levelId})`。主游戏沿用 `onComplete → landmark-reveal-return → revealing → completeReveal`，更新关羽祠完成状态、散雾和印记，并使用原 `wusan-journey-demo-progress-v1` 存档。小游戏不读写主游戏存档。存档在雾散演出完成后保存；旧版模拟完成的印记不会自动清除。

## 张居正模块后续接入

`modules/zhangjuzheng-memorial/index.html` 是独立 ES Module 入口。`state.mjs` 的 `isVictory(state)` 要求批完十份奏折且国库、民心、边防均大于零；`app.mjs` 的 `renderEnd()` 显示胜负。当前没有完成通信，也不读写主游戏存档。本轮未修改此模块，原张居正模拟入口保留。

后续可新增 `zhangjuzheng-memorial` 注册适配器，iframe 指向 `../../modules/zhangjuzheng-memorial/index.html`；在实际胜利结束页增加领取桥接，复用同样的 source/origin/channel/session/action 校验与 complete/cancel、dispose 协议。失败和中途退出仅 cancel，不发奖；无需变更奏折玩法或主游戏存档系统。

## 自动测试

`node --test guanyu-shrine/verify.cjs` 三项通过：初始及移动后棋局的所有求解步骤合法且末步才胜利；错误窗口、origin、频道、会话被拒绝；重复完成只结算一次、退出和卸载后不发奖。JS 语法与 `git diff --check` 通过。

## 浏览器测试

从正式长卷入口进入关羽祠并打开华容道；中途退出保持 0/4，重新进入为新棋局。实际键盘移动 20 次揭雾，使用原一键通关自动执行合法步骤，137 步后真实出关并显示三星文化卡。领取前仍为 0/4；点击领取后返回长卷、关羽祠区域散雾并盖忠义印记，变为 1/4。刷新并跳过序幕后恢复 1/4。

所有十一张游戏图片加载成功，浏览器无 error/warn。宾阳楼和张居正故居原模拟入口打开和取消正常；跨站赶路实见关羽骑马及守将行走。荆州博物馆原模拟入口打开和取消正常；张居正故居至博物馆自然抵达正常；博物馆赶路至关羽祠后显示再次探索，返回长卷仍仅忠义印记 1/4。截图保存在 previews/guanyu-integration-complete.jpg。未做手机真机或其他浏览器测试。测试使用独立端口 8767，真实游玩留下该 origin 的忠义印记，不影响其他端口原存档。

未提交或推送 Git。保留工作区原有变更，不改角色、画面、小游戏核心规则和美术资源。
