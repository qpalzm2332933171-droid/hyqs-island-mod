# -*- coding: utf-8 -*-
import io, re, sys
sys.stdout.reconfigure(encoding="utf-8")
FILES = ['work/dump/extract_02_encrypt.js', 'work/dump/project.beauty.js']

print("########## 1) all 4015 alert call sites ##########")
for fn in FILES:
    s = io.open(fn, encoding='utf-8', errors='replace').read()
    lines = s.split('\n')
    print("---- " + fn)
    for i, l in enumerate(lines):
        if 'getError("4015")' in l:
            ctx = ' | '.join(x.strip()[:130] for x in lines[i:i+3] if x.strip())
            print("L%d: %s" % (i+1, ctx))

print()
print("########## 2) illegal flags read/write ##########")
for fn in FILES:
    s = io.open(fn, encoding='utf-8', errors='replace').read()
    lines = s.split('\n')
    print("---- " + fn)
    for i, l in enumerate(lines):
        if re.search(r'illegal', l):
            print("L%d: %s" % (i+1, l.strip()[:170]))

print()
print("########## 3) clientlog cheat reports ##########")
for fn in FILES:
    s = io.open(fn, encoding='utf-8', errors='replace').read()
    lines = s.split('\n')
    print("---- " + fn)
    for i, l in enumerate(lines):
        if re.search(r'clientlog\(|cheat', l, re.I):
            print("L%d: %s" % (i+1, l.strip()[:170]))
