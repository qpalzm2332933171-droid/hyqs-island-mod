# -*- coding: utf-8 -*-
import os, json, re
root = r'work/apk/assets/res/import'
hits = []
for r, ds, fs in os.walk(root):
    for fn in fs:
        p = os.path.join(r, fn)
        try: t = open(p, encoding='utf-8', errors='replace').read()
        except: continue
        if 'btnTool' in t:
            hits.append(p)
print('files with btnTool:', hits[:5], 'total', len(hits))
for p in hits[:2]:
    d = json.load(open(p, encoding='utf-8'))
    s = json.dumps(d, ensure_ascii=False)
    # find label strings near btnTool / lab1
    for m in re.finditer(r'"(?:string|_string)":"([^"]{1,20})"', s):
        print('   label:', m.group(1))
