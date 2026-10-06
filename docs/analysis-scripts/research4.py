# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
for pat in [r'hitClose', r'buff\.atk\b', r'HYFightBuff']:
    out.append('########## ' + pat)
    c=0
    for m in re.finditer(pat, s):
        i=m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-300):i+300]); c+=1
        if c>=6: break
    if c==0: out.append('(none)')
io.open(r'work\dump\_res3.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
