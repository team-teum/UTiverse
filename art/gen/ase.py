import struct, zlib
from PIL import Image
def string(s):
    b=s.encode('utf-8'); return struct.pack('<H',len(b))+b
def chunk(t,data): return struct.pack('<IH',len(data)+6,t)+data
def write(path, img, layer_name, grid):
    img=img.convert('RGBA'); w,h=img.size
    colors=sorted(set(img.getdata()))
    colors=[c for c in colors if c[3]>0][:256]
    pal=struct.pack('<III',len(colors),0,len(colors)-1)+b'\0'*8
    for (r,g,b,a) in colors: pal+=struct.pack('<HBBBB',0,r,g,b,a)
    layer=struct.pack('<HHHHHHB',3,0,0,0,0,0,255)+b'\0'*3+string(layer_name)
    cel=struct.pack('<HhhBHh',0,0,0,255,2,0)+b'\0'*5+struct.pack('<HH',w,h)+zlib.compress(img.tobytes())
    chunks=[chunk(0x2019,pal),chunk(0x2004,layer),chunk(0x2005,cel)]
    body=b''.join(chunks)
    frame=struct.pack('<IHHH',16+len(body),0xF1FA,len(chunks),100)+b'\0\0'+struct.pack('<I',len(chunks))+body
    header=struct.pack('<IHHHHHIHII',128+len(frame),0xA5E0,1,w,h,32,1,100,0,0)
    header+=struct.pack('<B3sHBBhhHH',0,b'\0\0\0',len(colors),1,1,0,0,grid[0],grid[1])
    header+=b'\0'*(128-len(header))
    assert len(header)==128
    open(path,'wb').write(header+frame)
def read(path):
    d=open(path,'rb').read()
    size,magic,frames,w,h,depth=struct.unpack('<IHHHHH',d[:14])
    assert magic==0xA5E0 and size==len(d)
    gw,gh=struct.unpack('<HH',d[40:44])
    off=128; fs,fm,_,_,_,nch=struct.unpack('<IHHH2sI',d[off:off+16]); assert fm==0xF1FA
    p=off+16; out={}
    for _ in range(nch):
        cs,ct=struct.unpack('<IH',d[p:p+6])
        if ct==0x2005:
            body=d[p+6:p+cs]; cw,chh=struct.unpack('<HH',body[16:20]); px=zlib.decompress(body[20:])
            out['img']=Image.frombytes('RGBA',(cw,chh),px)
        p+=cs
    return w,h,gw,gh,out

def write_layers(path, w, h, layers, visible=()):
    """레이어 여러 개, 프레임 1개짜리 RGBA Aseprite 파일"""
    colors=set()
    for _, img in layers:
        colors.update(c for c in img.convert('RGBA').getdata() if c[3]>0)
    colors=sorted(colors)[:256]
    pal=struct.pack('<III',len(colors),0,max(0,len(colors)-1))+b'\0'*8
    for (r,g,b,a) in colors: pal+=struct.pack('<HBBBB',0,r,g,b,a)
    chunks=[chunk(0x2019,pal)]
    for name,_ in layers:
        flags=(1 if name in visible else 0)|2
        chunks.append(chunk(0x2004,struct.pack('<HHHHHHB',flags,0,0,0,0,0,255)+b'\0'*3+string(name)))
    for i,(_,img) in enumerate(layers):
        img=img.convert('RGBA')
        cel=struct.pack('<HhhBHh',i,0,0,255,2,0)+b'\0'*5+struct.pack('<HH',w,h)+zlib.compress(img.tobytes())
        chunks.append(chunk(0x2005,cel))
    body=b''.join(chunks)
    frame=struct.pack('<IHHH',16+len(body),0xF1FA,len(chunks),100)+b'\0\0'+struct.pack('<I',len(chunks))+body
    header=struct.pack('<IHHHHHIHII',128+len(frame),0xA5E0,1,w,h,32,1,100,0,0)
    header+=struct.pack('<B3sHBBhhHH',0,b'\0\0\0',len(colors),1,1,0,0,w,h)
    header+=b'\0'*(128-len(header))
    open(path,'wb').write(header+frame)
