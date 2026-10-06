# -*- coding: utf-8 -*-
import re
d = open('work/dump/project.beauty.js', encoding='utf-8', errors='replace').read()
lines = d.split('\n')
pats = ['"food"', '"tool"', '"prop"', '"inv"', '"spe"', '"drug"', "TYPE ==", "TYPE=="]
import collections
cnt = collections.Counter()
for no, ln in enumerate(lines, 1):
    for p in ['"food"', '"tool"', '"prop"', '"inv"', '"spe"', '"drug"']:
        if p in ln:
            cnt[p] += 1
print(cnt)
# show first few contexts of TYPE comparisons
shown = 0
for no, ln in enumerate(lines, 1):
    if re.search(r'\.TYPE\s*[=!]=|[=!]=\s*e\.TYPE', ln):
        print(no, '|', ln.strip()[:150])
        shown += 1
        if shown > 40: break
