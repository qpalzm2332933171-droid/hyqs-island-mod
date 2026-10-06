# -*- coding: utf-8 -*-
import json, io, collections
p = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\technology.json', encoding='utf-8'))
prods = collections.Counter()
for k, v in p.items(): prods[v['productId']] += 1
big = {k: v for k, v in prods.items() if k >= 100000}
print('skin-like productIds:', len(big), list(big.items())[:12])
for nid in ['10000301', '10000302', '10010101', '10010102', '200101']:
    print(nid, json.dumps(p.get(nid), ensure_ascii=False)[:220])
