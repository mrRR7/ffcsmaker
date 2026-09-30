"""Generates the final Ultimate FFCS artwork. Type is outlined from Space Grotesk Bold (SIL OFL)."""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = TTFont(os.path.join(HERE, "../../public/fonts/fp/SpaceGrotesk-Bold.ttf"))
INK, CREAM, CORAL, DARK = "#211A17", "#F6EFE4", "#FF6B4A", "#1A1512"

def text(s, size, x, base, track=-0.01):
    gs, cm, upm = FONT.getGlyphSet(), FONT.getBestCmap(), FONT["head"].unitsPerEm
    k, pen, cx = size / upm, SVGPathPen(gs, ntos=lambda v: f"{v:.1f}"), x
    for ch in s:
        g = cm[ord(ch)]; gs[g].draw(TransformPen(pen, (k, 0, 0, -k, cx, base))); cx += gs[g].width * k + track * size
    return pen.getCommands(), cx - track * size
CAP = FONT["OS/2"].sCapHeight / FONT["head"].unitsPerEm

def mark(ink, tile, small=False):
    if small:  # gaps 24, margin 20: survives 16 px
        r = [(20, 20, 56, 216), (100, 20, 136, 56), (100, 100, 56, 56)]; t = (180, 180, 56, 56); rx = 16
    else:
        r = [(28, 28, 56, 200), (100, 28, 128, 56), (100, 100, 56, 56)]; t = (172, 172, 56, 56); rx = 14
    f = lambda a, c: f'<rect x="{a[0]}" y="{a[1]}" width="{a[2]}" height="{a[3]}" rx="{rx}" fill="{c}"/>'
    return "".join(f(a, ink) for a in r) + f(t, tile)
def svg(w, h, title, body): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}" role="img"><title>{title}</title>{body}</svg>\n'
def put(path, s): os.makedirs(os.path.dirname(os.path.join(HERE, path)), exist_ok=True); open(os.path.join(HERE, path), "w", encoding="utf-8").write(s)

N = "Ultimate FFCS"
for tag, ink in (("", INK), ("-reversed", CREAM)):
    # symbol + small-size cut
    put(f"svg/symbol{tag}.svg", svg(256, 256, f"{N} symbol", mark(ink, CORAL)))
    put(f"svg/symbol-small{tag}.svg", svg(256, 256, f"{N} symbol, small-size cut", mark(ink, CORAL, True)))
    # horizontal: cap height 84 centred on the mark's centre line
    s = 84 / CAP; d, ex = text(N, s, 284, 128 + 42)
    put(f"svg/horizontal{tag}.svg", svg(round(ex + 28), 256, f"{N} logo", mark(ink, CORAL) + f'<path fill="{ink}" d="{d}"/>'))
    # wordmark only
    s = 100 / CAP; d, ex = text(N, s, 28, 28 + 100)
    put(f"svg/wordmark{tag}.svg", svg(round(ex + 28), 156, f"{N} wordmark", f'<path fill="{ink}" d="{d}"/>'))
    # stacked: mark centred over wordmark
    s = 84 / CAP; d, ex = text(N, s, 0, 0); W = round(ex + 56)
    d, _ = text(N, s, 28, 228 + 60 + 84)
    put(f"svg/stacked{tag}.svg", svg(W, 228 + 60 + 84 + 28, f"{N} logo, stacked",
        f'<g transform="translate({W/2-128:g} 0)">{mark(ink, CORAL)}</g><path fill="{ink}" d="{d}"/>'))

# web icons: dark warm tile, cream F, coral tile
def tile(rx, scale, small, full=False):
    bg = f'<rect width="256" height="256" rx="{rx}" fill="{DARK}"/>'
    m = f'<g transform="translate(128 128) scale({scale}) translate(-128 -128)">{mark(CREAM, CORAL, small)}</g>'
    return svg(256, 256, f"{N} icon", bg + m)
put("web/favicon.svg", tile(58, 0.72, True))
put("web/favicon-src-small.svg", tile(58, 0.72, True))     # 16/32/48 px
put("web/icon-src.svg", tile(58, 0.62, False))             # 192/512
put("web/apple-src.svg", tile(0, 0.62, False))             # 180, iOS rounds it
put("web/maskable-src.svg", tile(0, 0.55, False))          # inside the 80 % safe zone
print("ok")
