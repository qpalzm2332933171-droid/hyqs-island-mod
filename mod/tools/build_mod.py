# -*- coding: utf-8 -*-
"""只重建 project.jsc:  game-source/project.dec.js + mod/js/mod_native.js -> xxtea(zip) -> project.jsc

用法:
    python build_mod.py                    # 输出到 <work>/build/project.jsc
    python build_mod.py --deploy           # 顺便覆盖到 <work>/apk_dec/assets/src/project.jsc
    python build_mod.py --check            # 额外用 node 做语法检查
"""
import argparse, hashlib, io, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config, jsc

PARTS = [os.path.join(config.GAME_SRC, "project.dec.js"),
         os.path.join(config.MOD_JS, "mod_native.js")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-js", default=os.path.join(config.BUILD, "project.mod.js"))
    ap.add_argument("--out-jsc", default=os.path.join(config.BUILD, "project.jsc"))
    ap.add_argument("--deploy", action="store_true", help="复制到 apk_dec/assets/src/project.jsc")
    ap.add_argument("--check", action="store_true", help="用 node --check 做语法检查")
    a = ap.parse_args()
    os.makedirs(config.BUILD, exist_ok=True)
    text = "\n".join(io.open(f, encoding="utf-8").read() for f in PARTS)
    io.open(a.out_js, "w", encoding="utf-8").write(text)
    if a.check:
        r = subprocess.run(["node", "--check", a.out_js], capture_output=True, text=True)
        print("node --check rc =", r.returncode, r.stderr[:800])
        if r.returncode != 0:
            sys.exit(1)
    n = jsc.pack(text.encode("utf-8"), a.out_jsc)
    print("jsc = %d bytes, md5 = %s" % (n, hashlib.md5(io.open(a.out_jsc, "rb").read()).hexdigest()))
    if a.deploy:
        dst = os.path.join(config.APK_DEC, "assets", "src", "project.jsc")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        import shutil
        shutil.copyfile(a.out_jsc, dst)
        print("-> " + dst)


if __name__ == "__main__":
    main()
