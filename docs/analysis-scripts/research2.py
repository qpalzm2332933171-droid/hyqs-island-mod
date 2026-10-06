# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
for m in re.finditer(r'getBaseFight\(', s):
    i = m.start()
    print('===== @%d' % i)
    print(s[max(0,i-500):i+500])
    print()
