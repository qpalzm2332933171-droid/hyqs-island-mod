#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""荒野日记:孤岛 — 邮件 token 生成/校验器

token 公式 (游戏客户端 DYHttpMgr.checkMailLegal):
    token = md5( id + type + goods + to_user + createTime + deadline + coin + SECRET )
其中 SECRET 硬编码在客户端 project.js 的 DYHttpMgr 模块里。

用法:
    python mailtoken.py --selftest                 # 跑内置用例
    python mailtoken.py --json payload.json        # 校验/补算一个响应体里的所有邮件
    python mailtoken.py --json payload.json --fix  # 重算 token 并写回
"""
import argparse, hashlib, json, sys

SECRET = "apsdfAJOJ(#@&($0809283JLJOOJ"
FIELDS = ["id", "type", "goods", "to_user", "createTime", "deadline", "coin"]


def calc_token(mail: dict) -> str:
    s = "".join(str(mail[f]) for f in FIELDS) + SECRET
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def verify(mail: dict) -> bool:
    return calc_token(mail) == mail.get("token")


CASES = [
    # 网上教程里的月卡邮件(官方原文), 用于自检公式是否正确 (uid 已脱敏)
    (dict(id=1791337288475, type="item", goods="100000:6;100002:2", to_user="1000000000001",
          createTime=1643981588000, deadline=1646573587000, coin=280),
     "716524f2ecc0d163749bcc473fe013a2"),
    (dict(id=1791337288476, type="item", goods="", to_user="1000000000001",
          createTime=1643981588000, deadline=1646573587000, coin=2800),
     "9b86a06e24709d070c14b206efdf0e9c"),
    # 实测抓包样本 (uid 已脱敏): 原始 goods=4438:8 的 token
    (dict(id=1112672461636, type="item", goods="4438:8", to_user="1000000000000",
          createTime=1791196104000, deadline=1793788104000, coin=0),
     "d7f9501c9da75a823a048ce16d2d643f"),
]


def selftest():
    ok = True
    for m, expected in CASES:
        got = calc_token(m)
        good = got == expected
        ok = ok and good
        print(("OK   " if good else "FAIL ") + f"id={m['id']} got={got} expected={expected}")
    return ok


def walk(resp):
    return resp.get("data", {}).get("goods_from_user", []) + resp.get("data", {}).get("goods_from_channel", [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true", help="运行内置自检用例")
    ap.add_argument("--json", help="要校验的 querymail1 响应体 json 文件")
    ap.add_argument("--fix", action="store_true", help="重算 token 并写回文件")
    a = ap.parse_args()
    if a.selftest or not a.json:
        sys.exit(0 if selftest() else 1)
    resp = json.load(open(a.json, encoding="utf-8"))
    bad = 0
    for m in walk(resp):
        ok = verify(m)
        print(("OK   " if ok else "FAIL ") + f"id={m['id']} token={m.get('token')}")
        if not ok:
            bad += 1
            if a.fix:
                m["token"] = calc_token(m)
    if a.fix and bad:
        json.dump(resp, open(a.json, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"已重算并写回 {bad} 封邮件的 token -> {a.json}")
    sys.exit(0 if bad == 0 else 2)


if __name__ == "__main__":
    main()
