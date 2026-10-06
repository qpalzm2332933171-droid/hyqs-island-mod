# -*- coding: utf-8 -*-
import json, csv, os, re
os.makedirs('deliverables', exist_ok=True)
d = json.load(open(r'work/apk/assets/res/raw-assets/resources/Profiles/item_profile.json', encoding='utf-8'))
def sortkey(k):
    m = re.match(r'^(\d+)(?:_(\d+))?$', k)
    return (int(m.group(1)), int(m.group(2) or 0)) if m else (999999, k)
items = sorted([k for k, v in d.items() if isinstance(v, dict) and 'NAME' in v and k != '0'], key=sortkey)
notes = {
 '100000': '书页(货币,走scriptChange)', '100002': '求生精选(货币,走logItem)', '100003': '天赋原石(货币)',
 '100004': '天赋结晶(货币)', '100005': '时之沙(广告币)', '100006': '神秘钥匙(机器人币)',
 '4088': '未知果实(可开裂变体4088_0..4)', '7003': '治疗(功能物)', '7006': '喂食(功能物)',
 '4096': '实物周边', '4097': '实物周边',
}
rows = []
for k in items:
    v = d[k]
    nm = (v.get('NAME') or {}).get('cn', '')
    rows.append((k, nm, v.get('TYPE', ''), v.get('WEIGHT', ''), v.get('COIN_VALUE', ''), notes.get(k, '')))
with open('deliverables/物品ID表.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['ID', '名称', '类型', '重量', '贝壳价值', '备注'])
    for r in rows: w.writerow(r)
with open('deliverables/物品ID表.md', 'w', encoding='utf-8') as f:
    f.write('# 荒野日记:孤岛 物品ID表 (1.9.0.0)\n\n')
    f.write('来源: APK `assets/res/raw-assets/resources/Profiles/item_profile.json`,共 %d 条(不含内部ID 0)。\n' % len(rows))
    f.write('注: 100000-100006 为货币类,邮件领取时走专用通道; 4088 为可开裂果实; 7003/7006 为功能物。\n\n')
    f.write('| ID | 名称 | 类型 | 重量 | 贝壳价值 | 备注 |\n|---|---|---|---|---|---|\n')
    for r in rows:
        f.write('| {} | {} | {} | {} | {} | {} |\n'.format(*r))
print('items:', len(rows))
print('first 5:', rows[:5])
print('last 3:', rows[-3:])
