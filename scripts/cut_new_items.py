"""Full-sheet blob extract. Layouts verified via blob centers."""
from PIL import Image, ImageFilter
import numpy as np
import os
from collections import deque

ASSETS = r"D:\project\Sort-King\assets\items"

# row-major keys matching ACTUAL blob layout (not prompt order)
SHEETS = {
    # 3 cols x 2 rows
    "animal": ["cat", "dog", "rabbit", "panda", "bird", "elephant"],
    # 2 cols x 3 rows: TL TR ML MR BL BR
    "vehicle": ["car", "bike", "bus", "ship", "plane", "train"],
    "clothes": ["tshirt", "pants", "dress", "hat", "shoes", "socks"],
    "sport": ["football", "basketball", "tennis", "jump", "pingpong", "badminton"],
}


def strip_bg(arr):
    r = arr[..., 0].astype(int)
    g = arr[..., 1].astype(int)
    b = arr[..., 2].astype(int)
    a = arr[..., 3].astype(int)
    magenta = (r > 150) & (g < 130) & (b > 130) & (r > g + 50)
    magenta |= (r > 180) & (g < 100) & (b > 150)
    magenta |= (r > 200) & (g < 140) & (b > 180) & (r - g > 70)
    a = np.where(magenta, 0, a)
    out = arr.copy()
    out[..., 3] = a
    return out


def find_blobs(mask, min_area):
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    blobs = []
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or visited[y, x]:
                continue
            q = deque([(y, x)])
            visited[y, x] = True
            ys = [y]; xs = [x]
            while q:
                cy, cx = q.popleft()
                for ny, nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        q.append((ny, nx))
                        ys.append(ny); xs.append(nx)
            area = len(ys)
            if area >= min_area:
                blobs.append({
                    "area": area,
                    "y0": min(ys), "y1": max(ys)+1,
                    "x0": min(xs), "x1": max(xs)+1,
                    "cy": sum(ys)/area, "cx": sum(xs)/area,
                })
    return blobs


def save_crop(arr, blob, dst):
    pad = 10
    h, w = arr.shape[:2]
    y0 = max(0, blob["y0"] - pad)
    x0 = max(0, blob["x0"] - pad)
    y1 = min(h, blob["y1"] + pad)
    x1 = min(w, blob["x1"] + pad)
    cropped = arr[y0:y1, x0:x1]
    ch, cw = cropped.shape[:2]
    scale = 220 / max(cw, ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    out = Image.fromarray(cropped, "RGBA").resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    canvas.paste(out, ((256 - nw)//2, (256 - nh)//2), out)
    canvas.save(dst, "PNG", optimize=True)
    print(f"  {os.path.basename(dst):16s} area={blob['area']:5d} {nw:3d}x{nh:3d} "
          f"c=({blob['cx']:.0f},{blob['cy']:.0f})")


for cat, keys in SHEETS.items():
    src = os.path.join(ASSETS, f"_sheet_{cat}.png")
    im = Image.open(src).convert("RGBA")
    arr = strip_bg(np.array(im))
    h, w = arr.shape[:2]
    arr[int(h*0.88):, int(w*0.72):, 3] = 0

    # dilate alpha so anti-aliased fragments connect
    alpha_img = Image.fromarray(arr[..., 3], "L").filter(ImageFilter.MaxFilter(9))
    small = alpha_img.resize((w // 6, h // 6), Image.BILINEAR)
    mask = np.array(small) > 80
    sw, sh = mask.shape[1], mask.shape[0]
    blobs = find_blobs(mask, min_area=max(50, sw * sh // 600))
    for b in blobs:
        b["y0"] *= 6; b["y1"] = min(h, b["y1"] * 6)
        b["x0"] *= 6; b["x1"] = min(w, b["x1"] * 6)
        b["cy"] *= 6; b["cx"] *= 6

    blobs = sorted(blobs, key=lambda b: -b["area"])[:6]
    # animal is 3x2 -> band by half; others 2x3 -> band by third
    if cat == "animal":
        band = h / 2.0
    else:
        band = h / 3.0
    blobs.sort(key=lambda b: (int(b["cy"] // band), b["cx"]))

    print(f"{cat} ({len(blobs)}):")
    for key, blob in zip(keys, blobs):
        save_crop(arr, blob, os.path.join(ASSETS, f"{key}.png"))
print("done")
