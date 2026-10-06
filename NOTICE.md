# 版权与使用声明 (NOTICE)

## 1. 本仓库原创部分 —— MIT 协议

以下内容为作者原创, 以 [MIT](LICENSE) 协议开源, 可自由使用/修改/再分发(保留版权声明):

- `mod/` 下的全部代码(JS 注入层、Java 原生菜单、构建/分析脚本)
- `mail-tool/` 下的网页工具代码(index.html / gen.js / md5.js / items.js 的数据整理部分)
- `docs/` 下的全部文档
- `payloads/` 下的示例响应体

## 2. 不属于本仓库原创的部分 —— 仅作学习存档

以下内容的**版权属于游戏的开发商与发行商**, 本仓库只是把它们作为逆向工程的学习材料收录,
**不适用 MIT 协议, 请勿用于商业用途或二次分发**:

| 路径 | 来源 |
|---|---|
| `game-source/project.dec.js` / `project.beauty.js` / `project.raw.js` | 从游戏客户端 `assets/src/project.jsc` 解密得到 |
| `game-source/Profiles/*.json` | 游戏客户端 `assets/res/raw-assets/resources/Profiles/` |
| `mail-tool/icons/*.png` | 从游戏资源图集中提取的物品图标 |

如果权利方认为本仓库内容侵犯了你的权益, 请开 Issue 或邮件联系, 我会立即删除相关内容。

## 3. 使用风险

- 修改游戏客户端与存档**可能违反游戏的用户协议**, 并可能导致账号被限制;
- 本仓库记录的所有"规避检测"手段**仅用于技术学习**, 使用后果由使用者自行承担;
- **请勿在充值账号 / 主力账号上做任何修改**, 也不要把本仓库的工具用于牟利。
