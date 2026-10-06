# game-source —— 游戏逻辑源码(学习存档)

## 文件

| 文件 | 说明 |
|---|---|
| `project.dec.js` | 从 `assets/src/project.jsc` 静态解密出的**明文游戏逻辑**(1.8 MB), 打包 MOD 时用的就是它 |
| `project.beauty.js` | 同一份代码的美化版(63260 行), **所有文档里的行号都指这个文件** |
| `project.raw.js` | 设备上动态 dump 的原始版本(未美化, 用于对比) |
| `Profiles/*.json` | 关键配置表(物品/科技/皮肤/天赋/商店/建筑产物) |

## 版权

这些内容的版权属于游戏开发商/发行商, **不是本仓库原创**, 不适用 MIT 协议, 仅作为逆向学习资料收录。
详见 [../NOTICE.md](../NOTICE.md)。

## 怎么自己再解一次

见 [../docs/07-游戏源码提取.md](../docs/07-游戏源码提取.md)。

## 阅读建议

- 想理解**邮件**: 搜索 `queryMail` / `checkMailLegal` (行 4990 / 5021);
- 想理解**存档**: 搜索 `updateData` / `trySave` / `sign`;
- 想理解**战斗**: 搜索 `getBaseFight` / `getFightBuff` / `calScore`;
- 想理解**作弊检测**: 搜索 `_checkIsCheated` / `clientlog` / `4015`。
