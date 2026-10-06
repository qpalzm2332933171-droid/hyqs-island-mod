# -*- coding: utf-8 -*-
import json, io
t = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\tech_role.json', encoding='utf-8'))
for k in ['1000', '100001', '100003', '100101']:
    print(k, json.dumps(t.get(k), ensure_ascii=False)[:400])
p = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\technology.json', encoding='utf-8'))
for nid in ['3001', '3002', '30001', '300101', '30011']:
    print('tech', nid, json.dumps(p.get(nid), ensure_ascii=False)[:200])
