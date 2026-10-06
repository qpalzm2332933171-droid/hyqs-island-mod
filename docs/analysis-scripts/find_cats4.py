# -*- coding: utf-8 -*-
lines = open('work/dump/project.beauty.js', encoding='utf-8', errors='replace').read().split('\n')
import re
for no, ln in enumerate(lines, 1):
    if re.search(r'"(food|tool|prop|inv|spe|drug)"', ln):
        print(no, '|', ln.strip()[:150])
