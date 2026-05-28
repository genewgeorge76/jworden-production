"""
Generate brand image assets from public/logo.svg.

Outputs:
  public/logo.png              512x512  - schema.org logo, OG fallback
  public/apple-touch-icon.png  180x180  - iOS home screen
  public/og-default.jpg        1200x630 - Open Graph + Twitter card
  public/hero-paving.jpg       1920x1080 - Home hero background
  public/hero-paving.webp      1920x1080 - WebP variant for <picture>

All assets are branded with J. Worden & Sons palette:
  navy   #1a1a1a   amber  #f5a623   cream  #fafaf8

This is intentionally "good enough" branded placeholder content.
Photography can be swapped in later by replacing the files in public/
without touching code.
"""
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
SVG = PUB / "logo.svg"

NAVY = (26, 26, 26)
AMBER = (245, 166, 35)
AMBER_DARK = (212, 136, 10)
CREAM = (250, 250, 248)
WHITE = (255, 255, 255)


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVu-Sans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def render_logo_png(size: int) -> Image.Image:
    """Rasterize logo.svg at given square size with transparent background."""
    png_bytes = cairosvg.svg2png(
        url=str(SVG), output_width=size, output_height=size
    )
    return Image.open(BytesIO(png_bytes)).convert("RGBA")


def write_logo_512() -> None:
    img = render_logo_png(512)
    img.save(PUB / "logo.png", "PNG", optimize=True)


def write_apple_touch_icon() -> None:
    img = render_logo_png(180)
    # iOS will round-corner; we ship square per Apple guidance.
    img.save(PUB / "apple-touch-icon.png", "PNG", optimize=True)


def _draw_diagonal_pattern(draw: ImageDraw.ImageDraw, w: int, h: int,
                            color, opacity: int = 24, spacing: int = 24) -> None:
    """Subtle diagonal repeating-line pattern (matches Home hero CSS)."""
    line_color = (color[0], color[1], color[2], opacity)
    for x in range(-h, w, spacing):
        draw.line([(x, 0), (x + h, h)], fill=line_color, width=1)


def write_og_default() -> None:
    """1200x630 Open Graph card — branded navy background, amber JW mark, brand text."""
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), NAVY)

    # Diagonal pattern overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    _draw_diagonal_pattern(od, W, H, AMBER, opacity=20, spacing=22)
    base = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(base)

    # Left amber rule
    draw.rectangle([(80, 120), (90, 510)], fill=AMBER)

    # Logo mark (top-left, scaled)
    logo = render_logo_png(120)
    base.paste(logo, (120, 120), logo)

    # Brand wordmark
    f_big = _load_font(78)
    f_mid = _load_font(36)
    f_sm = _load_font(24)

    draw.text((120, 270), "J. Worden & Sons", fill=WHITE, font=f_big)
    draw.text((124, 365), "Asphalt Paving", fill=AMBER, font=f_mid)
    draw.text((124, 425),
              "4th Generation • Family Owned • Est. 1984",
              fill=(255, 255, 255, 200), font=f_sm)

    # Bottom amber bar with phone
    draw.rectangle([(0, 580), (W, 630)], fill=AMBER)
    draw.text((120, 590), "Free Estimates  ·  (804) 446-1296  ·  jwordenasphaltpaving.com",
              fill=NAVY, font=f_sm)

    base.save(PUB / "og-default.jpg", "JPEG", quality=88, optimize=True,
              progressive=True)


def _gradient_band(w: int, h: int, top, bottom) -> Image.Image:
    grad = Image.new("RGB", (w, h), top)
    px = grad.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return grad


def write_hero_paving() -> None:
    """1920x1080 branded abstract hero — represents fresh asphalt with amber accents.
    Stylised, not photographic — clearly a placeholder ready for real photography.
    """
    W, H = 1920, 1080
    # Vertical asphalt-to-charcoal gradient
    base = _gradient_band(W, H, (40, 40, 40), (10, 10, 10))

    draw = ImageDraw.Draw(base, "RGBA")

    # Diagonal repeating amber lines (subtle, matches Home hero CSS pattern)
    for x in range(-H, W, 32):
        draw.line([(x, 0), (x + H, H)], fill=(245, 166, 35, 18), width=1)

    # Center "road" — perspective trapezoid
    road = [
        (W // 2 - 60, H // 2 - 40),
        (W // 2 + 60, H // 2 - 40),
        (W // 2 + 700, H),
        (W // 2 - 700, H),
    ]
    draw.polygon(road, fill=(20, 20, 20))

    # Dashed center lane stripe
    cx = W // 2
    y = H // 2
    seg_h = 30
    gap = 24
    while y < H:
        # taper width with perspective
        progress = (y - H // 2) / (H - H // 2)
        half = int(4 + 18 * progress)
        draw.rectangle([(cx - half, y), (cx + half, y + seg_h)], fill=AMBER)
        y += seg_h + gap + int(20 * progress)

    # Soft vignette
    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse([(-300, -200), (W + 300, H + 200)], fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(180))
    black = Image.new("RGB", (W, H), (0, 0, 0))
    base = Image.composite(base, black, vignette)

    # JPEG (universal fallback)
    base.save(PUB / "hero-paving.jpg", "JPEG", quality=82, optimize=True,
              progressive=True)
    # WebP (modern browsers)
    base.save(PUB / "hero-paving.webp", "WEBP", quality=80, method=6)


def main() -> None:
    PUB.mkdir(exist_ok=True)
    write_logo_512()
    write_apple_touch_icon()
    write_og_default()
    write_hero_paving()
    for f in ["logo.png", "apple-touch-icon.png", "og-default.jpg",
              "hero-paving.jpg", "hero-paving.webp"]:
        p = PUB / f
        print(f"  {f}: {p.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
