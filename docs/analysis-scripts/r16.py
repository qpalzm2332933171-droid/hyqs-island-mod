# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
i = s.find('HYWarehouse')
print('HYWarehouse at', i)
j = s.find('updateAttr: function', i)
print('updateAttr in HYWarehouse at', j)
print(s[j-1500:j+1500])
