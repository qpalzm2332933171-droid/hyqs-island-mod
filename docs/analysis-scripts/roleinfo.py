# -*- coding: utf-8 -*-
import json, io, sys
p = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\role_profile.json', encoding='utf-8'))
print('roles:', list(p.keys()))
r = p[list(p.keys())[0]]
print('fields:', sorted(r.keys()))
import pprint
for k in r:
    if k in ('NAME','DESC','BASE','BUILD','SHOP','SKIN','ROLESKIN'):
        v = r[k]
        s = json.dumps(v, ensure_ascii=False)[:600]
        print('---', k, '->', s)
