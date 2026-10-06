# -*- coding: utf-8 -*-
import io, re, json
s = io.open(r'work\dump\project.beauty.js', encoding='utf-8', errors='ignore').read()
i = s.find('window.HYTechnology')
seg = s[i-6000:i+40000] if i > 0 else ''
ms = [m.group(1) + ' @%d' % (i-6000+m.start()) for m in re.finditer(r'\n\s{6,10}([A-Za-z_0-9][A-Za-z0-9_]*): function', seg)]
io.open(r'work\dump\_tech1.txt','w',encoding='utf-8',errors='ignore').write('\n'.join(ms))
print('HYTechnology at', i, 'methods', len(ms))
p = json.load(io.open(r'work\apk_dec\assets\res\raw-assets\resources\Profiles\technology.json', encoding='utf-8'))
print('technology.json top keys:', list(p.keys())[:20])
k0 = list(p.keys())[0]
print('sample', k0, json.dumps(p[k0], ensure_ascii=False)[:900])
