# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
i = 302311
seg = s[i:i+2400]
io.open(r'work\dump\_r8.txt','w',encoding='utf-8',errors='ignore').write(seg)
print(seg[900:2400])
