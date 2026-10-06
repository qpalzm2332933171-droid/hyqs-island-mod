# -*- coding: utf-8 -*-
"""编译 mod/java 下的 Java 源码 -> classes.dex (javac + d8)

用法:  python build_dex.py
产物:  <work>/mod_java/dex/classes.dex  (由 build_apk.py 注入 APK)
"""
import os, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config

SRC = [os.path.join(config.JAVA_SRC, "com", "hymod", n)
       for n in ("ModBridge.java", "ModMenu.java", "ModProvider.java")]


def main():
    out = os.path.join(config.WORK, "mod_java", "out")
    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(out)
    _, android_jar = config.build_tools()
    r = subprocess.run([config.javac(), "-encoding", "UTF-8", "-source", "8", "-target", "8",
                        "-nowarn", "-bootclasspath", android_jar, "-d", out] + SRC,
                       capture_output=True, text=True)
    print("javac rc =", r.returncode)
    if r.stdout.strip():
        print(r.stdout[:4000])
    if r.stderr.strip():
        print(r.stderr[:4000])
    if r.returncode != 0:
        sys.exit(1)
    classes = [os.path.join(dp, f) for dp, _, fn in os.walk(out) for f in fn if f.endswith(".class")]
    os.makedirs(config.DEX_DIR, exist_ok=True)
    d8 = config.exe("d8")
    r2 = subprocess.run([d8, "--min-api", "21", "--output", config.DEX_DIR] + classes,
                        capture_output=True, text=True, shell=(os.name == "nt"))
    print("d8 rc =", r2.returncode)
    print((r2.stdout or "")[-1200:] + (r2.stderr or "")[-1200:])
    size = os.path.getsize(config.CLASSES_DEX) if os.path.exists(config.CLASSES_DEX) else "MISSING"
    print("dex =", config.CLASSES_DEX, size)
    if r2.returncode != 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
