"""1200x630 social/OG image: reversed lockup + existing site subtitle on warm dark."""
import os, sys
from fontTools.ttLib import TTFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_final as g
lock = open(os.path.join(g.HERE, "svg/horizontal-reversed.svg"), encoding="utf-8").read()
inner = lock[lock.index("</title>") + 8: lock.rindex("</svg>")]
S = 0.88; LW, LH = 1101 * S, 256 * S
g.FONT = TTFont(os.path.join(g.HERE, "../../public/fonts/fp/SpaceGrotesk-Medium.ttf"))
sub = "VIT Timetable Generator"; size = 44
_, w = g.text(sub, size, 0, 0, 0.02)
d, _ = g.text(sub, size, (1200 - w) / 2, 452, 0.02)
body = (f'<rect width="1200" height="630" fill="{g.DARK}"/>'
        f'<g transform="translate({(1200-LW)/2:g} 150) scale({S})">{inner}</g>'
        f'<path fill="#A89F92" d="{d}"/>')
open(os.path.join(g.HERE, "web/og-image.svg"), "w", encoding="utf-8").write(g.svg(1200, 630, "Ultimate FFCS", body))
