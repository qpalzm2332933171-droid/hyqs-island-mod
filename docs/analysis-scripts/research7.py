# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
i = s.find('window.HYRoleSkin')
if i < 0:
    i = s.find('HYRoleSkin =')
seg = s[i:i+60000]
out = []
for m in re.finditer(r'\n\s{6,10}([A-Za-z_][A-Za-z0-9_]*): function', seg):
    out.append('%s  @%d' % (m.group(1), i + m.start()))
io.open(r'work\dump\_res6.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('methods:', len(out))
