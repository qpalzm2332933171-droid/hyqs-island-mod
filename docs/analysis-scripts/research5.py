# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
def sec(tag, pat, before=250, after=450, limit=6):
    out.append('\n\n########## ' + tag)
    c=0
    for m in re.finditer(pat, s):
        i=m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-before):i+after]); c+=1
        if c>=limit: break
    if c==0: out.append('(none)')
sec('maxLife 7002', r'core\.role\.7002', 200, 350, 5)
sec('base.unlock', r'base\.unlock', 200, 300, 8)
sec('roleSkin', r'core\.roleSkin', 200, 300, 6)
sec('window.HYPlayer', r'window\.HYPlayer\s*=', 100, 200, 3)
io.open(r'work\dump\_res4.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
