#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""查自己账号有没有被标记 / 被真封。

用法:
  python check_flags.py --account-id <accountId> --openid <openId>
accountId / openId 在你抓到的 login 响应里 (POST /Logic/account/login)。
"""
import argparse, json, sys, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
BASE = "http://server1.xxxy.dayukeji.com"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--account-id", required=True)
    ap.add_argument("--openid", required=True)
    ap.add_argument("--channel", default="000020", help="OPPO=000020, vivo=000368, 小米=000066 ...")
    ap.add_argument("--game-ver", default="1.9.0.070502")
    a = ap.parse_args()
    login = {"accountId": a.account_id, "nick": "undefined", "icon": "", "openId": a.openid,
             "game": 2301, "channel": a.channel, "mode": "release", "gameId": 2301,
             "gameVer": a.game_ver, "gameMode": "release", "plat": "android",
             "uid": "undefined", "logicToken": "undefined"}
    body = "&".join("%s=%s" % (k, urllib.parse.quote(str(v), safe="")) for k, v in login.items())
    req = urllib.request.Request(BASE + ":15015/Logic/account/login", data=body.encode("utf-8"),
                                 headers={"Content-Type": "application/x-www-form-urlencoded",
                                          "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; SM-S926B Build/9ba7f0d.0)"})
    d = json.loads(urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace"))
    base = d["data"]["baseData"]
    print("errorCode  :", d.get("errorCode"))
    print("invalid    :", d["data"].get("invalid", "absent"))
    print("adCoin     :", json.dumps(base.get("coin", {}).get("adCoin"), ensure_ascii=False))
    print("robotCoin  :", json.dumps(base.get("coin", {}).get("robotCoin"), ensure_ascii=False))
    print("cheat 键   :", [k for k in base.keys() if "cheat" in k.lower()] or "无")
    print()
    print("提示: invalid 有值 / errorCode==1001 -> 真封号; 只有 cheat 键 -> 本地弹窗, 按 docs/02 清掉即可")


if __name__ == "__main__":
    main()
