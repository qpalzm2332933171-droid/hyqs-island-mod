# -*- coding: utf-8 -*-
import json, os, re
prof = json.load(open(r'work/apk/assets/res/raw-assets/resources/Profiles/item_profile.json', encoding='utf-8'))
icons = set(f[:-4] for f in os.listdir(r'deliverables/mail-tool/icons'))
notes = {
 '100000': '货币-书页', '100002': '货币-求生精选', '100003': '货币-天赋原石', '100004': '货币-天赋结晶',
 '100005': '货币-时之沙(广告币)', '100006': '货币-神秘钥匙(机器人币)', '4088': '可开裂变体4088_0..4',
 '7003': '功能物-治疗', '7006': '功能物-喂食', '7010': '功能物-生火', '7011': '功能物-生火', '7028': '功能物-驯养',
 '420101': '好友礼包', '420201': '好友礼包', '420301': '好友礼包', '420401': '好友礼包', '420501': '好友礼包',
 '4061': '圆球', '4062': '圆球', '4063': '圆球', '4064': '圆球', '4065': '圆球', '4066': '圆球', '4067': '圆球',
 '4096': '实物周边', '4097': '实物周边',
}
def cat_of(iid, t):
    n = int(iid.split('_')[0]) if iid.split('_')[0].isdigit() else 0
    if 100000 <= n <= 100006: return 'currency'
    if t in ('tool',): return 'tool'
    if t in ('food',): return 'food'
    if t in ('prop', 'spe'): return 'prop'
    if t in ('drug',): return 'drug'
    return 'other'
def sortkey(k):
    m = re.match(r'^(\d+)(?:_(\d+))?$', k)
    return (int(m.group(1)), int(m.group(2) or 0)) if m else (999999, k)
items = []
for k in sorted([k for k, v in prof.items() if isinstance(v, dict) and 'NAME' in v and k != '0'], key=sortkey):
    v = prof[k]
    items.append({
        'id': k,
        'name': v['NAME'].get('cn', ''),
        'tw': v['NAME'].get('tw', ''),
        'type': v.get('TYPE', ''),
        'cat': cat_of(k, v.get('TYPE', '')),
        'w': v.get('WEIGHT', ''),
        'v': v.get('COIN_VALUE', ''),
        'note': notes.get(k, ''),
        'icon': k in icons,
    })
out = 'window.ITEM_DATA = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(r'deliverables/mail-tool/items.js', 'w', encoding='utf-8').write(out)
print('items:', len(items), 'with icon:', sum(1 for i in items if i['icon']))
import collections
print(collections.Counter(i['cat'] for i in items))
