# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
for m in re.finditer(r'core\.warehouse\.', s):
    i = m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-450):i+250])
io.open(r'work\dump\_wh.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print(len(out)//2)
