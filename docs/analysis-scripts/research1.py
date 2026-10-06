# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
def dump(tag, pat, before=120, after=900, limit=4):
    out = ['\n\n########## ' + tag + ' ##########']
    c = 0
    for m in re.finditer(pat, s):
        st = m.start()
        out.append('----- @%d -----' % st)
        out.append(s[max(0, st-before):st+after])
        c += 1
        if c >= limit: break
    if c == 0: out.append('(none)')
    return '\n'.join(out)
buf = []
buf.append(dump('getMoveSpeed', r'getMoveSpeed'))
buf.append(dump('calcMoveSpeed', r'calcMoveSpeed'))
buf.append(dump('atk_spd', r'atk_spd', 300, 400, 6))
io.open(r'work\dump\_res1.txt', 'w', encoding='utf-8', errors='ignore').write('\n'.join(buf))
print('ok')
