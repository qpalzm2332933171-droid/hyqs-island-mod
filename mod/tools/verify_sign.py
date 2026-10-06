#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证 updatedata 的 sign 公式:  sign = md5( SECRET + base64(modify 原串) + uid )

用一条自己抓到的 updatedata 请求即可验证:
  python verify_sign.py --uid <你的UID> --modify '<请求体里 modify 参数的原始 JSON 串>' --expect <请求体里 sign 的值>
"""
import argparse, base64, hashlib

SECRET = "apsdfAJOJ(#@&($0809283JLJOOJ"


def sign(modify_str, uid):
    b64 = base64.b64encode(modify_str.encode("utf-8")).decode("ascii")
    return hashlib.md5((SECRET + b64 + uid).encode("utf-8")).hexdigest()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--uid", required=True)
    ap.add_argument("--modify", required=True, help="updatedata 请求体里 modify 参数的原文")
    ap.add_argument("--expect", default=None, help="抓包看到的 sign, 用于比对")
    a = ap.parse_args()
    got = sign(a.modify, a.uid)
    if a.expect:
        print("计算 sign:", got)
        print("抓包 sign:", a.expect)
        print("结果:", "MATCH" if got == a.expect else "不匹配 (检查 modify 是否被 URL 解码过)")
    else:
        print(got)
