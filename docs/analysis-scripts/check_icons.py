# -*- coding: utf-8 -*-
import json, os
d = json.load(open(r'work/apk/assets/res/raw-assets/resources/Profiles/item_profile.json', encoding='utf-8'))
items = [k for k, v in d.items() if isinstance(v, dict) and 'NAME' in v and k != '0']
icons = set(f[:-4] for f in os.listdir(r'deliverables/mail-tool/icons'))
missing = [k for k in items if k not in icons]
print('missing icons for:', missing)
for k in missing:
    print('  ', k, d[k]['NAME']['cn'], d[k].get('TYPE'))
print('extra icons not in items:', sorted(icons - set(items)))
