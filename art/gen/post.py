from PIL import Image
import os; os.chdir('.')
def shift(img, top, bottom, dy, clear_to, cell_h=80):
    out=img.copy(); W=img.width
    for y0 in range(0,img.height,cell_h):
        part=img.crop((0,y0+top,W,y0+bottom+1))
        out.paste(Image.new('RGBA',(W,clear_to+1-top)),(0,y0+top))
        out.alpha_composite(part,(0,y0+top+dy))
    return out
hair=shift(Image.open('hair_px.png').convert('RGBA'),0,77,2,79); hair.save('hair_px.png')
s=Image.open('suits_px.png').convert('RGBA')
body=shift(s.crop((0,0,s.width,80)),0,45,2,45); hat=shift(s.crop((0,80,s.width,160)),0,77,2,79)
o=Image.new('RGBA',(s.width,160)); o.alpha_composite(body,(0,0)); o.alpha_composite(hat,(0,80)); o.save('suits_px.png')
base=Image.open('base_px.png'); faces=Image.open('faces.png'); W=64
def comp(f,sv=14):
    i=Image.new('RGBA',(64,80)); i.alpha_composite(base); i.alpha_composite(faces.crop((f*W,0,f*W+W,80)))
    i.alpha_composite(o.crop((sv*W,0,sv*W+W,80))); i.alpha_composite(o.crop((sv*W,80,sv*W+W,160))); return i
pr=Image.new('RGBA',(66*5,82),(60,50,100,255))
for k,f in enumerate([0,2,3,9]): pr.alpha_composite(comp(f),(k*66+1,1))
# 비교용: 후드 없는 기본
i=Image.new('RGBA',(64,80)); i.alpha_composite(base); i.alpha_composite(faces.crop((0,0,64,80))); pr.alpha_composite(i,(4*66+1,1))
pr.resize((pr.width*4,pr.height*4),0).save('preview.png')
