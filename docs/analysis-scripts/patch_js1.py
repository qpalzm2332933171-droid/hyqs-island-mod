# -*- coding: utf-8 -*-
import io
p = r'work\mod\mod_native.js'
s = io.open(p, encoding='utf-8').read()
old = 'function T(msg) { try { HYCommon.toast(String(msg), 2); } catch (e) { log("toast fail " + e); } }'
new = ('function T(msg) { try { HYCommon.toast(String(msg), 2); } catch (e) { log("toast fail " + e); } '
       'try { bridge("setStatus", "(Ljava/lang/String;)V", String(msg)); } catch (e) {} }')
assert old in s, 'not found'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('patched T()')
