# Handoff: rope twist on an oblique wrap

This folder holds a standalone, embeddable visualization built in a claude.ai chat. Read this file first; it records the physics, the decisions made, and the conventions the code follows, so work can continue without re-deriving anything.

## Files

- `viz/rope.js` — shared by all figures: light/dark palettes (`THEMES`: CSS custom properties plus the canvas palette `C`), theme selection, iframe embedding, the rotation-minimizing frame (`rmf`), and `drawLayer`, which draws rope body, braid and marker. Change the rope style here and every figure follows.
- `viz/rope-twist.html` — the animated wrap described below (Figure 2 in the post).
- `viz/rope-twists.html` — static Figure 1: a straight 12 cm rope with zero, one and two twists, drawn by `drawLayer` with uniform twist strain κ = 2πn / L.
- `index.html` — the blog post embedding both figures.
- `HANDOFF.md` — this brief.

Theme: `?theme=light|dark` query parameter, otherwise the system preference. A host page can also switch it with `postMessage({type:'rope-twist-theme', theme})`. When embedded, each figure posts `{type:'rope-twist-height', h}` to the parent so the iframe can be sized to fit. Figures need no dependencies beyond `rope.js` and make no network requests.

## Purpose

Show how a longitudinally marked rope twists when pulled around a cylinder at an oblique angle, as in a reference photo of an orange climbing rope wrapped about one and a half turns around a diagonal bar. The animation is a continuous line-style drawing of the rope running around the bar while its marker line spins.

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
- Strain is applied as an extra material angle κ · s along the rope (marker and braid), and the spin accumulates as `spin += (tw − κ) · dl`. Internally κ takes the sign of `tw`, so a positive slider value always means "same sense as the torsion".
- Rendering is 2D canvas with an orthographic projection. View is fixed (spin about bar axis 90°, tilt 0.3 rad toward viewer, screen rotation 55° so the bar runs diagonally like the photo). The view auto-scales to fit the rope.
- Occlusion: rope points are split into runs behind and in front of the bar; draw order is back rope, bar (filled), front rope. The rope body is a thick outline stroke plus a slightly thinner fill stroke; braid and marker segments are culled when their surface normal faces away from the viewer. The marker's hidden side is drawn faint and dashed.
- Braid: 10 strands per direction, row spacing 0.5 cm along the rope. Every fifth strand in each direction is drawn bold as a continuous spiral (tracer yarn). Strand identity is tracked with `carrier = (k ∓ n) mod 10`, and the pulled-length counter wraps at 10 × 0.5 cm so identities stay consistent.
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
