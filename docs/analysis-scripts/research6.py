# -*- coding: utf-8 -*-
import io, re
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
out=[]
def sec(tag, pat, before=200, after=400, limit=6):
    out.append('\n\n########## ' + tag)
    c=0
    for m in re.finditer(pat, s):
        i=m.start(); out.append('--- @%d ---' % i); out.append(s[max(0,i-before):i+after]); c+=1
        if c>=limit: break
    if c==0: out.append('(none)')
sec('base.skin', r'base\.skin|unlock\.skin|skin\.unlock', 200, 300, 8)
sec('HYRoleSkin def', r'window\.HYRoleSkin|HYRoleSkin\s*=\s*', 100, 300, 3)
sec('getSkin(', r'getSkin: function|getSkin\(', 250, 500, 5)
io.open(r'work\dump\_res5.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(out))
print('ok')
