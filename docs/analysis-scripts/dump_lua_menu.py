import re,io,json
src=open(r"C:\path\to\workwspace\脚本.lua",encoding="utf-8").read().split("\n")
out=[]
for i,l in enumerate(src,1):
    if "gg.choice" in l:
        # capture following lines until }, nil,
        block=[]
        for j in range(i-1,min(i+15,len(src))):
            block.append(src[j].rstrip())
            if "nil," in src[j]:
                break
        out.append("### L%d\n"%i+"\n".join(block))
    if "['gnm']=" in l:
        m=re.findall(r"\['(gnm|xss|gs|xg|ftz)'\]=(\{.*?\}|'[^']*')", l)
        out.append("L%d CFG %s"%(i, " | ".join("%s=%s"%(a,b) for a,b in m)))
open(r"C:\path\to\workwspace\work\notes\lua_menu_dump.txt","w",encoding="utf-8").write("\n\n".join(out))
print(len(out),"blocks")
