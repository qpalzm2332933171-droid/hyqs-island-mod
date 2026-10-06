# -*- coding: utf-8 -*-
lines = open('work/dump/project.beauty.js', encoding='utf-8', errors='replace').read().split('\n')
for no in range(7668, 7700):
    ln = lines[no-1]
    if ln.strip(): print(no, '|', ln[:150])
print('====== 7800-7870')
for no in range(7800, 7870):
    ln = lines[no-1]
    if ln.strip(): print(no, '|', ln[:150])
