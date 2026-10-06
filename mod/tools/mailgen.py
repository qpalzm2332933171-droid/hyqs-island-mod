#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""荒野日记:孤岛 — 邮件响应体生成器 (自带合法 token)

生成可直接填进 Reqable 响应体重写规则的 querymail1 响应体。

用法示例:
  # 全物品礼包(从 item_profile.json 读全部物品, 每样 99 个 + 999999 贝壳)
  python mailgen.py --mode all --to-user <你的UID> --count 99 --coin 999999 --json-out all.json
  # 自定义 goods 串
  python mailgen.py --goods "4438:10;100002:6" --coin 2800 --to-user <你的UID> --json-out m.json

goods 串格式: "物品ID:数量;物品ID:数量"
特殊 ID(货币)可直接写进 goods: 100000 书页 / 100002 求生精选 / 100003 天赋原石 /
100004 天赋结晶 / 100005 时之砂(最多9, 见 docs/02) / 100006 神秘钥匙
"""
import argparse, hashlib, json, os, sys, time

SECRET = "apsdfAJOJ(#@&($0809283JLJOOJ"
FIELDS = ["id", "type", "goods", "to_user", "createTime", "deadline", "coin"]
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PROFILE = os.path.join(HERE, "..", "..", "game-source", "Profiles", "item_profile.json")
FALLBACK_PROFILE = os.path.join(HERE, "item_profile.json")


def calc_token(mail: dict) -> str:
    s = "".join(str(mail[f]) for f in FIELDS) + SECRET
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def load_items(profile_path):
    d = json.load(open(profile_path, encoding="utf-8"))
    return {k: v["NAME"].get("cn", "") for k, v in d.items()
            if isinstance(v, dict) and "NAME" in v and k != "0"}


def find_profile():
    for p in (DEFAULT_PROFILE, FALLBACK_PROFILE):
        if os.path.exists(p):
            return p
    return None


def make_mail(mail_id, title, message, goods, coin, to_user, create_time, deadline,
              from_user="dalao", nick="%E7%A9%BA%E9%87%8A", mtype="item", channel="_"):
    m = dict(id=mail_id, title=title, nick=nick, type=mtype, message=message, goods=goods,
             createTime=create_time, deadline=deadline, valid=1, from_user=from_user,
             to_user=to_user, channel=channel, is_receive=0, is_open=0, coin=coin)
    m["token"] = calc_token(m)
    return m


def build_response(mails, now_ms=None):
    now_ms = now_ms or int(time.time() * 1000)
    return {"errorCode": 0, "errorMsg": "", "data": {
        "goods_from_channel": [], "goods_from_user": mails}, "time": now_ms}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--to-user", required=True, help="收件人 uid = 你自己的游戏 UID (游戏内可查)")
    ap.add_argument("--id", type=int, default=1112672461636,
                    help="邮件 id: 填一封你账号上真实存在的邮件 id, updatemail 才最稳")
    ap.add_argument("--title", default="空释的超级礼包")
    ap.add_argument("--message", default=None)
    ap.add_argument("--goods", default=None, help="自定义 goods 串; 不填则按 --mode 生成")
    ap.add_argument("--mode", choices=["all", "custom"], default="all")
    ap.add_argument("--count", type=int, default=99, help="all 模式: 每样物品数量")
    ap.add_argument("--coin", type=int, default=None, help="附带贝壳 (默认 999999)")
    ap.add_argument("--days", type=int, default=30, help="有效天数 (从今天算起)")
    ap.add_argument("--json-out", default=None, help="输出文件; 不填则打印到 stdout")
    a = ap.parse_args()

    now = int(time.time() * 1000)
    if a.goods:
        goods = a.goods
    else:
        prof = find_profile()
        if not prof:
            sys.exit("找不到 item_profile.json, 请用 --goods 手动指定, 或把它放到 tools/ 目录")
        items = load_items(prof)
        goods = ";".join(f"{k}:{a.count}" for k in sorted(items, key=lambda x: (len(x), x)))
        print(f"# 物品数: {len(items)}, goods 长度: {len(goods)}", file=sys.stderr)

    coin = a.coin if a.coin is not None else 999999
    message = a.message or f"全物品x{a.count} + {coin}贝壳, 一键领取!"
    mail = make_mail(a.id, a.title, message, goods, coin, a.to_user,
                     now, now + a.days * 86400000)
    txt = json.dumps(build_response([mail], now_ms=now), ensure_ascii=False, separators=(",", ":"))
    rt = json.loads(txt)
    for m in rt["data"]["goods_from_user"]:
        assert calc_token(m) == m["token"], "token mismatch"
    print(f"[ok] mails=1, json={len(txt)} bytes, token={mail['token']}", file=sys.stderr)
    if a.json_out:
        open(a.json_out, "w", encoding="utf-8").write(txt)
        print(f"[ok] -> {a.json_out}", file=sys.stderr)
    else:
        print(txt)


if __name__ == "__main__":
    main()
