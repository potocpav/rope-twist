#!/usr/bin/env python3
"""Generate the rope sheath's surface maps for Figure 4 (viz/rope-twist.html).

The sheath is modelled as a basket weave: every crossing cell holds one carrier, a flat bundle of
two yarns, running along u or v in a checkerboard. Each carrier arches over its cell and dives
under its neighbours at the cell ends. Yarns carry fine fibre grooves, slightly twisted.

One tile covers 2 x 2 cells (the pattern's period), seamlessly. Outputs, next to this script:
  rope-normal.png  tangent-space normal map: RGB = (n_u, n_v, n_w) * 0.5 + 0.5, where u runs along
                   image columns, v along image rows and w out of the surface.
  rope-ao.png      ambient occlusion, greyscale (1 = open, 0 = fully occluded).

Usage: python3 viz/make-rope-maps.py   (needs numpy and Pillow)
"""
import os

import numpy as np
from PIL import Image

N = 256                  # tile size in pixels (2 x 2 cells)
CELL = N // 2
YARNS = 2                # yarns side by side in a carrier
FIBRES = 4               # fibre bundles across one yarn: few and wide, so they still show when the map is
                         # shrunk to a few screen pixels per yarn (Figure 5's ropes)
TWIST = 0.6              # fibre groove slant: grooves across per cell length
GROOVE = 0.3             # depth of the grooves between fibre bundles, as a share of the yarn height
THICK = 0.16             # carrier height, in cell widths
DIVE = 0.55              # how far carrier ends sink under the crossing carriers (0..1)
NORMAL_GAIN = 0.8        # scales slopes when converting height to normals

rng = np.random.default_rng(7)


def carrier(along, across):
    """Height of a carrier in its cell, from local coordinates in [0, 1)."""
    # Yarns: rounded profiles across the carrier, flattened slightly where they press together.
    y = (across * YARNS) % 1.0
    yarn = np.clip(1 - (2 * y - 1) ** 2, 0, 1) ** 0.7
    # Fibre bundles, slanted by the yarn twist: rounded ridges with grooves between them.
    fib = np.abs(np.sin(np.pi * (y * FIBRES + along * TWIST))) ** 0.6
    yarn = yarn * (1 - GROOVE * (1 - fib))
    # Arch along the carrier: high in the middle, diving at both ends.
    arch = 1 - DIVE * (2 * along - 1) ** 4
    return THICK * yarn * arch


def tile():
    v, u = np.mgrid[0:N, 0:N] / CELL           # cell coordinates; row index = v, column = u
    i, j = np.floor(u).astype(int), np.floor(v).astype(int)
    fu, fv = u % 1.0, v % 1.0
    # Checkerboard of carrier directions, matching rope-texture.png (one cell = 2 x 2 colour pixels):
    # carriers along u (image rows) are on top where i + j is even, carriers along v where it is odd.
    along_v = (i + j) % 2 == 1
    h = np.where(along_v, carrier(fv, fu), carrier(fu, fv))
    # Per-yarn variation, so the weave doesn't look stamped: a small random height offset per yarn.
    ycoord = np.where(along_v, fu, fv) * YARNS
    yarn_id = (i * 7 + j * 13) * YARNS + np.floor(ycoord).astype(int)
    jitter = rng.uniform(-0.015, 0.015, size=yarn_id.max() + 1)
    h = h + jitter[yarn_id] * (h > 0.02)
    return h


def blur(a, sigma):
    """Seamless (wrapping) Gaussian blur via FFT."""
    f = np.fft.fftfreq(a.shape[0])
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


def main():
    out = os.path.dirname(os.path.abspath(__file__))
    h = tile()
    h = blur(h, 0.7)                           # soften pixel-level aliasing of the grooves

    # Normals from central differences (wrapping), with height in cell widths.
    du = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * CELL / 2
    dv = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * CELL / 2
    n = np.stack([-du * NORMAL_GAIN, -dv * NORMAL_GAIN, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    Image.fromarray(np.round((n * 0.5 + 0.5) * 255).astype(np.uint8), 'RGB').save(os.path.join(out, 'rope-normal.png'))

    # Ambient occlusion: low points and crevices see less of the sky. Combine absolute height
    # with cavity (height below the local average) at two scales.
    hn = h / h.max()
    cavity = (h - blur(h, CELL * 0.08)) / THICK + 0.5 * (h - blur(h, CELL * 0.25)) / THICK
    # Fine cavity: the grooves between fibre bundles, a few pixels wide.
    fine = (h - blur(h, CELL / (YARNS * FIBRES) * 0.5)) / THICK
    ao = np.clip(0.3 + 0.7 * hn ** 0.6 + 0.8 * np.minimum(cavity, 0) + 1.5 * np.minimum(fine, 0), 0, 1)
    Image.fromarray(np.round(ao * 255).astype(np.uint8), 'L').save(os.path.join(out, 'rope-ao.png'))


if __name__ == '__main__':
    main()
