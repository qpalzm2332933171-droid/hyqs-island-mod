# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
i = s.find('window.HYEquip')
print('window.HYEquip at', i)
if i < 0:
    i = s.find('HYEquip =')
    print('HYEquip = at', i)
seg = s[i:i+50000]
ms = [m.group(1) + ' @%d' % (i+m.start()) for m in re.finditer(r'\n\s{6,10}([A-Za-z_][A-Za-z0-9_]*): function', seg)]
io.open(r'work\dump\_r4.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(ms))
print(len(ms), 'methods')
