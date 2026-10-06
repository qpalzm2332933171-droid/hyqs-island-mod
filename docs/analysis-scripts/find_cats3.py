# -*- coding: utf-8 -*-
lines = open('work/dump/project.beauty.js', encoding='utf-8', errors='replace').read().split('\n')
for no in range(7468, 7530):
    ln = lines[no-1]
    if ln.strip(): print(no, '|', ln[:150])
print('======')
for no in range(7700, 7745):
    ln = lines[no-1]
    if ln.strip(): print(no, '|', ln[:150])
