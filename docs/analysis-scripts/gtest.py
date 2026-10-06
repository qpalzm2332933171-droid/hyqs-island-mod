# -*- coding: utf-8 -*-
"""gtest.py : 重启/截图/点击  (设计坐标 720x1280, 原点左下 -> 自动换算为设备坐标)"""
import subprocess, sys, time, os
ADB = r"D:\Android\AndroidSDK\platform-tools\adb.exe"
PKG = "com.dygame.hyqs.nearme.gamecenter"
W = r"C:\path\to\workwspace"
OUT = os.path.join(W, "work", "notes")
DW, DH = 720.0, 1280.0

def adb(*a, **kw):
    return subprocess.run([ADB] + list(a), capture_output=True, text=True, **kw)

def start():
    adb("shell", "am force-stop " + PKG); time.sleep(2)
    r = adb("shell", "monkey -p %s -c android.intent.category.LAUNCHER 1" % PKG)
    print("launch ok")

def shot(name):
    adb("shell", "screencap -p /sdcard/%s.png" % name)
    local = os.path.join(OUT, name + ".png")
    adb("pull", "/sdcard/%s.png" % name, local)
    print("shot ->", local)
    return local

def conv(x, y):
    return int(x * 2), int((DH - y) * 2)

def tap(x, y, design=True):
    if design: x, y = conv(x, y)
    adb("shell", "input tap %d %d" % (int(x), int(y)))
    print("tap", x, y)

def swipe(x1, y1, x2, y2, ms=300):
    a = conv(x1, y1); b = conv(x2, y2)
    adb("shell", "input swipe %d %d %d %d %d" % (a[0], a[1], b[0], b[1], ms))
    print("swipe")

if __name__ == "__main__":
    c = sys.argv[1]
    if c == "start": start()
    elif c == "shot": shot(sys.argv[2])
    elif c == "tap": tap(float(sys.argv[2]), float(sys.argv[3]))
    elif c == "swipe": swipe(*[float(v) for v in sys.argv[2:6]])
