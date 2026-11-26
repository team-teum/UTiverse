import sys
sys.path.insert(0, '/home/claude/av7')
src = open('/home/claude/av7/char_noface.py').read()
exec(src[:src.index("base.save('base.png')")])
from PIL import Image

def strand(pts, c=None):
    return [(y, x, x) for (x, y) in pts]

# ── 새 머리 (성별 느낌 없이) ──
# 6 애기 세 가닥
f, b = new(), new()
for pts in ([(12, 2), (13, 3), (13, 4), (14, 5)], [(16, 1), (16, 2), (15, 3), (15, 4), (15, 5)], [(20, 2), (19, 3), (19, 4), (18, 5)]):
    shape(f, strand(pts), H2)
hairs.append((b, f))
# 7 모히칸
f, b = new(), new()
mo = [(0, 15, 16), (1, 14, 17), (2, 13, 17), (3, 13, 18), (4, 13, 18), (5, 13, 18), (6, 13, 18), (7, 13, 18), (8, 14, 17), (9, 14, 17), (10, 14, 17)]
shape(f, mo, H2); fill(f, [(1, 14, 14), (2, 14, 14), (3, 14, 14), (4, 14, 14)], H1); fill(f, [(y, 18, 18) for y in range(3, 8)], H3)
hairs.append((b, f))
# 8 버즈컷 (짧게 깎은 머리)
f, b = new(), new()
buzz = [(5, 12, 19), (6, 10, 21), (7, 9, 22), (8, 8, 23), (9, 7, 24), (10, 7, 24), (11, 7, 11), (11, 20, 24), (12, 7, 9), (12, 22, 24)]
shape(f, buzz, H2); fill(f, [(6, 11, 13), (7, 10, 11)], H1); fill(f, [(10, 21, 24), (11, 22, 24)], H3)
hairs.append((b, f))
# 9 뽀글 아프로
f, b = new(), new()
afro = []
for y in range(0, 18):
    dy = (y - 8.5) / 9.5
    half = int(14 * max(0, 1 - dy * dy) ** 0.5)
    afro.append((y, 16 - half, 15 + half))
shape(b, afro, H2)
for (x, y) in [(6, 5), (10, 2), (15, 1), (21, 2), (25, 5), (4, 10), (27, 10), (5, 14), (26, 14)]:
    fill(b, [(y, x, x + 1)], H1)
shape(f, top(), H2); shine(f); fill(f, [(14, 6, 7), (14, 10, 11), (14, 15, 16), (14, 20, 21), (14, 24, 25)], H1); shade(f, [(15, 6, 8), (15, 15, 17), (15, 23, 25)])
hairs.append((b, f))
# 10 더벅머리 (덥수룩한 앞머리)
f, b = new(), new()
shag = top([(15, 9, 10), (15, 12, 13), (15, 18, 19), (15, 21, 22), (16, 4, 6), (17, 4, 5), (16, 25, 27), (17, 26, 27)])
shape(f, shag, H2); shine(f); shade(f, BANG + [(15, 9, 10), (15, 12, 13), (15, 18, 19), (15, 21, 22)])
hairs.append((b, f))
# 11 꽁지머리 (뒤로 작게 묶음)
f, b = new(), new()
shape(b, [(14, 25, 28), (15, 26, 29), (16, 27, 29), (17, 27, 28)], H2); fill(b, [(13, 25, 26)], (255, 209, 102, 255))
shape(f, top(), H2); shine(f); shade(f, BANG)
hairs.append((b, f))
# 12 스파이크 업
f, b = new(), new()
sp = top([(2, 8, 9), (3, 8, 10), (1, 12, 13), (2, 11, 14), (0, 16, 17), (1, 15, 18), (1, 20, 21), (2, 19, 22), (3, 23, 24), (4, 22, 25)])
shape(f, [s for s in sp if s[0] < 14] + [(14, 5, 7), (14, 24, 26)], H2); shine(f); shade(f, [(12, 23, 26), (13, 24, 26)])
hairs.append((b, f))
# 13 긴 머리 하나로 묶음
f, b = new(), new()
shape(b, [(y, 14, 17) for y in range(14, 30)] + [(30, 15, 16)], H2); fill(b, [(y, 17, 17) for y in range(14, 30)], H3); fill(b, [(15, 14, 17)], (120, 90, 200, 255))
shape(f, top(box(4, 15, 2, 4) + box(26, 15, 2, 4)), H2); shine(f); shade(f, BANG)
hairs.append((b, f))
# 14 옆가르마 숏컷 (한쪽으로 넘긴 앞머리)
f, b = new(), new()
side = [(4, 13, 18), (5, 11, 20), (6, 9, 22), (7, 8, 23), (8, 7, 24), (9, 6, 25), (10, 6, 25), (11, 5, 26), (12, 5, 26), (13, 5, 13), (13, 17, 26), (14, 5, 10), (14, 20, 26), (15, 5, 7), (15, 23, 26), (16, 5, 6), (16, 25, 26)]
shape(f, side, H2); shine(f); fill(f, [(12, 14, 22), (13, 18, 24), (14, 21, 25)], H3); fill(f, [(8, 13, 13), (9, 13, 13), (10, 13, 13)], H3)
hairs.append((b, f))

# ── 새 옷 ──
W_, NV = (246, 246, 250, 255), (61, 72, 140, 255)
def stripes(img):
    for y in (26, 28, 30):
        fill(img, [(y, 11, 20)], NV)
    for y in (26, 28):
        fill(img, [(y, a, bb) for (yy, a, bb) in ARM_L + ARM_R if yy == y], NV)
def plaid(img):
    for y in range(24, 33):
        for x in range(7, 25):
            p = img.getpixel((x, y))
            if p[3] and p != OUT and (x % 3 == 0 or y % 3 == 0): img.putpixel((x, y), (168, 58, 50, 255))
def vest(img):
    fill(img, [(y, 11, 13) for y in range(25, 33)] + [(y, 18, 20) for y in range(25, 33)], (120, 150, 110, 255))
    fill(img, [(24, 14, 17), (25, 15, 16)], W_)
def suit_tie(img):
    fill(img, [(24, 14, 17), (25, 14, 17), (26, 15, 16)], W_)
    fill(img, [(25, 15, 16), (26, 15, 16), (27, 15, 16), (28, 15, 16), (29, 16, 16)], (192, 57, 79, 255))
def track(img):
    fill(img, [(y, 15, 15) for y in range(24, 33)], (230, 230, 240, 255))
    fill(img, [(y, 8, 8) for y in range(26, 32)] + [(y, 23, 23) for y in range(26, 32)] + [(y, 11, 11) for y in range(34, 37)] + [(y, 20, 20) for y in range(34, 37)], W_)
def coat(img):
    shape(img, [(33, 10, 21), (34, 10, 21), (35, 10, 21)], (200, 150, 100, 255))
    fill(img, [(y, 15, 16) for y in range(25, 36)], (170, 120, 80, 255)); fill(img, [(27, 14, 14), (30, 14, 14), (33, 14, 14)], (90, 70, 60, 255))
def hanbok(img):
    fill(img, [(24, 14, 17)], W_); fill(img, [(25, 15, 16), (26, 16, 17), (27, 17, 18)], (224, 72, 90, 255))
    fill(img, [(27, 7, 9), (27, 22, 24)], (255, 209, 102, 255)); fill(img, [(28, 7, 9), (28, 22, 24)], (90, 143, 216, 255))
def raincoat(img):
    fill(img, [(y, 15, 15) for y in range(24, 33)], (200, 150, 40, 255)); fill(img, [(26, 14, 14), (29, 14, 14)], (90, 143, 216, 255))
def dino(img):
    G2 = (80, 160, 90, 255)
    for (x, y) in [(10, 25), (21, 25), (9, 27), (22, 27)]: img.putpixel((x, y), G2)
    fill(img, box(13, 27, 6, 5), (220, 240, 170, 255))
    shape(img, [(23, 9, 10), (22, 9, 9), (23, 21, 22), (22, 22, 22)], (255, 230, 120, 255))
def fubao(img):
    # 몸: 배 무늬와 볼터치만 (후드는 머리 위에 따로 씌운다: fubao_hood)
    fill(img, box(13, 28, 6, 4), (255, 236, 240, 255))
    fill(img, [(30, 12, 12), (30, 19, 19)], (245, 160, 175, 255))
def fubao_hood():
    """머리를 통째로 감싸는 동글동글한 판다 후드. 볼 쪽이 햄스터처럼 아래로 통통하게 처진다"""
    BK, WH, WS, WL = (52, 48, 56, 255), (250, 250, 252, 255), (214, 214, 228, 255), (255, 255, 255, 255)
    def ell(cx, cy, rx, ry):
        return {(x, y) for y in range(H) for x in range(W) if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1}
    outer = ell(16, 13.2, 12, 9.4) | ell(8.5, 18.6, 4.6, 3.8) | ell(23.5, 18.6, 4.6, 3.8) | ell(16, 20.2, 7.5, 2.8)
    hole = ell(16, 16.4, 7.8, 5.6)
    cells = outer - hole
    hood = new()
    spans = sorted((y, x, x) for (x, y) in cells)
    shape(hood, spans, WH)
    # 얼굴 둘레 안쪽 테두리와 아래쪽 그림자
    for (x, y) in cells:
        if any((x + dx, y + dy) in hole for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            hood.putpixel((x, y), OUT)
        elif y >= 19 or x >= 25:
            hood.putpixel((x, y), WS)
    fill(hood, [(6, 11, 14), (7, 9, 11)], WL)
    # 판다 귀
    shape(hood, [(2, 6, 8), (3, 5, 9), (4, 5, 9), (5, 6, 8)], BK)
    shape(hood, [(2, 23, 25), (3, 22, 26), (4, 22, 26), (5, 23, 25)], BK)
    fill(hood, [(3, 6, 6), (3, 23, 23)], (110, 104, 118, 255))
    return hood
def panda_body(): pass

suits += [
    suit((W_, (210, 212, 225, 255), (90, 143, 216, 255), (68, 113, 184, 255)), sleeves=2, extra=stripes),
    suit(((216, 80, 78, 255), (180, 64, 60, 255), (58, 60, 86, 255), (42, 44, 66, 255)), extra=plaid),
    suit(((246, 246, 250, 255), (210, 212, 225, 255), (110, 100, 90, 255), (85, 76, 68, 255)), extra=vest),
    suit(((48, 50, 76, 255), (32, 34, 54, 255), (48, 50, 76, 255), (32, 34, 54, 255)), extra=suit_tie),
    suit(((62, 150, 110, 255), (46, 118, 86, 255), (62, 150, 110, 255), (46, 118, 86, 255)), extra=track),
    suit(((215, 165, 110, 255), (180, 130, 85, 255), (70, 70, 90, 255), (52, 52, 70, 255)), extra=coat),
    suit(((255, 224, 234, 255), (240, 190, 205, 255), (106, 120, 208, 255), (85, 96, 168, 255)), extra=hanbok),
    suit(((255, 209, 102, 255), (224, 179, 74, 255), (255, 209, 102, 255), (224, 179, 74, 255)), extra=raincoat, shoe=(90, 143, 216, 255)),
    suit(((120, 200, 120, 255), (86, 164, 90, 255), (120, 200, 120, 255), (86, 164, 90, 255)), extra=dino, shoe=(86, 164, 90, 255)),
    suit(((250, 250, 252, 255), (214, 214, 224, 255), (52, 48, 56, 255), (36, 32, 40, 255)), extra=fubao, shoe=(52, 48, 56, 255)),
]
# 푸바오 잠옷은 팔(소매)도 검정
fb = suits[-1]
for (y, a, bb) in ARM_L + ARM_R:
    for x in range(a, bb + 1):
        if fb.getpixel((x, y))[3] and fb.getpixel((x, y)) != OUT: fb.putpixel((x, y), (52, 48, 56, 255))

NH, NS = len(hairs), len(suits)
hs = Image.new('RGBA', (W * NH, H * 2), (0, 0, 0, 0))
for i, (bb, ff) in enumerate(hairs):
    hs.alpha_composite(bb, (i * W, 0)); hs.alpha_composite(ff, (i * W, H))
ss = Image.new('RGBA', (W * NS, H), (0, 0, 0, 0))
for i, s in enumerate(suits): ss.alpha_composite(s, (i * W, 0))
hs.resize((hs.width * 2, hs.height * 2), Image.NEAREST).save('hair_px.png')
# 옷 시트: 위 줄 = 몸에 입는 옷, 아래 줄 = 머리 위에 씌우는 것(모자·후드). 지금은 푸바오 후드만
ss2 = Image.new('RGBA', (W * NS, H * 2), (0, 0, 0, 0))
ss2.alpha_composite(ss, (0, 0))
ss2.alpha_composite(fubao_hood(), ((NS - 1) * W, H))
ss2.resize((ss2.width * 2, ss2.height * 2), Image.NEAREST).save('suits_px.png')
print(NH, NS)
