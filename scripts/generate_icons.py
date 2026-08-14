"""
Genera los iconos PNG de la PWA sin dependencias externas (solo zlib/struct).
Ejecutar: python scripts/generate_icons.py
Regenera: icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
"""
import struct
import zlib
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG_TOP = (242, 146, 27)     # ambar oscuro
BG_BOTTOM = (245, 166, 35)  # ambar (accent de marca)
WHITE = (255, 253, 248)     # crema (papel)
BUBBLE = (255, 253, 248)    # crema


def lerp(a, b, t):
    return a + (b - a) * t


def make_pixels(size, maskable=False):
    px = [[BG_TOP for _ in range(size)] for _ in range(size)]
    for y in range(size):
        t = y / (size - 1)
        row_color = tuple(int(lerp(BG_TOP[i], BG_BOTTOM[i], t)) for i in range(3))
        for x in range(size):
            px[y][x] = row_color

    cx, cy = size / 2, size / 2 * 1.05
    scale = size / 512.0
    # margen extra si es maskable (zona segura ~ 40% del icono centrada)
    body_scale = 0.72 if maskable else 0.86

    def set_px(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            px[y][x] = color

    def fill_rect(x0, y0, x1, y1, color, radius=0):
        for y in range(int(y0), int(y1)):
            for x in range(int(x0), int(x1)):
                if radius > 0:
                    # esquinas redondeadas simples
                    corner = False
                    if x < x0 + radius and y < y0 + radius:
                        if (x - (x0 + radius)) ** 2 + (y - (y0 + radius)) ** 2 > radius ** 2:
                            corner = True
                    if x > x1 - radius and y < y0 + radius:
                        if (x - (x1 - radius)) ** 2 + (y - (y0 + radius)) ** 2 > radius ** 2:
                            corner = True
                    if x < x0 + radius and y > y1 - radius:
                        if (x - (x0 + radius)) ** 2 + (y - (y1 - radius)) ** 2 > radius ** 2:
                            corner = True
                    if x > x1 - radius and y > y1 - radius:
                        if (x - (x1 - radius)) ** 2 + (y - (y1 - radius)) ** 2 > radius ** 2:
                            corner = True
                    if corner:
                        continue
                set_px(x, y, color)

    def fill_circle(ccx, ccy, r, color):
        for y in range(int(ccy - r), int(ccy + r) + 1):
            for x in range(int(ccx - r), int(ccx + r) + 1):
                if (x - ccx) ** 2 + (y - ccy) ** 2 <= r ** 2:
                    set_px(x, y, color)

    # --- carrocería (cuerpo del auto) ---
    body_w = 300 * scale * (body_scale / 0.86)
    body_h = 110 * scale * (body_scale / 0.86)
    bx0 = cx - body_w / 2
    bx1 = cx + body_w / 2
    by0 = cy - body_h / 2
    by1 = cy + body_h / 2
    fill_rect(bx0, by0, bx1, by1, WHITE, radius=int(28 * scale))

    # --- cabina (parte superior) ---
    cab_w = body_w * 0.55
    cab_h = body_h * 0.75
    cabx0 = cx - cab_w / 2
    cabx1 = cx + cab_w / 2
    caby1 = by0 + 4 * scale
    caby0 = caby1 - cab_h
    fill_rect(cabx0, caby0, cabx1, caby1, WHITE, radius=int(20 * scale))

    # --- ruedas ---
    wheel_r = 34 * scale * (body_scale / 0.86)
    wheel_y = by1 - 6 * scale
    fill_circle(bx0 + body_w * 0.24, wheel_y, wheel_r, (34, 29, 20))
    fill_circle(bx0 + body_w * 0.76, wheel_y, wheel_r, (34, 29, 20))
    fill_circle(bx0 + body_w * 0.24, wheel_y, wheel_r * 0.45, (250, 247, 240))
    fill_circle(bx0 + body_w * 0.76, wheel_y, wheel_r * 0.45, (250, 247, 240))

    # --- burbujas de espuma ---
    fill_circle(cx - body_w * 0.32, by0 - 22 * scale, 14 * scale, BUBBLE)
    fill_circle(cx - body_w * 0.18, by0 - 40 * scale, 9 * scale, BUBBLE)
    fill_circle(cx + body_w * 0.30, by0 - 16 * scale, 11 * scale, BUBBLE)

    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filtro None
        for x in range(size):
            r, g, b = px[y][x]
            raw += bytes((r, g, b, 255))

    def chunk(tag, data):
        c = tag + data
        return struct.pack("!I", len(data)) + c + struct.pack("!I", zlib.crc32(c) & 0xffffffff)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack("!IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


for size, name, maskable in [
    (192, "icon-192.png", False),
    (512, "icon-512.png", False),
    (512, "icon-maskable-512.png", True),
    (180, "apple-touch-icon.png", False),
]:
    write_png(os.path.join(OUT_DIR, name), make_pixels(size, maskable))
    print("generado", name)
