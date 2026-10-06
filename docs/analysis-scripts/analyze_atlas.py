# -*- coding: utf-8 -*-
import re
d = open('work/dump/extract_00_encrypt.js', encoding='utf-8', errors='replace').read()
print('--- AutoAtlas entries in settings rawAssets:')
for m in re.finditer(r'"([A-Za-z0-9+/]{20,24})":\["([^"]*AutoAtlas[^"]*)"', d):
    print(' ', m.group(1), '=>', m.group(2))
print('--- any AutoAtlas mentions:')
for m in re.finditer(r'AutoAtlas', d):
    i = m.start()
    print('  ...', d[max(0,i-120):i+60].replace('\n', ' ')[-160:])
