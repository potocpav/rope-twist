# Handoff: rope twist on an oblique wrap

This folder holds a standalone, embeddable visualization built in a claude.ai chat. Read this file first; it records the physics, the decisions made, and the conventions the code follows, so work can continue without re-deriving anything.

## Files

- `viz/rope.js` — shared by all figures: light/dark palettes (`THEMES`: CSS custom properties plus the canvas palette `C`), theme selection, iframe embedding, the rotation-minimizing frame (`rmf`), `drawLayer`, which draws the 2D canvas rope (body, braid and marker) for Figure 2, and the wrap geometry (`buildWrap`) and fixed camera (`view`) for Figure 3. The canvas version of the animated wrap that used `drawLayer` was replaced by the WebGL one; it is in git history.
- `viz/rope-twist.html` — the animated wrap described below (Figure 3 in the post), rendered with WebGL 2. The rope is a solid tube (rings every 0.25 cm, 24 segments around, flat end caps) on a solid grey cylinder. Each rope vertex carries its arc length s and frame angle a; the fragment shader turns them into material coordinates (q = (a − spin − κs)/STEP around, p = (s − pulled)/D along) and samples `viz/rope-texture.png` (nearest, repeating) at (q − p)·h/(NS·w), (q + p)/NS for an image of w×h pixels, so texture rows follow the two helical braid directions. Its braid row spacing is D = r·2π/NS ≈ 0.314 cm (not the shared 0.5 cm), equal to one strand's arc width, so both braid directions run at 45° to the axis, at right angles to each other, and texture pixels are square on the rope surface. The image height spans the NS = 10 strands around the rope (one pixel row per strand at h = 10), and pixels cover equal steps along both braid directions for any image size. Going once around the rope shifts the texture by one image in y and h/w images in x, so the image wraps seamlessly only if h is a multiple of w (a console warning flags other sizes). On top of the colour, `viz/rope-structure.jpg` (greyscale photo of a 2×2-strand patch, linear + mipmapped) is tiled once per 4×4 colour pixels (`STRUCT`) and multiplied in, scaled by 1/(its mean brightness) so the overall tone is kept, and blended in at half strength (`STRUCT_MIX` = 0.5); it wraps seamlessly when the colour image height is a multiple of 4 (console warning otherwise). The textures are loaded as images, so the page must be served over http (e.g. `serve.py`), not opened as a file; the marker (guiding line) is part of the colour texture: its dark stripe runs along the rope. A wireframe checkbox shows the mesh with hidden lines removed.
- `viz/rope-twists.html` — static Figure 2: a straight 12 cm rope with zero, one and two twists, drawn in 2D canvas by `drawLayer` with uniform twist strain κ = 2πn / L.
- `index.html` — the blog post embedding the figures.
- `HANDOFF.md` — this brief.

Theme: `?theme=light|dark` query parameter, otherwise the system preference. A host page can also switch it with `postMessage({type:'rope-twist-theme', theme})`. When embedded, each figure posts `{type:'rope-twist-height', h}` to the parent so the iframe can be sized to fit. Figures need no dependencies beyond `rope.js` and the texture images next to them.

## Purpose

Show how a longitudinally marked rope twists when pulled around a cylinder at an oblique angle, as in a reference photo of an orange climbing rope wrapped about one and a half turns around a diagonal bar. The animation shows a textured 3D rope running around the bar while its marker line spins.

## Physics (agreed with the author; do not revert)

The rope centreline is a helix of radius R + r (cylinder radius plus rope radius) and pitch angle α, measured from the cylinder's cross-sectional plane, with straight tangent lead-in and lead-out sections.

The helix torsion is τ = sin α · cos α / (R + r).

The key mechanism: friction locks the rope's contact strip to the bar, so each rope element keeps its orientation relative to the bar's surface while it is wrapped. With a uniform torsional strain κ along the rope, this constraint forces the whole rope to spin about its own axis at

    dk = dl · (τ − κ)

where dl is the length of rope pulled through. With κ = 0 (strain-free rope) this is the author's formula dk = dl · sin α · cos α / (R + r). Pulling one full turn of wrapped rope through (dl = 2π(R + r)/cos α) spins the rope by 360° · sin α.

Consequences shown in the UI: positive κ (same sense as τ) slows the spin; κ = τ stops it (all geometric twist is stored as strain); κ > τ reverses it; negative κ speeds it up.

An earlier version wrongly assumed the rope slides freely about its own axis at the contact, which freezes the marker pattern in space. That model was rejected; the contact-locked model above is correct.

## Implementation notes

- Units are centimetres throughout. Rope radius r = 0.5 cm (fixed).
- Reference frame along the centreline: rotation-minimizing frame computed with the double-reflection method (Wang et al. 2008). This is the zero-twist frame.
- The spin rate is not hard-coded from the formula. `geo.tw` is measured numerically as the rate at which the zero-twist frame turns relative to the bar's outward normal along the helix; it equals ±τ, and its sign sets the handedness. The displayed numbers use the analytic τ.
- Strain is applied as an extra material angle κ · s along the rope (texture and marker), and the spin accumulates as `spin += (tw − κ) · dl`. Internally κ takes the sign of `tw`, so a positive slider value always means "same sense as the torsion".
- Rendering is WebGL 2 with an orthographic projection and a depth buffer for occlusion. View is fixed (spin about bar axis 90°, tilt 0.3 rad toward viewer, screen rotation 55° so the bar runs diagonally like the photo). The view auto-scales to fit the rope. Without WebGL 2 the figure shows a short message instead.
- Braid: 10 strands around, row spacing D ≈ 0.314 cm along the rope (see the texture mapping under Files). The pulled-length counter wraps at 10 × D so the texture stays continuous.
- Figure 2 (canvas) still draws the braid as lines: 10 strands per direction, row spacing 0.5 cm, every fifth strand bold as a tracer, strand identity tracked with `carrier = (k ∓ n) mod 10`.
- Animation is continuous (no loop seam). Starts paused when the reader has `prefers-reduced-motion` set.

## Controls and ranges

- Wrap angle α: 10–60°, default 45°
- Bar radius R: 0.5–2 cm, default 1.0 cm
- Turns: 0.25–2 in steps of 0.05, default 1.25
- Twist strain κ: −40 to 40 °/cm, default 0
- Pull speed: 2–20 cm/s (real time), default 6 cm/s
- Readouts: rope pulled per marker turn = 2π / |τ − κ| (∞ when zero); spin rate = v · |τ − κ| / 2π rev/s, flagged "(reversed)" when τ − κ < 0.

## Design decisions made along the way

- The rope runs around a fixed wrap; the angle is a control, not animated.
- No reference "outer face" line on the rope (removed as visually confusing).
- No playback/slow-motion selector; the speed range was reduced instead.
- Light and dark palettes are fixed per theme; the theme follows the host page or system preference.

## Likely next steps

- Write the blog text (currently placeholder) and add further figures.
