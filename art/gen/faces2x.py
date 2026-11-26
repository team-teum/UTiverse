import math
from PIL import Image
W, H = 64, 80
CLEAR=(0,0,0,0)
def new(): return Image.new('RGBA',(W,H),CLEAR)
def hexc(h,a=255): h=h.lstrip('#'); return (int(h[0:2],16),int(h[2:4],16),int(h[4:6],16),a)
def ellipse(cx, cy, rx, ry):
    s=set()
    for y in range(int(cy-ry)-1,int(cy+ry)+2):
        for x in range(int(cx-rx)-1,int(cx+rx)+2):
            if ((x+0.5-cx)/rx)**2+((y+0.5-cy)/ry)**2<=1: s.add((x,y))
    return s
def poly(pts):
    s=set(); ys=[p[1] for p in pts]
    for y in range(int(min(ys)),int(max(ys))+1):
        yc=y+0.5; xs=[]
        for (x0,y0),(x1,y1) in zip(pts,pts[1:]+pts[:1]):
            if (y0<=yc<y1) or (y1<=yc<y0): xs.append(x0+(yc-y0)*(x1-x0)/(y1-y0))
        xs.sort()
        for p,q in zip(xs[::2],xs[1::2]):
            for x in range(int(math.ceil(p-0.5)),int(math.floor(q-0.5))+1): s.add((x,y))
    return s
def put(img, pts, c):
    for (x,y) in pts:
        x,y=int(round(x)),int(round(y))
        if 0<=x<W and 0<=y<H: img.putpixel((x,y),c)
# ── 눈: 8×9 템플릿 (왼눈; 오른눈은 좌우 반전) ──
# o 속눈썹/외곽 · d 홍채 짙음 · m 홍채 · l 홍채 밝음 · w 하이라이트 · s 흰자 · k 눈꼬리 붉은기
EYE_SHAPES = {
    "basic": [
        "..oooooo",
        ".oooooooo",
        "oodddddo.",
        "odwwmddo.",
        "odwwmmdo.",
        "sdmmmmds.",
        "sdmllmds.",
        ".dmlwld..",
        "..dddd...",
    ],
    "sparkle": [
        "..oooooo",
        ".oooooooo",
        "odddddddo",
        "odwwmmwdo",
        "odwwmmmdo",
        "sdmmwmmds",
        "sdmlllmds",
        ".dmlwwld.",
        "..ddddd..",
    ],
    "small": [  # 깜짝
        ".........",
        "..oooooo.",
        ".osssssso",
        ".ossddsso",
        ".osdwmdso",
        ".osdmmdso",
        ".ossddsso",
        "..osssso.",
        "...oooo..",
    ],
    "half": [  # 심드렁: 위를 덮은 눈꺼풀
        ".........",
        ".........",
        ".........",
        "ooooooooo",
        "odddddddo",
        "sdmmmmmds",
        "sdmllmmds",
        ".dmlwld..",
        "..dddd...",
    ],
    "happy": [
        ".........",
        ".........",
        "...ooo...",
        "..o...o..",
        ".o.....o.",
        "o.......o",
        ".........",
        ".........",
        ".........",
    ],
    "closed": [
        ".........",
        ".........",
        ".........",
        ".........",
        "o.......o",
        ".o.....o.",
        "..ooooo..",
        ".........",
        ".........",
    ],
    "line": [
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "ooooooooo",
        ".........",
        ".........",
        ".........",
    ],
    "gt": [  # >
        ".........",
        ".oo......",
        "...oo....",
        ".....oo..",
        ".......o.",
        ".....oo..",
        "...oo....",
        ".oo......",
        ".........",
    ],
    "heart": [
        ".........",
        ".hh...hh.",
        "hHhh.hhhh",
        "hHhhhhhhh",
        "hhhhhhhhh",
        ".hhhhhhh.",
        "..hhhhh..",
        "...hhh...",
        "....h....",
    ],
    "teary": [
        "..oooooo",
        ".oooooooo",
        "odddddddo",
        "odwwmmddo",
        "odwwmmwdo",
        "tdmmmmmdt",
        "tdmwllmdt",
        "tdmlwwldt",
        "ttdddddtt",
    ],
}
EYE_COLORS = {
    "보라": ("#2a1d3d", "#7a5bb8", "#b59ae6"),
    "갈색": ("#2b1a14", "#7a4a2e", "#c08a5a"),
    "하늘": ("#14304e", "#3e86c8", "#8cc8f2"),
    "분홍": ("#4a1a2e", "#d65a8a", "#f7a8c4"),
    "초록": ("#143a2a", "#3e9a6a", "#8edcb0"),
    "금빛": ("#4a2e10", "#d69a2e", "#f7d77e"),
}

# ── 성별 느낌이 덜한 담백한 표정용 눈 ──
EYE_SHAPES.update({
    "dot": [
        ".........",
        ".........",
        ".........",
        "...ooo...",
        "..ooooo..",
        "..oowoo..",
        "..ooooo..",
        "...ooo...",
        ".........",
    ],
    "flat": [
        ".........",
        ".........",
        ".........",
        ".ooooooo.",
        "..ddddd..",
        "..dmwmd..",
        "...ddd...",
        ".........",
        ".........",
    ],
    "tired": [
        ".........",
        ".........",
        ".........",
        ".........",
        ".ooooooo.",
        "..dmmmd..",
        "...ddd...",
        "..bbbbb..",
        ".........",
    ],
    "up": [
        ".........",
        "...ooo...",
        "..oowoo..",
        "..ooooo..",
        "...ooo...",
        ".........",
        ".........",
        ".........",
        ".........",
    ],
})

def eye_tile(shape, color="보라"):
    dk, md, lt = (hexc(c) for c in EYE_COLORS[color])
    cmap = {'o': (40, 26, 36, 255), 'd': dk, 'm': md, 'l': lt, 'w': (255, 255, 255, 255), 's': (250, 248, 255, 255),
            'h': (240, 70, 120, 255), 'H': (255, 190, 210, 255), 't': (150, 220, 250, 255), 'b': (190, 160, 200, 255)}
    return [[cmap.get(ch) for ch in row.ljust(9, '.')] for row in EYE_SHAPES[shape]]
def draw_eye(img, shape, color, x0, y0, flip=False):
    tile = eye_tile(shape, color)
    for r, row in enumerate(tile):
        for c, col in enumerate(row):
            if col is None: continue
            x = x0 + (8 - c if flip else c)
            put(img, [(x, y0 + r)], col)

LX, RX, EY = 18, 37, 30
BLUSH = (247, 160, 170, 255); BLUSH2 = (240, 128, 146, 255)
MOUTH = (150, 70, 80, 255); MOUTH_IN = (200, 90, 110, 255); TONGUE = (245, 130, 150, 255)
def blush(img, strong=False):
    for cx in (18.5, 45.5):
        for (x, y) in ellipse(cx, 39.5, 3.0, 1.2): put(img, [(x, y)], BLUSH2 if strong and (x + y) % 2 == 0 else BLUSH)
def mouth(img, kind):
    _put = put
    def put_(i, pts, c): _put(i, [(x, y - 1) for (x, y) in pts], c)
    return _mouth(img, kind, put_)
def _mouth(img, kind, put):
    if kind == "dot": put(img, [(31, 42), (32, 42)], MOUTH)
    elif kind == "smile": put(img, [(30, 41), (31, 42), (32, 42), (33, 41)], MOUTH)
    elif kind == "open": put(img, [(30, 41), (31, 41), (32, 41), (33, 41), (30, 42), (33, 42), (31, 43), (32, 43)], MOUTH); put(img, [(31, 42), (32, 42)], TONGUE)
    elif kind == "cat": put(img, [(29, 41), (30, 42), (31, 41), (32, 41), (33, 42), (34, 41)], MOUTH)
    elif kind == "o": put(img, [(31, 41), (32, 41), (30, 42), (33, 42), (31, 43), (32, 43)], MOUTH); put(img, [(31, 42), (32, 42)], MOUTH_IN)
    elif kind == "flat": put(img, [(30, 42), (31, 42), (32, 42), (33, 42)], MOUTH)
    elif kind == "wave": put(img, [(29, 42), (30, 41), (31, 42), (32, 41), (33, 42), (34, 41)], MOUTH)
    elif kind == "smirk": put(img, [(30, 42), (31, 42), (32, 42), (33, 41), (34, 40)], MOUTH)
    elif kind == "grin":
        put(img, [(29, 41), (30, 42), (31, 42), (32, 42), (33, 42), (34, 41)], MOUTH)
        put(img, [(30, 41), (31, 41), (32, 41), (33, 41)], (255, 255, 255, 255))
    elif kind == "tongue": put(img, [(30, 41), (31, 41), (32, 41), (33, 41)], MOUTH); put(img, [(32, 42), (33, 42), (32, 43), (33, 43)], TONGUE); put(img, [(33, 43)], MOUTH_IN)

FACES = []
def face(label, eyes, mth, blush_kind=1, extra=None, color=None):
    FACES.append((label, eyes, mth, blush_kind, extra))
def sunglasses(img):
    k = (30, 30, 44, 255); g = (90, 96, 130, 255)
    for x0 in (LX - 1, RX):
        for (x, y) in poly([(x0, EY + 1), (x0 + 11, EY + 1), (x0 + 10, EY + 7), (x0 + 1, EY + 7)]): put(img, [(x, y)], k)
        put(img, [(x0 + 2, EY + 2), (x0 + 3, EY + 2), (x0 + 2, EY + 3)], g)
    put(img, [(x, EY + 2) for x in range(LX + 10, RX)], k)
    put(img, [(x, EY + 1) for x in range(14, LX - 1)] + [(x, EY + 1) for x in range(RX + 11, 50)], k)
def round_glasses(img):
    g = (70, 140, 110, 255)
    for cx in (LX + 4, RX + 4):
        for a in range(36):
            t = a * math.pi / 18
            put(img, [(cx + 5.6 * math.cos(t), EY + 4.5 + 5.2 * math.sin(t))], g)
    put(img, [(x, EY + 3) for x in range(LX + 10, RX - 1)], g)
def tears(img):
    t = (120, 210, 245, 255); tl = (200, 240, 255, 255)
    for x0 in (LX + 2, RX + 5):
        for y in range(EY + 7, EY + 17): put(img, [(x0, y), (x0 + 1, y)], t)
        put(img, [(x0, EY + 9), (x0, EY + 13)], tl)
def sweat(img):
    t = (120, 200, 245, 255)
    put(img, [(48, 24), (47, 25), (48, 25), (49, 25), (47, 26), (48, 26), (49, 26), (48, 27)], t); put(img, [(47, 25)], (220, 245, 255, 255))
def zz(img):
    z = (170, 180, 255, 255)
    for (ox, oy, s) in ((48, 20, 3), (53, 15, 2)):
        put(img, [(ox + i, oy) for i in range(s + 1)] + [(ox + s - i, oy + i) for i in range(s + 1)] + [(ox + i, oy + s) for i in range(s + 1)], z)
def mask(img):
    m = (246, 248, 255, 255); ms = (210, 214, 228, 255); mo = (150, 150, 170, 255)
    sh = poly([(22, 37), (42, 37), (41, 43), (23, 43)])
    for p in sh: put(img, [p], m)
    for (x, y) in sh:
        if y in (39, 41): put(img, [(x, y)], ms)
    for (x, y) in sh:
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            if (x+dx, y+dy) not in sh: put(img, [(x+dx, y+dy)], mo)
    put(img, [(16, 35), (17, 36), (18, 37), (19, 37), (20, 37), (21, 37), (47, 35), (46, 36), (45, 37), (44, 37), (43, 37)], mo)
def star(img):
    y = (255, 220, 110, 255)
    put(img, [(50, 26), (49, 27), (50, 27), (51, 27), (50, 28), (48, 27), (52, 27), (50, 25), (50, 29)], y)

face("기본", ("basic", "basic"), "smile")
face("반짝반짝", ("sparkle", "sparkle"), "dot")
face("방긋", ("happy", "happy"), "open", 2)
face("윙크", ("basic", "happy"), "cat", 1, star)
face("심드렁", ("half", "half"), "flat", 0)
face("깜짝", ("small", "small"), "o", 0, sweat)
face(">_<", ("gt", "gt"), "open", 2)
face("폭풍 눈물", ("closed", "closed"), "wave", 1, tears)
face("글썽", ("teary", "teary"), "wave", 1)
face("하트", ("heart", "heart"), "smile", 2)
face("졸려", ("line", "line"), "o", 1, zz)
face("메롱", ("basic", "happy"), "tongue", 1)
face("선글라스", ("basic", "basic"), "flat", 0, sunglasses)
face("동글 안경", ("basic", "basic"), "smile", 1, round_glasses)
face("마스크", ("basic", "basic"), None, 0, mask)


BROWS = {}
def brows(kind):
    def draw(img):
        br = (90, 60, 55, 255)
        if kind == "angry":
            put(img, [(LX + 2, EY - 5), (LX + 3, EY - 5), (LX + 4, EY - 4), (LX + 5, EY - 3), (LX + 6, EY - 3)], br)
            put(img, [(RX + 6, EY - 5), (RX + 5, EY - 5), (RX + 4, EY - 4), (RX + 3, EY - 3), (RX + 2, EY - 3)], br)
        elif kind == "flat":
            put(img, [(x, EY - 3) for x in range(LX + 1, LX + 7)] + [(x, EY - 3) for x in range(RX + 2, RX + 8)], br)
        elif kind == "raise":
            put(img, [(x, EY - 3) for x in range(LX + 1, LX + 7)], br)
            put(img, [(RX + 2, EY - 4), (RX + 3, EY - 5), (RX + 4, EY - 6), (RX + 5, EY - 6), (RX + 6, EY - 5), (RX + 7, EY - 5)], br)
    return draw
def vein(img):
    r = (230, 80, 90, 255)
    put(img, [(46, 21), (48, 21), (47, 22), (46, 23), (48, 23), (45, 22), (49, 22)], r)
def dots3(img):
    for x in (44, 47, 50): put(img, [(x, 22), (x + 1, 22)], (200, 200, 230, 255))

def face_layer(k, eye_color="보라"):
    label, (le, re), mth, bl, extra = FACES[k]
    img = new()
    if bl: blush(img, bl == 2)
    draw_eye(img, le, eye_color, LX, EY)
    draw_eye(img, re, eye_color, RX, EY, flip=True)
    # 눈썹 (짧고 가는)
    br = (120, 80, 70, 255)
    if le not in ("gt",) and label not in BROWS:
        put(img, [(LX + 2, EY - 3), (LX + 3, EY - 3), (LX + 4, EY - 4), (LX + 5, EY - 4)], br)
        put(img, [(RX + 6, EY - 3), (RX + 5, EY - 3), (RX + 4, EY - 4), (RX + 3, EY - 4)], br)
    if mth: mouth(img, mth)
    if label in BROWS: BROWS[label](img)
    if extra: extra(img)
    return img

# 담백한 표정들 (반짝이·볼터치 없이)
for label, eyes, mth, bl, extra, br in [
    ("무표정", ("dot", "dot"), "flat", 0, None, "flat"),
    ("씩", ("dot", "dot"), "smirk", 0, None, "raise"),
    ("진지", ("flat", "flat"), "flat", 0, None, "flat"),
    ("멍", ("dot", "dot"), "o", 0, None, None),
    ("피곤", ("tired", "tired"), "wave", 0, None, "flat"),
    ("뿔남", ("dot", "dot"), "wave", 0, vein, "angry"),
    ("히죽", ("happy", "happy"), "grin", 0, None, None),
    ("생각 중", ("up", "up"), "flat", 0, dots3, "raise"),
]:
    face(label, eyes, mth, bl, extra)
    if br: BROWS[label] = brows(br)
