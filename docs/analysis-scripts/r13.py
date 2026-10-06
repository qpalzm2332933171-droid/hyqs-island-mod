# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
for key in ['getLockNumByTag', 'getLockNumByRole', 'getTechMaxLevel', 'techItem', 'techSkin', 'techRole']:
    out.append('\n########## ' + key)
    for m in re.finditer(re.escape(key), s):
        i = m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-320):i+320])
        if len(out) > 60: break
io.open(r'work\dump\_tech3.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
