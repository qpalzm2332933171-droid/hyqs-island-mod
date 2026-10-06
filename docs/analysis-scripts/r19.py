# -*- coding: utf-8 -*-
import json, io
t = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\tech_role.json', encoding='utf-8'))
print('type', type(t).__name__, 'len', len(t))
ks = list(t.keys())[:10] if isinstance(t, dict) else None
print('keys', ks)
print(json.dumps(t[ks[0]] if ks else t[:2], ensure_ascii=False)[:800])
import collections
if isinstance(t, dict):
    c = collections.Counter(v.get('productId') for v in t.values() if isinstance(v, dict))
    print('productIds', c.most_common(10))
