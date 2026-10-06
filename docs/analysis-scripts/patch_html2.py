# -*- coding: utf-8 -*-
import io, sys
P = r"C:\path\to\workwspace\deliverables\mail-tool\index.html"
s = io.open(P, encoding="utf-8").read()

old = """  $('btnApplyCount').onclick = function(){
    var v = prompt('\u5c06\u5df2\u9009\u7269\u54c1\u7684\u6570\u91cf\u5168\u90e8\u8bbe\u4e3a:', $('defCount').value);
    if(v===null) return; v = Math.max(1, Math.min(99999, parseInt(v)||1));
    for(var id in state.sel){ if(state.sel.hasOwnProperty(id)) state.sel[id]=v; }
    renderGrid(); renderSelPanel(); save();
  };"""
new = """  $('btnApplyCount').onclick = function(){
    var v = Math.max(1, Math.min(99999, parseInt($('defCount').value)||1));
    var n = 0;
    for(var id in state.sel){ if(state.sel.hasOwnProperty(id)){ state.sel[id]=v; n++; } }
    if(!n){ toast('\u8bf7\u5148\u52fe\u9009\u7269\u54c1'); return; }
    renderGrid(); renderSelPanel(); save();
    toast('\u5df2\u5c06 ' + n + ' \u79cd\u7269\u54c1\u7684\u6570\u91cf\u8bbe\u4e3a ' + v);
  };"""

tip_old = """        <li>\u91cd\u542f\u6e38\u620f(\u90ae\u4ef6\u670910\u5206\u949f\u7f13\u5b58) \u2192 \u6253\u5f00\u90ae\u4ef6 \u2192 \u9886\u53d6</li>
      </ol>"""
tip_new = """        <li>\u91cd\u542f\u6e38\u620f(\u90ae\u4ef6\u670910\u5206\u949f\u7f13\u5b58) \u2192 \u6253\u5f00\u90ae\u4ef6 \u2192 \u9886\u53d6</li>
      </ol>
      <div class="tip" style="margin-top:8px">\u5c0f\u6280\u5de7: \u7f51\u5740\u672b\u5c3e\u52a0 <code>#sel=4438:5,4500:10</code> \u53ef\u81ea\u52a8\u9884\u9009\u5e76\u8bbe\u7f6e\u6570\u91cf\u3002</div>"""

n1 = s.count(old); n2 = s.count(tip_old)
print("match1:", n1, "match2:", n2)
if n1 != 1 or n2 != 1:
    print("ABORT: pattern count mismatch"); sys.exit(1)
s = s.replace(old, new).replace(tip_old, tip_new)
io.open(P, "w", encoding="utf-8", newline="").write(s)
print("patched OK, new len:", len(s))
