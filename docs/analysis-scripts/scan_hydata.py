# -*- coding: utf-8 -*-
import io, re, sys
sys.stdout.reconfigure(encoding="utf-8")
s = io.open('work/dump/extract_02_encrypt.js', encoding='utf-8', errors='replace').read().split('\n')
a, b = 13402, 14125
pat = re.compile(r'save|load|file|path|md5|sign|signature|localStorage|writeString|readString', re.I)
for i in range(a-1, min(b, len(s))):
    if pat.search(s[i]):
        print('L%d: %s' % (i+1, s[i].strip()[:180]))
