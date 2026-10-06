# -*- coding: utf-8 -*-
import json, io
p = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\role_skin.json', encoding='utf-8'))
ks = list(p.keys()); print('role_skin count', len(ks), ks[:10])
print(json.dumps(p[ks[0]], ensure_ascii=False)[:1200])
print()
s = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\shop_profile.json', encoding='utf-8'))
sk = list(s.keys()); print('shop count', len(sk), sk[:12])
print(json.dumps(s[sk[0]], ensure_ascii=False)[:1200])
