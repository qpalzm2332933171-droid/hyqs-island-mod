# -*- coding: utf-8 -*-
"""deploy.py <js_file> [--pull] : pack js -> project.jsc, push to device hotfix dir, restart game"""
import io, os, sys, subprocess, hashlib, time, filecmp
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
import jsc

ADB = r"D:\Android\AndroidSDK\platform-tools\adb.exe"
PKG = "com.dygame.hyqs.nearme.gamecenter"
HOT = "/data/data/%s/files/c98759c9a82b24c176af027949f417b0" % PKG
BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

def sh(cmd, **kw):
    return subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True, **kw)

def adb(*args):
    return subprocess.run([ADB] + list(args), capture_output=True, text=True)

def su(cmd):
    return adb("shell", "su -c '%s'" % cmd)

def md5_file(p):
    return hashlib.md5(io.open(p, "rb").read()).hexdigest()

def main():
    js_path = sys.argv[1]
    local = os.path.join(BASE, "work", "mod", "build", "project.jsc")
    n = jsc.pack(io.open(js_path, "rb").read(), local)
    print("packed ->", local, n, "bytes md5", md5_file(local))
    r = adb("push", local, "/data/local/tmp/project_mod.jsc")
    print("push:", r.stdout.strip(), r.stderr.strip())
    r = su("cp /data/local/tmp/project_mod.jsc %s/src/project.jsc && chown u0_a59:u0_a59 %s/src/project.jsc && chmod 600 %s/src/project.jsc && md5sum %s/src/project.jsc" % (HOT, HOT, HOT, HOT))
    print("install:", r.stdout.strip(), r.stderr.strip())

if __name__ == "__main__":
    main()
