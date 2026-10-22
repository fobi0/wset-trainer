#!/usr/bin/env python3
"""Generate the PWA icons (a glass of red wine) without any image library.
Run from the repo root: python3 tools/make_icons.py
"""
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "icons"
BG = (123, 30, 58)       # --accent burgundy
GLASS = (250, 245, 247)
WINE = (214, 79, 116)
SS = 4                   # supersampling per axis, for anti-aliased edges


def in_ellipse(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def shade(x, y, full_bleed, scale):
    """Colour at unit coordinates (0..1), or None for transparent.
    scale < 1 shrinks the glass towards the centre (more padding)."""
    if not full_bleed:
        # Rounded square for the regular icon.
        r = 0.22
        qx, qy = min(x, 1 - x), min(y, 1 - y)
        if qx < r and qy < r and (r - qx) ** 2 + (r - qy) ** 2 > r * r:
            return None
    gx, gy = 0.5 + (x - 0.5) / scale, 0.5 + (y - 0.5) / scale
    bowl = gy >= 0.2 and in_ellipse(gx, gy, 0.5, 0.33, 0.17, 0.2)
    if bowl:
        return WINE if gy >= 0.34 else GLASS
    stem = 0.484 <= gx <= 0.516 and 0.5 <= gy <= 0.75
    base = in_ellipse(gx, gy, 0.5, 0.755, 0.13, 0.028)
    if stem or base:
        return GLASS
    return BG


def render(size, full_bleed, scale):
    rows = []
    n = SS * SS
    for py in range(size):
        row = bytearray([0])  # PNG filter type: none
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(SS):
                for sx in range(SS):
                    c = shade((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, full_bleed, scale)
                    if c is not None:
                        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            a = acc[3] // n
            if a:
                cover = acc[3] / 255
                row += bytes([round(acc[0] / cover), round(acc[1] / cover), round(acc[2] / cover), a])
            else:
                row += b"\0\0\0\0"
        rows.append(bytes(row))
    return png(size, b"".join(rows))


def png(size, raw):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))
    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


ICONS = {
    # name: (size, full_bleed, glass scale)
    "icon-192.png": (192, False, 1.0),
    "icon-512.png": (512, False, 1.0),
    # Maskable: full-bleed, glass kept inside the central safe zone (80% circle).
    "icon-maskable-512.png": (512, True, 0.85),
    "apple-touch-icon.png": (180, True, 0.9),
}

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, (size, full_bleed, scale) in ICONS.items():
        (OUT / name).write_bytes(render(size, full_bleed, scale))
        print("wrote", OUT / name)
