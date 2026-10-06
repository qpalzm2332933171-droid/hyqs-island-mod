#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""荒野日记:孤岛 — 清除存档里的"作弊标记" (4015-1 ~ 4015-6 弹窗)

原理:
  游戏客户端进 Main 场景时调用 _checkIsCheated(), 读取 base.* 里的一堆标记,
  只要有任何一个非 0 就弹「错误4015」并要求重启 -> 表现为"封号"。
  这些标记随存档同步到服务器 (updatedata), 所以换设备/重装都还在, 必须主动清零。

  清除方式: 向 /Logic/user/updatedata 发一次 modify = {"base.xxx":0}
  其中 sign = md5( SECRET + base64(原样 modify 字符串) + uid )

  注意: 服务器只认 sign, 不校验内容语义 —— 这就是能自己解封的原因。
        （真正被服务器封禁 = /Logic/account/login 返回 errorCode 1001 或 invalid 字段, 本地无解）

用法:
  python unban.py --uid <你的UID> --account-id <登录accountId> --openid <openId> \
                  --logic-token <运行期 logicToken> --key base.coin.adCoin.illegal
  python unban.py --uid ... --all          # 清掉全部已知标记
"""
import argparse, base64, hashlib, json, re, sys, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding="utf-8")

SECRET = "apsdfAJOJ(#@&($0809283JLJOOJ"
BASE = "http://server1.xxxy.dayukeji.com"
KEYS = ["base.coin.adCoin.illegal", "base.cheatAchievement", "base.achieve_fake_profile",
        "base.cheatBuildProducts", "base.cheatBuildProduct", "base.cheatGoOutMax",
        "base.cheatSelectGift", "base.cheatMail", "base.cheatQueryMail", "base.cheatMailMd5",
        "base.cheatAllMailMd5", "base.cheatAdCoinNum", "base.cheatAdCoinCount",
        "base.cheatHYDataUpdate", "base.cheatProduct", "base.cheatItem"]


def sign_modify(modify_str, uid):
    b64 = base64.b64encode(modify_str.encode("utf-8")).decode("ascii")
    return hashlib.md5((SECRET + b64 + uid).encode("utf-8")).hexdigest()


def post(url, params):
    body = "&".join("%s=%s" % (k, urllib.parse.quote(str(v), safe="")) for k, v in params.items())
    req = urllib.request.Request(url, data=body.encode("utf-8"), headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; SM-S926B Build/9ba7f0d.0)",
        "Accept-Encoding": "gzip,deflate"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "replace")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--uid", required=True, help="游戏 UID (值本身在游戏设置里可见)")
    ap.add_argument("--account-id", required=True, help="登录接口响应里的 accountId")
    ap.add_argument("--openid", required=True, help="登录接口响应里的 openId")
    ap.add_argument("--logic-token", required=True, help="登录接口响应里的 logicToken")
    ap.add_argument("--channel", default="000020", help="渠道号, OPPO=000020")
    ap.add_argument("--game-ver", default="1.9.0.070502")
    ap.add_argument("--key", action="append", help="要清零的键, 可重复; 不填则用 --all")
    ap.add_argument("--all", action="store_true", help="清零全部已知标记")
    ap.add_argument("--verify", action="store_true", help="清零后再调 login 复查")
    a = ap.parse_args()

    keys = KEYS if a.all else (a.key or ["base.coin.adCoin.illegal"])
    common = dict(uid=a.uid, gameId=2301, gameVer=a.game_ver, gameMode="release",
                  plat="android", channel=a.channel, accountId=a.account_id,
                  logicToken=a.logic_token, aliveTime=18002922)
    for k in keys:
        modify = json.dumps({k: 0}, separators=(",", ":"))
        p = dict(common); p["modify"] = modify; p["sign"] = sign_modify(modify, a.uid)
        try:
            resp = post(BASE + ":14015/Logic/user/updatedata", p)
            ec = re.search(r'"errorCode"\s*:\s*(-?\d+)', resp)
            print(f"[{k}] sign={p['sign']} errorCode={ec.group(1) if ec else '?'} {resp[:120]}")
        except Exception as e:
            print(f"[{k}] 请求失败: {e}")

    if a.verify:
        login = {"accountId": a.account_id, "nick": "undefined", "icon": "", "openId": a.openid,
                 "game": 2301, "channel": a.channel, "mode": "release", "gameId": 2301,
                 "gameVer": a.game_ver, "gameMode": "release", "plat": "android",
                 "uid": "undefined", "logicToken": "undefined"}
        lr = post(BASE + ":15015/Logic/account/login", login)
        for pat, tag in ((r'"errorCode"\s*:\s*(-?\d+)', "errorCode"),
                         (r'"invalid"[^,}]*', "invalid"),
                         (r'"adCoin"\s*:\s*\{[^}]*\}', "adCoin")):
            m = re.search(pat, lr)
            print(f"login {tag}: {m.group(0) if m else 'absent'}")


if __name__ == "__main__":
    main()
