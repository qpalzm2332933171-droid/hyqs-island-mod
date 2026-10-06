# -*- coding: utf-8 -*-
p = r'deliverables/mail-tool/index.html'
s = open(p, encoding='utf-8').read()

s = s.replace(
".item .nm{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".item .nm{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}")
s = s.replace(
".item .id{font-size:11px;color:var(--dim)}",
".item .id{display:block;font-size:11px;color:var(--dim)}")
s = s.replace(
".item .note{font-size:10px;color:var(--warn);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".item .note{display:block;font-size:10px;color:var(--warn);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}")
s = s.replace('>已选数量批量设为…<', '>批量设置已选数量<')

anchor = "  load();\n  if(!$('mdeadline').value) setDeadlineDays(30);"
inject = """  load();
  try{
    var hm = /#sel=([^&]+)/.exec(location.hash);
    if(hm){
      hm[1].split(',').forEach(function(part){
        var kv = part.split(':'); if(kv.length===2){ state.sel[kv[0]] = Math.max(1, parseInt(kv[1])||1); }
      });
    }
  }catch(e){}
  if(!$('mdeadline').value) setDeadlineDays(30);"""
assert anchor in s, 'anchor not found'
s = s.replace(anchor, inject)
open(p, 'w', encoding='utf-8').write(s)
print('patched ok, size', len(s))
