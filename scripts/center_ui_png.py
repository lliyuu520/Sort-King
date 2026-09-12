"""Clean magenta fringe, crop, and center UI PNGs on their original canvas."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "ui" / "src"

# Icons/stars: keep subject near 70% of the canvas after centering.
SCALE_TO_FIT = {
    "icon_back.png": 0.70,
    "icon_sound_on.png": 0.70,
    "spark.png": 0.70,
    "star_on.png": 0.70,
    "star_off.png": 0.70,
}


def is_magenta_fringe(r: int, g: int, b: int, a: int) -> bool:
    if a <= 12:
        return True
    if r >= 180 and b >= 180 and g <= 190 and (r - g) >= 40 and (b - g) >= 40:
        return True
    return False


def clean_fringe(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_magenta_fringe(r, g, b, a):
                px[x, y] = (0, 0, 0, 0)
    return im


def content_bbox(im: Image.Image, alpha_min: int = 24) -> tuple[int, int, int, int] | None:
    w, h = im.size
    px = im.load()
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] >= alpha_min:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y
    if max_x < 0:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def center_on_canvas(
    subject: Image.Image, canvas_size: tuple[int, int], max_ratio: float | None
) -> Image.Image:
    cw, ch = canvas_size
    sw, sh = subject.size
    if max_ratio:
        limit_w = max(1, int(cw * max_ratio))
        limit_h = max(1, int(ch * max_ratio))
        scale = min(limit_w / sw, limit_h / sh, 1.0)
        if scale < 0.999:
            nw = max(1, int(round(sw * scale)))
            nh = max(1, int(round(sh * scale)))
            subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)
            sw, sh = subject.size
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = (cw - sw) // 2
    y = (ch - sh) // 2
    canvas.alpha_composite(subject, (x, y))
    return canvas


def process(path: Path) -> None:
    src = Image.open(path)
    canvas_size = src.size
    cleaned = clean_fringe(src)
    box = content_bbox(cleaned)
    if not box:
        raise SystemExit(f"no opaque content: {path}")
    subject = cleaned.crop(box)
    out = center_on_canvas(subject, canvas_size, SCALE_TO_FIT.get(path.name))
    out.save(path, "PNG")
    nb = content_bbox(out)
    print(
        f"{path.name}: {canvas_size[0]}x{canvas_size[1]} "
        f"content {box[2] - box[0]}x{box[3] - box[1]} -> "
        f"{(nb[2] - nb[0]) if nb else 0}x{(nb[3] - nb[1]) if nb else 0} "
        f"pad L{nb[0] if nb else 0} T{nb[1] if nb else 0} "
        f"R{canvas_size[0] - (nb[2] if nb else 0)} "
        f"B{canvas_size[1] - (nb[3] if nb else 0)}"
    )


def main() -> None:
    names = sys.argv[1:] or [
        "btn_chip.png",
        "icon_back.png",
        "icon_sound_on.png",
        "spark.png",
        "star_on.png",
        "star_off.png",
    ]
    for name in names:
        process(SRC / name)


if __name__ == "__main__":
    main()
