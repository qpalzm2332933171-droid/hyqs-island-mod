# -*- coding: utf-8 -*-
import json, re
p = r'work/apk/assets/res/import/1f/1ff76e09-d308-4f36-b3a8-448227bf5961.json'
s = open(p, encoding='utf-8', errors='replace').read()
print('size', len(s))
i = s.find('btnTool')
print(s[max(0,i-100):i+600])
print('--- search Chinese-ish strings in file:')
for m in re.finditer(r'\\u([0-9a-fA-F]{4})', s):
    pass
strs = re.findall(r'"([^"]{1,24})"', s)
import collections
cnt = collections.Counter(x for x in strs if not x.startswith('__') and x not in ('cc.Node','cc.Label','cc.Sprite','cc.Button','cc.SpriteFrame','cc.Prefab','cc.Layout','cc.ScrollView','position','scale','color','opacity','active','anchor','size','x','y','width','height'))
for k, v in cnt.most_common(60):
    print('  ', repr(k), v)
