# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
for m in re.finditer(r'window\.([A-Za-z_]+)\s*=', s[505000:527000]):
    print('@%d' % (505000+m.start()), m.group(1))
print('===== updateDuration defs <535000 =====')
i = s.find('updateDuration: function')
while i > 0:
    if i > 535000: break
    print('@%d' % i, s[i:i+180].replace('\n',' | ')[:180])
    i = s.find('updateDuration: function', i+1)
