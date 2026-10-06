# -*- coding: utf-8 -*-
import json, io, collections
p = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\technology.json', encoding='utf-8'))
print('technology nodes:', len(p))
bases = collections.Counter()
prods = collections.Counter()
for k, v in p.items():
    bases[10*int(int(v['id'])/10)] += 1
    prods[v['productId']] += 1
print('distinct bases:', len(bases), 'products:', len(prods))
print('sample bases:', list(bases.items())[:6])
t = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\talent_profile.json', encoding='utf-8'))
print('talent count:', len(t), 'keys:', list(t.keys())[:12])
k = list(t.keys())[0]
print('talent sample', k, json.dumps(t[k], ensure_ascii=False)[:500])
bp = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\build_product_profile.json', encoding='utf-8'))
print('build products:', len(bp), list(bp.keys())[:8])
