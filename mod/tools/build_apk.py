# -*- coding: utf-8 -*-
"""一键打包直装 MOD APK。

前置:
  1) apktool.jar 放在 <work>/apktool/apktool.jar (或用 HYQS_APKTOOL 指定)
  2) 目标渠道 APK 已解包到 <work>/apk_dec, 且已跑过 patch_manifest.py
  3) 已跑 build_dex.py 生成 classes.dex
用法:
  python build_apk.py                 # 全流程
  python build_apk.py --js-only       # 只重建 project.jsc 并放回 apk_dec
  python build_apk.py --no-dex        # 不重新注入 dex (调试 js 时用)
产物:
  <repo>/dist/荒野日记孤岛_MOD.apk
"""
import argparse, os, shutil, subprocess, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config, jsc

OUTDIR = os.path.join(config.REPO, "dist")
OUTAPK = os.path.join(OUTDIR, "荒野日记孤岛_MOD.apk")


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def build_js():
    parts = [os.path.join(config.GAME_SRC, "project.dec.js"),
             os.path.join(config.MOD_JS, "mod_native.js")]
    text = "\n".join(open(f, encoding="utf-8").read() for f in parts)
    os.makedirs(config.BUILD, exist_ok=True)
    out_js = os.path.join(config.BUILD, "project.mod.js")
    open(out_js, "w", encoding="utf-8").write(text)
    n = jsc.pack(text.encode("utf-8"), os.path.join(config.BUILD, "project.jsc"))
    dst = os.path.join(config.APK_DEC, "assets", "src", "project.jsc")
    shutil.copyfile(os.path.join(config.BUILD, "project.jsc"), dst)
    print("[1/5] project.jsc %d bytes -> %s" % (n, dst))


def copy_icons():
    dst = os.path.join(config.APK_DEC, "assets", "hymod", "icons")
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    os.makedirs(dst, exist_ok=True)
    n = 0
    for f in os.listdir(config.ICONS):
        if f.lower().endswith(".png"):
            shutil.copyfile(os.path.join(config.ICONS, f), os.path.join(dst, f))
            n += 1
    print("[2/5] 图标 %d 个 -> %s" % (n, dst))


def apktool_build():
    out = os.path.join(config.BUILD, "unsigned.apk")
    if not os.path.exists(config.APKTOOL):
        sys.exit("缺少 apktool.jar: " + config.APKTOOL)
    r = run(["java", "-jar", config.APKTOOL, "b", "-o", out], cwd=config.APK_DEC)
    print("[3/5] apktool b rc =", r.returncode)
    if r.returncode != 0:
        print(r.stdout[-3000:] + r.stderr[-3000:])
        sys.exit(1)
    return out


def inject_dex(apk):
    if not os.path.exists(config.CLASSES_DEX):
        sys.exit("缺少 classes.dex, 先跑 build_dex.py")
    with zipfile.ZipFile(apk, "a", zipfile.ZIP_DEFLATED) as z:
        if "classes2.dex" in z.namelist():
            sys.exit("APK 里已有 classes2.dex")
        z.write(config.CLASSES_DEX, "classes2.dex")
    print("[4/5] classes2.dex 已注入 (%d bytes)" % os.path.getsize(config.CLASSES_DEX))


def align_sign(apk):
    os.makedirs(OUTDIR, exist_ok=True)
    aligned = os.path.join(config.BUILD, "aligned.apk")
    if os.path.exists(aligned):
        os.remove(aligned)
    r = run([config.exe("zipalign"), "-f", "-p", "4", apk, aligned])
    if r.returncode != 0:
        sys.exit("zipalign 失败: " + (r.stderr or r.stdout)[:500])
    ks, kspass, alias = config.keystore()
    if os.path.exists(OUTAPK):
        os.remove(OUTAPK)
    r = run([config.exe("apksigner"), "sign", "--ks", ks, "--ks-pass", "pass:" + kspass,
             "--key-pass", "pass:" + kspass, "--ks-key-alias", alias, "--out", OUTAPK, aligned])
    if r.returncode != 0:
        sys.exit("apksigner 失败: " + (r.stdout or "")[-800:] + (r.stderr or "")[-800:])
    r = run([config.exe("apksigner"), "verify", "--print-certs", OUTAPK])
    print("[5/5] 签名完成 rc =", r.returncode)
    print("      " + "\n      ".join(r.stdout.splitlines()[:3]))
    print("DONE ->", OUTAPK, os.path.getsize(OUTAPK), "bytes")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--js-only", action="store_true")
    ap.add_argument("--no-dex", action="store_true")
    a = ap.parse_args()
    build_js()
    if a.js_only:
        sys.exit(0)
    copy_icons()
    u = apktool_build()
    if not a.no_dex:
        inject_dex(u)
    align_sign(u)
