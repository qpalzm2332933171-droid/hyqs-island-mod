# -*- coding: utf-8 -*-
import json, os
from PIL import Image

atlas2 = r'work/apk/assets/res/raw-assets/resources/Texture/Item/AutoAtlas-2.png'
atlas1 = r'work/apk/assets/res/raw-assets/resources/Texture/Item/AutoAtlas-1.png'
sf = json.load(open(r'work/apk/assets/res/import/3e/3ea429a1-9d5e-4cd3-ac94-eae9d49164d6.json', encoding='utf-8'))['content']
print('sf:', sf)
im2 = Image.open(atlas2); print('atlas2 size', im2.size)
im1 = Image.open(atlas1); print('atlas1 size', im1.size)
x, y, w, h = sf['rect']
os.makedirs('work/icon_test', exist_ok=True)
# top-left origin test
im2.crop((x, y, x+w, y+h)).save('work/icon_test/4000_tl.png')
# bottom-left origin test
W, H = im2.size
im2.crop((x, H-y-h, x+w, H-y)).save('work/icon_test/4000_bl.png')
print('saved. rect=', sf['rect'])
