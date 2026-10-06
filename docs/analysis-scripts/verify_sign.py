# -*- coding: utf-8 -*-
import hashlib, base64, sys, urllib.parse
sys.stdout.reconfigure(encoding="utf-8")
SECRET = "apsdfAJOJ(#@&($0809283JLJOOJ"
# record 6421: modify param (URL-decoded, exact string as sent) + uid + expected sign
modify = '{"base.activities.aq":{},"core.timeline":208322,"core.role.7001":2.8028,"core.role.7000":93.22749999999999,"core.role.7004":100,"core.role.7005":100,"core.role.7006":87.26000000000005,"core.role.7003":350,"core.events.utime.K_PET_HUNGER":208022,"core.shop.LIMIT.106":1,"core.shop.LIMIT.100":3,"core.shop.LIMIT.101":3,"core.shop.LIMIT.103":3,"core.shop.LIMIT.102":3,"core.shop.LIMIT.105":3,"core.shop.LIMIT.107":11,"core.bag.4404":1,"core.warehouse.4404":"undefined","base.technology.script.hasNum":2263,"base.technology.seniorScript.hasNum":2649,"base.technology.spiritCurrency":1491,"base.technology.powerCurrency":1093,"base.coin.adCoin.illegal":1}'
uid = "1000000000000"
expected = "3ec1f3903e2b49569e60863bad53d4af"
b64 = base64.b64encode(modify.encode("utf-8")).decode("ascii")
cand = {
    "SECRET + b64 + uid": SECRET + b64 + uid,
    "b64 + uid + SECRET": b64 + uid + SECRET,
    "SECRET + b64": SECRET + b64,
}
for name, s in cand.items():
    h = hashlib.md5(s.encode("utf-8")).hexdigest()
    print("%-24s %s %s" % (name, h, "MATCH" if h == expected else ""))
# also try with urlencoded modify (as raw)
modify_raw = urllib.parse.quote(modify, safe='')
b64raw = base64.b64encode(modify_raw.encode("utf-8")).decode("ascii")
for name, s in {"SECRET + b64(raw) + uid": SECRET + b64raw + uid}.items():
    h = hashlib.md5(s.encode("utf-8")).hexdigest()
    print("%-24s %s %s" % (name, h, "MATCH" if h == expected else ""))
