import re,io
p=r"C:\path\to\workwspace\work\apk\lib\x86\libcocos2djs.so"
d=io.open(p,"rb").read()
for m in re.finditer(rb"ebf83d12", d):
    s=max(0,m.start()-40); e=min(len(d), m.start()+80)
    print(m.start(), repr(d[s:e]))
    print("---")
