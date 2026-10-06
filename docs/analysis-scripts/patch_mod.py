# -*- coding: utf-8 -*-
import io, os, re
BASE = r"C:\path\to\workwspace\work\mod"
core = io.open(os.path.join(BASE, "mod_core.js"), encoding="utf-8").read()
if "M.T = T;" not in core:
    core = core.replace("  M.logs = logs;", "  M.logs = logs;\n  M.T = T;\n  M.log = log;")
    io.open(os.path.join(BASE, "mod_core.js"), "w", encoding="utf-8").write(core)
    print("core patched: exposed M.T / M.log")
ui = io.open(os.path.join(BASE, "mod_ui.js"), encoding="utf-8").read()
n = len(re.findall(r"(?<![.\w])T\(", ui))
ui2 = re.sub(r"(?<![.\w])T\(", "M.T(", ui)
io.open(os.path.join(BASE, "mod_ui.js"), "w", encoding="utf-8").write(ui2)
print("ui: replaced", n, "T( -> M.T(")
