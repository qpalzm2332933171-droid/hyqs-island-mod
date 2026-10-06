# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
a, b = 302311, 304100
seg = s[a:b]
for m in re.finditer(r'[^A-Za-z0-9_]m[^A-Za-z0-9_]', seg):
    p = a + m.start()
    print('@%d : %s' % (p, s[p-120:p+120].replace('\n',' | ')))
