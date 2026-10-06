/* =========================================================================
 *  荒野日记: 孤岛  ——  内置 MOD  (In-Game Mod Menu)
 *  用法: 附加在 project.js 末尾, 打包为 project.jsc 放入热更目录
 *  设计原则:
 *    1) 全部走游戏内部 API, 不做内存搜索(GG 那种会触发 cheatItem 上报)
 *    2) 分两类修改:
 *       [上传类] 写 HYData -> 会被 updatedata 上传到服务器(存档权威在服务端)
 *       [本地类] 只 hook 运行时取值(getter/战斗数据), 不写存档, 服务器完全无感
 *    3) 安全层: 可拦截 clientlog 作弊上报 / 每日物品检查 / 清除封号标记
 * ========================================================================= */
(function () {
  if (window.HYMOD) return;
  var M = { ver: "1.0.0", ready: false };
  window.HYMOD = M;

  /* ---------------- 基础工具 ---------------- */
  var logs = [];
  function log(s) {
    var line = "[" + new Date().toTimeString().substr(0, 8) + "] " + s;
    logs.push(line);
    if (logs.length > 80) logs.shift();
    try { console.log("[HYMOD] " + s); } catch (e) {}
  }
  M.logs = logs;
  M.T = T;
  M.log = log;
  function T(msg) { try { HYCommon.toast(String(msg), 2); } catch (e) { log("toast fail " + e); } }
  function ok(fn, tag) { try { return fn(); } catch (e) { log((tag || "err") + ": " + e); return null; } }

  /* ---------------- 配置(本地存储) ---------------- */
  var cfg = {
    safeLog: true,        // 拦截 clientlog 作弊上报
    safeCheckItem: true,  // 拦截每日物品异常检查
    autoSave: true        // 修改后自动 trySave
  };
  ok(function () {
    var s = cc.sys.localStorage.getItem("hymod_cfg");
    if (s) { var o = JSON.parse(s); for (var k in o) cfg[k] = o[k]; }
  }, "cfg");
  M.cfg = cfg;
  function saveCfg() { ok(function () { cc.sys.localStorage.setItem("hymod_cfg", JSON.stringify(cfg)); }); }

  /* ---------------- 本地增益(不上传) ---------------- */
  var buff = {
    atk: 0,      // 额外攻击
    def: 0,      // 额外防御
    dodge: 0,    // 额外闪避
    hit: 0,      // 额外命中
    moveMul: 1,  // 移速倍率
    atkSpd: 1,   // 攻速倍率
    load: 0,     // 额外负重上限
    noCost: false,   // 攻击不消耗物品
    oneHit: false    // 一击必杀
  };
  M.buff = buff;

  /* ---------------- 安全层 ---------------- */
  var hooksInstalled = false;
  function installSafeHooks() {
    if (hooksInstalled) return;
    hooksInstalled = true;

    // 1) clientlog 拦截(作弊上报的主通道)
    if (dy && dy.http && dy.http.clientlog) {
      var rawLog = dy.http.clientlog;
      dy.http.clientlog = function (type) {
        if (cfg.safeLog) {
          var args = Array.prototype.slice.call(arguments);
          log("clientlog 已拦截: " + JSON.stringify(args).substr(0, 160));
          return;
        }
        return rawLog.apply(this, arguments);
      };
      log("已挂钩 dy.http.clientlog");
    }

    // 2) 每日物品数量检查
    if (window.HYCommon && HYCommon.checkItem) {
      var rawCheck = HYCommon.checkItem;
      HYCommon.checkItem = function () {
        if (cfg.safeCheckItem) { log("checkItem 已跳过"); return; }
        return rawCheck.apply(this, arguments);
      };
      log("已挂钩 HYCommon.checkItem");
    }

    // 3) 记录 updatedata 返回码(用于判断服务器是否接受修改)
    if (dy && dy.http && dy.http.updateData) {
      var rawUp = dy.http.updateData;
      dy.http.updateData = function (cb, uid, data) {
        return rawUp.call(this, function (err, res) {
          M.lastUpd = { code: res && res.errorCode, msg: res && res.errorMsg, time: Date.now(), keys: Object.keys(JSON.parse(data || "{}")).length };
          if (res && res.errorCode && 0 !== res.errorCode) log("updatedata 返回 " + res.errorCode + " (" + res.errorMsg + ")  键数=" + M.lastUpd.keys);
          cb && cb(err, res);
        }, uid, data);
      };
      log("已挂钩 dy.http.updateData");
    }
  }

  /* ---------------- 功能: 物品 ---------------- */
  var SAFE_MAX = 200;   // 未配置物品的安全上限(超过会被 checkItem 判定异常)
  function itemMax(id) {
    var c = ok(function () { return dy.config.ITEM_CHECK_CONFIG[id]; });
    return c ? c.NUM : SAFE_MAX;
  }
  M.itemMax = itemMax;

  function allItemIds() {
    var p = ok(function () { return dy.profile.getAll("Profiles/item_profile"); }) || {};
    var out = [];
    for (var k in p) if (/^\d+$/.test(k)) out.push(k);
    return out;
  }
  M.allItemIds = allItemIds;

  function addItems(map) {   // {id: count}
    if (!map) return;
    ok(function () { HYBag.updateAttr(map); }, "addItems");
    if (cfg.autoSave) ok(function () { HYData.trySave(); }, "save");
  }
  M.addItems = addItems;

  function grantAll(n, onlySafe) {
    var ids = allItemIds(), map = {}, cnt = 0;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], v = n;
      if (onlySafe) v = Math.min(n, itemMax(id));
      map[id] = v; cnt++;
    }
    addItems(map);
    T("已发放 " + cnt + " 种物品 x" + n);
    log("全物品发放 " + cnt + " 种 x" + n + (onlySafe ? " (限安全值)" : ""));
    return map;
  }
  M.grantAll = grantAll;

  function clearBag() {
    var b = ok(function () { return HYData.get("core.bag"); }) || {};
    for (var k in b) ok(function () { HYData.clear("core.bag." + k); });
    ok(function () { HYData.trySave(); });
    T("背包已清空");
  }
  M.clearBag = clearBag;

  /* 邮件式发奖: 完全复刻 PanelMailDetail.getItem 的发奖分支(不含 HTTP) */
  function grantByMailGoods(goodsStr, coin) {
    var r = String(goodsStr || "").split(";"), c = {}, n = 0;
    for (var s = 0; s < r.length; s++) {
      if (!r[s]) continue;
      var l = r[s].split(":");
      var id = l[0], num = +l[1] || 0;
      if (100000 == id) { HYData.add("base.technology.script.hasNum", num); }
      else if (100002 == id) { HYData.add("base.technology.seniorScript.hasNum", num); }
      else if (100003 == id) { HYData.add("base.technology.spiritCurrency", num); }
      else if (100004 == id) { HYData.add("base.technology.powerCurrency", num); }
      else if (100005 == id) { HYCommon.tryAddADCoin(num, dy.config.AD_TYPE.MAIL); }
      else if (100006 == id) { HYCommon.tryAddRobotCoin(num, 0, "mail"); }
      else if (id.indexOf("core") > -1 || id.indexOf("base") > -1) {
        if (l[2] && "num" == l[2]) num = +num;
        HYData.set(id, num);
      } else if (dy.profile.getById("Profiles/item_profile", id)) { c[id] = (c[id] || 0) + num; }
      else log("未知物品ID " + id);
      n++;
    }
    ok(function () { HYBag.updateAttr(c); });
    if (coin && +coin > 0) { ok(function () { HYCoin.update(+coin); }); }
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("邮件式发奖完成: " + n + " 项" + (coin ? " + " + coin + "贝壳" : ""));
    log("grantByMailGoods goods=" + goodsStr + " coin=" + coin);
  }
  M.grantByMailGoods = grantByMailGoods;

  /* ---------------- 功能: 角色属性(本地, 不上传) ---------------- */
  var hooksFight = false;
  function installFightHooks() {
    if (hooksFight) return;
    hooksFight = true;
    // getBaseFight: 每场战斗开始时调用 -> 在此注入攻击/移速/攻速/防御
    var raw = HYPlayer.getBaseFight;
    HYPlayer.getBaseFight = function () {
      var o = raw.apply(this, arguments);
      try {
        if (buff.atk) o.atk = (o.atk || 0) + buff.atk;
        if (buff.def) o.def = (o.def || 0) + buff.def;
        if (buff.dodge) o.dodge = (o.dodge || 0) + buff.dodge;
        if (buff.hit) { o.hit_rate = (o.hit_rate || 0) + buff.hit; }
        if (buff.moveMul && buff.moveMul !== 1) o.move_spd = (o.move_spd || 1) * buff.moveMul;
        if (buff.atkSpd && buff.atkSpd !== 1) o.atk_spd = (o.atk_spd || 1) * buff.atkSpd;
      } catch (e) { log("getBaseFight hook: " + e); }
      return o;
    };
    // getMaxLoad: 负重上限
    var rawLoad = HYPlayer.getMaxLoad;
    HYPlayer.getMaxLoad = function () {
      var v = rawLoad.apply(this, arguments);
      return buff.load ? v + buff.load : v;
    };
    log("战斗属性 hook 已安装");
  }
  M.installFightHooks = installFightHooks;

  function setBuff(k, v) { buff[k] = v; T("已设置 " + k + " = " + v); log("buff." + k + "=" + v); }

  /* 武器/防具强化: 直接改内存中的 item_profile 数据(不改文件, 不触网) */
  var equipBuff = { on: false, atkMul: 3, defMul: 3, disMul: 2, critAdd: 30 };
  M.equipBuff = equipBuff;
  function applyEquipBuff(on) {
    var prof = ok(function () { return dy.profile.mProfiles["Profiles/item_profile"]; });
    if (!prof) { T("找不到 item_profile"); return; }
    if (!M._equipBackup) {
      M._equipBackup = {};
      for (var k in prof) {
        if (prof[k] && prof[k].E_ATTRS) {
          var a = prof[k].E_ATTRS;
          M._equipBackup[k] = { ATK: a.ATK, DEF: a.DEF, DIS: a.DIS, CRIT: a.CRIT, HIT: a.HIT };
        }
        if (prof[k] && prof[k].E_ATTRS_1 && prof[k].E_ATTRS_1.ATK !== undefined) {
          M._equipBackup[k + "_1"] = { ATK: prof[k].E_ATTRS_1.ATK, DIS: prof[k].E_ATTRS_1.DIS };
        }
        if (prof[k] && prof[k].E_ATTRS_2 && prof[k].E_ATTRS_2.ATK !== undefined) {
          M._equipBackup[k + "_2"] = { ATK: prof[k].E_ATTRS_2.ATK, DIS: prof[k].E_ATTRS_2.DIS };
        }
      }
      log("已备份 " + Object.keys(M._equipBackup).length + " 条装备属性");
    }
    var n = 0;
    for (var id in prof) {
      var p = prof[id]; if (!p) continue;
      ["E_ATTRS", "E_ATTRS_1", "E_ATTRS_2"].forEach(function (key, idx) {
        var a = p[key]; if (!a || a.ATK === undefined) return;
        var bk = M._equipBackup[id + (idx ? "_" + idx : "")];
        if (!bk) return;
        if (on) {
          if (bk.ATK) a.ATK = Math.round(bk.ATK * equipBuff.atkMul);
          if (bk.DEF !== undefined && a.DEF !== undefined) a.DEF = Math.round(bk.DEF * equipBuff.defMul);
          if (bk.DIS !== undefined && a.DIS !== undefined) a.DIS = Math.round(bk.DIS * equipBuff.disMul);
          if (bk.CRIT !== undefined && a.CRIT !== undefined) a.CRIT = (bk.CRIT || 0) + equipBuff.critAdd;
          if (bk.HIT !== undefined && a.HIT !== undefined) a.HIT = Math.round(bk.HIT * equipBuff.disMul);
        } else {
          a.ATK = bk.ATK; a.DEF = bk.DEF; a.DIS = bk.DIS; a.CRIT = bk.CRIT; a.HIT = bk.HIT;
        }
        n++;
      });
    }
    equipBuff.on = !!on;
    T(on ? ("装备已强化 (" + n + " 条)") : "装备已还原");
    log("applyEquipBuff " + on + " -> " + n + " 条");
  }
  M.applyEquipBuff = applyEquipBuff;

  /* ---------------- 功能: 玩法 ---------------- */
  // 冷却/计时清零: 对应 lua 的 86400000 -> 1 (活动CD, 长按等)
  function clearCooldowns() {
    var n = 0;
    var scan = function (obj, prefix) {
      for (var k in obj) {
        var v = obj[k];
        if (typeof v === "number" && v === 86400000) { HYData.set(prefix + k, 1); n++; }
        else if (v && typeof v === "object" && prefix.split(".").length < 4) scan(v, prefix + k + ".");
      }
    };
    var base = HYData.get("base") || {};
    scan(base, "base.");
    var core = HYData.get("core") || {};
    scan(core, "core.");
    ok(function () { HYData.trySave(); });
    T("已清零 " + n + " 处 86400000 冷却");
    log("clearCooldowns " + n);
  }
  M.clearCooldowns = clearCooldowns;

  function clearCheatFlags() {
    var keys = ["base.cheatAchievement", "base.achieve_fake_profile", "base.cheatBuildProducts",
      "base.cheatGoOutMax", "base.cheatSelectGift", "base.cheatBuildProduct", "base.coin.adCoin.illegal"];
    var n = 0;
    keys.forEach(function (k) { if (HYData.get(k)) { HYData.set(k, 0); n++; log("清除 " + k); } });
    // 记录本次修改前的天数, 便于压低 checkItem 的比值
    ok(function () { HYData.trySave(); });
    T("已清除 " + n + " 个非法标记");
  }
  M.clearCheatFlags = clearCheatFlags;

  // 本局得分: 修改 calScore 的返回值(结算时生效)
  var scoreAdd = { on: false, mul: 10, add: 0 };
  M.scoreAdd = scoreAdd;
  var scoreHooked = false;
  function installScoreHook() {
    if (scoreHooked) return;
    scoreHooked = true;
    var raw = HYCommon.calScore;
    HYCommon.calScore = function () {
      var v = raw.apply(this, arguments);
      if (scoreAdd.on) { v = Math.floor(v * scoreAdd.mul) + scoreAdd.add; log("结算得分 " + v); }
      return v;
    };
    log("得分 hook 已安装");
  }
  M.installScoreHook = installScoreHook;

  // 皮肤解锁: 对应 lua 的皮肤替换 (core.roleSkin)
  var SKINS = {
    "100003": "新春厨神", "100004": "妙厨",
    "100102": "幽灵公主", "100103": "罗塔女巫", "100104": "冰雪女王", "100105": "吸血女爵",
    "100202": "狂化战士", "100203": "赏金猎人", "100204": "荒岛学者",
    "100302": "圣诞老哥", "100303": "绝味小哥", "100304": "苍龙祭祀", "100305": "驯鹿之魂",
    "100403": "新月狼人", "100404": "彩蛋兔爷", "100405": "丛林战士"
  };
  M.SKINS = SKINS;
  function setSkin(id) {
    ok(function () { HYData.set("core.roleSkin", id); HYData.trySave(); });
    T("皮肤已切换: " + (SKINS[id] || id));
    log("setSkin " + id);
  }
  M.setSkin = setSkin;

  /* ---------------- 启动 ---------------- */
  function boot() {
    if (!window.dy || !window.HYData || !window.cc || !cc.director || !dy.theRoot) { setTimeout(boot, 500); return; }
    installSafeHooks();
    installFightHooks();
    installScoreHook();
    M.ready = true;
    log("MOD 已加载 v" + M.ver);
    T("MOD 已加载, 点击右上角 M 打开菜单");
  }
  setTimeout(boot, 800);
  M.boot = boot;
})();
