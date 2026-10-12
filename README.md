# How Climbing Ropes Twist

A blog post on why a climbing rope spins about its own axis when pulled around a bar at an oblique angle, with interactive visualizations.

**Read it:** https://potocpav.github.io/rope-twist/

## Layout

- `index.html` — the post (plain static HTML, no build step).
- `viz/rope-twists.html` — Figure 1, static: a straight rope with zero, one and two twists.
- `viz/rope-twist.html` — Figure 2, interactive: a rope pulled around a bar at an oblique angle.
- `viz/rope.js` — shared rope rendering (palette, braid, marker), theming and iframe embedding used by both figures.

Each figure is a standalone page with no external dependencies, embedded via iframe; open one directly to view it on its own. Theme follows the system, or force it with `?theme=light` / `?theme=dark`.
- `images/` — photos used in the post.
- `HANDOFF.md` — physics and implementation notes for the visualization.

## Local preview

```sh
python3 serve.py
```

Then open http://localhost:8000/. The page reloads automatically whenever a file in the folder changes, including the figures and `viz/rope.js`. Pass a port to use another one, e.g. `python3 serve.py 8080`. Needs only Python 3.
