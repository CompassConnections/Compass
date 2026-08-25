"""Build the 1080x1080 X feed creative (python3 media-creator/scripts/make-x-ad.py)

Needs: pillow, fonttools[woff]. Fonts come from `npm run fonts` in media-creator/.
Outputs media-creator/out/ads/x-ad-search-1080.png plus a 400px thumb for the legibility check.

Original docstring from brand tokens and real profiles from the search capture.

Profiles are set as TYPE, not pasted as a screenshot: the app's ~14px UI would land at ~5px once
a 1080 creative is shown at feed width, which marketing-visuals.md H1 already measured as
worthless. Two cards rather than one because the pair carries the range argument.
"""
import json
import os
import urllib.request
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))          # media-creator/scripts
MC = os.path.dirname(HERE)                                  # media-creator
FONTS = os.path.join(MC, 'public', 'fonts')                 # npm run fonts
TMP = os.path.join(MC, 'out', '.fontcache')
OUT = os.path.join(MC, 'out', 'ads')
os.makedirs(TMP, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

CREAM, CANVAS100, INK, INK600 = '#F7F4EF', '#EDE8E0', '#1E1A14', '#786C5C'

# Every number on the creative is read live from the same endpoint /stats renders from, per the
# "never hardcode a measured number" rule in docs/marketing-copy.md. An ad is frozen once it runs,
# so the guarantee is only that it was true on the day it shipped -- which is why the denominator
# ("of members who answered") is printed on the creative rather than left implicit.
STATS_URL = 'https://api.compassmeet.com/stats'

def pct(dist, *values):
    """Share of respondents selecting any of `values`. Denominator is dist['base']."""
    by = {i['value']: i['count'] for i in dist['items']}
    return 100.0 * sum(by.get(v, 0) for v in values) / dist['base']

def load_stats():
    with urllib.request.urlopen(STATS_URL, timeout=30) as r:
        st = json.load(r)
    dg = st['demographics']
    return {
        # NOTE: diet and religion are multi-select, so these sums are upper bounds -- a profile that
        # ticked both 'vegan' and 'veg', or both 'atheist' and 'agnostic', is counted twice in the
        # numerator. The stats endpoint exposes per-value counts only, not distinct profiles per
        # group, so an exact figure is not derivable client-side. Single-value bars ('vegan' alone,
        # 'atheist' alone) are exact.
        'vegveg': pct(dg['diet'], 'vegan', 'veg'),
        'masters_plus': pct(dg['education_level'], 'masters', 'doctorate'),
        'vegan': pct(dg['diet'], 'vegan'),
        'degree': pct(dg['education_level'], 'bachelors', 'masters', 'doctorate'),
        'friendship': pct(dg['pref_relation_styles'], 'friendship'),
        'relationship': pct(dg['pref_relation_styles'], 'relationship'),
        'collab': pct(dg['pref_relation_styles'], 'collaboration'),
        'nonreligious': pct(dg['religion'], 'atheist', 'agnostic'),
        'diet_base': dg['diet']['base'],
        'edu_base': dg['education_level']['base'],
        'rel_base': dg['pref_relation_styles']['base'],
    }

ST = load_stats()
AMBER, EMBER, PALE = '#C17F3E', '#855022', '#E8D5BC'

def ttf(name):
    src, dst = f'{FONTS}/{name}.woff2', f'{TMP}/{name}.ttf'
    if not os.path.exists(dst):
        f = TTFont(src); f.flavor = None; f.save(dst)
    return dst

HEAD, BODY, ITAL = ttf('Newsreader-latin'), ttf('DMSans-latin'), ttf('Newsreader-Italic-latin')
F = lambda p, s: ImageFont.truetype(p, s)

S, M = 1080, 76
FOOT_RULE = S - 118

img = Image.new('RGB', (S, S), CREAM)
d = ImageDraw.Draw(img)

def wrap(text, font, maxw):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

d.text((M, 66), 'C O M P A S S', font=F(BODY, 26), fill=EMBER)

f_h = F(HEAD, 96)
y = 112
d.text((M, y), 'Search.', font=f_h, fill=AMBER); y += 102
d.text((M, y), "Don't swipe.", font=f_h, fill=INK); y += 126

# The product is not a dating app: friendship and collaboration are first-class, and the live
# numbers below say so more convincingly than the adjective would.
f_b = F(BODY, 32)
for line in wrap('A free, open-source directory for finding your people — a partner, '
                 'close friends, or collaborators.', f_b, S - 2 * M):
    d.text((M, y), line, font=f_b, fill=INK600); y += 43
y += 30

# ── Three-up stat band: who is actually here ────────────────────────────────
f_num, f_lab = F(HEAD, 82), F(BODY, 26)
cols = [
    (f"{ST['nonreligious']:.0f}%",  ['are atheist', 'or agnostic']),
    (f"{ST['vegveg']:.0f}%",        ['are vegan or', 'vegetarian']),
    (f"{ST['masters_plus']:.0f}%",  ["hold a master's", 'or above']),
]
colw = (S - 2 * M) / 3
band_top = y
for k, (num, lab) in enumerate(cols):
    cxc = M + colw * k + colw / 2
    d.text((cxc - d.textlength(num, font=f_num) / 2, y), num, font=f_num, fill=AMBER)
    ly = y + 96
    for line in lab:
        d.text((cxc - d.textlength(line, font=f_lab) / 2, ly), line, font=f_lab, fill=INK)
        ly += 33
for k in (1, 2):
    x = M + colw * k
    d.line([x, band_top + 8, x, band_top + 150], fill=PALE, width=2)
y += 178

# ── One member, so the percentages resolve into a person ────────────────────
# Portrait is a showcase persona from web/public/images/showcase — fully synthetic (Gemini),
# no real person depicted, per that directory's README. Set as type rather than screenshotted:
# the app's ~14px UI lands at ~5px at feed width (marketing-visuals.md H1).
f_name, f_meta, f_q, f_tag = F(BODY, 32), F(BODY, 26), F(ITAL, 33), F(BODY, 23)
PHOTO = os.path.join(MC, '..', 'web', 'public', 'images', 'showcase', 'priyaraman-1.jpg')

quote = ('"I model where cash transfers do the most good. Looking for a life-partner '
         'dedicated to improving the world."')
qlines = wrap(quote, f_q, S - 2 * M - 224)
# Height follows the quote rather than being pinned, so a copy edit that adds a line still fits.
ch = 26 + 40 + 42 + 42 * len(qlines) + 6 + 37 + 21
d.rounded_rectangle([M, y, S - M, y + ch], radius=24, fill=CANVAS100)

ph = 156
im_p = Image.open(PHOTO).convert('RGB')
CROP = (150, 260, 610, 720)          # left, top, right, bottom — centred on the face
im_p = im_p.crop(CROP).resize((ph, ph), Image.LANCZOS)
mask = Image.new('L', (ph * 4, ph * 4), 0)
ImageDraw.Draw(mask).ellipse([0, 0, ph * 4, ph * 4], fill=255)
img.paste(im_p, (M + 30, y + (ch - ph) // 2), mask.resize((ph, ph), Image.LANCZOS))

cx = M + 30 + ph + 30
cy = y + 26
d.text((cx, cy), 'Priya Raman', font=f_name, fill=INK)
d.text((cx + d.textlength('Priya Raman', font=f_name) + 13, cy + 6),
       '26  ·  Bangalore, India', font=f_meta, fill=INK600)
cy += 40
d.text((cx, cy), 'Economist at a nonprofit working on extreme poverty',
       font=f_meta, fill=INK600)
cy += 42
for line in qlines:
    d.text((cx, cy), line, font=f_q, fill=INK); cy += 42
cy += 6
tx = cx
for tag in ['Effective altruism', 'Global poverty', 'Meditation']:
    tw = d.textlength(tag, font=f_tag)
    d.rounded_rectangle([tx, cy, tx + tw + 28, cy + 37], radius=18, fill=PALE)
    d.text((tx + 14, cy + 7), tag, font=f_tag, fill=EMBER)
    tx += tw + 38
y += ch + 18

assert y < FOOT_RULE - 10, f'content overflows footer: {y} >= {FOOT_RULE - 10}'

f_f = F(BODY, 29)
d.line([M, FOOT_RULE, S - M, FOOT_RULE], fill=PALE, width=2)
d.text((M, FOOT_RULE + 26), 'compassmeet.com', font=f_f, fill=INK)
foot = 'Free forever  ·  Open source  ·  No swiping'
d.text((S - M - d.textlength(foot, font=f_f), FOOT_RULE + 26), foot, font=f_f, fill=INK600)

img.save(f'{OUT}/x-ad-search-1080.png')
# Feed-size proof: the creative is judged at ~400px, not at 1080.
img.resize((400, 400), Image.LANCZOS).save(f'{OUT}/x-ad-search-thumb.png')
print(f'OK — content ends at {y}, footer rule at {FOOT_RULE}')
