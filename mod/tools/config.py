# -*- coding: utf-8 -*-
"""公共路径配置: 所有脚本都可从仓库任意位置运行, 也支持环境变量覆盖。

约定目录:
  <repo>/game-source/project.dec.js     解密后的游戏逻辑 (本仓库提供)
  <repo>/mod/js/mod_native.js           MOD 主体 (本仓库提供)
  <repo>/work/apk_dec/                  apktool d 目标 APK 得到的工程 (需自己生成)
  <repo>/work/apktool/apktool.jar       apktool (需自己下载)
  <repo>/work/build/                    中间产物
"""
import os, shutil, glob

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.environ.get("HYQS_WORK", os.path.join(REPO, "work"))
APK_DEC = os.path.join(WORK, "apk_dec")
APKTOOL = os.environ.get("HYQS_APKTOOL", os.path.join(WORK, "apktool", "apktool.jar"))
BUILD = os.path.join(WORK, "build")
MOD_JS = os.path.join(REPO, "mod", "js")
GAME_SRC = os.path.join(REPO, "game-source")
ICONS = os.path.join(REPO, "mail-tool", "icons")
JAVA_SRC = os.path.join(REPO, "mod", "java")
DEX_DIR = os.path.join(WORK, "mod_java", "dex")
CLASSES_DEX = os.path.join(DEX_DIR, "classes.dex")


def find_sdk():
    for k in ("ANDROID_SDK_ROOT", "ANDROID_HOME"):
        if os.environ.get(k) and os.path.isdir(os.environ[k]):
            return os.environ[k]
    for p in (r"D:\\Android\\AndroidSDK", os.path.expanduser("~/Android/Sdk"),
              os.path.expanduser("~/Library/Android/sdk")):
        if os.path.isdir(p):
            return p
    return None


def build_tools(sdk=None):
    """返回 (build-tools 目录, android.jar 路径)"""
    sdk = sdk or find_sdk()
    if not sdk:
        raise SystemExit("找不到 Android SDK, 请设置 ANDROID_SDK_ROOT 或用 --sdk 指定")
    bt = sorted(glob.glob(os.path.join(sdk, "build-tools", "*")))
    bt = [b for b in bt if os.path.exists(os.path.join(b, "zipalign.exe" if os.name == "nt" else "zipalign"))]
    if not bt:
        raise SystemExit("SDK 里没有 build-tools")
    bt = sorted(bt, key=lambda p: [int(x) if x.isdigit() else 0 for x in os.path.basename(p).split(".")])[-1]
    plats = sorted(glob.glob(os.path.join(sdk, "platforms", "android-*")))
    if not plats:
        raise SystemExit("SDK 里没有 platforms/android-*")
    jar = os.path.join(plats[-1], "android.jar")
    return bt, jar


def exe(name):
    """build-tools 里的可执行文件 (兼容 .bat / 无扩展名)"""
    bt, _ = build_tools()
    for cand in (os.path.join(bt, name + ".bat"), os.path.join(bt, name + ".exe"), os.path.join(bt, name)):
        if os.path.exists(cand):
            return cand
    raise SystemExit("找不到 " + name)


def javac():
    jh = os.environ.get("JAVA_HOME")
    if jh:
        c = os.path.join(jh, "bin", "javac.exe" if os.name == "nt" else "javac")
        if os.path.exists(c):
            return c
    c = shutil.which("javac")
    if c:
        return c
    raise SystemExit("找不到 javac, 请设置 JAVA_HOME (需要 JDK 8+)")


def keystore():
    """默认用 debug keystore; 自己发布请换成自己的"""
    ks = os.environ.get("HYQS_KEYSTORE") or os.path.expanduser("~/.android/debug.keystore")
    return ks, os.environ.get("HYQS_KS_PASS", "android"), os.environ.get("HYQS_KS_ALIAS", "androiddebugkey")
