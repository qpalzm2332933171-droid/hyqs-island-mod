/* ================= HYMOD UI v2 (菜单界面, 挂载 Canvas) ================= */
(function () {
  var M = window.HYMOD;
  if (!M || M.uiReady2) return;

  var root = null, panel = null, floatBtn = null, keypadNode = null;
  var page = 0, PER_PAGE = 11, STEP = 80;

  function sceneName() { try { var s = cc.director.getScene(); return s ? (s.name || "?") : "?"; } catch (e) { return "?"; } }
  function hostNode() {
    try {
      if (window.dy && dy.theRoot && dy.theRoot.node) {
        var par = dy.theRoot.node.parent;
        if (par && cc.isValid(par)) return par;
      }
    } catch (e) {}
    try { var cv = cc.find("Canvas"); if (cv && cc.isValid(cv)) return cv; } catch (e) {}
    try {
      var sc = cc.director.getScene();
      if (sc && sc.children && sc.children.length) {
        for (var i = 0; i < sc.children.length; i++) {
          var c = sc.children[i];
          if (c && cc.isValid(c) && String(c.name).indexOf("Canvas") > -1) return c;
        }
        for (var j = 0; j < sc.children.length; j++) {
          var d = sc.children[j];
          try { if (d && cc.isValid(d) && d.getComponentInChildren && d.getComponentInChildren(cc.Camera)) return d; } catch (e2) {}
        }
        return sc;
      }
    } catch (e) {}
    return cc.director.getScene();
  }
  function canvasOffset(host) {
    try {
      var cv = cc.find("Canvas");
      if (cv && cc.isValid(cv)) {
        if (cv.parent === host) return { x: cv.x, y: cv.y };
        var wp = cv.convertToWorldSpaceAR(cc.v2(0, 0));
        var lp = host.convertToNodeSpaceAR(wp);
        return { x: lp.x, y: lp.y };
      }
    } catch (e) {}
    return { x: 0, y: 0 };
  }
  function topmost(host) {
    try {
      if (root && cc.isValid(root) && root.parent === host) root.setSiblingIndex(host.children.length - 1);
      if (floatBtn && cc.isValid(floatBtn)) {
        var fs = hostSize(host);
        var fx = -fs.w / 2 + 62, fy = fs.h / 2 - 62;
        if (floatBtn.x !== fx || floatBtn.y !== fy) floatBtn.setPosition(fx, fy);
      }
    } catch (e) {}
  }
  function hostSize(node) {
    var w = node.width || 720, h = node.height || 1280;
    if (!node.width) { try { var s = cc.director.getVisibleSize(); w = s.width; h = s.height; } catch (e) {} }
    return { w: w, h: h };
  }

  function mkNode(parent, w, h, x, y) {
    var n = new cc.Node();
    if (w || h) n.setContentSize(w || 0, h || 0);
    n.setAnchorPoint(0.5, 0.5);
    n.setPosition(x || 0, y || 0);
    parent.addChild(n);
    return n;
  }
  function drawRect(node, w, h, rgba, radius) {
    try { node.setContentSize(w, h); } catch (e) {}
    var g = node.getComponent(cc.Graphics) || node.addComponent(cc.Graphics);
    g.clear();
    g.fillColor = cc.color(rgba[0], rgba[1], rgba[2], rgba[3] === undefined ? 255 : rgba[3]);
    if (radius) g.roundRect(0, 0, w, h, radius); else g.rect(0, 0, w, h);
    g.fill();
    return g;
  }
  function mkText(parent, text, size, color, x, y, w, h) {
    var n = mkNode(parent, w || 10, h || 10, x, y);
    var l = n.addComponent(cc.Label);
    l.string = String(text);
    l.fontSize = size;
    l.lineHeight = Math.round(size * 1.2);
    try { l.useSystemFont = true; } catch (e) {}
    try {
      l.overflow = cc.Label.Overflow.CLAMP;
      l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      l.verticalAlign = cc.Label.VerticalAlign.CENTER;
    } catch (e) {}
    if (w || h) n.setContentSize(w || 10, h || 10);
    n.color = cc.color(color[0], color[1], color[2], color[3] === undefined ? 255 : color[3]);
    return l;
  }
  var BG = [38, 62, 96, 235];
  function mkButton(parent, text, x, y, w, h, cb, bg) {
    var n = mkNode(parent, w, h, x, y);
    var col = bg || BG;
    drawRect(n, w, h, col, 10);
    mkText(n, text, Math.min(28, Math.max(18, Math.round(h * 0.42))), [235, 245, 255], 0, 0, w - 16, h);
    n.on(cc.Node.EventType.TOUCH_START, function () { drawRect(n, w, h, [90, 140, 210, 255], 10); });
    var restore = function () { drawRect(n, w, h, col, 10); };
    n.on(cc.Node.EventType.TOUCH_END, function () { restore(); try { cb(); } catch (e) { M.logs.push("btn: " + e); } });
    n.on(cc.Node.EventType.TOUCH_CANCEL, restore);
    return n;
  }

  function onOff(b) { return b ? "开" : "关"; }

  function menuItems() {
    var M = window.HYMOD;
    return [
      { h: "== 安全 / 反封号 ==" },
      { t: "拦截作弊上报 clientlog: " + onOff(M.cfg.safeLog), f: function () { M.cfg.safeLog = !M.cfg.safeLog; saveCfgUi(); } },
      { t: "跳过每日物品检查: " + onOff(M.cfg.safeCheckItem), f: function () { M.cfg.safeCheckItem = !M.cfg.safeCheckItem; saveCfgUi(); } },
      { t: "自动保存存档: " + onOff(M.cfg.autoSave), f: function () { M.cfg.autoSave = !M.cfg.autoSave; saveCfgUi(); } },
      { t: "★ 清除封号标记并上传", f: function () { M.clearCheatFlags(); } },

      { h: "== 物品 (写存档 / 会联网) ==" },
      { t: "一键全物品 (安全数量)", f: function () { M.grantAll(99, true); } },
      { t: "一键全物品 x999 (激进)", f: function () { M.grantAll(999, false); } },
      { t: "自定义添加物品 ID:数量", f: function () { keypad("物品ID", "", function (id) { keypad("数量", "99", function (n) { var o = {}; o[id] = parseInt(n) || 1; M.addItems(o); M.T("已添加 " + id + " x" + n); }); }); } },
      { t: "邮件式发奖 (goods;coin)", f: function () { keypad("物品串 例 4438:99;4500:5", "", function (s) { keypad("贝壳数量", "0", function (c) { M.grantByMailGoods(s, c); }); }); } },
      { t: "清空背包 (危险)", f: function () { M.clearBag(); } },
      { t: "查看上次存档上传返回码", f: function () { var u = M.lastUpd; M.T(u ? ("updatedata " + u.code + " keys=" + u.keys) : "none"); } },

      { h: "== 角色属性 (本地 / 不联网) ==" },
      { t: "攻击 +1000", f: function () { M.buff.atk = 1000; M.T("攻击 +1000"); } },
      { t: "防御 +1000", f: function () { M.buff.def = 1000; M.T("防御 +1000"); } },
      { t: "闪避 +500", f: function () { M.buff.dodge = 500; M.T("闪避 +500"); } },
      { t: "命中 +500", f: function () { M.buff.hit = 500; M.T("命中 +500"); } },
      { t: "移速 x" + M.buff.moveMul + " (点击切换2倍)", f: function () { M.buff.moveMul = M.buff.moveMul === 1 ? 2 : 1; M.T("移速 x" + M.buff.moveMul); render(); } },
      { t: "攻速 x" + M.buff.atkSpd + " (点击切换2倍)", f: function () { M.buff.atkSpd = M.buff.atkSpd === 1 ? 2 : 1; M.T("攻速 x" + M.buff.atkSpd); render(); } },
      { t: "自定义移速倍率", f: function () { keypad("移速倍率", "3", function (v) { M.buff.moveMul = parseFloat(v) || 1; M.T("移速 x" + M.buff.moveMul); render(); }); } },
      { t: "负重 +999", f: function () { M.buff.load = 999; M.T("负重 +999"); } },
      { t: "清除全部角色增益", f: function () { M.buff.atk = M.buff.def = M.buff.dodge = M.buff.hit = M.buff.load = 0; M.buff.moveMul = M.buff.atkSpd = 1; M.T("已清除"); render(); } },

      { h: "== 装备强化 (本地 / 不联网) ==" },
      { t: "装备强化: " + onOff(M.equipBuff.on) + " 攻x" + M.equipBuff.atkMul + " 防x" + M.equipBuff.defMul + " 距x" + M.equipBuff.disMul, f: function () { M.applyEquipBuff(!M.equipBuff.on); render(); } },
      { t: "设置强化倍率 (攻/防/距)", f: function () { keypad("攻击倍率", String(M.equipBuff.atkMul), function (a) { keypad("防御倍率", String(M.equipBuff.defMul), function (d) { keypad("距离倍率", String(M.equipBuff.disMul), function (r) { M.equipBuff.atkMul = parseFloat(a) || 1; M.equipBuff.defMul = parseFloat(d) || 1; M.equipBuff.disMul = parseFloat(r) || 1; if (M.equipBuff.on) { M.applyEquipBuff(false); M.applyEquipBuff(true); } M.T("倍率已更新"); render(); }); }); }); } },

      { h: "== 玩法 ==" },
      { t: "冷却清零 86400000 to 1", f: function () { M.clearCooldowns(); } },
      { t: "本局得分加成: " + onOff(M.scoreAdd.on) + " x" + M.scoreAdd.mul, f: function () { M.scoreAdd.on = !M.scoreAdd.on; M.T("得分加成 " + onOff(M.scoreAdd.on)); render(); } },
      { t: "设置得分倍率", f: function () { keypad("得分倍率", String(M.scoreAdd.mul), function (v) { M.scoreAdd.mul = parseFloat(v) || 1; M.scoreAdd.on = true; M.T("得分 x" + M.scoreAdd.mul); render(); }); } },
      { t: "切换皮肤", f: function () { openSkinMenu(); } },

      { h: "== 调试 ==" },
      { t: "查看日志", f: function () { openLog(); } },
      { t: "重建UI", f: function () { if (root && cc.isValid(root)) root.destroy(); root = null; build(); openPanel(); } }
    ];
  }
  function saveCfgUi() { try { cc.sys.localStorage.setItem("hymod_cfg", JSON.stringify(M.cfg)); } catch (e) {} render(); }

  function closePanel() { if (panel && cc.isValid(panel)) panel.active = false; }
  function openPanel() { if (panel && cc.isValid(panel)) { panel.active = true; render(); } }
  M.showPanel = function () { build(); openPanel(); };

  function panelBox() {
    var host = hostNode(), hs = hostSize(host);
    return { W: Math.min(hs.w - 20, 700), H: Math.min(hs.h - 40, 1180) };
  }
  function render() {
    if (!panel || !cc.isValid(panel)) return;
    panel.removeAllChildren();
    var b = panelBox(), W = b.W, H = b.H;
    drawRect(panel, W, H, [12, 20, 32, 245], 16);
    mkText(panel, "MOD v" + M.ver + "  " + M.diag, 22, [120, 220, 255], 0, H / 2 - 40, W - 120, 44);
    var divider = mkNode(panel, W, 2, 0, H / 2 - 68); drawRect(divider, W, 2, [60, 110, 170, 255]);
    mkButton(panel, "X", W / 2 - 44, H / 2 - 40, 56, 56, closePanel, [150, 40, 40, 240]);
    var items = menuItems();
    var maxPage = Math.max(0, Math.ceil(items.length / PER_PAGE) - 1);
    if (page > maxPage) page = maxPage;
    var start = page * PER_PAGE, end = Math.min(items.length, start + PER_PAGE);
    var top = H / 2 - 112;
    for (var i = start; i < end; i++) {
      var it = items[i], y = top - (i - start) * STEP;
      if (it.h) mkText(panel, it.h, 22, [150, 210, 150], 0, y, W - 40, 40);
      else (function (it) { mkButton(panel, it.t, 0, y, W - 40, 68, it.f); })(it);
    }
    var by = -H / 2 + 46;
    mkButton(panel, "上一页", -W / 4, by, 180, 60, function () { page = Math.max(0, page - 1); render(); });
    mkText(panel, (page + 1) + "/" + (maxPage + 1), 24, [200, 220, 240], 0, by, 140, 60);
    mkButton(panel, "下一页", W / 4, by, 180, 60, function () { page = Math.min(maxPage, page + 1); render(); });
  }

  function openSkinMenu() {
    if (!panel || !cc.isValid(panel)) return;
    panel.removeAllChildren();
    var b = panelBox(), W = b.W, H = b.H;
    drawRect(panel, W, H, [12, 20, 32, 245], 16);
    mkText(panel, "皮肤切换", 30, [120, 220, 255], 0, H / 2 - 40, W - 120, 44);
    mkButton(panel, "X", W / 2 - 44, H / 2 - 40, 56, 56, function () { render(); }, [150, 40, 40, 240]);
    var ids = Object.keys(M.SKINS), top = H / 2 - 100;
    for (var i = 0; i < ids.length && i < 14; i++) {
      (function (id) { mkButton(panel, id + " " + M.SKINS[id], 0, top - i * 74, W - 40, 64, function () { M.setSkin(id); }); })(ids[i]);
    }
  }
  function openLog() {
    if (!panel || !cc.isValid(panel)) return;
    panel.removeAllChildren();
    var b = panelBox(), W = b.W, H = b.H;
    drawRect(panel, W, H, [12, 20, 32, 245], 16);
    mkText(panel, "日志", 30, [120, 220, 255], 0, H / 2 - 40, W - 120, 44);
    mkButton(panel, "X", W / 2 - 44, H / 2 - 40, 56, 56, function () { render(); }, [150, 40, 40, 240]);
    var arr = M.logs.slice(-15), top = H / 2 - 90;
    for (var i = 0; i < arr.length; i++) mkText(panel, arr[i].substr(0, 42), 18, [200, 220, 240], 0, top - i * 62, W - 40, 60);
  }

  function keypad(title, def, cb) {
    if (!keypadNode || !cc.isValid(keypadNode)) return;
    keypadNode.removeAllChildren();
    keypadNode.active = true;
    var b = panelBox(), W = Math.min(b.W, 620), H = 780;
    drawRect(keypadNode, W, H, [10, 16, 28, 252], 16);
    mkText(keypadNode, title, 24, [120, 220, 255], 0, H / 2 - 36, W - 30, 44);
    var buf = String(def || "");
    var disp = mkText(keypadNode, buf || "_", 38, [255, 240, 140], 0, H / 2 - 96, W - 30, 50);
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "清空", "0", "."];
    for (var i = 0; i < keys.length; i++) {
      (function (k, i) {
        var col = i % 3, row = Math.floor(i / 3);
        var x = (col - 1) * (W / 3 - 6), y = H / 2 - 175 - row * 84;
        mkButton(keypadNode, k, x, y, W / 3 - 26, 72, function () {
          if (k === "清空") buf = ""; else buf += k;
          disp.string = buf || "_";
        }, [30, 44, 66, 240]);
      })(keys[i], i);
    }
    mkButton(keypadNode, "取消", -W / 4, -H / 2 + 54, 200, 72, function () { keypadNode.active = false; }, [90, 40, 40, 240]);
    mkButton(keypadNode, "确定", W / 4, -H / 2 + 54, 200, 72, function () { keypadNode.active = false; cb && cb(buf); }, [30, 100, 60, 245]);
  }
  M.keypad = keypad;

  function diag() {
    var s = "";
    try {
      var vs = cc.director.getVisibleSize();
      var cv = cc.find("Canvas");
      s = "cv " + (cv ? (Math.round(cv.width) + "x" + Math.round(cv.height) + " s" + cv.scaleX.toFixed(2)) : "-") + " vis " + Math.round(vs.width) + "x" + Math.round(vs.height);
    } catch (e) { s = "diag err " + e; }
    M.diag = s;
    return s;
  }
  M.diag = "";
  function build() {
    var host = hostNode();
    if (!host || !host.isValid) return;
    var hs = hostSize(host);
    if (root && cc.isValid(root) && root.parent === host) { diag(); return; }
    if (root && cc.isValid(root)) root.destroy();
    var off = canvasOffset(host);
    root = mkNode(host, hs.w, hs.h, off.x, off.y);
    root.zIndex = 20000;
    root.name = "HYMOD_ROOT";
    floatBtn = mkNode(root, 88, 88, -hs.w / 2 + 62, hs.h / 2 - 62);
    drawRect(floatBtn, 88, 88, [20, 90, 140, 235], 44);
    mkText(floatBtn, "M", 44, [255, 255, 255], 0, 0, 80, 80);
    floatBtn.on(cc.Node.EventType.TOUCH_END, function () {
      if (panel && cc.isValid(panel)) { panel.active = !panel.active; if (panel.active) render(); }
    });
    panel = mkNode(root, 10, 10, 0, 0);
    panel.active = false;
    keypadNode = mkNode(root, 10, 10, 0, 0);
    keypadNode.active = false;
    topmost(host);
    diag();
    var wp = ""; try { var w = root.convertToWorldSpaceAR(cc.v2(0, 0)); var v = cc.director.getVisibleSize(); wp = " rootWorld=" + Math.round(w.x) + "," + Math.round(w.y) + " off=" + off.x + "," + off.y + " vis=" + Math.round(v.width) + "x" + Math.round(v.height); var nm = []; for (var ci = 0; ci < host.children.length; ci++) { var cc2 = host.children[ci]; nm.push(cc2.name + "@" + Math.round(cc2.x) + "," + Math.round(cc2.y) + "z" + cc2.zIndex); } wp += " kids=[" + nm.join(" ") + "]"; } catch (e2) { wp = " wpErr " + e2; }
    M.log("UI rebuild scene=" + sceneName() + " host=" + host.name + " z=" + root.zIndex + " sib=" + (root ? root.getSiblingIndex() : -1) + " ch=" + host.children.length + wp + " " + M.diag);
  }
  M.buildUI = build;

  var lastHost = null;
  setInterval(function () {
    try {
      var host = hostNode();
      if (!host) return;
      if (host !== lastHost || !root || !cc.isValid(root) || root.parent !== host) {
        lastHost = host;
        M.log("host change -> " + host.name + " @" + sceneName());
        build();
      } else topmost(host);
    } catch (e) {}
  }, 1000);
  setInterval(function () {
    if (true) return;
    try {
      var out = [];
      out.push("win=" + cc.winSize.width + "x" + cc.winSize.height);
      try { var vs = cc.view.getVisibleSize(); out.push("vis=" + Math.round(vs.width) + "x" + Math.round(vs.height)); } catch (e) {}
      var cv = cc.find("Canvas");
      if (cv && cc.isValid(cv)) {
        var cw = cv.convertToWorldSpaceAR(cc.v2(0, 0));
        out.push("cv=" + Math.round(cw.x) + "," + Math.round(cw.y) + " sz=" + Math.round(cv.width) + "x" + Math.round(cv.height) + " sc=" + cv.scaleX + " par=" + (cv.parent ? cv.parent.name : "-"));
      }
      if (root && cc.isValid(root)) {
        var rw = root.convertToWorldSpaceAR(cc.v2(0, 0));
        out.push("root=" + Math.round(root.x) + "," + Math.round(root.y) + " w=" + Math.round(rw.x) + "," + Math.round(rw.y) + " sz=" + Math.round(root.width) + "x" + Math.round(root.height) + " sc=" + root.scaleX + " par=" + (root.parent ? root.parent.name : "-"));
      }
      if (floatBtn && cc.isValid(floatBtn)) {
        var fw = floatBtn.convertToWorldSpaceAR(cc.v2(0, 0));
        out.push("float=" + Math.round(floatBtn.x) + "," + Math.round(floatBtn.y) + " w=" + Math.round(fw.x) + "," + Math.round(fw.y));
      }
      try {
        var cams = cc.director.getScene().getComponentsInChildren(cc.Camera);
        var cs = [];
        for (var ci = 0; ci < cams.length; ci++) {
          var cm = cams[ci];
          var cp = cm.node.convertToWorldSpaceAR(cc.v2(0, 0));
          cs.push(cm.node.name + "[d" + cm.depth + " m" + cm.cullingMask + " oh" + cm.orthoHeight + " @" + Math.round(cp.x) + "," + Math.round(cp.y) + " L" + cm.node.layer + "]");
        }
        out.push("cams=" + cs.join(" "));
      } catch (e) { out.push("camsErr " + e); }
      try {
        var pr = root && cc.isValid(root) ? root.parent : null;
        if (pr) { var ls = []; for (var li = 0; li < pr.children.length; li++) { var ccx = pr.children[li]; ls.push(ccx.name + ":L" + ccx.layer + ":" + ccx.zIndex); } out.push("kids=" + ls.join(" ")); }
      } catch (e) {}
      try { out.push("rootL=" + (root ? root.layer : -1) + " cvL=" + (cc.find("Canvas") ? cc.find("Canvas").layer : -1) + " theRootL=" + (window.dy && dy.theRoot && dy.theRoot.node ? dy.theRoot.node.layer : -1)); } catch (e) {}
      M.log("DBG " + out.join(" | "));
    } catch (e) { M.log("DBG err " + e); }
  }, 6000);
  if (cc.Director && cc.Director.EVENT_AFTER_SCENE_LAUNCH) {
    cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () { setTimeout(function () { build(); }, 400); });
  }
  M.uiReady2 = true;
})();
