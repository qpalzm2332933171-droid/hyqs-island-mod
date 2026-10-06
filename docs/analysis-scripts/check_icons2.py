# -*- coding: utf-8 -*-
import re
s = open(r'work/dump/extract_00_encrypt.js', encoding='utf-8', errors='replace').read()
for pat in ['4463', '4464', '4465', '4472', '4045', '4199', '4052', '100001', '200002']:
    hits = []
    for m in re.finditer(r'Texture/Item/([^"]*' + pat + r'[^"]*)', s):
        hits.append(m.group(1))
    seen = []
    for h in hits:
        if h not in seen: seen.append(h)
    print(pat, '->', seen[:8])
