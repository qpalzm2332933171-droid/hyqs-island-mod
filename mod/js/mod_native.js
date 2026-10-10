/* =========================================================================
 *  荒野日记: 孤岛  ——  内置 MOD v2 (原生菜单版)
 *  载体: 追加在 project.dec.js 末尾 -> 加密为 project.jsc
 *  UI  : com.hymod.ModMenu (原生 Android View, 打包在 APK 内)
 *  通信: jsb.reflection.callStaticMethod("com/hymod/ModBridge","setMenu","(Ljava/lang/String;)V",json)
 * ========================================================================= */
(function () {
  if (window.HYMOD && window.HYMOD.ver === "3.2.0") return;
  var M = window.HYMOD = { ver: "3.2.0", ready: false };

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
    var s = persistOn() ? cc.sys.localStorage.getItem("hymod_cfg2") : null;
    if (s) { var o = JSON.parse(s); for (var k in o) cfg[k] = o[k]; }
  }, "cfg");
  M.cfg = cfg;
  /* ---------------- 首选项持久化开关 (需求12) ---------------- */
  function persistOn() { try { return cc.sys.localStorage.getItem("hymod_persist") === "1"; } catch (e) { return false; } }
  M.persist = persistOn();
  function setPersist(on) {
    M.persist = !!on;
    ok(function () {
      cc.sys.localStorage.setItem("hymod_persist", on ? "1" : "0");
      if (!on) { cc.sys.localStorage.removeItem("hymod_vals2"); cc.sys.localStorage.removeItem("hymod_cfg2"); }
    }, "persist");
    if (on) ok(function () {
      cc.sys.localStorage.setItem("hymod_vals2", JSON.stringify(M.vals));
      cc.sys.localStorage.setItem("hymod_cfg2", JSON.stringify(cfg));
    }, "persistSave");
    log("保存功能首选项 = " + M.persist);
  }
  M.persistOn = persistOn; M.setPersist = setPersist;
  function saveCfg() { if (!M.persist) return; ok(function () { cc.sys.localStorage.setItem("hymod_cfg2", JSON.stringify(cfg)); }); }

  /* ---------------- 本地增益(不上传) ---------------- */
  var buff = {
    atkAdd: 0, defAdd: 0, dodgeAdd: 0, hitAdd: 0,
    moveMul: 1, atkSpdMul: 1, scoreMul: 1,
    lifeAdd: 0, lifeMul: 1, godMode: false, oneHit: false,
    loadAdd: 0, noCost: false, teleport: false,
    freePay: false,        // 需求1: 内购点击即支付成功
    lockBuildDur: false,   // 需求11: 锁定建筑耐久
    limitedDungeon: false  // 需求5: 开启全部限时副本
  };
  M.buff = buff;
  M.locked = {};           // 需求2: 锁定的角色状态 {7004:值,...}
  M.eagle = { bloodMax: 0, friendMax: 0 };   // 需求9: 金雕活力/羁绊上限

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
    installNoBanHooks();
  }
  M.installSafeHooks = installSafeHooks;

  /* ---------------- 需求7: 去除所有本地封号校验(4015 系列) ---------------- */
  var noBan = {};
  function noBanAllDone() {
    return noBan.invalid && noBan.seal && noBan.alert && noBan.logerr && noBan.scenemain;
  }
  function installNoBanHooks() {
    if (noBanAllDone()) return;
    try {
      /* 1) dy.cache.invalid 拦截(登录响应里的封号标记) */
      if (dy && dy.cache && !noBan.invalid) {
        try {
          Object.defineProperty(dy.cache, "invalid", {
            get: function () { return 0; },
            set: function (v) { log("已拦截 dy.cache.invalid = " + v); },
            configurable: true
          });
          noBan.invalid = 1;
          log("dy.cache.invalid 已拦截");
        } catch (e) { noBan.invalid = 1; log("invalid 拦截失败 " + e); }
      }
      /* 2) HYCommon.sealTip 置空(封号标记+清号) */
      if (window.HYCommon && HYCommon.sealTip && !noBan.seal) {
        noBan.seal = 1;
        HYCommon.sealTip = function (e, t) { log("已拦截 sealTip(" + e + ", " + t + ")"); };
        log("HYCommon.sealTip 已置空");
      }
      /* 3) HYCommon.alert 过滤 4015 系列弹窗 */
      if (window.HYCommon && HYCommon.alert && !noBan.alert) {
        var rawAlert = HYCommon.alert, t15 = "";
        ok(function () { t15 = dy.error_profile["4015"].TITLE; });
        HYCommon.alert = function (title) {
          try {
            var s = String(title || "");
            if ((t15 && s.indexOf(t15) === 0) || s.indexOf("4015") >= 0) { log("已拦截封号弹窗: " + s); return; }
          } catch (e) {}
          return rawAlert.apply(this, arguments);
        };
        noBan.alert = 1;
        log("HYCommon.alert 4015 过滤已安装 (title=" + t15 + ")");
      }
      /* 4) dy.http.logError 不上报 4015 系列 */
      if (dy && dy.http && dy.http.logError && !noBan.logerr) {
        var rawLogErr = dy.http.logError;
        dy.http.logError = function (code) {
          try { if (/4015/.test(String(code))) { log("已拦截 logError(" + code + ")"); return; } } catch (e) {}
          return rawLogErr.apply(this, arguments);
        };
        noBan.logerr = 1;
      }
      /* 5) SceneMain 本地校验方法覆写(_checkMainJs / _checkIsCheated) */
      if (!noBan.scenemain) {
        var cls = null;
        try { cls = cc.js && cc.js.getClassByName && cc.js.getClassByName("SceneMain"); } catch (e) {}
        if (cls && cls.prototype) {
          cls.prototype._checkMainJs = function () { log("本地 main.js 校验已移除"); };
          cls.prototype._checkIsCheated = function () { log("本地作弊检测已移除"); };
          noBan.scenemain = 1;
          log("SceneMain 封号校验方法已覆写");
        }
      }
    } catch (e) { log("installNoBanHooks " + e); }
  }
  M.installNoBanHooks = installNoBanHooks;
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
    installPayHooks();
    installBuildDurHook();
    installAttrLockHook();
    installLimitedHooks();
    log("战斗属性 hook 已安装 | getFightBuff版本=" + String(HYPlayer.getFightBuff).substr(0, 70).replace(/\s+/g, " "));
  }
  M.installGameHooks = installGameHooks;

  /* ---------------- 需求1: 内购直接成功 ---------------- */
  function installPayHooks() {
    if (H.pay) return; H.pay = true;
    if (dy && dy.http && dy.http.tryPay) {
      var rawTryPay = dy.http.tryPay;
      dy.http.tryPay = function (cb, ware) {
        if (buff.freePay) {
          log("内购模拟成功: " + (ware && ware.ID));
          try { cb && cb({ event: dy.iap.EVENT_PAY_SUCC, param: ware }); } catch (e) { log("pay cb " + e); }
          return;
        }
        return rawTryPay.apply(this, arguments);
      };
      log("已挂钩 dy.http.tryPay (内购直接成功)");
    }
    if (window.HYCommon && HYCommon.tryCostADCoin) {
      var rawAD = HYCommon.tryCostADCoin;
      HYCommon.tryCostADCoin = function (cb, ware) {
        if (buff.freePay) {
          log("广告币内购模拟成功: " + (ware && ware.ID));
          try { cb && cb({ event: dy.iap.EVENT_PAY_SUCC, param: ware, ad: 1 }); } catch (e) {}
          return;
        }
        return rawAD.apply(this, arguments);
      };
    }
  }

  /* ---------------- 需求11: 建筑耐久锁定 ---------------- */
  function installBuildDurHook() {
    if (H.buildDur) return; H.buildDur = true;
    if (window.HYBuild && HYBuild.updateDuration) {
      var rawBUD = HYBuild.updateDuration;
      HYBuild.updateDuration = function (e, t) {
        try {
          if (buff.lockBuildDur) {
            if (e && typeof e === "object") {
              var keep = {}, cut = 0;
              for (var k in e) { if (e[k] < 0) cut++; else keep[k] = e[k]; }
              if (cut) log("建筑耐久消耗已拦截(map x" + cut + ")");
              if (!Object.keys(keep).length) return;
              return rawBUD.call(this, keep);
            }
            if (t < 0) { log("建筑耐久消耗已拦截"); return; }
          }
        } catch (err) {}
        return rawBUD.apply(this, arguments);
      };
      log("已挂钩 HYBuild.updateDuration (建筑耐久锁)");
    }
  }

  /* ---------------- 需求2: 角色状态锁定 ---------------- */
  var ATTR_MAXKEY = { "7004": "7046", "7005": "7047", "7006": "7048", "7000": "7044", "7001": "7045" };
  var ATTR_NAMES = { "7004": "外伤", "7005": "内伤", "7006": "饥饿", "7000": "精神", "7001": "失眠" };
  function lockAttrCurrent(id) {
    var v = ~~ok(function () { return HYData.get("core.role." + id); });
    M.locked[id] = v;
    T("已锁定" + ATTR_NAMES[id] + " = " + v);
    log("锁定状态 " + id + " = " + v);
    return v;
  }
  function restoreLockedAttrs() {
    for (var id in ATTR_MAXKEY) {
      var lv = M.locked[id];
      if (lv === undefined || lv === null) continue;
      if (~~HYData.get("core.role." + id) !== ~~lv) {
        HYData.set("core.role." + id, lv);
        (function (i2, v2) { ok(function () { dy.notify.post(dy.K_UPDATE_STATE, { ID: i2, CUR: v2, MAX: HYData.get("core.role." + ATTR_MAXKEY[i2]) }); }); })(id, lv);
      }
    }
  }
  function installAttrLockHook() {
    if (H.attrLock) return; H.attrLock = true;
    if (window.HYPlayer && HYPlayer._correctRoleState) {
      var rawCRS = HYPlayer._correctRoleState;
      HYPlayer._correctRoleState = function (e) {
        var r = rawCRS.apply(this, arguments);
        try { restoreLockedAttrs(); } catch (err) { log("locked restore " + err); }
        return r;
      };
      log("已挂钩 HYPlayer._correctRoleState (状态锁定)");
    }
  }
  function setRoleAttr(id, v) {
    v = parseInt(v, 10);
    if (isNaN(v)) { T("数值无效"); return; }
    HYData.set("core.role." + id, v);
    ok(function () { dy.notify.post(dy.K_UPDATE_STATE, { ID: id, CUR: v, MAX: HYData.get("core.role." + ATTR_MAXKEY[id]) }); });
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T(ATTR_NAMES[id] + " 已改为 " + v);
  }
  function setRoleAttrMax(id, v) {
    var mk = ATTR_MAXKEY[id];
    if (!mk) return;
    v = parseInt(v, 10);
    if (isNaN(v)) { T("数值无效"); return; }
    HYData.set("core.role." + mk, v);
    ok(function () { dy.notify.post(dy.K_UPDATE_STATE, { ID: id, CUR: HYData.get("core.role." + id), MAX: v }); });
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T(ATTR_NAMES[id] + "上限 已改为 " + v);
  }

  /* ---------------- 需求5: 限时副本 ---------------- */
  var LIMITED_POTS = { "4003": 1, "4004": 1, "4005": 1, "4006": 1 };
  var LIMITED_ITEMS = ["4423", "4444", "4449", "4450"];
  var POT_SPREAD = {
    "4003": { x: 258, y: -460 },
    "4004": { x: 302, y: -505 },
    "4005": { x: 196, y: -460 },
    "4006": { x: 258, y: -528 }
  };
  function hookPotPanelClass() {
    if (H.potPanel) return true;
    var cls = null;
    try { cls = cc.js && cc.js.getClassByName && cc.js.getClassByName("PanelAreaPot"); } catch (e) {}
    if (!cls || !cls.prototype || !cls.prototype.init) return false;
    var rawInit = cls.prototype.init;
    cls.prototype.init = function (delegate, potId) {
      rawInit.apply(this, arguments);
      try {
        if (buff.limitedDungeon && POT_SPREAD[String(potId)] && this.node) {
          var p = POT_SPREAD[String(potId)];
          this.node.setPosition(p.x, p.y);
        }
      } catch (e) {}
    };
    H.potPanel = 1;
    log("PanelAreaPot.init 已挂钩(限时副本坐标分散)");
    return true;
  }
  function installLimitedHooks() {
    if (H.limited) return; H.limited = true;
    if (window.HYWorld && HYWorld.isPotShow) {
      var rawShow = HYWorld.isPotShow;
      HYWorld.isPotShow = function (id) {
        if (buff.limitedDungeon && LIMITED_POTS[id]) {
          try {
            var prof = this.fetchPotProfile(id);
            if (!prof) return false;
            var code = prof.MAP_CODE || 0;
            if (MapManager.getInstance().getCurrentMapCode() != code) return false;
            return true;
          } catch (e) { return true; }
        }
        return rawShow.apply(this, arguments);
      };
      log("已挂钩 HYWorld.isPotShow (限时副本)");
    }
    if (window.HYWorld && HYWorld._checkUnlock) {
      var rawUnlock = HYWorld._checkUnlock;
      HYWorld._checkUnlock = function (id) {
        if (buff.limitedDungeon && LIMITED_POTS[id]) return true;
        return rawUnlock.apply(this, arguments);
      };
    }
    hookPotPanelClass();
  }
  function spreadLimitedPots() {
    var scene = ok(function () { return cc.director.getScene(); });
    if (!scene) return 0;
    var n = 0, stack = [scene];
    while (stack.length) {
      var nd = stack.pop();
      try {
        var ch = nd._children;
        if (ch) for (var i = 0; i < ch.length; i++) stack.push(ch[i]);
        var comps = nd._components;
        if (comps) for (var j = 0; j < comps.length; j++) {
          var c = comps[j];
          if (c && c.mAreaPot && POT_SPREAD[String(c.mAreaPot)]) {
            var p = POT_SPREAD[String(c.mAreaPot)];
            nd.setPosition(p.x, p.y);
            n++;
          }
        }
      } catch (e) {}
    }
    return n;
  }
  function setLimitedDungeons(on, silent) {
    buff.limitedDungeon = !!on;
    var ids = ["4003", "4004", "4005", "4006"];
    for (var i = 0; i < ids.length; i++) {
      (function (id) {
        ok(function () {
          var d = HYWorld.fetchPotData(id);
          if (!d) return;
          d.SHOW = on ? 1 : 0;
          HYWorld.updatePotData(id, d);
        }, "limited " + id);
      })(ids[i]);
    }
    if (on) {
      var need = 0;
      if (!silent) {
        var give = {};
        for (var k = 0; k < LIMITED_ITEMS.length; k++) {
          var liid = LIMITED_ITEMS[k];
          var lcur = ~~HYData.get("core.bag." + liid) + ~~HYData.get("core.warehouse." + liid);
          if (lcur < 20) { give[liid] = 20 - lcur; need++; }
        }
        if (need > 0) {
          ok(function () { HYBag.updateAttr(give); }, "limited items");
          refreshBag();
        }
        T("限时副本已开启" + (need > 0 ? "(入场道具已补足到20)" : "(入场道具已充足)"));
      }
    } else if (!silent) T("限时副本已关闭");
    hookPotPanelClass();
    spreadLimitedPots();
    ok(function () { HYWorld.refreshPotsShow(); });
    ok(function () { dy.notify.post(dy.K_REFRESH_POT_NODE); });
    for (var m = 0; m < ids.length; m++) (function (id) { ok(function () { dy.notify.post(dy.K_REFRESH_ONE_POT_NODE, id); }); })(ids[m]);
    setTimeout(spreadLimitedPots, 800);
    setTimeout(spreadLimitedPots, 2000);
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    log("setLimitedDungeons " + on);
  }

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

  function clearCheatFlags(silent) {
    var keys = ["base.cheatAchievement", "base.achieve_fake_profile", "base.cheatBuildProducts",
      "base.cheatGoOutMax", "base.cheatSelectGift", "base.cheatBuildProduct",
      "base.coin.adCoin.illegal", "base.cheatMail", "base.cheatQueryMail", "base.cheatMailMd5",
      "base.cheatAllMailMd5", "base.cheatAdCoinNum", "base.cheatAdCoinCount", "base.cheatHYDataUpdate",
      "base.cheatProduct", "base.cheatItem"];
    var n = 0;
    keys.forEach(function (k) { if (ok(function () { return HYData.get(k); })) { HYData.set(k, 0); n++; log("清除 " + k); } });
    ok(function () { HYData.trySave(); });
    if (!silent) T("已清除 " + n + " 个标记");
  }
  M.clearCheatFlags = clearCheatFlags;
  /* ---------------- 菜单结构 ---------------- */

  /* ================================================================
   *  v3.0.0 新增功能 (需求 1~12)
 *  v3.1.0 增加 vivo / 九游 渠道服支持
   *  - 需求1  内购直接成功 / 一键发全部礼包
   *  - 需求2  外伤/内伤/饥饿/精神/失眠 数值与上限修改 + 锁定
   *  - 需求3  选择游戏天数(成就/天气/季节/日常刷新全部联动)
   *  - 需求4  当前副本进度检测与修改
   *  - 需求5  全部限时副本开关
   *  - 需求6  成就选择器(原版完成接口)
   *  - 需求7  本地封号校验清除(补充: 场景主类覆写 / 作弊键写入拦截)
   *  - 需求8  剧情/生物/物品图鉴一键解锁
   *  - 需求9  金雕 活力/羁绊 及上限
   *  - 需求10 狼 生命/饥饿/忠诚 及上限
   *  - 需求11 建筑耐久锁定
   *  - 需求12 功能首选项持久化开关
   * ================================================================ */

  /* ---- 需求7 补充: 场景主类校验方法覆写(实例定位 -> 原型级覆写) ---- */
  function hookSceneMainNow() {
    if (noBan.scenemain) return true;
    var scene = ok(function () { return cc.director.getScene(); });
    if (!scene) return false;
    var stack = [scene], found = null;
    while (stack.length && !found) {
      var nd = stack.pop();
      try {
        var comps = nd._components;
        if (comps) for (var i = 0; i < comps.length; i++) {
          var c = comps[i];
          if (c && typeof c._checkMainJs === "function" && typeof c._checkIsCheated === "function") { found = c; break; }
        }
        var ch = nd._children;
        if (ch) for (var j = 0; j < ch.length; j++) stack.push(ch[j]);
      } catch (e) {}
    }
    if (!found) return false;
    try {
      var proto = Object.getPrototypeOf(found) || found;
      proto._checkMainJs = function () { log("本地 main.js 校验已移除"); };
      proto._checkIsCheated = function () { log("本地作弊检测已移除"); };
      noBan.scenemain = 1;
      log("SceneMain 校验方法已覆写(原型级)");
      return true;
    } catch (e) { log("hookSceneMainNow " + e); }
    return false;
  }

  /* ---- 需求3: 选择游戏天数 ---- */
  function setGameDay(target) {
    target = parseInt(target, 10);
    if (isNaN(target) || target < 1) { T("请输入有效的天数"); return; }
    target = Math.min(target, 99999);
    var old = ok(function () { return HYTime.day(); }) || 1;
    if (target === old) { T("当前已经是第 " + old + " 天"); return; }
    var delta = target - old;
    var tl = (ok(function () { return HYTime.timeline(); }) || 0) + delta * 86400;
    ok(function () { HYData.set("core.timeline", tl); });
    ok(function () { HYTime.mTimeline = tl; });
    if (delta > 1) ok(function () {
      /* 先把累计器 core.achieve.* 同步到当前计数, 保证补发天数一定计入(ONCE 成就按累计器取 max) */
      var ap = achieveProfileMap();
      for (var aid in ap) {
        var pa = ap[aid];
        if (!pa || pa.TYPE != 2 || !pa.DEMAND || pa.DEMAND.type != 1) continue;
        var bc = HYData.get("base.achieve." + aid);
        var ac = HYData.get("core.achieve." + aid) || 0;
        var want = Math.max((bc && bc.count) || 0, ac);
        if (ac < want) HYData.set("core.achieve." + aid, want);
      }
      HYAchieve.add(2, 1, delta - 1);
    }, "dayAch");
    ok(function () { HYEvent.setUpdateTime(dy.K_REFRESH_FOR_DAY, target - 1); });
    ok(function () { HYEvent.setUpdateTime(dy.K_UPDATE_TEMPERATURE, 0); });
    ok(function () { HYEvent.setUpdateTime(dy.K_UPDATE_WEATHER, 0); });
    ok(function () { HYEvent.setUpdateTime(dy.K_UPDATE_SEASON, 0); });
    if (delta > 0) ok(function () { HYEvent._tryRefreshForDay(); }, "dayRefresh");
    ok(function () { dy.notify.post(dy.K_UPDATE_TIME, HYTime.getTime()); });
    ok(function () { dy.notify.post(dy.K_UPDATE_TEMPERATURE, HYNature.temperature()); });
    ok(function () { dy.notify.post(dy.K_UPDATE_SEASON, HYNature.season()); });
    ok(function () { dy.notify.post(dy.K_UPDATE_WEATHER, HYNature.weather()); });
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    M.dayInfo = { day: target, old: old, time: Date.now() };
    T("天数已设置: 第 " + old + " 天 -> 第 " + target + " 天");
    log("setGameDay " + old + " -> " + target + " timeline=" + tl + " delta=" + delta);
    setTimeout(function () { ok(function () { pushMenu(); }); }, 200);
  }

  /* ---- 需求4: 当前副本进度 ---- */
  function currentPotId() {
    var id = ok(function () { return HYData.cache && HYData.cache.currentPot; });
    if (!id) id = ok(function () { return HYData.get("core.world.startPot"); });
    return id ? String(id) : "";
  }
  function potName(id) {
    var s = "";
    ok(function () {
      var pf = dy.profile.getById("Profiles/pot_profile", id);
      if (pf && pf.NAME) s = pf.NAME[lang()] || pf.NAME.cn || "";
    });
    return s || ("位置" + id);
  }
  function detectPot(silent) {
    var id = currentPotId();
    if (!id) { M.potInfo = null; if (!silent) T("没有检测到当前位置"); return null; }
    var prof = ok(function () { return HYWorld.fetchPotProfile(id); });
    if (!prof) { M.potInfo = null; if (!silent) T("位置 " + id + " 没有配置档"); return null; }
    var type = String(prof.TYPE), info = { id: id, name: potName(id), type: type, kind: "", cur: 0, total: 0 };
    var d = ok(function () { return HYWorld.fetchPotData(id); });
    if (type === "101" && d) {
      info.kind = "dungeon";
      info.cur = ~~d.REACH;
      info.total = (d.SERIES && d.SERIES.length) || 0;
    } else if (type === "301" && d) {
      info.kind = "ship";
      info.cur = ~~d.SREACH;
      info.total = (d.SERIES && d.SERIES.length) || 0;
    }
    M.potInfo = info;
    if (!silent) {
      if (info.kind) T(info.name + " 进度 " + info.cur + "/" + info.total + " (可改 0~" + info.total + ")");
      else T(info.name + " 没有进度");
      setTimeout(function () { ok(function () { pushMenu(); }); }, 200);
    }
    return info;
  }
  function setPotProgress(v) {
    var info = M.potInfo || detectPot(true);
    if (!info) { T("请先检测当前位置"); return; }
    if (!info.kind) { T(info.name + " 没有进度可修改"); return; }
    v = parseInt(v, 10);
    if (isNaN(v)) { T("请输入有效的进度值"); return; }
    v = Math.max(0, Math.min(info.total, v));
    var d = ok(function () { return HYWorld.fetchPotData(info.id); });
    if (!d) { T("读取副本数据失败"); return; }
    if (info.kind === "dungeon") d.REACH = v; else d.SREACH = v;
    ok(function () { HYWorld.updatePotData(info.id, d); });
    ok(function () { dy.notify.post(dy.K_REFRESH_ONE_POT_NODE, info.id); });
    ok(function () { dy.notify.post(dy.K_REFRESH_POT_NODE); });
    ok(function () { dy.notify.post(dy.K_REFRESH_TITLE_INFO); });
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    info.cur = v;
    T(info.name + " 进度已改为 " + v + "/" + info.total);
    log("setPotProgress " + info.id + " = " + v + "/" + info.total);
    setTimeout(function () { ok(function () { pushMenu(); }); }, 200);
  }
  function openPotPicker() {
    var info = detectPot(true);
    if (!info) { T("请先检测当前位置"); return; }
    if (!info.kind) { T(info.name + " 没有进度"); return; }
    var items = [];
    for (var i = 0; i <= info.total; i++) items.push({ id: String(i), name: i + "/" + info.total, cat: info.name });
    bridge("openItemPicker", "(Ljava/lang/String;)V", jstr({
      title: info.name + " 进度 (" + info.cur + "/" + info.total + ")",
      count: "1", action: "potprog", single: true, hideTarget: true, okText: "设为该进度", items: items
    }));
  }

  /* ---- 需求6: 成就 ---- */
  function achieveProfileMap() {
    return ok(function () { return dy.profile.getAll("Profiles/achieve_profile"); }) || {};
  }
  function achieveName(a, id) {
    return (a && a.NAME && (a.NAME[lang()] || a.NAME.cn)) || ("成就" + id);
  }
  function achieveMaxCount(a) {
    var v = a && a.DEMAND && a.DEMAND.value;
    if (!v || !v.length) return 1;
    return v[v.length - 1];
  }
  function completeAchieve(id, count) {
    var p = achieveProfileMap()[id];
    if (!p) return false;
    var mx = achieveMaxCount(p);
    var c = (count === undefined || count === null || isNaN(parseInt(count, 10))) ? mx : Math.max(0, parseInt(count, 10));
    ok(function () { HYAchieve._genAchieve(id, p, c); }, "achv" + id);
    return true;
  }
  function completeAllAchieves() {
    var p = achieveProfileMap(), n = 0;
    for (var id in p) {
      var a = p[id];
      if (!a || !a.DEMAND) continue;
      ok(function () { HYAchieve._genAchieve(id, p[id], achieveMaxCount(p[id])); }, "achv" + id);
      n++;
    }
    ok(function () { HYData.trySave(); });
    T("已完成 " + n + " 项成就(可在游戏成就界面领奖)");
    log("completeAllAchieves " + n);
  }
  function openAchievePicker() {
    var p = achieveProfileMap(), items = [];
    for (var id in p) {
      var a = p[id];
      if (!a || !a.DEMAND) continue;
      var cat = a.TYPE == 1 ? "战斗" : a.TYPE == 2 ? "生存" : "探索";
      items.push({ id: id, name: achieveName(a, id), cat: cat });
    }
    if (!items.length) { T("成就表未加载"); return; }
    bridge("openItemPicker", "(Ljava/lang/String;)V", jstr({
      title: "成就选择器", count: "1", action: "achieve", single: false, hideTarget: true, okText: "完成成就", items: items
    }));
  }

  /* ---- 需求8: 图鉴 ---- */
  function atlasInfo() {
    var s = "";
    ok(function () {
      var A = HYData.get("base.atlas") || {};
      var f = function (x) { var n = 0; for (var k in (x || {})) n++; return n; };
      s = "已解锁 剧情" + f(A.FOR_S) + " / 生物" + f(A.FOR_B) + " / 物品" + f(A.FOR_I);
    });
    return s || "图鉴数据未加载";
  }
  function unlockAtlas(kind) {
    var src = ok(function () {
      return dy.profile.getAll("Profiles/" + (kind === "FOR_S" ? "image_story_profile" : kind === "FOR_B" ? "image_biology_profile" : "image_item_profile"));
    }) || {};
    var items = ok(function () { return dy.profile.getAll("Profiles/item_profile"); }) || {};
    var n = 0;
    for (var id in src) {
      if (kind === "FOR_I") { var it0 = items[id]; if (!it0 || it0.ISFISH) continue; }
      if (HYData.get("base.atlas." + kind + "." + id)) continue;
      HYData.set("base.atlas." + kind + "." + id, 1);
      n++;
      if (kind === "FOR_S") HYAchieve.add(3, 4, 1);
      else if (kind === "FOR_B") {
        HYAchieve.add(3, 5, 1);
        if (items[id] && items[id].ISFISH) HYAchieve.add(3, 7, 1);
      } else HYAchieve.add(3, 6, 1);
    }
    ok(function () { HYData.trySave(); });
    M.atlasText = atlasInfo();
    log("unlockAtlas " + kind + " +" + n);
    return n;
  }
  function unlockAllAtlas() {
    var a = unlockAtlas("FOR_S"), b = unlockAtlas("FOR_B"), c = unlockAtlas("FOR_I");
    T("图鉴已解锁: 剧情+" + a + " 生物+" + b + " 物品+" + c);
    setTimeout(function () { ok(function () { pushMenu(); }); }, 200);
  }

  /* ---- 需求9: 金雕 ---- */
  function installEagleHooks() {
    if (H.eagle) return; H.eagle = 1;
    if (window.HYEagle && HYEagle.updateBlood) {
      var rawBlood = HYEagle.updateBlood;
      HYEagle.updateBlood = function (e) {
        if (M.eagle.bloodMax > 0) {
          /* 自定义上限生效时完全接管加减与钳制(游戏原函数按羁绊等级封顶, 会无视自定义上限) */
          var ed = parseInt(e, 10); if (isNaN(ed)) ed = 0;
          var et = (+HYData.get("base.eagle.blood") || 0) + ed;
          if (et > M.eagle.bloodMax) et = M.eagle.bloodMax;
          var elo = Math.min(10, M.eagle.bloodMax);
          if (et < elo) et = elo;
          HYData.set("base.eagle.blood", et);
          return HYData.get("base.eagle.blood");
        }
        var r = rawBlood.apply(this, arguments);
        try {
          var b = +HYData.get("base.eagle.blood");
          if (b < 0) { HYData.set("base.eagle.blood", 0); r = 0; }
        } catch (err) {}
        return r;
      };
      log("已挂钩 HYEagle.updateBlood");
    }
    if (window.HYEagle && HYEagle.updateFriendship) {
      var rawFri = HYEagle.updateFriendship;
      HYEagle.updateFriendship = function (e) {
        var r = rawFri.apply(this, arguments);
        try {
          if (M.eagle.friendMax > 0) {
            var f = +HYData.get("base.eagle.friendship");
            if (f > M.eagle.friendMax) { HYData.set("base.eagle.friendship", M.eagle.friendMax); r = M.eagle.friendMax; }
          }
        } catch (err) {}
        return r;
      };
      log("已挂钩 HYEagle.updateFriendship");
    }
  }
  function setEagle(vals) {
    var e = M.eagle;
    if (vals.friendMax !== undefined) e.friendMax = Math.max(0, parseInt(vals.friendMax, 10) || 0);
    if (vals.bloodMax !== undefined) e.bloodMax = Math.max(0, parseInt(vals.bloodMax, 10) || 0);
    if (vals.friendship !== undefined) {
      var f = Math.max(0, parseInt(vals.friendship, 10) || 0);
      if (e.friendMax > 0) f = Math.min(f, e.friendMax);
      HYData.set("base.eagle.friendship", f);
    }
    if (vals.blood !== undefined) {
      var b = Math.max(0, parseInt(vals.blood, 10) || 0);
      var mx = e.bloodMax > 0 ? e.bloodMax : (100 + 15 * (ok(function () { return HYEagle.getFriendshipLevel(); }) || 1));
      if (b > mx) b = mx;
      HYData.set("base.eagle.blood", b);
    }
    ok(function () { HYData.trySave(); });
    T("金雕: 活力 " + HYData.get("base.eagle.blood") + "/" + (e.bloodMax > 0 ? e.bloodMax : "默认") +
      "  羁绊 " + HYData.get("base.eagle.friendship") + "/" + (e.friendMax > 0 ? e.friendMax : "默认"));
  }

  /* ---- 需求10: 狼 ---- */
  function wolfHas() { return !!ok(function () { return HYPet.hasPet(HYPet.PT_WOLF); }); }
  function setWolf(vals) {
    if (!wolfHas()) { T("还没有宠物狼"); return; }
    var p = ok(function () { return HYData.get("core.pets.1"); });
    if (!p) { T("还没有宠物狼"); return; }
    if (vals.lifemax !== undefined) p["7002"] = Math.max(1, parseInt(vals.lifemax, 10) || 0);
    if (vals.hungermax !== undefined) p["7048"] = Math.max(1, parseInt(vals.hungermax, 10) || 0);
    if (vals.royalmax !== undefined) p["7049"] = Math.max(1, parseInt(vals.royalmax, 10) || 0);
    if (vals.life !== undefined) p["7003"] = Math.max(0, parseInt(vals.life, 10) || 0);
    if (vals.hunger !== undefined) p["7006"] = Math.max(0, parseInt(vals.hunger, 10) || 0);
    if (vals.royal !== undefined) p["7028"] = Math.max(0, parseInt(vals.royal, 10) || 0);
    ok(function () { HYPet._correctState(p); });
    HYData.set("core.pets.1", p);
    ok(function () { HYData.trySave(); });
    T("狼: 生命 " + p["7003"] + "/" + p["7002"] + " 饥饿 " + p["7006"] + "/" + p["7048"] + " 忠诚 " + p["7028"] + "/" + p["7049"]);
  }

  /* ---- 需求11: 建筑耐久 ---- */
  function installBuildDurSetHook() {
    if (H.buildDurSet || !window.HYData || !HYData.set) return;
    H.buildDurSet = 1;
    var rawSetB = HYData.set;
    HYData.set = function (k, v) {
      try {
        if (buff.lockBuildDur && typeof k === "string" && /^core\.builds\.[^.]+\.DURATION$/.test(k) && v !== "MAX") {
          var old = HYData.get(k);
          if (old === "MAX") { log("建筑耐久锁定: 拦截 " + k + " (MAX)"); return old; }
          if (typeof old === "number" && typeof v === "number" && v < old) {
            log("建筑耐久锁定: 拦截 " + k + " " + old + " -> " + v);
            return old;
          }
        }
      } catch (e) {}
      return rawSetB.apply(this, arguments);
    };
    log("HYData.set 建筑耐久锁已安装");
  }
  function fixAllBuilds() {
    var n = 0;
    ok(function () {
      var b = HYData.get("core.builds") || {};
      for (var id in b) {
        var mx = HYData.get("core.builds." + id + ".DURATION_MAX");
        if (mx && mx !== "MAX" && HYData.get("core.builds." + id + ".LEVEL") > 0) {
          var cur = HYData.get("core.builds." + id + ".DURATION");
          if (cur !== "MAX") { HYData.set("core.builds." + id + ".DURATION", mx); n++; }
        }
      }
    });
    ok(function () { HYData.trySave(); });
    T("已修复 " + n + " 座建筑耐久至上限");
  }

  /* ---- 需求12: 首选项持久化 ---- */
  function applyPersist(val) {
    var on = (val === "1" || val === true);
    setPersist(on);
    if (!on) {
      M.vals = {}; M.saveVals();
      cfg.safeLog = true; cfg.safeCheckItem = true; cfg.safeUpdate = false; cfg.autoSave = true; cfg.noHotfix = true;
    } else {
      M.vals["persist"] = "1";
      M.saveVals(); saveCfg();
    }
    T(M.persist ? "保存功能首选项: 开启 (重启后保留)" : "保存功能首选项: 关闭 (重启后不保留)");
    setTimeout(function () { ok(function () { pushMenu(); }); }, 200);
  }

  /* ---- 需求1: 一键发放全部商店礼包 ---- */
  function payAllWares() {
    var n = 0;
    ok(function () {
      HYCommon._initShopProfiles();
      var lists = [HYCommon.mShopProfileForAccount, HYCommon.mShopProfileForGame, HYCommon.mShopProfileForLimit];
      for (var i = 0; i < lists.length; i++) {
        var L = lists[i];
        if (!L) continue;
        for (var k in L) {
          var w = L[k];
          if (!w || w.ID === undefined) continue;
          if (!w.PRICE && !w.INCLUDE) continue;
          HYCommon.gainForPurchase(w.ID);
          n++;
        }
      }
    }, "payAll");
    T("已发放 " + n + " 个商店礼包(含月卡/永久包)");
    log("payAllWares " + n);
  }

  /* ================= v3.2.0 新功能 ================= */

  /* ---- 机关甲人 (设置部件与等级) ---- */
  var ROBOT_SECTIONS = [
    { sec: 0, name: "核心", ids: ["1"] },
    { sec: 1, name: "手臂", ids: ["101", "102", "103", "104", "105", "106", "107"] },
    { sec: 2, name: "躯干", ids: ["201", "202", "203", "204"] },
    { sec: 3, name: "足部", ids: ["301", "302", "303", "304", "305"] }
  ];
  function robotProfile(id) { return ok(function () { return dy.profile.getById("Profiles/robot", id); }); }
  function robotUpgap(id) { var p = robotProfile(id); return (p && p.upgap) || null; }
  function robotExp(id) {
    var n = 0;
    ok(function () {
      if (dy.cache.robotOnline && dy.cache.robotInfo && dy.cache.robotInfo.formula) n = ~~dy.cache.robotInfo.formula[id + ""] || 0;
      else n = ~~HYData.get("base.robot.formula." + id) || 0;
    });
    return n;
  }
  function robotLevel(id) {
    var up = robotUpgap(id);
    if (!up || !up.length) return 1;
    var n = robotExp(id);
    for (var o = 0; o < up.length; o++) {
      if (n < ~~up[o] || o == up.length - 1) return o + 1;
      n -= ~~up[o];
    }
    return up.length;
  }
  function robotExpForLevel(id, lv) {
    var up = robotUpgap(id);
    if (!up || !up.length) return 0;
    lv = Math.max(1, Math.min(up.length, parseInt(lv, 10) || 1));
    var s = 0;
    for (var i = 0; i < lv - 1; i++) s += ~~up[i];
    return s;
  }
  function robotName(id) {
    var p = robotProfile(id);
    var nm = ok(function () { return dy.i18n.t(p.name + "_" + robotLevel(id)); });
    return (nm || ("组件" + id)) + "(" + id + ")";
  }
  function robotWear() {
    var w = ok(function () {
      if (dy.cache.robotOnline && dy.cache.robotInfo && dy.cache.robotInfo.wearId && dy.cache.robotInfo.wearId.length) return dy.cache.robotInfo.wearId.slice();
      var v = HYData.get("base.robot.wearId");
      if (v && v.length) return v.slice();
      return ["1", "101", "201", "301"];
    });
    return w || ["1", "101", "201", "301"];
  }
  function robotSavedExp() {
    var o = {};
    ok(function () { o = JSON.parse(M.vals["rb_exp"] || "{}") || {}; });
    return o || {};
  }
  function robotSaveCfg(wearArr, expObj) {
    if (wearArr) M.vals["rb_wear"] = JSON.stringify(wearArr);
    if (expObj) {
      var cur = robotSavedExp();
      for (var k in expObj) cur[k] = expObj[k];
      M.vals["rb_exp"] = JSON.stringify(cur);
    }
    M.saveVals();
  }
  /** 把 MOD 的甲人配置写进存档 + 内存缓存 */
  function robotPushToGame(wearArr, expObj, unlockAll) {
    var b = HYData.get("core.robot") || {};
    var w = (wearArr || robotWear()).slice();
    var i, j, s, id;
    if (unlockAll) for (i = 0; i < ROBOT_SECTIONS.length; i++) for (j = 0; j < ROBOT_SECTIONS[i].ids.length; j++) b[ROBOT_SECTIONS[i].ids[j]] = ROBOT_SECTIONS[i].sec + 1;
    for (s = 0; s < 4; s++) if (w[s] && !b[w[s]]) b[w[s]] = s + 1;
    HYData.set("core.robot", b);
    HYData.set("base.robot.wearId", w);
    if (expObj) for (id in expObj) HYData.set("base.robot.formula." + id, ~~expObj[id]);
    ok(function () {
      if (dy.cache.robotInfo) {
        dy.cache.robotInfo.wearId = w.slice();
        var f = dy.cache.robotInfo.formula || {};
        if (expObj) for (var id2 in expObj) f[id2 + ""] = ~~expObj[id2];
        dy.cache.robotInfo.formula = f;
      }
    }, "rbCache");
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
  }
  function robotReapply(silent) {
    var w = null, e = null;
    ok(function () { if (M.vals["rb_wear"]) w = JSON.parse(M.vals["rb_wear"]); });
    ok(function () { if (M.vals["rb_exp"]) e = JSON.parse(M.vals["rb_exp"]); });
    if (!w && !e) { if (!silent) T("还没有可恢复的甲人配置"); return false; }
    robotPushToGame(w, e, M.vals["rb_unlock"] === "1");
    if (!silent) T("甲人配置已重新应用");
    return true;
  }
  function refreshRobotUI() {
    ok(function () {
      var scene = cc.director.getScene();
      if (!scene) return;
      var walk = function (nd) {
        if (!nd) return null;
        if (nd.name === "PanelRobotDetail") return nd;
        var cs = nd.children || [];
        for (var i = 0; i < cs.length; i++) { var r = walk(cs[i]); if (r) return r; }
        return null;
      };
      var node = walk(scene);
      if (node) { var c = node.getComponent("PanelRobotDetail"); if (c && c.layoutUI) c.layoutUI(); }
    }, "rbUI");
  }
  function robotUnlockEntrance() {
    ok(function () {
      HYData.set("base.robot.unlock", 1);
      if (!HYData.get("core.robot")) HYData.set("core.robot", { "1": 1, "101": 2, "201": 3, "301": 4 });
      if (!HYData.get("base.robot.wearId")) HYData.set("base.robot.wearId", ["1", "101", "201", "301"]);
      if (!HYData.get("core.builds.3200")) HYData.set("core.builds.3200", { LEVEL: 1, DURATION: "MAX", DURATION_MAX: "MAX", LOCK: 0 });
      if (cfg.autoSave) HYData.trySave();
    });
    T("机关甲人入口已解锁(回营地首页查看)");
    setTimeout(pushMenu, 200);
  }
  function robotUnlockAll(silent) {
    var b = HYData.get("core.robot") || {}, n = 0;
    for (var i = 0; i < ROBOT_SECTIONS.length; i++) for (var j = 0; j < ROBOT_SECTIONS[i].ids.length; j++) {
      var id = ROBOT_SECTIONS[i].ids[j];
      if (!b[id]) { b[id] = ROBOT_SECTIONS[i].sec + 1; n++; }
    }
    HYData.set("core.robot", b);
    M.vals["rb_unlock"] = "1"; M.saveVals();
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    if (!silent) { T("已解锁全部 17 个甲人组件"); setTimeout(pushMenu, 200); }
    return n;
  }
  function robotEquip(section, id) {
    var S = ROBOT_SECTIONS[~~section];
    if (!S) return;
    var p = robotProfile(id);
    if (!p) { T("组件不存在: " + id); return; }
    if (~~p.section !== S.sec) { T("组件 " + id + " 不能装在" + S.name); return; }
    var w = robotWear();
    w[~~section] = String(id);
    var exp = {}, se = robotSavedExp();
    if (se[id] !== undefined) exp[id] = se[id];
    robotSaveCfg(w, exp);
    robotPushToGame(w, exp, false);
    T(S.name + "已换为 " + robotName(id));
    refreshRobotUI();
    setTimeout(pushMenu, 200);
  }
  function robotSetLevels() {
    var w = robotWear(), exp = {}, n = 0, maxLv = 19;
    for (var s = 0; s < 4; s++) {
      var v = V("rb_lv" + s);
      if (v === undefined || v === null || v === "") continue;
      var lv = parseInt(v, 10);
      if (isNaN(lv)) continue;
      var up = robotUpgap(w[s]) || [];
      maxLv = up.length || 19;
      exp[w[s]] = robotExpForLevel(w[s], lv);
      n++;
    }
    if (!n) { T("请先填写等级(1-" + maxLv + ")"); return; }
    robotSaveCfg(w, exp);
    robotPushToGame(w, exp, false);
    T("甲人等级已应用(" + n + " 项)");
    refreshRobotUI();
    setTimeout(pushMenu, 200);
  }
  function robotMaxLevels(which) {
    var ids = [], s;
    if (which === "all") { for (s = 0; s < ROBOT_SECTIONS.length; s++) ids = ids.concat(ROBOT_SECTIONS[s].ids); }
    else ids = robotWear();
    var exp = {};
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i]; if (!id) continue;
      var up = robotUpgap(id); if (!up || !up.length) continue;
      exp[id] = robotExpForLevel(id, up.length);
    }
    robotUnlockAll(true);
    robotSaveCfg(null, exp);
    robotPushToGame(null, exp, false);
    T((which === "all" ? "全部组件" : "当前装备") + "已满级(" + Object.keys(exp).length + " 个)");
    refreshRobotUI();
    setTimeout(pushMenu, 200);
  }
  function openRobotPicker(section) {
    var S = ROBOT_SECTIONS[~~section];
    if (!S) return;
    var items = [];
    for (var i = 0; i < S.ids.length; i++) {
      var id = S.ids[i];
      items.push({ id: id, name: robotName(id), cat: "当前 Lv." + robotLevel(id) });
    }
    bridge("openItemPicker", "(Ljava/lang/String;)V", jstr({
      title: "选择" + S.name + "组件", count: "1", action: "robot:" + ~~section, single: true, hideTarget: true, okText: "装备该组件", items: items
    }));
  }
  /** 在线模式下拦截服务器刷新, 保住 MOD 的甲人修改 */
  function installRobotHook() {
    if (H.robotHook) return;
    if (!dy.http || !dy.http.getRobotInfo) return;
    H.robotHook = true;
    var raw = dy.http.getRobotInfo;
    dy.http.getRobotInfo = function (cb) {
      return raw.call(this, function (err, res) {
        try {
          if (!err && res && res.data && sv("rb_lock", false)) {
            var w = null, e = null;
            if (M.vals["rb_wear"]) w = JSON.parse(M.vals["rb_wear"]);
            if (M.vals["rb_exp"]) e = JSON.parse(M.vals["rb_exp"]);
            if (w && w.length) res.data.wearId = w.join(";");
            if (e) res.data.formula = JSON.stringify(e);
            log("甲人: 服务器刷新已被本地配置覆盖");
          }
        } catch (e2) { log("robotHook " + e2); }
        cb && cb(err, res);
      });
    };
    log("已挂钩 dy.http.getRobotInfo (甲人锁定)");
  }

  /* ---- 建筑等级 ---- */
  function fillRobotNames() {
    if (H.fillName) return;
    ok(function () {
      var tab = window.i18n && window.i18n.languages && window.i18n.languages[dy.cache.language];
      if (!tab) return;
      var R = dy.profile.getAll("Profiles/robot") || {}, n = 0;
      for (var id in R) {
        var p = R[id] || {}, base = p.name, up = p.upgap || [];
        if (!base) continue;
        var n0 = tab[base + "_1"];
        if (!n0) continue;
        for (var lv = 2; lv <= (up.length || 19); lv++) {
          if (tab[base + "_" + lv] === undefined) { tab[base + "_" + lv] = n0; n++; }
        }
      }
      H.fillName = true;
      if (n) log("部件名补齐: " + n + " 条");
    }, "fillName");
  }
  function talentRatio() {
    var r = 1;
    ok(function () { if (HYData.get("core.talent.2019")) r = (100 + HYTechnology.techTalent("2019")[0]) / 100; });
    return r;
  }
  function buildProfile(id) { return ok(function () { return dy.profile.getById("Profiles/build_profile", id); }); }
  function buildLevels(id) {
    var p = buildProfile(id), out = [];
    if (p) for (var k in p) if (/^\d+(_\d)?$/.test(k)) out.push(k);
    out.sort(function (a, b) { return parseFloat(a.replace("_", ".")) - parseFloat(b.replace("_", ".")); });
    return out;
  }
  function buildEntryName(id, lv) {
    var p = buildProfile(id), e = p && p[lv];
    return (e && e.NAME && (e.NAME[dy.cache.language] || e.NAME.cn)) || ("Lv." + lv);
  }
  function buildCurLevel(id) {
    var v = ok(function () { return HYData.get("core.builds." + id + ".LEVEL"); });
    return (v === undefined || v === null) ? 0 : v;
  }
  function buildInfoText() {
    var id = String(M.vals["bld_id"] || "").replace(/\s/g, "");
    if (!id) return "未选择建筑 (点上面的[选择建筑])";
    if (!buildProfile(id)) return "已选: " + id + " (无此建筑)";
    var cur = buildCurLevel(id);
    return "已选: " + id + "  " + (parseInt(cur, 10) > 0 ? ("当前 " + cur + " 级 " + buildEntryName(id, cur)) : "当前未建造") + "  可选等级: " + buildLevels(id).join("/");
  }
  function setBuildLevel(id, lv, silent) {
    id = String(id || "").replace(/\s/g, "");
    lv = String(lv || "").replace(/\s/g, "");
    if (!id) { if (!silent) T("请输入建筑ID, 如 3000"); return false; }
    var p = buildProfile(id);
    if (!p) { if (!silent) T("没有建筑 " + id + " (可点[选择建筑])"); return false; }
    if (lv === "0") {
      var lock0 = ~~ok(function () { return HYData.get("core.builds." + id + ".LOCK"); }) || 0;
      ok(function () { HYPlayer.addBuild(id, 0, lock0); });
      ok(function () { dy.notify.post(dy.K_REFRESH_HOME_BUILDS); });
      if (cfg.autoSave) ok(function () { HYData.trySave(); });
      if (!silent) { T("建筑 " + id + " 已拆除(0级)"); setTimeout(pushMenu, 200); }
      return true;
    }
    var entry = p[lv];
    if (!entry) { if (!silent) T("建筑 " + id + " 没有等级 " + lv + " (可用: " + buildLevels(id).join("/") + ")"); return false; }
    var lock = ~~ok(function () { return HYData.get("core.builds." + id + ".LOCK"); }) || 0;
    var num = parseInt(lv, 10);
    ok(function () { HYPlayer.addBuild(id, num, lock); }, "addBuild");
    if (/^\d+$/.test(lv)) {
      ok(function () { HYData.set("core.builds." + id + ".LEVEL", num); });
    } else {
      HYData.set("core.builds." + id + ".LEVEL", lv);
      var d = entry.DURATION;
      if (d !== "MAX") d = Math.floor(d * talentRatio());
      HYData.set("core.builds." + id + ".DURATION", d);
      HYData.set("core.builds." + id + ".DURATION_MAX", d);
    }
    ok(function () {
      var mx = HYData.get("core.builds." + id + ".DURATION_MAX"), cur = HYData.get("core.builds." + id + ".DURATION");
      if (mx && mx !== "MAX" && cur !== "MAX" && cur < mx) HYData.set("core.builds." + id + ".DURATION", mx);
    });
    ok(function () { dy.notify.post(dy.K_BUILD_UPDATE); });
    ok(function () { dy.notify.post(dy.K_REFRESH_HOME_BUILDS); });
    ok(function () { dy.notify.post(dy.K_UPDATE_DURATION); });
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    if (!silent) { T("建筑 " + id + " = " + lv + " 级 " + buildEntryName(id, lv)); setTimeout(pushMenu, 200); }
    log("setBuildLevel " + id + " -> " + lv);
    return true;
  }
  function openBuildPicker() {
    var prof = ok(function () { return dy.profile.getAll("Profiles/build_profile"); }) || {};
    var items = [];
    for (var id in prof) {
      var lvs = buildLevels(id);
      if (!lvs.length) continue;
      var names = [];
      for (var i = 0; i < lvs.length; i++) names.push(lvs[i] + "=" + buildEntryName(id, lvs[i]));
      var cur = buildCurLevel(id);
      items.push({ id: id, name: "当前 " + (parseInt(cur, 10) > 0 ? cur + "级 " + buildEntryName(id, cur) : "未建造"), cat: names.join(" / ") });
    }
    if (!items.length) { T("建筑表未加载"); return; }
    bridge("openItemPicker", "(Ljava/lang/String;)V", jstr({
      title: "选择建筑", count: "1", action: "build:", single: true, hideTarget: true, okText: "选定该建筑", items: items
    }));
  }
  function openBuildLevelPicker() {
    var id = String(M.vals["bld_id"] || V("bld_id") || "").replace(/\s/g, "");
    if (!id) { T("请先选择建筑"); return; }
    var lvs = buildLevels(id);
    if (!lvs.length) { T("没有建筑 " + id); return; }
    var items = [];
    for (var i = 0; i < lvs.length; i++) items.push({ id: lvs[i], name: buildEntryName(id, lvs[i]), cat: (lvs[i] === String(buildCurLevel(id)) ? "当前等级" : "可设为 " + lvs[i] + " 级") });
    bridge("openItemPicker", "(Ljava/lang/String;)V", jstr({
      title: "选择 " + id + " 的等级", count: "1", action: "buildlvl:" + id, single: true, hideTarget: true, okText: "应用该等级", items: items
    }));
  }
  function maxAllBuilds() {
    var b = ok(function () { return HYData.get("core.builds"); }) || {};
    var n = 0, fail = 0;
    for (var id in b) {
      if (!/^\d+$/.test(id)) continue;
      var cur = b[id] && b[id].LEVEL;
      if (!(parseInt(cur, 10) > 0)) continue;
      var lvs = buildLevels(id);
      if (!lvs.length) continue;
      var curS = String(cur), target = null, i;
      if (curS.indexOf("_") > 0) for (i = 0; i < lvs.length; i++) if (lvs[i] === curS) target = curS;
      if (!target) {
        var mx = 0;
        for (i = 0; i < lvs.length; i++) { var v = parseInt(lvs[i], 10); if (!isNaN(v) && v > mx) mx = v; }
        target = String(mx);
      }
      if (curS !== target) { if (setBuildLevel(id, target, true)) n++; else fail++; }
    }
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("全部建筑满级: 已升级 " + n + " 座" + (fail ? (", 失败 " + fail) : "") + " (分支建筑保留原分支)");
    setTimeout(pushMenu, 200);
  }

  /* ---- 天赋一键解锁 ---- */
  function talentUnlockInfo() {
    var tal = ok(function () { return dy.profile.getAll("Profiles/talent_profile"); }) || {};
    var total = 0, n = 0;
    for (var id in tal) {
      if (id === "2000") continue;
      total++;
      if (HYData.get("base.unlock.talent." + id)) n++;
    }
    return { n: n, total: total };
  }
  function unlockAllTalents(silent) {
    var tal = ok(function () { return dy.profile.getAll("Profiles/talent_profile"); }) || {};
    var n = 0;
    for (var id in tal) {
      if (id === "2000") continue;
      if (!HYData.get("base.unlock.talent." + id)) { HYData.set("base.unlock.talent." + id, 1); n++; }
    }
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    log("unlockAllTalents +" + n);
    if (!silent) {
      var info = talentUnlockInfo();
      T("已解锁全部天赋: 新增 " + n + " 个 (现在 " + info.n + "/" + info.total + ")");
      setTimeout(pushMenu, 200);
    }
    return n;
  }
  function talentFullUnlock() {
    var n = unlockAllTalents(true), m = talentMax(true);
    if (cfg.autoSave) ok(function () { HYData.trySave(); });
    T("天赋全开: 解锁+" + n + " 强化+" + m + " (全部★3)");
    setTimeout(pushMenu, 200);
  }

  /* ---- 心情笔记跳过按钮(原生弹窗) ---- */
  function addMoodSkipButton(panel) {
    if (panel._hymodSkipBtn || !panel.nodClose || !panel.node) return;
    var src = panel.nodClose;
    if (!src.parent) return;
    var clone = cc.instantiate(src);
    clone.name = "btnHymodSkip";
    var btn = clone.getComponent(cc.Button);
    if (btn) btn.clickEvents = [];
    ok(function () {
      var locs = clone.getComponentsInChildren("LocaleLabel") || [];
      for (var li = 0; li < locs.length; li++) { try { locs[li].node.removeComponent(locs[li]); } catch (e2) {} }
    }, "moodLocal");
    /* 面板入场景前 getComponentInChildren 有时拿不到, 多补几次确保显示"跳过" */
    var applyLab = function () {
      if (panel.canTouch) return;
      ok(function () {
        var l = clone.getComponentInChildren(cc.Label);
        if (!l) { var n2 = clone.getChildByName("Label"); if (n2) l = n2.getComponent(cc.Label); }
        if (l && l.string !== "跳过") l.string = "跳过";
      }, "moodLab");
    };
    clone.active = true;
    clone.setPosition(src.getPosition());
    src.parent.addChild(clone);
    applyLab();
    setTimeout(applyLab, 60);
    setTimeout(applyLab, 250);
    clone.on(cc.Node.EventType.TOUCH_END, function (event) {
      ok(function () {
        if (panel.canTouch) return;
        /* 关键: 拦住冒泡, 否则这次点击会走到根按钮 buttonListenter 把窗口直接关掉 */
        if (event && event.stopPropagation) event.stopPropagation();
        if (panel._hymodSkipBtn) panel._hymodSkipBtn.active = false;
        if (panel.func) panel.unschedule(panel.func);
        if (panel.labMsg) panel.labMsg.string = panel.msg || panel.labMsg.string;
        panel.canTouch = true;
        if (panel.nodClose) panel.nodClose.active = 1;
        dy.audio.playMusic("bgm_home", !0);
        log("心情笔记: 已跳过");
      }, "moodSkip");
    });
    panel._hymodSkipBtn = clone;
    log("心情笔记: 跳过按钮已添加");
  }
  function installMoodSkipHook() {
    if (H.moodSkip) return;
    var cls = ok(function () { return cc.js.getClassByName("PanelMoodAlert"); });
    if (!cls || !cls.prototype || !cls.prototype.init) return;
    H.moodSkip = true;
    var proto = cls.prototype;
    var rawInit = proto.init;
    proto.typingAni = function () {
      var self = this;
      var chars = (self.msg || "").split(""), spd = 0.1;
      if ("en" == dy.cache.language) spd = 0.03;
      var total = chars.length, i = 0;
      dy.audio.playMusic("note", !0);
      self.unschedule(self.func);
      self.func = function () {
        self.labMsg.string += chars[i];
        if (++i == total) {
          self.unschedule(self.func);
          dy.audio.playMusic("bgm_home", !0);
          self.canTouch = !0;
          self.nodClose.active = 1;
          if (self._hymodSkipBtn) self._hymodSkipBtn.active = false;
        }
      };
      self.schedule(self.func, spd, cc.macro.REPEAT_FOREVER, 0);
    };
    proto.init = function () {
      var self = this;
      rawInit.apply(self, arguments);
      ok(function () { if (self.nodClose) self.nodClose.active = false; }, "moodHideClose");
      ok(function () { addMoodSkipButton(self); }, "moodBtn");
    };
    log("已挂钩 PanelMoodAlert (心情笔记跳过)");
  }

  /* ---- 新菜单 ---- */
  function v3Tabs(tabs) {
    var ai, aid, anm;
    var vt = [];   /* v3 新增页先收集, 最后插入到"物品"页之后 */
    /* 商店 */
    vt.push({ title: "商店", items: [
      { type: "switch", id: "freePay", title: "内购直接成功(人民币礼包/月卡)", val: sv("freePay", buff.freePay) },
      { type: "button", id: "pay_all", title: "一键获得全部商店礼包", desc: "走游戏原版发奖接口: 月卡/永久武器食物材料医疗包/每日礼包" },
      { type: "text", title: "开着开关时, 商店里所有人民币商品点击购买立即成功" },
      { type: "text", title: "永久礼包(115-118)每次新开局自动发放, 月卡发到邮箱" }
    ]});
    /* 状态(需求2) */
    var st = [{ type: "text", title: "改完点最下方[应用数值修改]; 锁定后游戏内变化会被持续写回" }];
    var ATTRS = [["7004", "外伤"], ["7005", "内伤"], ["7006", "饥饿"], ["7000", "精神"], ["7001", "失眠"]];
    for (ai = 0; ai < ATTRS.length; ai++) {
      aid = ATTRS[ai][0]; anm = ATTRS[ai][1];
      st.push({ type: "input", id: "av_" + aid, title: anm + " 当前值", val: String(nv("av_" + aid, ~~ok(function () { return HYData.get("core.role." + aid); }) || 0)) });
      st.push({ type: "input", id: "am_" + aid, title: anm + " 上限", val: String(nv("am_" + aid, ~~ok(function () { return HYData.get("core.role." + ATTR_MAXKEY[aid]); }) || 0)) });
      st.push({ type: "switch", id: "lk_" + aid, title: "锁定 " + anm, val: sv("lk_" + aid, M.locked[aid] !== undefined) });
    }
    st.push({ type: "button", id: "attr_apply", title: "应用数值修改" });
    st.push({ type: "switch", id: "lockAllAttrs", title: "一键锁定全部当前值", val: sv("lockAllAttrs", false) });
    vt.push({ title: "状态", items: st });
    /* 天数(需求3) */
    vt.push({ title: "天数", items: [
      { type: "text", title: "当前: 第 " + (ok(function () { return HYTime.day(); }) || "?") + " 天" + (M.dayInfo ? ("  (上次设置 -> " + M.dayInfo.day + ")") : "") },
      { type: "input", id: "day_set", title: "目标天数", val: String(nv("day_set", 2)) },
      { type: "button", id: "day_apply", title: "设置天数", desc: "同时联动: 生存成就/日常刷新/商店重置/怪物潮/温度/天气/季节" },
      { type: "button", id: "day_add7", title: "+7 天" },
      { type: "button", id: "day_add30", title: "+30 天" }
    ]});
    /* 副本(需求4) */
    var pi = M.potInfo;
    var potText = pi ? (pi.name + "  " + (pi.kind ? (pi.cur + "/" + pi.total) : "没有进度")) : "尚未检测";
    vt.push({ title: "副本", items: [
      { type: "text", title: "当前位置: " + potText },
      { type: "button", id: "pot_detect", title: "检测当前所在位置" },
      { type: "button", id: "pot_picker", title: "修改当前副本进度(选择器)", desc: "自动检测副本; 营地等没有进度的位置会直接提示" },
      { type: "input", id: "pot_val", title: "或直接输入进度值", val: String(nv("pot_val", 0)) },
      { type: "button", id: "pot_apply", title: "应用输入的进度" }
    ]});
    /* 限时副本(需求5) */
    vt.push({ title: "限时副本", items: [
      { type: "switch", id: "limitedDungeon", title: "开启全部限时副本", val: sv("limitedDungeon", buff.limitedDungeon) },
      { type: "text", title: "包含: 秘境(七夕)/双生遗迹/红石遗迹/迷情宫殿 共4个节日限定副本" },
      { type: "text", title: "开启后地图上显示并可进入, 自动补入场道具各20个" }
    ]});
    /* 成就(需求6) */
    vt.push({ title: "成就", items: [
      { type: "button", id: "achv_picker", title: "成就选择器(可多选)", desc: "和物品选择器同款界面, 走游戏原版完成成就接口" },
      { type: "button", id: "achv_all", title: "一键完成全部成就" },
      { type: "text", title: "完成后到游戏成就界面即可领取对应奖励" }
    ]});
    /* 图鉴(需求8) */
    vt.push({ title: "图鉴", items: [
      { type: "button", id: "atlas_S", title: "解锁全部剧情图鉴" },
      { type: "button", id: "atlas_B", title: "解锁全部生物图鉴" },
      { type: "button", id: "atlas_I", title: "解锁全部物品图鉴" },
      { type: "button", id: "atlas_ALL", title: "一键解锁全部图鉴" },
      { type: "text", title: M.atlasText || atlasInfo() }
    ]});
    /* 宠物(需求9/10) */
    var eg = M.eagle;
    vt.push({ title: "宠物", items: [
      { type: "text", title: "— 金雕 —" },
      { type: "input", id: "eg_blood", title: "活力值", val: String(nv("eg_blood", ~~ok(function () { return HYData.get("base.eagle.blood"); }) || 0)) },
      { type: "input", id: "eg_blood_max", title: "活力上限(0=默认)", val: String(nv("eg_blood_max", eg.bloodMax || 0)) },
      { type: "input", id: "eg_friend", title: "羁绊值", val: String(nv("eg_friend", ~~ok(function () { return HYData.get("base.eagle.friendship"); }) || 0)) },
      { type: "input", id: "eg_friend_max", title: "羁绊上限(0=默认)", val: String(nv("eg_friend_max", eg.friendMax || 0)) },
      { type: "button", id: "eg_apply", title: "应用金雕数值" },
      { type: "text", title: "— 狼 —" },
      { type: "input", id: "wolf_life", title: "生命值", val: String(nv("wolf_life", ~~ok(function () { return HYData.get("core.pets.1.7003"); }) || 0)) },
      { type: "input", id: "wolf_life_max", title: "生命上限", val: String(nv("wolf_life_max", ~~ok(function () { return HYData.get("core.pets.1.7002"); }) || 0)) },
      { type: "input", id: "wolf_hunger", title: "饥饿度", val: String(nv("wolf_hunger", ~~ok(function () { return HYData.get("core.pets.1.7006"); }) || 0)) },
      { type: "input", id: "wolf_hunger_max", title: "饥饿上限", val: String(nv("wolf_hunger_max", ~~ok(function () { return HYData.get("core.pets.1.7048"); }) || 0)) },
      { type: "input", id: "wolf_royal", title: "忠诚度", val: String(nv("wolf_royal", ~~ok(function () { return HYData.get("core.pets.1.7028"); }) || 0)) },
      { type: "input", id: "wolf_royal_max", title: "忠诚上限", val: String(nv("wolf_royal_max", ~~ok(function () { return HYData.get("core.pets.1.7049"); }) || 0)) },
      { type: "button", id: "wolf_apply", title: "应用狼数值" }
    ]});
    /* 机关甲人 (v3.2.0: 任意部件 + 等级) */
    var rbW = robotWear();
    var rbItems = [
      { type: "button", id: "rb_unlock_entrance", title: "解锁机关甲人(含制作台)", desc: "还没通关剧情解锁甲人时用" },
      { type: "text", title: "核心 " + robotName(rbW[0]) + " Lv." + robotLevel(rbW[0]) + "  |  手臂 " + robotName(rbW[1]) + " Lv." + robotLevel(rbW[1]) },
      { type: "text", title: "躯干 " + robotName(rbW[2]) + " Lv." + robotLevel(rbW[2]) + "  |  足部 " + robotName(rbW[3]) + " Lv." + robotLevel(rbW[3]) },
      { type: "button", id: "rb_unlock_all", title: "解锁全部 17 个组件", desc: "解锁后可在游戏更换面板里看到并装备" },
      { type: "button", id: "rb_max_all", title: "全部组件等级拉满", desc: "17 个组件全部升到 19 级" },
      { type: "button", id: "rb_max_wear", title: "当前装备的 4 个组件满级" },
      { type: "text", title: "— 更换组件 —" }
    ];
    for (var rs = 0; rs < ROBOT_SECTIONS.length; rs++) {
      var RS = ROBOT_SECTIONS[rs];
      rbItems.push({ type: "button", id: "rb_pick_" + rs, title: "更换" + RS.name + "组件", desc: "当前 " + robotName(rbW[rs]) + " / 共 " + RS.ids.length + " 种" });
    }
    rbItems.push({ type: "text", title: "— 设置等级(1-19) —" });
    for (rs = 0; rs < ROBOT_SECTIONS.length; rs++) {
      rbItems.push({ type: "input", id: "rb_lv" + rs, title: ROBOT_SECTIONS[rs].name + " 等级", val: String(nv("rb_lv" + rs, robotLevel(rbW[rs]))) });
    }
    rbItems.push({ type: "button", id: "rb_apply_lv", title: "应用等级设置" });
    rbItems.push({ type: "switch", id: "rb_lock", title: "锁定甲人修改(防服务器刷新覆盖)", val: sv("rb_lock", false) });
    rbItems.push({ type: "text", title: "MOD 改的是本地存档+内存; 开启锁定后服务器刷新也会被覆盖" });
    vt.push({ title: "甲人", items: rbItems });
    /* 建筑(需求11) */
    vt.push({ title: "建筑", items: [
      { type: "switch", id: "lockBuildDur", title: "锁定建筑耐久(不再掉耐久)", val: sv("lockBuildDur", buff.lockBuildDur) },
      { type: "button", id: "build_fix", title: "全部建筑耐久修复至上限" },
      { type: "text", title: "锁定后: 恶劣天气/怪物袭击/怪潮拆家都不会再掉耐久" },
      { type: "text", title: "— 建筑等级修改(v3.2.0) —" },
      { type: "button", id: "build_picker", title: "选择建筑(看当前等级)", desc: "列出全部建筑与可选等级" },
      { type: "text", title: buildInfoText() },
      { type: "button", id: "build_lvl_picker", title: "选择该建筑的等级并应用", desc: "3级分支建筑(工作间/淬毒台)会列出 3 / 3_1" },
      { type: "input", id: "bld_id", title: "或直接输入建筑ID", val: pv("bld_id", "") },
      { type: "input", id: "bld_lv", title: "目标等级(1/2/3/3_1)", val: pv("bld_lv", "") },
      { type: "button", id: "build_apply", title: "应用输入的建筑ID+等级" },
      { type: "button", id: "build_max_all", title: "全部建筑升到满级", desc: "分支建筑保留当前分支; 只处理已建成的" }
    ]});
    /* 天赋 (v3.2.0): 一键解锁全部(含非卖品) */
    var tally = talentUnlockInfo();
    vt.push({ title: "天赋", items: [
      { type: "text", title: "已解锁 " + tally.n + " / " + tally.total + " 个天赋(不含'无')" },
      { type: "button", id: "talent_unlock_all", title: "一键解锁全部天赋", desc: "含商店买不到的特殊天赋, 共23个" },
      { type: "button", id: "talent_max_all", title: "全部天赋强化至 ★3" },
      { type: "button", id: "talent_full_all", title: "解锁全部 + 全部★3" },
      { type: "text", title: "解锁后即可在游戏天赋界面选择; ★3 为游戏上限" }
    ]});
    /* 设置(需求12 等) */
    vt.push({ title: "设置", items: [
      { type: "switch", id: "persist", title: "保存功能首选项(重启后保留)", val: sv("persist", M.persist) },
      { type: "text", title: M.persist ? "已开启: 退出重启后开关/输入仍保留" : "已关闭(默认): 重启后全部恢复默认, 不写入本地" },
      { type: "button", id: "clear_flags2", title: "清除作弊标记(重发一次)" }
    ]});
    for (var vti = 0; vti < vt.length; vti++) tabs.splice(1 + vti, 0, vt[vti]);
  }

  /* ---- 新菜单事件分发 ---- */
  function v3Dispatch(id, val) {
    var on = (val === "1" || val === true);
    if (id === "freePay") { buff.freePay = on; T("内购直接成功 " + (on ? "已开启" : "已关闭")); return true; }
    if (id === "pay_all") { payAllWares(); return true; }
    if (id === "pot_detect") { detectPot(false); return true; }
    if (id === "pot_picker") { openPotPicker(); return true; }
    if (id === "pot_apply") { setPotProgress(V("pot_val")); return true; }
    if (id === "day_apply") { setGameDay(V("day_set")); return true; }
    if (id === "day_add7") { setGameDay((ok(function () { return HYTime.day(); }) || 1) + 7); return true; }
    if (id === "day_add30") { setGameDay((ok(function () { return HYTime.day(); }) || 1) + 30); return true; }
    if (id === "limitedDungeon") { setLimitedDungeons(on); return true; }
    if (id === "achv_picker") { openAchievePicker(); return true; }
    if (id === "achv_all") { completeAllAchieves(); return true; }
    if (id === "atlas_S") { T("剧情图鉴 +" + unlockAtlas("FOR_S")); setTimeout(pushMenu, 200); return true; }
    if (id === "atlas_B") { T("生物图鉴 +" + unlockAtlas("FOR_B")); setTimeout(pushMenu, 200); return true; }
    if (id === "atlas_I") { T("物品图鉴 +" + unlockAtlas("FOR_I")); setTimeout(pushMenu, 200); return true; }
    if (id === "atlas_ALL") { unlockAllAtlas(); return true; }
    if (id === "eg_apply") {
      setEagle({ blood: V("eg_blood"), bloodMax: V("eg_blood_max"), friendship: V("eg_friend"), friendMax: V("eg_friend_max") });
      return true;
    }
    if (id === "wolf_apply") {
      setWolf({ life: V("wolf_life"), lifemax: V("wolf_life_max"), hunger: V("wolf_hunger"), hungermax: V("wolf_hunger_max"), royal: V("wolf_royal"), royalmax: V("wolf_royal_max") });
      return true;
    }
    if (id === "lockBuildDur") { buff.lockBuildDur = on; T("建筑耐久锁定 " + (on ? "已开启" : "已关闭")); return true; }
    if (id === "build_fix") { fixAllBuilds(); return true; }
    if (id === "build_picker") { openBuildPicker(); return true; }
    if (id === "build_lvl_picker") { openBuildLevelPicker(); return true; }
    if (id === "build_apply") { setBuildLevel(V("bld_id"), V("bld_lv")); return true; }
    if (id === "build_max_all") { maxAllBuilds(); return true; }
    if (id === "rb_unlock_entrance") { robotUnlockEntrance(); return true; }
    if (id === "rb_unlock_all") { robotUnlockAll(false); return true; }
    if (id === "rb_max_all") { robotMaxLevels("all"); return true; }
    if (id === "rb_max_wear") { robotMaxLevels("wear"); return true; }
    if (id === "rb_apply_lv") { robotSetLevels(); return true; }
    if (id.indexOf("rb_pick_") === 0) { openRobotPicker(parseInt(id.substring(8), 10)); return true; }
    if (id === "rb_lock") {
      if (on) { installRobotHook(); robotReapply(true); T("甲人修改已锁定(服务器刷新也会被本地配置覆盖)"); }
      else T("甲人锁定已关闭(重启游戏后服务器数据会恢复)");
      setTimeout(pushMenu, 200);
      return true;
    }
    if (id === "talent_unlock_all") { unlockAllTalents(false); return true; }
    if (id === "talent_max_all") { T("全部天赋强化: " + talentMax(false)); setTimeout(pushMenu, 200); return true; }
    if (id === "talent_full_all") { talentFullUnlock(); return true; }
    if (id === "persist") { applyPersist(val); return true; }
    if (id === "clear_flags2") { clearCheatFlags(); return true; }
    if (id === "attr_apply") {
      var ATTRS2 = ["7004", "7005", "7006", "7000", "7001"];
      for (var i = 0; i < ATTRS2.length; i++) {
        var a2 = ATTRS2[i];
        var mv = V("am_" + a2);
        if (mv !== undefined && mv !== "" && !isNaN(parseInt(mv, 10))) setRoleAttrMax(a2, parseInt(mv, 10));
      }
      for (var j = 0; j < ATTRS2.length; j++) {
        var a3 = ATTRS2[j], cv = V("av_" + a3);
        if (cv !== undefined && cv !== "" && !isNaN(parseInt(cv, 10))) {
          var av3 = parseInt(cv, 10);
          setRoleAttr(a3, av3);
          /* 已开锁定的项: 锁存值跟随刚应用的新值(否则会立刻被旧锁存值回写) */
          if (M.locked[a3] !== undefined) { M.locked[a3] = av3; log("锁定值跟随 " + a3 + " = " + av3); }
        }
      }
      T("属性数值已应用");
      return true;
    }
    if (id.indexOf("lk_") === 0) {
      var lid = id.substring(3);
      if (on) { lockAttrCurrent(lid); } else { delete M.locked[lid]; T("已取消锁定 " + (ATTR_NAMES[lid] || lid)); }
      return true;
    }
    if (id === "lockAllAttrs") {
      var AA = ["7004", "7005", "7006", "7000", "7001"];
      if (on) { for (var x = 0; x < AA.length; x++) lockAttrCurrent(AA[x]); T("已一键锁定全部状态"); }
      else { M.locked = {}; T("已取消全部锁定"); }
      return true;
    }
    return false;
  }
  function v3Pick(o) {
    var action = o.action || "grant";
    if (action === "achieve") {
      var ids = o.ids || [], n = 0;
      for (var i = 0; i < ids.length; i++) if (completeAchieve(String(ids[i]))) n++;
      ok(function () { HYData.trySave(); });
      T("已完成 " + n + " 项成就");
      return true;
    }
    if (action === "potprog") {
      var sel = (o.ids && o.ids.length) ? o.ids[0] : o.count;
      setPotProgress(parseInt(sel, 10));
      return true;
    }
    if (action.indexOf("robot:") === 0) {
      var rbSec = parseInt(action.substring(6), 10);
      if (o.ids && o.ids.length) robotEquip(rbSec, String(o.ids[0]));
      return true;
    }
    if (action === "build:") {
      if (o.ids && o.ids.length) {
        M.vals["bld_id"] = String(o.ids[0]); M.vals["bld_lv"] = ""; M.saveVals();
        T("已选建筑 " + o.ids[0] + " (当前 " + (buildCurLevel(String(o.ids[0])) || 0) + " 级)");
        setTimeout(pushMenu, 200);
      }
      return true;
    }
    if (action.indexOf("buildlvl:") === 0) {
      if (o.ids && o.ids.length) setBuildLevel(action.substring(9), String(o.ids[0]));
      return true;
    }
    return false;
  }

  function installV3Hooks() {
    if (H.v3) return; H.v3 = true;
    M.setGameDay = setGameDay; M.detectPot = detectPot; M.setPotProgress = setPotProgress;
    M.openPotPicker = openPotPicker; M.completeAchieve = completeAchieve; M.completeAllAchieves = completeAllAchieves;
    M.openAchievePicker = openAchievePicker; M.unlockAtlas = unlockAtlas; M.unlockAllAtlas = unlockAllAtlas;
    M.atlasInfo = atlasInfo; M.setEagle = setEagle; M.setWolf = setWolf; M.fixAllBuilds = fixAllBuilds;
    M.setLimitedDungeons = setLimitedDungeons; M.hookSceneMainNow = hookSceneMainNow;
    M.setRoleAttr = setRoleAttr; M.setRoleAttrMax = setRoleAttrMax;
    M.lockAttrCurrent = lockAttrCurrent; M.restoreLockedAttrs = restoreLockedAttrs;
    M.robotEquip = robotEquip; M.robotSetLevels = robotSetLevels; M.robotMaxLevels = robotMaxLevels;
    M.robotUnlockAll = robotUnlockAll; M.robotUnlockEntrance = robotUnlockEntrance;
    M.robotLevel = robotLevel; M.robotWear = robotWear; M.robotExpForLevel = robotExpForLevel;
    M.setBuildLevel = setBuildLevel; M.maxAllBuilds = maxAllBuilds; M.buildLevels = buildLevels;
    M.openBuildPicker = openBuildPicker; M.openBuildLevelPicker = openBuildLevelPicker;
    M.unlockAllTalents = unlockAllTalents; M.talentFullUnlock = talentFullUnlock;
    M.installMoodSkipHook = installMoodSkipHook; M.addMoodSkipButton = addMoodSkipButton;
    M.installRobotHook = installRobotHook;
    buff.freePay = sv("freePay", false);
    buff.lockBuildDur = sv("lockBuildDur", false);
    buff.limitedDungeon = sv("limitedDungeon", false);
    M.eagle.bloodMax = Math.max(0, nv("eg_blood_max", 0));
    M.eagle.friendMax = Math.max(0, nv("eg_friend_max", 0));
    var AA0 = ["7004", "7005", "7006", "7000", "7001"];
    var lockAll0 = sv("lockAllAttrs", false);
    for (var q = 0; q < AA0.length; q++) {
      if (lockAll0 || sv("lk_" + AA0[q], false)) {
        var lv0 = ok(function () { return HYData.get("core.role." + AA0[q]); });
        if (lv0 !== undefined && lv0 !== null) M.locked[AA0[q]] = ~~lv0;
      }
    }
    if (lockAll0) log("启动恢复: 已锁定全部状态 " + JSON.stringify(M.locked));
    installEagleHooks();
    installBuildDurSetHook();
    installRobotHook();
    installMoodSkipHook();
    fillRobotNames();
    setInterval(function () { ok(function () { installNoBanHooks(); installMoodSkipHook(); installRobotHook(); fillRobotNames(); }); }, 2000);
    setTimeout(function () { ok(function () { installNoBanHooks(); installMoodSkipHook(); installRobotHook(); fillRobotNames(); }); }, 300);
    setTimeout(function () { ok(function () { clearCheatFlags(true); }); }, 1500);
    if (buff.limitedDungeon) setTimeout(function () { ok(function () { setLimitedDungeons(true, true); }); }, 2000);
    setInterval(function () { if (buff.limitedDungeon) ok(function () { spreadLimitedPots(); }); }, 2500);
    log("v3 钩子已安装: freePay=" + buff.freePay + " lockBuildDur=" + buff.lockBuildDur + " limited=" + buff.limitedDungeon);
  }


  function num(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }

  /* ---------------- 控件状态记忆 (localStorage) ---------------- */
  if (!M.vals) M.vals = {};
  ok(function () {
    var s = M.persist ? cc.sys.localStorage.getItem("hymod_vals2") : null;
    if (s) { var o = JSON.parse(s); if (o) for (var k in o) M.vals[k] = o[k]; }
  }, "vals");
  function saveVals() { if (!M.persist) return; ok(function () { cc.sys.localStorage.setItem("hymod_vals2", JSON.stringify(M.vals)); }); }
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
    /* 2. 战斗 (原"属性"页: 血量写入 + 战斗数值) */
    tabs.push({ title: "战斗", items: [
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
      { type: "text", title: "荒野日记:孤岛 MOD v3.2.0 (原生菜单)" },
      { type: "text", title: "v3.2.0 新增: 机关甲人部件/等级 / 建筑等级(含3级分支) / 天赋一键全解锁 / 心情笔记跳过按钮" },
      { type: "text", title: "游戏渠道: " + (ok(function () { return dy.utils.channel(); }) || "未知") + "  GAME_VER " + (ok(function () { return dy.config.GAME_VER; }) || "") },
      { type: "text", title: "菜单: 拖动悬浮球移动, 点击打开/关闭" },
      { type: "text", title: "滑块/开关会自动记忆; 纯本地修改项不会上传服务器" }
    ]});
    v3Tabs(tabs);
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
    if (v3Dispatch(id, val)) return;
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
      if (v3Pick(o)) return;
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
    installV3Hooks();
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
