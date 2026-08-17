"""
앱 아이콘/스플래시 생성 스크립트. 한 번 실행해서 assets/images/*.png를 만들고 나면 다시 실행할 필요 없음.
사용법: python scripts/generate-icons.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "images")

GREEN = (88, 204, 2, 255)       # theme.primary
GREEN_DARK = (76, 175, 0, 255)  # theme.primaryDark (다크모드 기준)
WHITE = (255, 255, 255, 255)
FONT_PATH = "C:\\Windows\\Fonts\\malgunbd.ttf"
CHAR = "字"  # 글자 자 - 아이콘 상징 문자


def char_image(size, fg, bg=None, scale=0.62):
    img = Image.new("RGBA", (size, size), bg if bg else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, int(size * scale))
    bbox = draw.textbbox((0, 0), CHAR, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    draw.text((x, y), CHAR, font=font, fill=fg)
    return img


def rounded_square(size, radius_ratio=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, size, size], radius=int(size * radius_ratio), fill=GREEN)
    return img


os.makedirs(OUT, exist_ok=True)

# 1. 메인 아이콘 (1024, 꽉 찬 정사각 배경 + 글자 - 모서리는 OS가 알아서 둥글게 처리하므로
#    여기서 둥글리거나 투명하게 두면 안 됨. 전체를 초록으로 꽉 채워야 함)
icon = Image.new("RGB", (1024, 1024), GREEN[:3])
icon_rgba = icon.convert("RGBA")
icon_rgba.alpha_composite(char_image(1024, WHITE, scale=0.55))
icon_rgba.convert("RGB").save(os.path.join(OUT, "icon.png"))

# 2. Android adaptive icon: foreground(투명 배경 글자), background(단색), monochrome(흰 실루엣)
fg = char_image(1024, WHITE, scale=0.42)  # safe zone 고려해 작게
fg.save(os.path.join(OUT, "android-icon-foreground.png"))

bg = Image.new("RGBA", (1024, 1024), GREEN)
bg.save(os.path.join(OUT, "android-icon-background.png"))

mono = char_image(1024, WHITE, scale=0.42)
mono.save(os.path.join(OUT, "android-icon-monochrome.png"))

# 3. 스플래시 아이콘 (투명 배경, 글자만 - app.json에서 backgroundColor로 배경 지정)
splash = char_image(1024, GREEN, scale=0.6)
splash.save(os.path.join(OUT, "splash-icon.png"))

# 4. 파비콘 (웹)
favicon = rounded_square(196, radius_ratio=0.18)
favicon.alpha_composite(char_image(196, WHITE, scale=0.55))
favicon.save(os.path.join(OUT, "favicon.png"))

print("done")
