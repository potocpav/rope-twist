# How Climbing Ropes Twist

A blog post on why a climbing rope spins about its own axis when pulled around a bar at an oblique angle, with interactive visualizations.

**Read it:** https://potocpav.github.io/rope-twist/

## Layout

- `index.html` — the post (plain static HTML, no build step).
- `viz/rope-twist.html` — Figure 4, interactive (WebGL 2): a textured rope pulled around a bar at an oblique angle, with a wireframe toggle.
- `viz/rope-texture.png`, `viz/rope-structure.jpg` — rope colour and fibre-structure textures for Figure 4.
- `images/` — photos and diagrams used in the post (Figures 1–3); each `*-preview.jpg` is a half-size copy shown inline, linking to the full image.
- `viz/rope.js` — shared code: palette, theming and iframe embedding, and the wrap geometry and camera (Figure 4).

Each figure is a standalone page with no external dependencies, embedded via iframe; open one through a local server (see below) to view it on its own, since Figure 4 loads its textures as images. Figures follow the system theme, or force one with `?theme=light` / `?theme=dark`; Figure 4's 3D scene always uses the light palette on a white canvas.

## Local preview

```sh
python3 serve.py
```

Then open http://localhost:8000/. The page reloads automatically whenever a file in the folder changes, including the figures and `viz/rope.js`. Pass a port to use another one, e.g. `python3 serve.py 8080`. Needs only Python 3.
