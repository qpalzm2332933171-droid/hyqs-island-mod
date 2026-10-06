/* =========================================================================
 *  荒野日记: 孤岛  ——  内置 MOD v2 (原生菜单版)
 *  载体: 追加在 project.dec.js 末尾 -> 加密为 project.jsc
 *  UI  : com.hymod.ModMenu (原生 Android View, 打包在 APK 内)
 *  通信: jsb.reflection.callStaticMethod("com/hymod/ModBridge","setMenu","(Ljava/lang/String;)V",json)
 * ========================================================================= */
(function () {
  if (window.HYMOD && window.HYMOD.ver === "2.1.0") return;
  var M = window.HYMOD = { ver: "2.1.0", ready: false };

  /* ---------------- 基础工具 ---------------- */
  function log(s) {
    try { console.log("[HYMOD] " + s); } catch (e) {}
  }
  function T(msg) { try { HYCommon.toast(String(msg), 2); } catch (e) { log("toast fail " + e); } try { bridge("setStatus", "(Ljava/lang/String;)V", String(msg)); } catch (e) {} }
  function ok(fn, tag) { try { return fn(); } catch (e) { log((tag || "err") + ": " + e); return null; } }
  M.log = log; M.T = T; M.ok = ok;

  function bridge(method, sig, arg) {
    try {
      var r;
      if (arg === undefined) r = jsb.reflection.callStaticMethod("com/hymod/ModBridge", method, "()V");
      else r = jsb.reflection.callStaticMethod("com/hymod/ModBridge", method, sig, arg);
      return r;
    } catch (e) { log("bridge " + method + " 失败: " + e); return null; }
  }
  M.bridge = bridge;
  function jstr(o) { try { return JSON.stringify(o); } catch (e) { return null; } }

  /* ---------------- 配置 ---------------- */
  var cfg = {
    safeLog: true,        // 拦截 clientlog 作弊上报
    safeCheckItem: true,  // 拦截每日物品异常检查
    safeUpdate: false,    // 过滤 updatedata 中的可疑键(默认关, 影响太大)
    autoSave: true,       // 修改后自动存档
    noHotfix: true        // 拦截热更(防止我们的脚本被服务器覆盖)
  };
  ok(function () {
    var s = cc.sys.localStorage.getItem("hymod_cfg2");
    if (s) { var o = JSON.parse(s); for (var k in o) cfg[k] = o[k]; }
  }, "cfg");
  M.cfg = cfg;
  function saveCfg() { ok(function () { cc.sys.localStorage.setItem("hymod_cfg2", JSON.stringify(cfg)); }); }

  /* ---------------- 本地增益(不上传) ---------------- */
  var buff = {
    atkAdd: 0, defAdd: 0, dodgeAdd: 0, hitAdd: 0,
    moveMul: 1, atkSpdMul: 1, scoreMul: 1,
    lifeAdd: 0, lifeMul: 1, godMode: false, oneHit: false,
    loadAdd: 0, noCost: false, teleport: false
  };
  M.buff = buff;

  /* ---------------- 安全层 ---------------- */
  var hooksInstalled = false;
  function installSafeHooks() {
    if (hooksInstalled) return;
    hooksInstalled = true;

    if (dy && dy.http && dy.http.clientlog) {
      var rawLog = dy.http.clientlog;
      dy.http.clientlog = function () {
        if (cfg.safeLog) { log("clientlog 已拦截: " + ok(function () { return JSON.stringify([].slice.call(arguments)).substr(0, 200); })); return; }
        return rawLog.apply(this, arguments);
      };
      log("已挂钩 dy.http.clientlog");
    }
    if (window.HYCommon && HYCommon.checkItem) {
      var rawCheck = HYCommon.checkItem;
      HYCommon.checkItem = function () {
        if (cfg.safeCheckItem) { log("checkItem 已跳过"); return; }
        return rawCheck.apply(this, arguments);
      };
      log("已挂钩 HYCommon.checkItem");
    }
    if (dy && dy.http && dy.http.updateData) {
      var rawUp = dy.http.updateData;
      dy.http.updateData = function (cb, uid, data) {
        var d = data;
        if (cfg.safeUpdate) {
          d = ok(function () {
            var o = JSON.parse(data || "{}"), bad = /cheat|illegal/i, out = {}, n = 0;
            for (var k in o) { if (bad.test(k)) { n++; continue; } out[k] = o[k]; }
            if (n) log("updatedata 过滤掉 " + n + " 个可疑键");
            return JSON.stringify(out);
          }) || data;
        }
        return rawUp.call(this, function (err, res) {
          try {
            M.lastUpd = { code: res && res.errorCode, msg: res && res.errorMsg, time: Date.now() };
            if (res && res.errorCode && 0 !== res.errorCode) log("updatedata 返回 " + res.errorCode + " (" + res.errorMsg + ")");
          } catch (e) {}
          cb && cb(err, res);
        }, uid, d);
      };
      log("已挂钩 dy.http.updateData");
    }
    if (cfg.noHotfix && dy && dy.http && dy.http.checkUpdateInfo) {
      var rawChk = dy.http.checkUpdateInfo;
      dy.http.checkUpdateInfo = function (cb) {
        log("checkUpdateInfo 已拦截 -> 强制无更新");
        try { cb && cb(null, { errorCode: 0, errorMsg: "", data: { event: dy.update.EVENT_NO_UPDATE, ver: "" } }); }
        catch (e) { log("checkUpdateInfo cb " + e); return rawChk.apply(this, arguments); }
      };
      log("已挂钩 dy.http.checkUpdateInfo");
    }
  }
  M.installSafeHooks = installSafeHooks;
  /* ---------------- 物品 ---------------- */
  var SPECIAL = {
    "100000": "书页(科技点)", "100002": "求生精选", "100003": "天赋原石",
    "100004": "天赋结晶", "100005": "时之砂(广告币)", "100006": "神秘钥匙(机器人币)"
  };
  var TYPE_CN = { tool: "工具", food: "食物", prop: "材料", drug: "药品", spe: "特殊", inv: "杂物" };

  function itemIds() {
    var p = ok(function () { return dy.profile.getAll("Profiles/item_profile"); }) || {};
    var out = [];
    for (var k in p) if (/^\d+/.test(k) && p[k] && p[k].NAME) out.push(k);
    return out;
  }
  function lang() { return (dy.cache && dy.cache.language) || "cn"; }
  function itemName(id) {
    var p = ok(function () { return dy.profile.getById("Profiles/item_profile", id); });
    if (p && p.NAME) return p.NAME[lang()] || p.NAME.cn || id;
    return SPECIAL[id] || ("物品" + id);
  }
  M.itemName = itemName;

  function pickerItems() {
    var arr = [], ids = itemIds();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], p = dy.profile.getById("Profiles/item_profile", id);
      arr.push({ id: id, name: itemName(id), cat: TYPE_CN[p.TYPE] || p.TYPE || "" });
    }
    for (var k in SPECIAL) arr.push({ id: k, name: SPECIAL[k], cat: "货币" });
    return arr;
  }

  /** 发放物品: target = bag | warehouse */
  function giveItems(ids, count, target) {
    var map = {}, n = 0;
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i]);
      if (SPECIAL[id]) { giveSpecial(id, count); n++; continue; }
      map[id] = (map[id] || 0) + (+count || 0); n++;
    }
    if (n && Object.keys(map).length) {
      if (target === "warehouse") ok(function () { HYWarehouse.updateAttr(map); }, "wh");
      else ok(function () { HYBag.updateAttr(map); }, "bag");
      refreshBag();
    }
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("已发放 " + n + " 种物品 x" + count + (target === "warehouse" ? " 到仓库" : " 到背包"));
    log("giveItems " + JSON.stringify(ids).substr(0, 120) + " x" + count + " -> " + (target || "bag"));
  }
  M.giveItems = giveItems;

  function refreshBag() {
    ok(function () { dy.notify.post(dy.K_BAG_UPDATE); });
    ok(function () { dy.notify.post(dy.K_BAG_REFRESH); });
    ok(function () { dy.notify.post(dy.K_UPDATE_BAG); });
    ok(function () { dy.notify.post(dy.K_WAREHOUSE_UPDATE); });
  }
  M.refreshBag = refreshBag;

  function giveSpecial(id, num) {
    num = +num || 0;
    ok(function () {
      if ("100000" == id) HYData.add("base.technology.script.hasNum", num);
      else if ("100002" == id) HYData.add("base.technology.seniorScript.hasNum", num);
      else if ("100003" == id) HYData.add("base.technology.spiritCurrency", num);
      else if ("100004" == id) HYData.add("base.technology.powerCurrency", num);
      else if ("100005" == id) HYCommon.tryAddADCoin(num, dy.config.AD_TYPE.MAIL);
      else if ("100006" == id) HYCommon.tryAddRobotCoin(num, 0, "mail");
      else HYBag.updateAttr(id, num);
    }, "special" + id);
  }

  /** 一键全物品 -> 仓库 / 背包 */
  function allItems(count, target, safe) {
    var ids = itemIds(), map = {}, n = 0;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], v = +count;
      if (safe) { var mx = ok(function () { return dy.config.ITEM_CHECK_CONFIG[id].NUM; }); if (mx) v = Math.min(v, mx); }
      if (v <= 0) continue;
      map[id] = v; n++;
    }
    if (target === "warehouse") ok(function () { HYWarehouse.updateAttr(map); }, "wh");
    else ok(function () { HYBag.updateAttr(map); }, "bag");
    refreshBag();
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("一键全物品 -> " + (target === "warehouse" ? "仓库" : "背包") + ": " + n + " 种 x" + count);
    log("allItems " + n + " x" + count + " -> " + target + " safe=" + safe);
  }
  M.allItems = allItems;

  /** 清空背包(不含仓库) */
  function clearBag() {
    var b = ok(function () { return HYData.get("core.bag"); }) || {}, n = 0;
    for (var k in b) { ok(function () { HYData.clear("core.bag." + k); }); n++; }
    refreshBag();
    ok(function () { HYData.trySave(); });
    T("背包已清空 (" + n + " 格)");
  }
  M.clearBag = clearBag;

  /** 邮件式发奖: goods = "id:num;id:num" */
  function mailGrant(goods, coin) {
    var r = String(goods || "").split(";"), c = {}, n = 0, miss = [];
    for (var s = 0; s < r.length; s++) {
      if (!r[s]) continue;
      var l = r[s].split(":"), id = String(l[0]).trim(), num = +l[1] || 0;
      if (!id || !num) continue;
      if (SPECIAL[id]) { giveSpecial(id, num); n++; continue; }
      if (id.indexOf("core.") === 0 || id.indexOf("base.") === 0) {
        ok(function () { HYData.set(id, (HYData.get(id) || 0) + num); });
        n++; continue;
      }
      c[id] = (c[id] || 0) + num; n++;
      if (!ok(function () { return dy.profile.getById("Profiles/item_profile", id); })) miss.push(id);
    }
    ok(function () { HYBag.updateAttr(c); }, "mail grant");
    refreshBag();
    ok(function () {
      var back = [];
      for (var gid in c) back.push(gid + "=" + HYData.get("core.bag." + gid));
      log("mailGrant 写入后背包: " + back.join(" "));
    });
    if (coin && +coin > 0) { coinGrant(+coin); }
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("邮件式发奖: " + n + " 项" + (coin ? " + " + coin + "贝壳" : ""));
    log("mailGrant goods=" + goods + " coin=" + coin + " 未知ID=" + miss.join(","));
  }
  M.mailGrant = mailGrant;

  /** 贝壳 */
  function coinGrant(num) {
    num = +num || 0;
    ok(function () { HYCoin.update(num); }, "coin");
    ok(function () { dy.http.saveCoins(null, HYCoin.current() || 0); });
    T("贝壳 +" + num + " (当前 " + ok(function () { return HYCoin.current(); }) + ")");
  }
  M.coinGrant = coinGrant;
  /* ---------------- 战斗/属性 hook (纯本地, 不上传) ---------------- */
  var H = {};
  function installGameHooks() {
    if (H.done) return; H.done = true;

    var rawBF = HYPlayer.getBaseFight;
    HYPlayer.getBaseFight = function () {
      var o = rawBF.apply(this, arguments);
      try {
        if (o) {
          var mul = buff.godMode ? 100 : buff.lifeMul;
          if (mul && mul !== 1) o.life = Math.round((o.life || 0) * mul);
          if (buff.lifeAdd) o.life = (o.life || 0) + buff.lifeAdd;
          if (buff.defAdd) o.def = (o.def || 0) + buff.defAdd;
          if (buff.dodgeAdd) o.dodge = (o.dodge || 0) + buff.dodgeAdd;
          if (buff.atkAdd) o.atk = (o.atk || 0) + buff.atkAdd;
          if (buff.oneHit) o.atk = (o.atk || 0) + 999999;
        }
      } catch (e) { log("getBaseFight hook " + e); }
      return o;
    };

    var rawFB = HYPlayer.getFightBuff;
    HYPlayer.getFightBuff = function () {
      var o = rawFB.apply(this, arguments);
      try {
        if (o) {
          o.atk = (o.atk || 0) + buff.atkAdd + (buff.oneHit ? 999999 : 0);
          if (buff.hitAdd) { o.hitClose = (o.hitClose || 0) + buff.hitAdd; o.hitRemote = (o.hitRemote || 0) + buff.hitAdd; }
          if (buff.atkSpdMul && buff.atkSpdMul !== 1) o.atk_spd = (o.atk_spd || 0) + (buff.atkSpdMul - 1);
          if (buff.moveMul && buff.moveMul !== 1) o.move_spd = (o.move_spd || 0) + (buff.moveMul - 1);
        }
      } catch (e) { log("getFightBuff hook " + e); }
      return o;
    };

    var rawSpeed = HYPlayer.getMoveSpeed;
    HYPlayer.getMoveSpeed = function () {
      var v = rawSpeed.apply(this, arguments);
      try {
        var mul = buff.teleport ? 300 : buff.moveMul;
        if (mul && mul !== 1) v = v * mul;
      } catch (e) {}
      return v;
    };

    var rawDef = HYPlayer.getDef;
    HYPlayer.getDef = function () {
      var v = rawDef.apply(this, arguments);
      return buff.defAdd ? v + buff.defAdd : v;
    };
    var rawMiss = HYPlayer.getMiss;
    HYPlayer.getMiss = function () {
      var v = rawMiss.apply(this, arguments);
      return buff.dodgeAdd ? v + buff.dodgeAdd : v;
    };
    var rawLoad = HYPlayer.getMaxLoad;
    HYPlayer.getMaxLoad = function () {
      var v = rawLoad.apply(this, arguments);
      return buff.loadAdd ? v + buff.loadAdd : v;
    };

    var rawScore = HYCommon.calScore;
    HYCommon.calScore = function () {
      var v = rawScore.apply(this, arguments);
      if (buff.scoreMul && buff.scoreMul !== 1) { v = Math.floor(v * buff.scoreMul); log("结算得分 " + v); }
      return v;
    };

    /* 无限耐久: 拦截装备耐久消耗(负值直接吞掉) */
    if (window.HYEquip && HYEquip.updateDuration) {
      var rawUD = HYEquip.updateDuration;
      HYEquip.updateDuration = function (e, t) {
        try {
          if (buff.infDur) {
            if (e && typeof e === "object") {
              var keep = {}, cut = 0;
              for (var k in e) { if (e[k] < 0) cut++; else keep[k] = e[k]; }
              if (cut) log("耐久消耗已拦截(map x" + cut + ")");
              if (!Object.keys(keep).length) return;
              return rawUD.call(this, keep);
            }
            if (t < 0) { log("耐久消耗已拦截 " + e + " " + t); return; }
          }
        } catch (err) { log("updateDuration hook " + err); }
        return rawUD.apply(this, arguments);
      };
      log("已挂钩 HYEquip.updateDuration (无限耐久)");
    }
    log("战斗属性 hook 已安装 | getFightBuff版本=" + String(HYPlayer.getFightBuff).substr(0, 70).replace(/\s+/g, " "));
  }
  M.installGameHooks = installGameHooks;

  /* ---------------- 装备强化 ---------------- */
  var equip = { on: false, atkMul: 3, defMul: 3, disMul: 2, critAdd: 30 };
  M.equip = equip;
  function applyEquip(on, silent) {
    var prof = ok(function () { return dy.profile.mProfiles["Profiles/item_profile"]; });
    if (!prof) { T("找不到 item_profile"); return; }
    if (!M._eqBk) {
      M._eqBk = {};
      for (var k in prof) {
        var p = prof[k]; if (!p) continue;
        ["E_ATTRS", "E_ATTRS_1", "E_ATTRS_2"].forEach(function (key, idx) {
          var a = p[key]; if (!a || a.ATK === undefined) return;
          M._eqBk[k + (idx ? "_" + idx : "")] = { ATK: a.ATK, DEF: a.DEF, DIS: a.DIS, CRIT: a.CRIT, HIT: a.HIT };
        });
      }
      log("装备属性备份 " + Object.keys(M._eqBk).length + " 条");
    }
    var n = 0;
    for (var id in prof) {
      var pp = prof[id]; if (!pp) continue;
      ["E_ATTRS", "E_ATTRS_1", "E_ATTRS_2"].forEach(function (key, idx) {
        var a = pp[key]; if (!a || a.ATK === undefined) return;
        var bk = M._eqBk[id + (idx ? "_" + idx : "")]; if (!bk) return;
        if (on) {
          if (bk.ATK) a.ATK = Math.round(bk.ATK * equip.atkMul);
          if (bk.DEF !== undefined && a.DEF !== undefined) a.DEF = Math.round(bk.DEF * equip.defMul);
          if (bk.DIS !== undefined && a.DIS !== undefined) a.DIS = Math.round(bk.DIS * equip.disMul);
          if (bk.CRIT !== undefined && a.CRIT !== undefined) a.CRIT = (bk.CRIT || 0) + equip.critAdd;
          if (bk.HIT !== undefined && a.HIT !== undefined) a.HIT = Math.round(bk.HIT * equip.disMul);
        } else { a.ATK = bk.ATK; a.DEF = bk.DEF; a.DIS = bk.DIS; a.CRIT = bk.CRIT; a.HIT = bk.HIT; }
        n++;
      });
    }
    equip.on = !!on;
    if (!silent) T(on ? ("装备已强化 (" + n + " 条)") : "装备已还原");
    log("applyEquip " + on + " -> " + n);
  }
  M.applyEquip = applyEquip;

  /* ---------------- 皮肤 / 角色 ---------------- */
  var SKIN_NAMES = {
    "100001": "罗兰(默认)", "100002": "健康蜂厨", "100003": "新春厨神", "100004": "妙厨",
    "100101": "朱莉(默认)", "100102": "幽灵公主", "100103": "罗塔女巫", "100104": "冰雪女王", "100105": "吸血女爵",
    "100201": "老贝(默认)", "100202": "狂化战士", "100203": "赏金猎人", "100204": "荒岛学者",
    "100301": "小哥(默认)", "100302": "圣诞老哥", "100303": "绝味小哥", "100304": "苍龙祭祀", "100305": "驯鹿之魂",
    "100401": "基德(默认)", "100402": "基德皮肤2", "100403": "新月狼人", "100404": "彩蛋兔爷", "100405": "丛林战士"
  };
  var SKIN_IDS = [];
  function loadSkinList() {
    if (!dy || !dy.profile) return;
    var p = ok(function () { return dy.profile.getAll("Profiles/role_skin"); });
    if (!p) return;
    var out = [];
    for (var role in p) for (var sid in p[role]) out.push(sid);
    if (out.length) SKIN_IDS = out;
  }
  function unlockSkin(sid) {
    var role = String(Math.floor(parseInt(sid, 10) / 100));
    ok(function () { HYRoleSkin.addSkin(role, sid); }, "addSkin");
    ok(function () { HYData.set("base.roleSkin." + role + "." + sid, "1"); });
    log("解锁皮肤 " + sid + " (角色 " + role + ")");
  }
  function unlockAllSkins() {
    loadSkinList();
    if (!SKIN_IDS.length) { T("皮肤表未加载"); return; }
    for (var i = 0; i < SKIN_IDS.length; i++) unlockSkin(SKIN_IDS[i]);
    ok(function () { HYData.trySave(); });
    T("已解锁 " + SKIN_IDS.length + " 个皮肤");
  }
  M.unlockAllSkins = unlockAllSkins;
  function useSkin(sid) {
    var role = String(Math.floor(parseInt(sid, 10) / 100));
    unlockSkin(sid);
    ok(function () { HYRoleSkin.setCurSkin(sid); HYRoleSkin.setSkinState(sid); });
    ok(function () { HYData.trySave(); });
    T("已切换/解锁皮肤: " + (SKIN_NAMES[sid] || sid));
    log("useSkin " + sid + " role=" + role);
  }
  M.useSkin = useSkin;

  /* 角色解锁 (原人民币购买) */
  var ROLE_SHOP = { "1001": 2, "1002": 1, "1003": 3, "1004": 4 };   // roleId -> shopId
  var ROLE_NAMES = { "1000": "罗兰", "1001": "朱莉", "1002": "老贝", "1003": "小哥", "1004": "基德" };
  function unlockRole(roleId, byShop) {
    var shopId = ROLE_SHOP[roleId];
    ok(function () { HYData.set("base.unlock.role." + roleId, 1); });
    if (shopId) ok(function () { HYData.set("base.shop." + shopId, 1); });
    ok(function () { HYData.trySave(); });
    log("解锁角色 " + roleId + " shop=" + shopId);
    return true;
  }
  function unlockAllRoles() {
    var n = 0;
    for (var r in ROLE_SHOP) { unlockRole(r, true); n++; }
    T("已解锁 " + n + " 个付费角色");
  }
  M.unlockAllRoles = unlockAllRoles;
  function buyRoleWithCoin(roleId, price) {
    price = +price || 0;
    var cur = ok(function () { return HYCoin.current(); }) || 0;
    if (cur < price) { T("贝壳不足 (需 " + price + ", 有 " + cur + ")"); return; }
    if (price > 0) coinGrant(-price);
    unlockRole(roleId, true);
    T("已用 " + price + " 贝壳解锁 " + (ROLE_NAMES[roleId] || roleId));
  }
  M.buyRoleWithCoin = buyRoleWithCoin;

  /* ==================== 背包->仓库 / 全提升 / 战斗倍速 ==================== */

  /** 把背包里所有物品移动到仓库(真正的搬运) */
  function bagToWarehouse() {
    var b = ok(function () { return HYData.get("core.bag"); }) || {};
    var map = {}, n = 0, total = 0;
    for (var k in b) { var v = +b[k] || 0; if (v > 0) { map[k] = v; n++; total += v; } }
    if (!n) { T("背包是空的"); return; }
    ok(function () { HYWarehouse.updateAttr(map); }, "wh+");
    var neg = {};
    for (var k2 in map) neg[k2] = -map[k2];
    ok(function () { HYBag.updateAttr(neg); }, "bag-");
    refreshBag();
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("已把背包 " + n + " 种(" + total + " 件) 全部搬入仓库");
    log("bagToWarehouse " + n + " 种 " + total + " 件");
  }
  M.bagToWarehouse = bagToWarehouse;

  /* ---------------- 科技 / 皮肤强化 / 天赋 全满 (真实写入最高等级) ---------------- */

  /** 建筑/产品科技拉满: 每个 (productId, base) 组写入 "节点数" 级 = 游戏内最高级
   *  注意: 皮肤/角色科技走另一套编码(base.technology.skin.<pid>), 由 skinTechMax 处理 */
  function techProductMax(silent) {
    var t = ok(function () { return dy.profile.getAll("Profiles/technology"); });
    if (!t) { if (!silent) T("technology.json 未加载"); return 0; }
    var skinPids = {};
    var tr0 = ok(function () { return dy.profile.getAll("Profiles/tech_role"); }) || {};
    for (var r0 in tr0) { var tl0 = (tr0[r0] && tr0[r0].techList) || []; for (var j0 = 0; j0 < tl0.length; j0++) skinPids[~~tl0[j0]] = 1; }
    var cnt = {};
    for (var k in t) {
      var v = t[k];
      if (!v || v.id === undefined || v.productId === undefined) continue;
      if (skinPids[~~v.productId]) continue;
      var key = v.productId + "." + (10 * Math.floor(v.id / 10));
      cnt[key] = (cnt[key] || 0) + 1;
    }
    var n = 0;
    for (var kk in cnt) {
      if (~~(HYData.get("base.technology.product." + kk)) < cnt[kk]) { HYData.set("base.technology.product." + kk, cnt[kk]); n++; }
    }
    if (!silent) { ok(function () { HYData.trySave(); }); T("科技强化全满: " + n + " 项"); }
    log("techProductMax " + n + " / " + Object.keys(cnt).length);
    return n;
  }

  /** 皮肤角色科技树强化全满 (tech_role.json 里所有 techList) */
  function skinTechMax(silent) {
    var tr = ok(function () { return dy.profile.getAll("Profiles/tech_role"); });
    if (!tr) { if (!silent) T("tech_role.json 未加载"); return 0; }
    var pids = {};
    for (var role in tr) {
      var tl = (tr[role] && tr[role].techList) || [];
      for (var i = 0; i < tl.length; i++) pids[tl[i]] = 1;
    }
    var n = 0;
    for (var pid in pids) {
      var mx = ~~ok(function () { return HYTechnology.getSkinMaxLevel(pid); });
      if (mx > 0 && ~~(HYData.get("base.technology.skin." + pid)) < mx) { HYData.set("base.technology.skin." + pid, mx); n++; }
    }
    if (!silent) { ok(function () { HYData.trySave(); }); T("皮肤强化全满: " + n + " 项"); }
    log("skinTechMax " + n + " / " + Object.keys(pids).length);
    return n;
  }

  /** 天赋强化全满 (每个天赋 3 级, 游戏源码上限) */
  function talentMax(silent) {
    var tal = ok(function () { return dy.profile.getAll("Profiles/talent_profile"); });
    if (!tal) { if (!silent) T("talent_profile 未加载"); return 0; }
    var n = 0;
    for (var tid in tal) {
      if (~~(HYData.get("base.technology.talent." + tid)) < 3) { HYData.set("base.technology.talent." + tid, 3); n++; }
    }
    if (!silent) { ok(function () { HYData.trySave(); }); T("天赋强化全满: " + n + " 项"); }
    log("talentMax " + n);
    return n;
  }
  M.techProductMax = techProductMax; M.skinTechMax = skinTechMax; M.talentMax = talentMax;

  /** 一键解锁全提升: 科技 + 皮肤强化 + 天赋 + 全皮肤 + 全角色 */
  function allUpgrade() {
    var nT = techProductMax(true), nS = skinTechMax(true), nL = talentMax(true);
    var nSkin = 0, rs = ok(function () { return dy.profile.getAll("Profiles/role_skin"); }) || {};
    for (var role in rs) for (var sid in rs[role]) {
      if (!ok(function () { return HYRoleSkin.getSkin(role, sid); })) { ok(function () { HYRoleSkin.addSkin(role, sid); }); nSkin++; }
    }
    var nRole = 0;
    for (var r in ROLE_SHOP) { unlockRole(r, true); nRole++; }
    ok(function () { HYData.trySave(); });
    refreshBag();
    T("全提升: 科技" + nT + " 皮肤强化" + nS + " 天赋" + nL + " 皮肤" + nSkin + " 角色" + nRole);
    log("allUpgrade 科技" + nT + " 皮肤强化" + nS + " 天赋" + nL + " 皮肤" + nSkin + " 角色" + nRole);
  }
  M.allUpgrade = allUpgrade;

  /* ---------------- 战斗倍速 (游戏自带 base.fightSpeed, 战斗文字间隔 = 0.8/speed) ---------------- */
  function setFightSpeed(v) {
    v = Math.max(1, Math.min(3, +v || 1));
    ok(function () { HYData.set("base.fightSpeed", v); });
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    M.fightSpeed = v;
    T("战斗倍速 x" + v + " (下一场战斗生效)");
    log("setFightSpeed " + v);
  }
  M.setFightSpeed = setFightSpeed;

  /* ---------------- 启动时恢复滑块/开关状态 ---------------- */
  function applyState() {
    buff.lifeMul = Math.max(1, nv("lifeMul", 1));
    buff.atkAdd = Math.max(0, nv("atkAdd", 0));
    buff.atkSpdMul = Math.max(1, nv("atkSpdMul", 1));
    buff.moveMul = Math.max(1, nv("moveMul", 1));
    buff.defAdd = Math.max(0, nv("defAdd", 0));
    buff.dodgeAdd = Math.max(0, nv("dodgeAdd", 0));
    buff.hitAdd = Math.max(0, nv("hitAdd", 0));
    buff.loadAdd = Math.max(0, nv("loadAdd", 0));
    buff.scoreMul = Math.max(1, nv("scoreMul", 1));
    buff.godMode = sv("godMode", false);
    buff.oneHit = sv("oneHit", false);
    buff.teleport = sv("teleport", false);
    buff.infDur = sv("infDur", false);
    equip.atkMul = Math.max(1, nv("eq_atk", 3));
    equip.defMul = Math.max(1, nv("eq_def", 3));
    equip.disMul = Math.max(1, nv("eq_dis", 2));
    equip.critAdd = Math.max(0, nv("eq_crit", 30));
    cfg.safeLog = sv("safeLog", cfg.safeLog);
    cfg.safeCheckItem = sv("safeCheckItem", cfg.safeCheckItem);
    cfg.safeUpdate = sv("safeUpdate", cfg.safeUpdate);
    cfg.noHotfix = sv("noHotfix", cfg.noHotfix);
    cfg.autoSave = sv("autoSave", cfg.autoSave);
    saveCfg();
    var fs2 = Math.max(1, Math.min(3, nv("fightSpeed", 1)));
    M.fightSpeed = fs2;
    if (fs2 !== 1) ok(function () { HYData.set("base.fightSpeed", fs2); });
    if (sv("equip_on", false)) {
      var tries = 0;
      var tryEq = function () {
        if (equip.on) return;
        applyEquip(true, true);
        if (!equip.on && ++tries < 20) setTimeout(tryEq, 1500);
      };
      setTimeout(tryEq, 800);
    }
    log("状态已恢复: lifeMul=" + buff.lifeMul + " atkAdd=" + buff.atkAdd + " atkSpd=" + buff.atkSpdMul + " moveMul=" + buff.moveMul + " infDur=" + buff.infDur + " fightSpeed=" + fs2 + " equipOn=" + sv("equip_on", false));
  }
  M.applyState = applyState;

  /* ---------------- 其它 ---------------- */
  function clearCooldowns() {
    var n = 0;
    var scan = function (obj, prefix) {
      for (var k in obj) {
        var v = obj[k];
        if (typeof v === "number" && v === 86400000) { HYData.set(prefix + k, 1); n++; }
        else if (v && typeof v === "object" && prefix.split(".").length < 4) scan(v, prefix + k + ".");
      }
    };
    scan(HYData.get("base") || {}, "base.");
    scan(HYData.get("core") || {}, "core.");
    ok(function () { HYData.trySave(); });
    T("已清零 " + n + " 处冷却");
  }
  M.clearCooldowns = clearCooldowns;

  function clearCheatFlags() {
    var keys = ["base.cheatAchievement", "base.achieve_fake_profile", "base.cheatBuildProducts",
      "base.cheatGoOutMax", "base.cheatSelectGift", "base.cheatBuildProduct",
      "base.coin.adCoin.illegal", "base.cheatMail", "base.cheatQueryMail", "base.cheatMailMd5",
      "base.cheatAllMailMd5", "base.cheatAdCoinNum", "base.cheatAdCoinCount", "base.cheatHYDataUpdate",
      "base.cheatProduct", "base.cheatItem"];
    var n = 0;
    keys.forEach(function (k) { if (ok(function () { return HYData.get(k); })) { HYData.set(k, 0); n++; log("清除 " + k); } });
    ok(function () { HYData.trySave(); });
    T("已清除 " + n + " 个标记");
  }
  M.clearCheatFlags = clearCheatFlags;
  /* ---------------- 菜单结构 ---------------- */
  function num(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }

  /* ---------------- 控件状态记忆 (localStorage) ---------------- */
  if (!M.vals) M.vals = {};
  ok(function () {
    var s = cc.sys.localStorage.getItem("hymod_vals2");
    if (s) { var o = JSON.parse(s); if (o) for (var k in o) M.vals[k] = o[k]; }
  }, "vals");
  function saveVals() { ok(function () { cc.sys.localStorage.setItem("hymod_vals2", JSON.stringify(M.vals)); }); }
  /** 取持久化原始值(滑块 / 输入框) */
  function pv(id, def) { var v = M.vals[id]; return (v === undefined || v === null || v === "") ? def : v; }
  /** 取持久化开关值(布尔) */
  function sv(id, def) {
    var v = M.vals[id];
    if (v === undefined || v === null || v === "") return def;
    return (v === "1" || v === 1 || v === true || v === "true");
  }
  function nv(id, def) { return num(pv(id, def), def); }
  M.pv = pv; M.sv = sv; M.nv = nv; M.saveVals = saveVals;

  function buildMenu() {
    var tabs = [];
    /* 1. 物品 */
    tabs.push({ title: "物品", items: [
      { type: "picker", id: "open_picker", title: "物品发放选择器", desc: "带图标/搜索/多选, 可选发到背包或仓库" },
      { type: "button", id: "bag_to_wh", title: "背包 → 仓库 (全部搬入)", desc: "把背包现有的东西整批挪进仓库, 背包清空" },
      { type: "input", id: "all_cnt", title: "补发数量(按每件安全上限)", val: String(nv("all_cnt", 99)) },
      { type: "button", id: "all_wh", title: "给仓库补发全物品", desc: "凭空补发(不是搬运), 数量按各物品安全上限" },
      { type: "button", id: "clear_bag", title: "清空背包", desc: "只清 core.bag, 仓库不动" },
      { type: "text", title: "— 货币 —" },
      { type: "button", id: "coin_add", title: "贝壳 +88888" },
      { type: "button", id: "sp_100000", title: "书页(科技) +9999" },
      { type: "button", id: "sp_100002", title: "求生精选 +999" },
      { type: "button", id: "sp_100003", title: "天赋原石 +9999" },
      { type: "button", id: "sp_100004", title: "天赋结晶 +9999" },
      { type: "button", id: "sp_100005", title: "时之砂(广告币) +999" },
      { type: "button", id: "sp_100006", title: "神秘钥匙(机器人币) +88888" },
      { type: "text", title: "— 邮件式发奖(本地模拟领取) —" },
      { type: "input", id: "goods", title: "goods 串 (id:数量;id:数量)", val: pv("goods", "4438:8") },
      { type: "input", id: "mail_coin", title: "附带贝壳", val: String(nv("mail_coin", 0)) },
      { type: "button", id: "mail_grant", title: "执行邮件式发奖" }
    ]});
    /* 2. 属性 */
    tabs.push({ title: "属性", items: [
      { type: "input", id: "life_set", title: "血量(写入存档)", val: String(nv("life_set", 999)) },
      { type: "button", id: "life_apply", title: "应用血量上限/当前血量" },
      { type: "slider", id: "lifeMul", title: "战斗生命倍率(本地)", min: 1, max: 50, val: nv("lifeMul", 1) },
      { type: "slider", id: "atkAdd", title: "额外攻击力(本地)", min: 0, max: 1000, val: nv("atkAdd", 0) },
      { type: "slider", id: "atkSpdMul", title: "攻速倍率(本地)", min: 1, max: 50, val: nv("atkSpdMul", 1) },
      { type: "slider", id: "moveMul", title: "移速倍率(本地)", min: 1, max: 50, val: nv("moveMul", 1) },
      { type: "slider", id: "defAdd", title: "额外防御(本地)", min: 0, max: 1000, val: nv("defAdd", 0) },
      { type: "slider", id: "dodgeAdd", title: "额外闪避(本地)", min: 0, max: 100, val: nv("dodgeAdd", 0) },
      { type: "slider", id: "hitAdd", title: "额外命中(本地)", min: 0, max: 100, val: nv("hitAdd", 0) },
      { type: "input", id: "loadAdd", title: "额外负重(本地, 可手输任意值)", val: String(nv("loadAdd", 0)) },
      { type: "input", id: "scoreMul", title: "结算得分倍率(可手输任意值)", val: String(nv("scoreMul", 1)) },
      { type: "slider", id: "fightSpeed", title: "战斗倍速(1-3)", min: 1, max: 3, val: nv("fightSpeed", 1) },
      { type: "switch", id: "godMode", title: "无敌(生命x100)", val: sv("godMode", false) },
      { type: "switch", id: "oneHit", title: "一击必杀", val: sv("oneHit", false) },
      { type: "switch", id: "teleport", title: "瞬移(移动速度x300)", val: sv("teleport", false) }
    ]});
    /* 3. 装备强化 */
    tabs.push({ title: "装备", items: [
      { type: "switch", id: "equip_on", title: "武器/防具强化", val: sv("equip_on", false) },
      { type: "switch", id: "infDur", title: "所有装备无限耐久", val: sv("infDur", false) },
      { type: "slider", id: "eq_atk", title: "攻击倍率", min: 1, max: 20, val: nv("eq_atk", 3) },
      { type: "slider", id: "eq_def", title: "防御倍率", min: 1, max: 20, val: nv("eq_def", 3) },
      { type: "slider", id: "eq_dis", title: "触及距离/命中倍率", min: 1, max: 10, val: nv("eq_dis", 2) },
      { type: "slider", id: "eq_crit", title: "暴击加成", min: 0, max: 100, val: nv("eq_crit", 30) },
      { type: "text", title: "开关后即时生效(内存中改 item_profile)" }
    ]});
    /* 4. 皮肤/角色 */
    var skinItems = [
      { type: "button", id: "upgrade_all", title: "一键解锁全提升", desc: "科技/皮肤强化/天赋真实拉满 + 全皮肤 + 全角色" },
      { type: "button", id: "skin_all", title: "一键解锁全部皮肤" }
    ];
    var groups = [["1000", "罗兰/厨子", ["100001", "100002", "100003", "100004"]],
                  ["1001", "朱莉", ["100101", "100102", "100103", "100104", "100105"]],
                  ["1002", "老贝", ["100201", "100202", "100203", "100204"]],
                  ["1003", "小哥", ["100301", "100302", "100303", "100304", "100305"]],
                  ["1004", "基德", ["100401", "100402", "100403", "100404", "100405"]]];
    for (var g = 0; g < groups.length; g++) {
      skinItems.push({ type: "text", title: "— " + groups[g][1] + " —" });
      for (var s = 0; s < groups[g][2].length; s++) {
        var sid = groups[g][2][s];
        skinItems.push({ type: "button", id: "skin_" + sid, title: "解锁并切换: " + (SKIN_NAMES[sid] || sid) });
      }
    }
    skinItems.push({ type: "text", title: "— 付费角色 (贝壳解锁) —" });
    skinItems.push({ type: "input", id: "role_price", title: "每个角色所需贝壳", val: String(nv("role_price", 2800)) });
    skinItems.push({ type: "button", id: "role_all", title: "一键解锁全部付费角色" });
    skinItems.push({ type: "button", id: "role_1001", title: "解锁 朱莉" });
    skinItems.push({ type: "button", id: "role_1002", title: "解锁 老贝" });
    skinItems.push({ type: "button", id: "role_1003", title: "解锁 小哥" });
    skinItems.push({ type: "button", id: "role_1004", title: "解锁 基德" });
    tabs.push({ title: "皮肤角色", items: skinItems });
    /* 5. 安全 */
    tabs.push({ title: "安全", items: [
      { type: "switch", id: "safeLog", title: "拦截作弊上报 clientlog", val: sv("safeLog", cfg.safeLog) },
      { type: "switch", id: "safeCheckItem", title: "跳过每日物品异常检查", val: sv("safeCheckItem", cfg.safeCheckItem) },
      { type: "switch", id: "safeUpdate", title: "过滤 updatedata 可疑键", val: sv("safeUpdate", cfg.safeUpdate) },
      { type: "switch", id: "noHotfix", title: "拦截热更(防脚本被覆盖)", val: sv("noHotfix", cfg.noHotfix) },
      { type: "switch", id: "autoSave", title: "修改后自动存档", val: sv("autoSave", cfg.autoSave) },
      { type: "button", id: "clear_flags", title: "清除作弊标记" },
      { type: "button", id: "clear_cd", title: "清零 86400000 冷却" }
    ]});
    /* 6. 关于 */
    tabs.push({ title: "关于", items: [
      { type: "text", title: "荒野日记:孤岛 MOD v2.1 (原生菜单)" },
      { type: "text", title: "菜单: 拖动悬浮球移动, 点击打开/关闭" },
      { type: "text", title: "滑块/开关会自动记忆; 纯本地修改项不会上传服务器" }
    ]});
    return { title: "荒野日记 MOD", tabs: tabs };
  }

  function pushMenu() {
    var m = jstr(buildMenu());
    if (!m) { log("菜单序列化失败"); return; }
    bridge("setMenu", "(Ljava/lang/String;)V", m);
    log("菜单已下发 (" + m.length + " 字节)");
  }
  M.pushMenu = pushMenu;
  /* ---------------- 消息分发 ---------------- */
  function V(id) { return M.vals[id]; }
  function dispatch(id, val) {
    log("ON " + id + " = " + val);
    if (id === "open_picker") {
      var items = ok(function () { return pickerItems(); }) || [];
      bridge("openItemPicker", "(Ljava/lang/String;)V", jstr({
        title: "物品发放", count: String(pv("all_cnt", "99")), action: "grant", items: items
      }));
      return;
    }
    if (id === "bag_to_wh") { bagToWarehouse(); return; }
    if (id === "all_wh") { allItems(num(V("all_cnt"), 99), "warehouse", true); return; }
    if (id === "clear_bag") { clearBag(); return; }
    if (id === "coin_add") { coinGrant(88888); return; }
    if (id === "mail_grant") { mailGrant(V("goods"), num(V("mail_coin"), 0)); return; }
    if (id === "life_apply") {
      var hp = num(V("life_set"), 999);
      ok(function () { HYData.set("core.role.7002", hp); HYData.set("core.role.7003", hp); });
      ok(function () { HYData.trySave(); });
      T("血量已写入 " + hp); return;
    }
    if (id === "clear_flags") { clearCheatFlags(); return; }
    if (id === "clear_cd") { clearCooldowns(); return; }
    if (id === "upgrade_all") { allUpgrade(); return; }
    if (id === "skin_all") { unlockAllSkins(); return; }
    if (id === "role_all") { unlockAllRoles(); return; }
    if (id.indexOf("skin_") === 0) { useSkin(id.substring(5)); return; }
    if (id.indexOf("role_") === 0) { buyRoleWithCoin(id.substring(5), num(V("role_price"), 2800)); return; }
    if (id.indexOf("sp_") === 0) { giveSpecial(id.substring(3), 9999); return; }

    /* 开关 */
    if (id === "godMode" || id === "oneHit" || id === "teleport") { buff[id] = (val === "1" || val === true); T(id + " = " + buff[id]); return; }
    if (id === "infDur") { buff.infDur = (val === "1" || val === true); T("无限耐久 " + (buff.infDur ? "已开启" : "已关闭")); return; }
    if (id === "equip_on") { applyEquip(val === "1" || val === true); return; }
    if (id === "safeLog" || id === "safeCheckItem" || id === "safeUpdate" || id === "noHotfix" || id === "autoSave") {
      cfg[id] = (val === "1" || val === true); saveCfg(); T(id + " = " + cfg[id]); return;
    }
    /* 纯文本输入框: 只登记值, 使用时再读取 */
    if (id === "goods" || id === "mail_coin" || id === "all_cnt" || id === "life_set" || id === "role_price") { log("输入 " + id + " = " + val); return; }
    /* 滑块 / 输入框 */
    var n = num(val, 0);
    if (id === "fightSpeed") { setFightSpeed(n); return; }
    if (id === "lifeMul") { buff.lifeMul = Math.max(1, n); T("生命倍率 x" + buff.lifeMul); return; }
    if (id === "atkAdd") { buff.atkAdd = n; T("额外攻击 +" + n); return; }
    if (id === "atkSpdMul") { buff.atkSpdMul = Math.max(1, n); T("攻速倍率 x" + buff.atkSpdMul); return; }
    if (id === "moveMul") { buff.moveMul = Math.max(1, n); T("移速倍率 x" + buff.moveMul); return; }
    if (id === "defAdd") { buff.defAdd = n; T("额外防御 +" + n); return; }
    if (id === "dodgeAdd") { buff.dodgeAdd = n; T("额外闪避 +" + n); return; }
    if (id === "hitAdd") { buff.hitAdd = n; T("额外命中 +" + n); return; }
    if (id === "loadAdd") { buff.loadAdd = Math.max(0, n); T("额外负重 +" + buff.loadAdd); return; }
    if (id === "scoreMul") { buff.scoreMul = Math.max(1, n); T("得分倍率 x" + buff.scoreMul); return; }
    if (id === "eq_atk") { equip.atkMul = Math.max(1, n); if (equip.on) applyEquip(true, true); return; }
    if (id === "eq_def") { equip.defMul = Math.max(1, n); if (equip.on) applyEquip(true, true); return; }
    if (id === "eq_dis") { equip.disMul = Math.max(1, n); if (equip.on) applyEquip(true, true); return; }
    if (id === "eq_crit") { equip.critAdd = n; if (equip.on) applyEquip(true, true); return; }
    log("未处理的按钮 " + id);
  }

  window.HYMOD_ON = function (id, val) {
    try { M.vals[id] = val; saveVals(); dispatch(String(id), val); }
    catch (e) { log("HYMOD_ON " + id + " 出错: " + e); T("执行出错: " + e); }
  };

  window.HYMOD_PICK = function (json) {
    try {
      var o = JSON.parse(json);
      var ids = o.ids || [], cnt = num(o.count, 99), target = o.target || "bag";
      if (!ids.length) { T("未选中物品"); return; }
      giveItems(ids, cnt, target);
    } catch (e) { log("HYMOD_PICK 出错: " + e); T("发放出错: " + e); }
  };

  window.HYMOD_UI_READY = function () {
    log("UI_READY -> 重新下发菜单");
    setTimeout(pushMenu, 60);
  };

  /* ---------------- 启动 ---------------- */
  function boot() {
    if (!window.dy || !window.HYData || !window.cc || !dy.theRoot ||
        !window.HYBag || !window.HYPlayer || !window.HYCommon || !window.HYCoin) {
      setTimeout(boot, 500); return;
    }
    installSafeHooks();
    installGameHooks();
    loadSkinList();
    applyState();
    setTimeout(function () { loadSkinList(); log("皮肤表二次加载: " + SKIN_IDS.length + " 个"); }, 6000);
    M.ready = true;
    log("MOD v" + M.ver + " 已加载 (原生菜单)");
    setTimeout(function () { pushMenu(); }, 400);
  }
  M.boot = boot;
  setTimeout(boot, 800);
})();
