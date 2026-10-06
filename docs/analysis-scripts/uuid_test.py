# -*- coding: utf-8 -*-
import os, json, sys
B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
IDX = {c: i for i, c in enumerate(B64)}

def decompress_uuid(cu):
    if len(cu) != 22:
        return cu
    out = list(cu[:2])
    pairs = cu[2:]
    for i in range(0, len(pairs), 2):
        v = (IDX[pairs[i]] << 6) | IDX[pairs[i+1]]
        out.append('%03x' % v)
    h = ''.join(out)
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"

for cu in ['3epCmhnV5M06yU6unUkWTW', '64+8JP/HBBabR/fn2HhYpm']:
    u = decompress_uuid(cu)
    print(cu, '->', u)
    d = u[:2]
    base = rf'work/apk/assets/res/import/{d}'
    for ext in ['.json', '.png']:
        p = os.path.join(base, u + ext)
        print('   ', p, os.path.exists(p))
