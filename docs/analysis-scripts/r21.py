# -*- coding: utf-8 -*-
import json, io, collections
tech = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\technology.json', encoding='utf-8'))
tr = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\tech_role.json', encoding='utf-8'))
# base10 -> count, per product
byp = collections.defaultdict(lambda: collections.Counter())
for k, v in tech.items():
    b = 10 * (int(v['id']) // 10)
    byp[v['productId']][b] += 1
pids = set()
for k, v in tr.items():
    for t in v.get('techList', []):
        pids.add(int(t))
tot_levels = 0; tot_bases = 0
for p in pids:
    for b, n in byp[p].items():
        tot_levels += n; tot_bases += 1
print('tech_role productIds:', len(pids), 'bases:', tot_bases, 'total levels:', tot_levels)
tal = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\talent_profile.json', encoding='utf-8'))
print('talents:', len(tal))
rs = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\role_skin.json', encoding='utf-8'))
print('skins:', sum(len(v) for v in rs.values()))
