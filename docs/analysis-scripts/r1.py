# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out = []
def sec(tag, pat, before=250, after=700, limit=6):
    out.append('\n\n########## ' + tag)
    c = 0
    for m in re.finditer(pat, s):
        i = m.start(); out.append('--- @%d ---' % i); out.append(s[max(0, i-before):i+after]); c += 1
        if c >= limit: break
    if c == 0: out.append('(none)')
sec('durability', r'DUR\b|耐久|durability|lossDur|dur\b', 200, 400, 8)
sec('progress', r'progress', 200, 300, 6)
io.open(r'work\dump\_r1.txt', 'w', encoding='utf-8', errors='ignore').write('\n'.join(out))
print('ok')
