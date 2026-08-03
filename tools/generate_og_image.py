#!/usr/bin/env python3
"""OG 이미지 생성 (1200×630 ×2 = 2400×1260 PNG).

사용법: python3 tools/generate_og_image.py   (Pillow 필요: pip install pillow)
출력:   assets/og-image.png
"""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "og-image.png")

S = 2  # 스케일 (레티나 선명도)
W, H = 1200 * S, 630 * S

BG = (23, 22, 26)
TEXT = (234, 231, 224)
MUTED = (164, 158, 147)
FAINT = (111, 106, 97)
PURPLE = (124, 77, 188)
PURPLE_L = (183, 149, 236)
GOLD = (212, 175, 95)
GOLD_D = (176, 141, 62)
BORDER = (58, 53, 66)
CHIP_BG = (42, 39, 49)

FONT_TTC = "/System/Library/Fonts/AppleSDGothicNeo.ttc"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """AppleSDGothicNeo ttc 에서 원하는 웨이트 탐색."""
    want = "Bold" if bold else "Regular"
    for idx in range(12):
        try:
            f = ImageFont.truetype(FONT_TTC, size, index=idx)
        except OSError:
            break
        name = f.getname()[1]
        if want.lower() in name.lower():
            return f
    return ImageFont.truetype(FONT_TTC, size)


def glow(draw_target: Image.Image, center, radius, color, alpha):
    layer = Image.new("RGBA", draw_target.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.55))
    draw_target.alpha_composite(layer)


def main() -> None:
    img = Image.new("RGBA", (W, H), BG + (255,))

    # 배경 글로우 (골드 우상단 / 퍼플 좌하단)
    glow(img, (int(W * 0.88), int(-H * 0.1)), int(430 * S), GOLD_D, 80)
    glow(img, (int(-W * 0.05), int(H * 1.1)), int(420 * S), PURPLE, 95)

    draw = ImageDraw.Draw(img)

    # 우측 卦 심볼 박스 (대각 그라디언트 + 라운드 마스크)
    box = 300 * S
    bx, by = W - 64 * S - box, (H - box) // 2
    grad = Image.new("RGBA", (box, box))
    gd = ImageDraw.Draw(grad)
    for i in range(2 * box):  # x+y = i 대각선 단위로 채색
        t = i / (2 * box)
        r = int(PURPLE[0] + (GOLD_D[0] - PURPLE[0]) * t)
        g = int(PURPLE[1] + (GOLD_D[1] - PURPLE[1]) * t)
        b = int(PURPLE[2] + (GOLD_D[2] - PURPLE[2]) * t)
        gd.line([(0, i), (i, 0)], fill=(r, g, b, 255), width=2)
    mask = Image.new("L", (box, box), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, box, box], radius=64 * S, fill=255)
    img.paste(grad, (bx, by), mask)
    f_mark = font(170 * S, bold=True)
    draw.text((bx + box / 2, by + box / 2 - 8 * S), "卦", font=f_mark, fill=(255, 255, 255), anchor="mm")

    # 좌측 텍스트
    x = 88 * S
    draw.text((x, 96 * S), "FORTUNE PLATFORM", font=font(30 * S, bold=True), fill=PURPLE_L)
    f_h1 = font(92 * S, bold=True)
    draw.text((x, 156 * S), "사주 만세력", font=f_h1, fill=TEXT)
    draw.text((x, 262 * S), "계산기", font=f_h1, fill=GOLD)
    draw.text((x, 396 * S), "만세력 · 타로 · 점성술 — 무료 오픈소스", font=font(36 * S), fill=MUTED)

    # 칩
    f_chip = font(24 * S, bold=True)
    cy = 470 * S
    cx = x
    chips = [("천간지지", False), ("대운·세운", False), ("타로 78장", False), ("출생차트", False), ("MIT · 무료", True)]
    for label, accent in chips:
        tw = draw.textlength(label, font=f_chip)
        pw, ph = int(tw + 44 * S), 52 * S
        color = GOLD if accent else TEXT
        border = GOLD if accent else BORDER
        draw.rounded_rectangle([cx, cy, cx + pw, cy + ph], radius=ph // 2,
                               fill=CHIP_BG + (220,), outline=border, width=2 * S)
        draw.text((cx + pw / 2, cy + ph / 2 - 2 * S), label, font=f_chip, fill=color, anchor="mm")
        cx += pw + 14 * S

    # URL / 장식 한자
    draw.text((x, 566 * S), "fortune-org.github.io/fortune-platform", font=font(25 * S), fill=FAINT)
    f_hanja = font(28 * S)
    hanja = " ".join("甲乙丙丁戊己庚辛壬癸")
    hw = draw.textlength(hanja, font=f_hanja)
    draw.text((W - 84 * S - hw, 572 * S), hanja, font=f_hanja, fill=TEXT + (70,))

    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"saved {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
