#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Frida 动态抓取 xxtea_decrypt 的输入/输出。

用途: 当某个渠道的 project.jsc 用了不同的密钥(静态解不开)时, 用它抓运行时的解密结果。

用法:
  pip install frida
  python dump_xxtea.py --pkg com.dygame.hyqs.nearme.gamecenter --out ../work/dump
然后点开游戏, 脚本会自动 spawn -> hook libcocos2djs.so!xxtea_decrypt -> 把结果写到 out/xxtea_*.bin
(抓完的文件是 zip, 里面的 encrypt.js 就是明文游戏逻辑)
"""
import argparse, os, sys, time

JS = r"""
var attached = false, counter = 0;
function tryAttach() {
    if (attached) return;
    var exp = Module.findExportByName("libcocos2djs.so", "xxtea_decrypt");
    if (!exp) { setTimeout(tryAttach, 50); return; }
    attached = true;
    send({t:"info", msg:"xxtea_decrypt @" + exp});
    Interceptor.attach(exp, {
        onEnter: function (args) {
            this.data = args[0]; this.len = args[1].toInt32();
            this.key = args[2]; this.keylen = args[3].toInt32(); this.outlen = args[4];
        },
        onLeave: function (ret) {
            try {
                var outLen = !this.outlen.isNull() ? this.outlen.readU32() : -1;
                send({t:"xxtea", idx: counter, inLen: this.len, outLen: outLen, ret: ret.toString()});
                if (!ret.isNull() && outLen > 0) send({t:"data", idx: counter, outLen: outLen}, Memory.readByteArray(ret, outLen));
                else if (!ret.isNull()) send({t:"data", idx: counter, outLen: -1}, Memory.readByteArray(ret, Math.min(this.len * 4 + 64, 1048576)));
                counter++;
            } catch (e) { send({t:"err", msg: String(e)}); }
        }
    });
}
tryAttach();
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pkg", default="com.dygame.hyqs.nearme.gamecenter")
    ap.add_argument("--out", default="dump")
    ap.add_argument("--wait", type=int, default=40, help="抓多少秒")
    a = ap.parse_args()
    import frida
    os.makedirs(a.out, exist_ok=True)
    dev = frida.get_usb_device(timeout=10)
    pid = dev.spawn([a.pkg])
    print("spawned pid", pid, flush=True)
    session = dev.attach(pid)
    script = session.create_script(JS)
    counter = {"n": 0}

    def on_message(message, data):
        if message["type"] != "send":
            return
        p = message["payload"]
        if p.get("t") == "xxtea":
            print("XXTEA idx=%s in=%s out=%s ret=%s" % (p["idx"], p["inLen"], p["outLen"], p["ret"]), flush=True)
        elif p.get("t") == "data":
            path = os.path.join(a.out, "xxtea_%02d_%s.bin" % (p["idx"], p["outLen"]))
            open(path, "wb").write(data)
            counter["n"] += 1
            print("  saved", path, len(data), "bytes", flush=True)
        elif p.get("t") == "err":
            print("ERR:", p["msg"], flush=True)

    script.on("message", on_message)
    script.load()
    dev.resume(pid)
    print("resumed, %ds ..." % a.wait, flush=True)
    time.sleep(a.wait)
    try:
        session.detach()
    except Exception:
        pass
    print("done, %d file(s) -> %s" % (counter["n"], a.out))


if __name__ == "__main__":
    main()
