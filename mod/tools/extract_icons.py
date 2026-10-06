# -*- coding: utf-8 -*-
"""从游戏资源提取全部物品图标到 deliverables/mail-tool/icons/<id>.png"""
import os, re, json, shutil
from PIL import Image

APK = r'work/apk'
SETTINGS = r'work/dump/extract_00_encrypt.js'
OUT = r'deliverables/mail-tool/icons'
os.makedirs(OUT, exist_ok=True)

s = open(SETTINGS, encoding='utf-8', errors='replace').read()

# 1) texture short-id -> png path
tex_map = {}
for m in re.finditer(r'"([0-9a-f]{9})":\["([^"]+\.(?:png|jpg))","cc\.Texture2D"\]', s):
    tex_map[m.group(1)] = m.group(2)
print('texture map entries:', len(tex_map))

# 2) item id -> asset entry (uuid, type)
item_entries = {}
for m in re.finditer(r'"([A-Za-z0-9+/]{22})":\["resources/Texture/Item/([^"]+)"([^\]]*)\]', s):
    uuid, name, rest = m.group(1), m.group(2), m.group(3)
    typ = rest.split(',')[1].strip() if ',' in rest else ''
    if re.match(r'^\d', name):
        item_entries[name] = (uuid, typ)
print('item entries:', len(item_entries))

B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
IDX = {c: i for i, c in enumerate(B64)}
def decompress_uuid(cu):
    if len(cu) != 22: return cu
    out = list(cu[:2])
    for i in range(2, len(cu), 2):
        v = (IDX[cu[i]] << 6) | IDX[cu[i+1]]
        out.append('%03x' % v)
    h = ''.join(out)
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"

atlas_cache = {}
def get_atlas(path):
    if path not in atlas_cache:
        full = os.path.join(APK, 'assets', 'res', 'raw-assets', path.replace('/', os.sep))
        atlas_cache[path] = Image.open(full).convert('RGBA')
    return atlas_cache[path]

ok, missing, direct = 0, [], 0
meta = {}
for item_id, (uuid, typ) in sorted(item_entries.items()):
    dest = os.path.join(OUT, item_id + '.png')
    if typ == '0':
        src = os.path.join(APK, 'assets', 'res', 'raw-assets', f'resources/Texture/Item/{item_id}.png')
        if os.path.exists(src):
            shutil.copyfile(src, dest); ok += 1; direct += 1
        else:
            missing.append((item_id, 'direct-missing'))
        continue
    full_uuid = decompress_uuid(uuid)
    jp = os.path.join(APK, 'assets', 'res', 'import', full_uuid[:2], full_uuid + '.json')
    if not os.path.exists(jp):
        missing.append((item_id, 'json-missing')); continue
    try:
        content = json.load(open(jp, encoding='utf-8'))['content']
        tex = content['texture']; rect = content['rect']
        rotated = content.get('rotated', False)
        atlas_path = tex_map.get(tex)
        if not atlas_path:
            missing.append((item_id, 'texmap-miss:' + tex)); continue
        im = get_atlas(atlas_path)
        W, H = im.size
        x, y, w, h = rect
        crop = im.crop((x, y, x + w, y + h))
        if rotated:
            crop = crop.rotate(-90, expand=True)
        crop.save(dest)
        meta[item_id] = {'atlas': atlas_path, 'rect': rect, 'rotated': rotated, 'size': crop.size}
        ok += 1
    except Exception as e:
        missing.append((item_id, 'err:' + str(e)))

print('extracted:', ok, '(direct:', direct, ')')
print('missing:', missing)
json.dump(meta, open(r'work/notes/icon_meta.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# summary of sizes
sizes = {}
for f in os.listdir(OUT):
    sz = os.path.getsize(os.path.join(OUT, f))
    sizes[f] = sz
print('total size: %.1f KB' % (sum(sizes.values())/1024))
