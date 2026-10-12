# How Climbing Ropes Twist

A blog post on why a climbing rope spins about its own axis when pulled around a bar at an oblique angle, with interactive visualizations.

**Read it:** https://potocpav.github.io/rope-twist/

## Layout

- `index.html` — the post (plain static HTML, no build step).
- `viz/rope-twists.html` — Figure 1, static: a straight rope with zero, one and two twists.
- `viz/rope-twist.html` — Figure 2, interactive: a rope pulled around a bar at an oblique angle.
- `viz/rope.js` — shared rope rendering (palette, braid, marker), theming and iframe embedding used by both figures.

Each figure is a standalone page with no external dependencies, embedded via iframe; open one directly to view it on its own. Theme follows the system, or force it with `?theme=light` / `?theme=dark`.
- `HANDOFF.md` — physics and implementation notes for the visualization.

## Local preview

```sh
python3 -m http.server
```

Then open http://localhost:8000/.
