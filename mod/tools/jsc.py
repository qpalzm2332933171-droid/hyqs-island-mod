# -*- coding: utf-8 -*-
"""jsc pack/unpack: jsc = xxtea(zip({encrypt.js}), key=ebf83d12-bc75-4b)"""
import io, os, sys, zipfile, hashlib
import xxtea

KEY = b"ebf83d12-bc75-4b"
ENTRY = "encrypt.js"

def unpack(path, out_js=None):
    blob = io.open(path, "rb").read()
    z = xxtea.decrypt(blob, KEY)
    assert z[:2] == b"PK", "not a zip after xxtea"
    zf = zipfile.ZipFile(io.BytesIO(z))
    js = zf.read(ENTRY)
    if out_js:
        io.open(out_js, "wb").write(js)
    return js

def pack(js_bytes, out_path, level=9):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=level) as zf:
        zi = zipfile.ZipInfo(ENTRY, date_time=(1980, 1, 1, 0, 0, 0))
        zi.compress_type = zipfile.ZIP_DEFLATED
        zi.external_attr = 0o644 << 16
        zf.writestr(zi, js_bytes)
    blob = xxtea.encrypt(buf.getvalue(), KEY)
    io.open(out_path, "wb").write(blob)
    return len(blob)

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "unpack":
        js = unpack(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
        print("unpacked", len(js), "bytes")
    elif cmd == "pack":
        js = io.open(sys.argv[2], "rb").read()
        n = pack(js, sys.argv[3])
        print("packed", n, "bytes ->", sys.argv[3])
    elif cmd == "roundtrip":
        js = io.open(sys.argv[2], "rb").read()
        tmp = sys.argv[2] + ".roundtrip.jsc"
        pack(js, tmp)
        back = unpack(tmp)
        print("input", len(js), "roundtrip", len(back), "equal:", back == js)
        os.remove(tmp)
