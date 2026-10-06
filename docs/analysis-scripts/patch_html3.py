# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding="utf-8")
P = r"C:\path\to\workwspace\deliverables\mail-tool\index.html"
s = io.open(P, encoding="utf-8").read()

old_badge = """             '<span class="id">ID '+it.id+(it.w?' \u00b7 \u91cd'+it.w:'')+'</span>'+
             (it.note?'<span class="note">'+it.note+'</span>':'')+"""
new_badge = """             '<span class="id">ID '+it.id+(it.w?' \u00b7 \u91cd'+it.w:'')+'</span>'+
             (it.note?'<span class="note">'+it.note+'</span>':'')+
             (String(it.id)==='100005'?'<span class="note" style="color:#ff9b9b">\u9644\u90ae\u4ef6\u4e0a\u96509</span>':'')+"""

old_gen = """  function gen(){
    var arr = selList();
    if(!arr.length){ toast('\u8bf7\u5148\u52fe\u9009\u7269\u54c1'); return; }
    var dl = $('mdeadline').value;"""
new_gen = """  function gen(){
    var arr = selList();
    if(!arr.length){ toast('\u8bf7\u5148\u52fe\u9009\u7269\u54c1'); return; }
    var clampNote = '';
    for(var ci=0; ci<arr.length; ci++){
      if(String(arr[ci].id)==='100005' && arr[ci].count>9){
        arr[ci].count = 9; state.sel[arr[ci].id] = 9;
        clampNote = ' \u00b7 <span style="color:#ff9b9b">100005(\u5e7f\u544a\u5e01)\u5df2\u5f3a\u5236\u964d\u4e3a9\uff08\u90ae\u4ef6\u4e0a\u96509\uff0c\u8d85\u8fc7\u4f1a\u89e6\u53d1\u5c01\u53f7\u6807\u8bb0\uff09</span>';
      }
    }
    if(clampNote){ renderGrid(); updateStats(); renderSelPanel(); }
    var dl = $('mdeadline').value;"""

old_info = """    $('genInfo').innerHTML = '\u7c7b\u578b '+arr.length+' \u79cd \u00b7 goods '+mail.goods.split(';').length+' \u9879 \u00b7 token <b>'+mail.token+'</b> \u00b7 \u957f\u5ea6 '+txt.length+' \u5b57\u7b26';"""
new_info = """    $('genInfo').innerHTML = '\u7c7b\u578b '+arr.length+' \u79cd \u00b7 goods '+mail.goods.split(';').length+' \u9879 \u00b7 token <b>'+mail.token+'</b> \u00b7 \u957f\u5ea6 '+txt.length+' \u5b57\u7b26'+clampNote;

    var cl = [];
    for(var cj=0; cj<arr.length; cj++) if(String(arr[cj].id)==='100005') cl.push(arr[cj].count);
    if(cl.length) toast('\u5df2\u751f\u6210\uff1b100005 \u6570\u91cf=' + cl[0] + ' (\u22649 \u5b89\u5168)');"""

for tag, old, new in [("badge", old_badge, new_badge), ("gen", old_gen, new_gen), ("info", old_info, new_info)]:
    n = s.count(old)
    print("pattern %-6s count=%d" % (tag, n))
    if n != 1:
        print("ABORT"); sys.exit(1)
    s = s.replace(old, new)
io.open(P, "w", encoding="utf-8", newline="").write(s)
print("patched, len:", len(s))
