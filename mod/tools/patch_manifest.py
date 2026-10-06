# -*- coding: utf-8 -*-
"""给(已用 apktool 解包的)AndroidManifest.xml 插入 hymod 的 ContentProvider 声明。

用法:
    python patch_manifest.py                 # 自动读 <work>/apk_dec/AndroidManifest.xml
    python patch_manifest.py --manifest X.xml --authority a.b.c.hymod
说明:
    authority 必须全局唯一, 惯例是 "<包名>.hymod"。
    这个空 Provider 的作用: 借系统在进程启动时调用 onCreate() 的时机加载 MOD,
    并在启动时把我们打好包的 project.jsc 覆盖回游戏的热更目录。
"""
import argparse, io, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default=os.path.join(config.APK_DEC, "AndroidManifest.xml"))
    ap.add_argument("--authority", default=None, help="默认 <包名>.hymod")
    a = ap.parse_args()
    p = a.manifest
    if not os.path.exists(p):
        sys.exit("找不到 " + p + " (先用 apktool d 解包)")
    s = io.open(p, encoding="utf-8").read()
    if "com.hymod.ModProvider" in s:
        print("已经打过补丁, 跳过"); return
    pkg = re.search(r'package="([^"]+)"', s).group(1)
    authority = a.authority or (pkg + ".hymod")
    ins = ('        <provider android:authorities="%s" android:exported="false" '
           'android:name="com.hymod.ModProvider"/>\n' % authority)
    i = s.rindex("</application>")
    io.open(p, "w", encoding="utf-8", newline="").write(s[:i] + ins + s[i:])
    print("已插入 provider, authority =", authority, "package =", pkg)


if __name__ == "__main__":
    main()
