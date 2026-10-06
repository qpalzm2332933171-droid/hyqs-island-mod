# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
a, b = 304100, 305400
print(s[a:b].replace('\r',''))
