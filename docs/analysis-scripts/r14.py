# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
seg = s[791000:794500]
io.open(r'work\dump\_tech4.txt','w',encoding='utf-8',errors='ignore').write(seg)
print(len(seg))
