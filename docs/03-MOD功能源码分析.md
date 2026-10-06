# MOD 功能 <-> 游戏源码 对照分析

> 行号指向 [`../game-source/project.beauty.js`](../game-source/project.beauty.js)(63260 行, 美化版)。
> 与 README 第 6 章互补: 本文只讲"每个功能为什么这么做"。

## 0. 快速索引

| 菜单功能 | hook / 写入点 | 源码行 | 是否写存档 |
|---|---|---|---|
| 生命倍率 / 无敌 / 一击必杀 / 额外攻防 | `HYPlayer.getBaseFight` | 19399 | 否 |
| 攻速 / 移速(战斗中) / 命中 | `HYPlayer.getFightBuff` | 19840-19870 | 否 |
| 移速(地图上) | `HYPlayer.getMoveSpeed` | 19251 | 否 |
| 额外防御 / 闪避 / 负重 | `HYPlayer.getDef` / `getMiss` / `getMaxLoad` | 19251 附近 | 否 |
| 结算得分 | `HYCommon.calScore` | ~39599 | 否 |
| 无限耐久 | `HYEquip.updateDuration` | 15277-15294 | 否 |
| 装备属性倍率 | 内存中的 `Profiles/item_profile.E_ATTRS*` | — | 否 |
| 战斗倍速 | `base.fightSpeed` | 8637 / 8849 / 8940 | 是(游戏自带字段) |
| 发物品(背包) | `HYBag.updateAttr` | 12206-12225 | 是 |
| 发物品(仓库) | `HYWarehouse.updateAttr` | 22982-23001 | 是 |
| 一键全提升(科技) | `base.technology.product.<pid>.<base10>` | 22160-22355 | 是 |
| 一键全提升(皮肤强化) | `base.technology.skin.<pid>` | 22219-22226 / 22366-22386 | 是 |
| 一键全提升(天赋) | `base.technology.talent.<tid>` = 3 | 22169-22173 | 是 |
| 解锁皮肤 | `HYRoleSkin.addSkin` / `base.roleSkin.*` | 19880-19898 | 是 |
| 解锁角色 | `base.unlock.role.*` + `base.shop.*` | 13553-13572 | 是 |
| 清作弊标记 | `base.cheat*` / `base.coin.adCoin.illegal` | 54050-54100 | 是 |

## 1. 为什么"能纯本地就纯本地"

游戏每 30 秒左右(以及每次关键操作后)会 `POST /Logic/user/updatedata`, 把 `core.*` / `base.*` 的
**全部改动**上传。也就是说:

- 你写进 `HYData` 的每一个键, 都会变成服务器上的一条数据;
- 而 hook 函数返回值**不写 HYData**, 服务器永远看不到。

所以 MOD 的设计原则是:

```
能改返回值 -> 绝不写存档
必须写存档(发物品/解锁) -> 一次写到位, 并且走"`trySave()` 一次"而不是反复写
```

## 2. 属性类 hook 的实现细节

```js
var rawBF = HYPlayer.getBaseFight;
HYPlayer.getBaseFight = function () {
  var o = rawBF.apply(this, arguments);       // o = { life, atk, def, dodge, hit, ... }
  if (buff.godMode)  o.life = Math.round((o.life||0) * 100);
  else if (buff.lifeMul !== 1) o.life = Math.round((o.life||0) * buff.lifeMul);
  if (buff.atkAdd)  o.atk   = (o.atk||0) + buff.atkAdd;
  if (buff.oneHit)  o.atk   = (o.atk||0) + 999999;
  ...
  return o;
};
```

注意点:

1. **必须 `apply` 原函数后再改**, 否则会把游戏原本的属性覆盖掉(比如血量直接变 1);
2. `getBaseFight` 每次进战斗/刷新面板都会调用, 所以改这里是"动态生效"的;
3. 生命值有两个概念: **面板血量**(存 `core.role.7002/7003`)和**战斗血量**(由 `getBaseFight` 算),
   写前者会存档(危险), hook 后者不会(安全);
4. 攻速/移速要看**战斗中**的 `getFightBuff`, 它返回的对象里有 `atk_spd` / `move_spd`,
   游戏公式是 `(武器速度 + 加成) * (1 + buff.atk_spd + ...)`(行 16412-16435),
   所以给 `atk_spd` 加 `(倍率-1)` 就等于"速度乘倍率"。

## 3. 无限耐久

```js
updateDuration: function(e, t) {          // 行 15277
  for (var a in e) {
    var i = this.getDuration(a);          // 当前耐久
    (i += e[a]) <= 0 && (this.dropItem(a), this.putOut(a));   // <=0 就扔掉
    ...
  }
}
```

MOD 的处理: 遍历参数 map, **丢掉所有负数项**(= 消耗), 剩下的照常交给原函数:

```js
HYEquip.updateDuration = function (e, t) {
  if (buff.infDur) {
    if (typeof e === "object") {
      var keep = {}, cut = 0;
      for (var k in e) { if (e[k] < 0) cut++; else keep[k] = e[k]; }
      if (!Object.keys(keep).length) return;   // 全是消耗 -> 直接不执行
      return rawUD.call(this, keep);
    }
    if (t < 0) return;                          // 单个 id + 负数
  }
  return rawUD.apply(this, arguments);
};
```

## 4. 一键全提升: 为什么写这些键就是"真解锁"

游戏的加成计算**不是**看"你有没有点过升级按钮", 而是每次直接读 `base.technology.*` 的等级:

- 建筑科技: `base.technology.product.<productId>.<base10>` 存的是**该组的等级**,
  `base10 = 10 * floor(id / 10)`, 上限 = 该 base 下 technology.json 的节点数(行 22291-22299);
- 皮肤强化: `base.technology.skin.<productId>`, 上限 = `getSkinMaxLevel(pid)`(行 22219-22226);
  读取处 `techSkin()` (行 22366-22386) 会 clamp 到上限, 所以写**上限值**才真的满级;
- 天赋: `base.technology.talent.<tid>`, 源码里 `setTalent` (行 22169-22173) 硬编码最大 3;
- 皮肤: `base.roleSkin.<role>.<skinId> = "1"`;
- 角色: `base.unlock.role.<roleId> = 1` + `base.shop.<shopId> = 1`。

**"表面文章"的坑**: 只把 UI 状态改了(比如只写 roleSkin 不写 technology.skin) ->
界面显示已解锁, 但加成计算读的是另一个键 -> 属性没变。MOD 一次性把 5 类键全部写满到**游戏自己的上限**,
所以加成是真的。

## 5. 安全层

| hook | 作用 | 默认 |
|---|---|---|
| `dy.http.clientlog` | 所有 `cheat*` 上报都走它(行 5008/5014/28654/41882/14265...), 拦掉 = 客户端不再举报你 | ✅ 开 |
| `HYCommon.checkItem` | 每日物品异常检查 | ✅ 开 |
| `dy.http.updateData` | 可过滤含 `cheat`/`illegal` 的键(**慎用**, 正常键名也可能命中) | ❌ 关 |
| `dy.http.checkUpdateInfo` | 强制"无更新", 防止 MOD 被热更覆盖 | ✅ 开 |
| 修改后自动 `HYData.trySave()` | 让改动立刻生效并上传(否则可能被下一次覆盖) | ✅ 开 |

## 6. 已知限制

- **强更新**: 官方大版本更新后, 客户端 jsc 结构变化 -> 需要重新解包适配;
- **排行榜类**数值(得分/成就)是服务端+人工都可能发现的地方, 别乱来;
- MOD 只改客户端, **不能创造服务器上不存在的东西**(比如根本不存在的物品 id 领了也只是本地数据);
- 部分渠道的 jsc 可能加壳/换 key -> 用 `mod/tools/dump_xxtea.py` 动态抓。
