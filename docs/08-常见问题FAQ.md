# FAQ / 排错

## 邮件相关

**Q: 邮件改完不显示?**
1. token 有没有重算(改 `id/type/goods/to_user/createTime/deadline/coin` 任意一个都要重算);
2. 有没有完全重启游戏(客户端有 10 分钟邮件缓存, 源码行 2498 / 4994);
3. 重写规则匹配的 URL 是不是 `/Logic/user/querymail1`。

**Q: 显示但领取失败?**
服务器 `updatemail` 返回非 0。用**你账号上真实存在过的邮件 id** 最稳。

**Q: 领了但物品没进背包?**
`goods` 里的 id 必须在 `item_profile` 里存在(行 41913); 特殊 id 走专用字段(见 README 4.3 表)。

**Q: 可以重复领同一封邮件吗?**
`channel == "_"` 的邮件不写已领取标记(行 41922), 理论上可以; 但要服务器每次都返回 `errorCode 0`。

**Q: 邮件能不能写 `base.xxx` / `core.xxx`?**
可以。行 41910-41912 会直接 `HYData.set`, 等于"用一封邮件改任意存档字段"。

## 封号 / 弹窗

**Q: 弹 4015-5?**
你在邮件或别处发了 >9 的 `100005`(时之砂)。清 `base.coin.adCoin.illegal`:
MOD 菜单"清除作弊标记", 或 `python mod/tools/unban.py --uid ... --key base.coin.adCoin.illegal`。

**Q: 登录直接失败 / 提示账号异常?**
先 `python mod/tools/check_flags.py --account-id ... --openid ...` 看 `invalid` 字段,
有值或 `errorCode 1001` 才是真封号。

**Q: 清完标记过一会又弹?**
1. 说明还有别的键非 0 -> 用 `--all`;
2. 或者你的某个操作又在置位(比如又发了 >9 的时之砂)。

## MOD 相关

**Q: 悬浮球挡住操作?**
按住拖到屏幕边缘会自动吸附。

**Q: 重启后滑块/开关回到默认?**
状态存在 `localStorage["hymod_vals2"]`。如果"拦截热更"被关掉、脚本被换回官方版, 状态自然就没了。

**Q: 一键全物品到背包卡死?**
别用背包, 用"给仓库补发全物品"或"背包->仓库(整批搬运)", 见 README 6.4。

**Q: 属性和装备页的倍率没有生效?**
1. 先确认 "安全" 页的日志里有 `战斗属性 hook 已安装`;
2. 属性和装备是**两套**: 属性改的是角色的基础属性, 装备改的是 `item_profile` 里装备的 `E_ATTRS*`;
3. 装备类改动需要**重新穿戴/重进战斗**才会刷新数值。

**Q: 修改会不会被服务器发现?**
见 README 第 12 章。纯内存 hook 不会上传; 写存档的会。

## 构建相关

见 [docs/05-构建与打包指南.md](05-构建与打包指南.md) 第 6 节。

## 其它

**Q: 为什么不直接发 Xposed/Frida 脚本?**
Frida 需要每次连电脑; Xposed 需要 root + 改框架。直装 APK 最省事, 也方便分享。

**Q: 存档怎么备份?**
游戏存档主要在服务器; 本地 `/data/data/<包名>/files/` 下有缓存。
想备份本地部分: `adb backup`(不支持) -> 用 root 直接 `adb pull /data/data/<包名>`。
