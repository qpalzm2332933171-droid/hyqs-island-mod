# -*- coding: utf-8 -*-
import struct, zlib, sys
def read_png(path):
    d = open(path,'rb').read()
    pos = 8; w=h=None; idat=b''; 
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]; typ = d[pos+4:pos+8]
        data = d[pos+8:pos+8+ln]
        if typ==b'IHDR':
            w,h,bd,ct = struct.unpack('>IIBB', data[:10])
        elif typ==b'IDAT': idat += data
        elif typ==b'IEND': break
        pos += 12+ln
    raw = zlib.decompress(idat)
    bpp = 4 if ct==6 else 3
    stride = w*bpp
    out = bytearray(w*h*bpp)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p+=1
        line = bytearray(raw[p:p+stride]); p+=stride
        if f==1:
            for i in range(bpp, stride): line[i] = (line[i]+line[i-bpp])&255
        elif f==2:
            for i in range(stride): line[i] = (line[i]+prev[i])&255
        elif f==3:
            for i in range(stride):
                a = line[i-bpp] if i>=bpp else 0
                line[i] = (line[i]+((a+prev[i])>>1))&255
        elif f==4:
            for i in range(stride):
                a = line[i-bpp] if i>=bpp else 0
                b = prev[i]; c = prev[i-bpp] if i>=bpp else 0
                pp = a+b-c; pa=abs(pp-a); pb=abs(pp-b); pc=abs(pp-c)
                pr = a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[i] = (line[i]+pr)&255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return w,h,bpp,bytes(out)

w,h,bpp,px = read_png(sys.argv[1])
print('size', w, h, 'bpp', bpp)
target = (0x6F,0xD0,0x8C)
minx=miny=10**9; maxx=maxy=-1; cnt=0
for y in range(0, h, 2):
    row = y*w*bpp
    for x in range(0, w, 2):
        i = row + x*bpp
        r,g,b = px[i], px[i+1], px[i+2]
        if abs(r-target[0])<26 and abs(g-target[1])<26 and abs(b-target[2])<26:
            cnt+=1
            if x<minx: minx=x
            if x>maxx: maxx=x
            if y<miny: miny=y
            if y>maxy: maxy=y
print('green pixels', cnt, 'bbox x', minx, maxx, 'y', miny, maxy)
