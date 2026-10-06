# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
for tag, pat in [('getDuration', r'getDuration: function'), ('updateDuration', r'updateDuration: function'),
                 ('isDurable', r'isDurable'), ('fightSpeed', r'fightSpd|battleSpd|speedUp|mFightSpeed|fight_speed'),
                 ('fight text play', r'打点|typeText|mTextSpeed|showDescOne|nextDesc')]:
    out.append('\n########## ' + tag)
    c=0
    for m in re.finditer(pat, s):
        i=m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-200):i+900]); c+=1
        if c>=3: break
    if c==0: out.append('(none)')
io.open(r'work\dump\_r2.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
