# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
for tag, pat, lim in [('updateDuration all', r'updateDuration', 6), ('fightCache', r'fightCache', 6), ('schedule', r'scheduleOnce|schedule\(', 4)]:
    out.append('\n########## ' + tag)
    c=0
    for m in re.finditer(pat, s):
        i=m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-260):i+420]); c+=1
        if c>=lim: break
    if c==0: out.append('(none)')
io.open(r'work\dump\_r3.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
