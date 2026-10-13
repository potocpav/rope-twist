# How Climbing Ropes Twist

A blog post on why a climbing rope spins about its own axis when pulled around a bar at an oblique angle, with interactive visualizations.

**Read it:** https://potocpav.github.io/rope-twist/

## Layout

- `index.html` — the post (plain static HTML, no build step).
- `viz/rope-twists.html` — Figure 2, static: a straight rope with zero, one and two twists.
- `viz/rope-twist.html` — Figure 3, interactive (WebGL 2): a textured rope pulled around a bar at an oblique angle, with a wireframe toggle.
- `viz/rope-texture.png`, `viz/rope-structure.jpg` — rope colour and fibre-structure textures for Figure 3.
- `viz/rope.js` — shared code: palette, theming and iframe embedding, canvas rope drawing (Figure 2), and the wrap geometry and camera (Figure 3).

Each figure is a standalone page with no external dependencies, embedded via iframe; open one through a local server (see below) to view it on its own, since Figure 3 loads its textures as images. Theme follows the system, or force it with `?theme=light` / `?theme=dark`.
- `images/` — photos used in the post.
- `HANDOFF.md` — physics and implementation notes for the visualization.

## Local preview

```sh
python3 serve.py
```

Then open http://localhost:8000/. The page reloads automatically whenever a file in the folder changes, including the figures and `viz/rope.js`. Pass a port to use another one, e.g. `python3 serve.py 8080`. Needs only Python 3.
