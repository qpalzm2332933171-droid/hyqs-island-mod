# -*- coding: utf-8 -*-
import io
p = r'work\apk_dec\AndroidManifest.xml'
s = io.open(p, encoding='utf-8').read()
if 'com.hymod.ModProvider' in s:
    print('already patched')
else:
    ins = '        <provider android:authorities="com.dygame.hyqs.nearme.gamecenter.hymod" android:exported="false" android:name="com.hymod.ModProvider"/>\n'
    i = s.rindex('</application>')
    s = s[:i] + ins + s[i:]
    io.open(p, 'w', encoding='utf-8', newline='').write(s)
    print('patched ok')
