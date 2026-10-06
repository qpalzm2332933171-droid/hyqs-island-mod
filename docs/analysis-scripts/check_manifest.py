# -*- coding: utf-8 -*-
import json, io, os
D = r"C:\path\to\workwspace\work\dump"
m = json.load(io.open(os.path.join(D,"device_project.manifest"), encoding="utf-8"))
print("top keys:", list(m.keys()))
for k,v in m.items():
    if k != "assets":
        print(k, "=", repr(v)[:200])
a = m.get("assets", {})
print("assets count", len(a))
ks = [k for k in a if "src/" in k or k.endswith(".jsc")]
for k in ks[:10]:
    print(" ", k, a[k])
print("searching keys sample:", list(a.keys())[:5])
