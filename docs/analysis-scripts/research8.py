# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
for pat in [r'addSkin: function', r'getSkin: function', r'getSkinList', r'ROLESKIN']:
    out.append('########## ' + pat)
    c=0
    for m in re.finditer(pat, s):
        i=m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-200):i+1400]); c+=1
        if c>=2: break
    if c==0: out.append('(none)')
io.open(r'work\dump\_res7.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
