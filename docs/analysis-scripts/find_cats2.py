# -*- coding: utf-8 -*-
lines = open('work/dump/project.beauty.js', encoding='utf-8', errors='replace').read().split('\n')
# module containing line 7768
start = None
for no in range(7768, 0, -1):
    ln = lines[no-1]
    if ln.startswith('  ') and not ln.startswith('   ') and '[' in ln:
        start = no; break
print('module start:', lines[start-1].strip()[:80])
for no in range(start-1, start+40):
    ln = lines[no-1]
    if ln.strip(): print(no, '|', ln[:160])
print('...')
for no in range(7740, 7800):
    ln = lines[no-1]
    if ln.strip() and ('curPage' in ln or 'TYPE' in ln or 'page' in ln.lower()): print(no, '|', ln.strip()[:160])
