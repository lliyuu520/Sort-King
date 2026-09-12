from PIL import Image
import numpy as np
import os

src_map = {
    # stationery 文具
    "pencil": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789091936789.png",
    "eraser": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789091939474.png",
    "scissors": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789091942074.png",
    "book": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789091944919.png",
    # toy 玩具
    "ball": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789091998670.png",
    "teddy": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092001361.png",
    "toycar": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092003938.png",
    "balloon": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092008193.png",
    # daily 日用品
    "toothbrush": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092065832.png",
    "soap": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092068211.png",
    "umbrella": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092070226.png",
    "towel": r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\generated-1789092074222.png",
}
out_dir = r"C:\Users\liliangyu\XiaomiMiMoProjects\分类大王\assets\items"
os.makedirs(out_dir, exist_ok=True)


def process(src, dst):
    im = Image.open(src).convert("RGBA")
    W, H = im.size
    arr = np.array(im)
    r = arr[..., 0].astype(int)
    g = arr[..., 1].astype(int)
    b = arr[..., 2].astype(int)
    a = arr[..., 3].astype(int)

    magenta = (r > 180) & (g < 100) & (b > 140) & (r > g + 80) & (b > g + 60)
    magenta |= (r > 200) & (g < 80) & (b > 160)
    a = np.where(magenta, 0, a)

    # force-clear watermark zone bottom-right
    wm_w, wm_h = int(W * 0.20), int(H * 0.12)
    a[H - wm_h :, W - wm_w :] = 0
    arr[..., 3] = a

    alpha = arr[..., 3]
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0:
        raise RuntimeError(f"empty alpha for {src}")
    pad = 8
    x0 = max(0, xs.min() - pad)
    x1 = min(W, xs.max() + 1 + pad)
    y0 = max(0, ys.min() - pad)
    y1 = min(H, ys.max() + 1 + pad)
    cropped = arr[y0:y1, x0:x1]

    ch, cw = cropped.shape[:2]
    scale = 256 / max(cw, ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    out = Image.fromarray(cropped, "RGBA").resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    canvas.paste(out, ((256 - nw) // 2, (256 - nh) // 2), out)
    canvas.save(dst, "PNG", optimize=True)
    pct = float((np.array(canvas)[..., 3] > 10).mean()) * 100
    print(f"{os.path.basename(dst)} {canvas.size} alpha%={pct:.1f}")


for key, src in src_map.items():
    process(src, os.path.join(out_dir, f"{key}.png"))
print("done")
