# -*- coding: utf-8 -*-
import io, re, sys
sys.stdout.reconfigure(encoding="utf-8")
s = io.open("脚本.lua", encoding="utf-8", errors="replace").read()
lines = s.split("\n")
out = []
cur_func = None
for i, l in enumerate(lines):
    m = re.match(r"\s*local\s+function\s+(\w+)|\s*function\s+(\w+)", l)
    if m:
        name = m.group(1) or m.group(2)
        # collect preceding comment lines
        ctx = []
        j = i - 1
        while j >= 0 and (lines[j].strip().startswith("--") or lines[j].strip() == ""):
            if lines[j].strip().startswith("--"):
                ctx.insert(0, lines[j].strip())
            j -= 1
            if len(ctx) > 4:
                break
        out.append((name, i + 1, ctx))
out.sort(key=lambda x: x[1])
res = []
res.append("# 脚本.lua 功能清单 (%d 行, %d 个函数)" % (len(lines), len(out)))
res.append("")
for name, ln, ctx in out:
    res.append("## %s  (L%d)" % (name, ln))
    for c in ctx:
        res.append("   " + c)
    res.append("")
io.open("work/notes/lua_features.md", "w", encoding="utf-8", newline="").write("\n".join(res))
print("functions:", len(out))
print("wrote work/notes/lua_features.md")
print("=== function names ===")
print(", ".join(n for n, _, _ in out))
