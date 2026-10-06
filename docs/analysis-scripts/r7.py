# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
pat = re.compile(r'scheduleOnce|delayTime|\.schedule\(|setTimeout')
out=[]
for m in pat.finditer(s):
    i=m.start()
    if 285000 < i < 330000:
        out.append('@%d  %s' % (i, s[max(0,i-160):i+220].replace('\n',' | ')[:380]))
io.open(r'work\dump\_r7.txt','w',encoding='utf-8',errors='ignore').write('\n\n'.join(out))
print(len(out), 'hits in fight panel region')
