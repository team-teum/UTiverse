# 기본 아바타 = 원래 시안 아바타 'Lumi'의 외곽선을 그대로 따라 그린 몸 (머리만 둥글게, 눈은 더 귀엽게)
# 그 위에 헤어 5종(뒤/앞)과 우주복 5종을 겹친다. 칸 32×40, 발끝 38행(외곽선 39).
import sys
sys.path.insert(0, '/home/claude/av7')
from PIL import Image
import ase

W, H = 32, 40
OUT = (43, 29, 36, 255)
EYE = (35, 24, 30, 255)
S1, S2, S3 = (250, 240, 230, 255), (230, 200, 180, 255), (200, 160, 140, 255)
H1, H2, H3 = (210, 210, 210, 255), (150, 150, 150, 255), (90, 90, 90, 255)
WHITE = (255, 255, 255, 255)

def new(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))
def box(x, y, w, h): return [(y + r, x, x + w - 1) for r in range(h)]
def fill(img, spans, c):
    for y, a, b in spans:
        for x in range(a, b + 1):
            if 0 <= x < W and 0 <= y < H: img.putpixel((x, y), c)
def shape(img, spans, c, outline=OUT):
    cells = {(x, y) for y, a, b in spans for x in range(a, b + 1)}
    if outline:
        for (x, y) in list(cells):
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                n = (x+dx, y+dy)
                if n not in cells and 0 <= n[0] < W and 0 <= n[1] < H:
                    img.putpixel(n, outline)
    for (x, y) in cells:
        if 0 <= x < W and 0 <= y < H: img.putpixel((x, y), c)

# ── Lumi 외곽선 (시트 1행 1열, 칸 32×40) ──
# 머리 6~23행 · x6~25 (위를 둥글게), 귀 15~17행, 목 23행, 몸통 24~33행, 팔 25~31행, 다리 34~38행
HEAD = [(6,13,18),(7,11,20),(8,9,22),(9,8,23),(10,8,23)] + [(y,7,24) for y in range(11,20)] + [(20,8,23),(21,10,21)]
EARS = [(y,5,6) for y in range(15,19)] + [(y,25,26) for y in range(15,19)]
TORSO = [(24,13,18),(25,12,19),(26,12,19)] + box(11, 27, 10, 6)   # 어깨는 좁고 아래로 갈수록 넓어지는 몸통 (Lumi처럼)
TORSO_SHADE = [(y, b - 2, b) for (y, a, b) in TORSO]
ARM_L = [(25,10,10),(26,9,10),(27,8,9),(28,7,9),(29,7,9),(30,7,9),(31,7,9),(32,8,9)]
ARM_R = [(y, 31 - b, 31 - a) for (y, a, b) in ARM_L]
LEGS = (10, 18)                                   # 다리 4칸: 10~13, 18~21
LEG_Y = 34                                        # 34~38, 외곽선 39

def legs_spans(rows):
    return [(y, lx, lx + 3) for lx in LEGS for y in rows]

base = new()
shape(base, legs_spans(range(34, 39)), S2)
fill(base, [(y, lx + 3, lx + 3) for lx in LEGS for y in range(34, 39)], S3)
shape(base, TORSO, S2)
fill(base, TORSO_SHADE, S3)
fill(base, box(12, 26, 1, 3), S1)
shape(base, ARM_L + ARM_R, S2)
shape(base, HEAD + EARS, S2)
fill(base, [(19,21,24),(20,19,23),(21,16,21),(9,22,23),(10,22,23)] + [(y,23,24) for y in range(11,19)] + [(y,25,26) for y in range(15,19)], S3)
fill(base, [(7,13,15),(8,11,13),(9,10,11),(10,9,9)], S1)
# 목: 머리 아래 외곽선과 몸통 위 외곽선 사이를 살로 이어 붙인다 (떨어져 보이지 않게)
fill(base, [(21, 14, 17), (22, 14, 17), (23, 14, 17)], S2)
fill(base, [(22, 17, 17), (23, 17, 17)], S3)
fill(base, [(22, 13, 13), (22, 18, 18)], OUT)


# ── 헤어 (머리 위·앞머리 / 몸 뒤) ──
def top(extra=()):
    t = [(4,13,18),(5,11,20),(6,9,22),(7,8,23),(8,7,24),(9,6,25),(10,6,25),(11,5,26),(12,5,26),(13,5,26),
         (14,5,12),(14,14,26),
         (15,5,8),(15,15,17),(15,23,26),
         (16,5,6),(16,25,26)]
    return t + list(extra)
BANG = [(14,6,12),(14,14,25),(15,6,8),(15,15,17),(15,23,25),(8,23,24),(9,24,25),(10,24,25),(11,25,26),(12,25,26),(13,25,26)]
def shade(img, rows): fill(img, rows, H3)
def shine(img): fill(img, [(5,13,15),(6,11,13),(7,10,10)], H1)

hairs = []
f, b = new(), new()   # 1 짧은 머리
shape(f, top(), H2); shine(f); shade(f, BANG); hairs.append((b, f))
f, b = new(), new()   # 2 단발
shape(f, top(box(4, 15, 3, 9) + box(25, 15, 3, 9)), H2); shine(f)
shade(f, BANG + box(4, 21, 3, 3) + box(25, 19, 3, 5)); hairs.append((b, f))
f, b = new(), new()   # 3 삐죽 머리 (Lumi처럼)
spikes = [(3,9,10),(4,8,11),(2,15,16),(3,14,17),(4,13,18),(3,21,22),(4,20,23),(8,3,5),(9,4,5),(8,26,28),(9,26,27)]
shape(f, top(spikes + [(15,4,6),(16,4,5),(15,25,27),(16,26,27)]), H2); shine(f)
shade(f, BANG + [(4,9,10),(4,14,17),(4,21,22)]); hairs.append((b, f))
f, b = new(), new()   # 4 긴 머리
shape(b, box(4, 12, 24, 20) + [(32, 6, 25)], H2)
fill(b, box(4, 26, 24, 6), H3)
shape(f, top(box(4, 15, 3, 12) + box(25, 15, 3, 12)), H2); shine(f)
shade(f, BANG + box(4, 23, 3, 4) + box(25, 21, 3, 6)); hairs.append((b, f))
f, b = new(), new()   # 5 똥머리
bun = []
for dy in range(-3, 3):
    half = int((9 - dy*dy) ** 0.5 + 0.3) + 1
    bun.append((3 + dy, 15 - half, 16 + half))
shape(f, bun + top(), H2)
fill(f, [(6,11,14),(7,9,11),(1,13,15)], H1); shade(f, BANG + [(4,18,19)]); hairs.append((b, f))

# ── 우주복 5종 (Lumi 몸통·팔·다리 그대로) ──
SHOE = (74, 58, 70, 255)
def suit(colors, sleeves=5, extra=None, shoe=SHOE):
    img = new()
    t, ts, bt, bs = colors
    shape(img, TORSO, t)
    fill(img, TORSO_SHADE, ts)
    sl = [(y, a, b) for (y, a, b) in ARM_L + ARM_R if y < 25 + sleeves]
    shape(img, sl, t)
    fill(img, [(y, a, b) for (y, a, b) in sl if b > 16], ts)
    shape(img, legs_spans(range(34, 37)) + [(33, 11, 20)], bt)
    fill(img, [(y, lx + 3, lx + 3) for lx in LEGS for y in range(34, 37)], bs)
    shape(img, legs_spans(range(37, 39)), shoe)
    if extra: extra(img)
    return img

def basic(img):
    fill(img, box(11, 30, 10, 1), (242, 137, 92, 255))
    fill(img, box(13, 26, 2, 2), (109, 179, 242, 255))
def hoodie(img):
    fill(img, box(13, 29, 6, 3), (229, 148, 181, 255))
    fill(img, [(24, 14, 14), (25, 14, 14), (24, 17, 17), (25, 17, 17)], WHITE)
def overalls(img):
    fill(img, box(13, 28, 6, 5), (90, 143, 216, 255))
    fill(img, [(24, 13, 13), (25, 13, 13), (26, 13, 13), (27, 13, 13), (24, 18, 18), (25, 18, 18), (26, 18, 18), (27, 18, 18)], (90, 143, 216, 255))
    fill(img, [(28, 13, 13), (28, 18, 18)], (255, 209, 102, 255))
def pajama(img):
    for (x, y) in ((13, 26), (17, 28), (14, 31), (18, 25), (11, 35), (19, 35), (8, 28), (23, 28)):
        img.putpixel((x, y), (255, 214, 102, 255))
def explorer(img):
    fill(img, box(13, 26, 6, 4), (124, 196, 240, 255))
    fill(img, box(13, 26, 6, 1), (180, 225, 250, 255))
    fill(img, box(11, 32, 10, 1), (90, 70, 60, 255))

suits = [
    suit(((244, 244, 248, 255), (207, 207, 220, 255), (244, 244, 248, 255), (207, 207, 220, 255)), extra=basic, shoe=(120, 130, 160, 255)),
    suit(((242, 167, 195, 255), (217, 135, 168, 255), (108, 111, 140, 255), (85, 88, 112, 255)), extra=hoodie),
    suit(((255, 209, 102, 255), (232, 178, 60, 255), (90, 143, 216, 255), (68, 113, 184, 255)), sleeves=2, extra=overalls),
    suit(((61, 72, 140, 255), (44, 52, 105, 255), (61, 72, 140, 255), (44, 52, 105, 255)), extra=pajama, shoe=(240, 200, 120, 255)),
    suit(((245, 145, 80, 255), (214, 110, 58, 255), (245, 145, 80, 255), (214, 110, 58, 255)), extra=explorer, shoe=(90, 70, 60, 255)),
]

base.save('base.png')
hs = Image.new('RGBA', (W * 5, H * 2), (0, 0, 0, 0))
for i, (b, f) in enumerate(hairs):
    hs.alpha_composite(b, (i * W, 0)); hs.alpha_composite(f, (i * W, H))
hs.save('hair.png')
ss = Image.new('RGBA', (W * 5, H), (0, 0, 0, 0))
for i, s in enumerate(suits): ss.alpha_composite(s, (i * W, 0))
ss.save('suits.png')
layers = [('body', base)] + [(f'suit-{i+1}', s) for i, s in enumerate(suits)]
layers += [(f'hair-back-{i+1}', b) for i, (b, f) in enumerate(hairs)]
layers += [(f'hair-front-{i+1}', f) for i, (b, f) in enumerate(hairs)]
ase.write_layers('character.aseprite', W, H, layers, visible={'body', 'suit-1', 'hair-front-1'})

def compose(h, s):
    img = new()
    if h is not None: img.alpha_composite(hairs[h][0])
    img.alpha_composite(base)
    if s is not None: img.alpha_composite(suits[s])
    if h is not None: img.alpha_composite(hairs[h][1])
    return img
lumi = Image.open('/home/claude/av3/lumi.png').convert('RGBA')
prev = Image.new('RGBA', (W * 7, H * 2), (40, 40, 60, 255))
prev.alpha_composite(lumi, (0, 0)); prev.alpha_composite(compose(None, None), (W, 0))
for i in range(5): prev.alpha_composite(compose(i, None), ((i + 2) * W, 0))
prev.alpha_composite(lumi, (0, H)); prev.alpha_composite(compose(2, 0), (W, H))
for i in range(5): prev.alpha_composite(compose(i, i), ((i + 2) * W, H))
prev.resize((prev.width * 5, prev.height * 5), Image.NEAREST).save('prev.png')
print('ok')
