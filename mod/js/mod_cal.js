/* CAL5: graphics-vs-label ground truth */
(function () {
  var M = window.HYMOD; if (!M) return;
  var Z = 6000, holder = null;
  function build() {
    var cv = null; try { cv = cc.find("Canvas"); } catch (e) {}
    if (!cv) return;
    if (holder && cc.isValid(holder) && holder.parent === cv) return;
    if (holder && cc.isValid(holder)) holder.destroy();
    holder = new cc.Node(); holder.setContentSize(10, 10); holder.setAnchorPoint(0.5, 0.5); holder.setPosition(0, 0);
    cv.addChild(holder); holder.zIndex = Z - 1;
    function mk(w, h, x, y, col, mode, txt) {
      var n = new cc.Node(); n.setContentSize(w, h); n.setAnchorPoint(0.5, 0.5); n.setPosition(x, y);
      holder.addChild(n); n.zIndex = Z;
      var g = n.addComponent(cc.Graphics);
      g.fillColor = cc.color(col[0], col[1], col[2], 255);
      if (mode === 0) g.rect(-w / 2, -h / 2, w, h); else g.rect(0, 0, w, h);
      g.fill();
      var t = new cc.Node(); n.addChild(t); t.zIndex = Z + 1;
      var l = t.addComponent(cc.Label); l.string = txt; l.fontSize = 30; l.useSystemFont = true;
      t.setPosition(0, 0); t.color = cc.color(255, 255, 255);
      return n;
    }
    mk(200, 200, 0, 0, [255, 40, 40], 0, "C");
    mk(200, 200, 250, 0, [40, 255, 40], 0, "R");
    mk(200, 200, 0, 250, [60, 60, 255], 1, "U");
    M.logs.push("CAL5 done");
  }
  setInterval(build, 1500); setTimeout(build, 500);
})();