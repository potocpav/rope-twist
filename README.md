# How Climbing Ropes Twist

A blog post on why a climbing rope spins about its own axis when pulled around a bar at an oblique angle, with interactive visualizations.

**Read it:** https://potocpav.github.io/rope-twist/

## Layout

- `index.html` — the post (plain static HTML, no build step).
- `viz/rope-twist.html` — Figure 1, a standalone canvas animation with no dependencies. Embedded via iframe; open it directly to view on its own. Theme follows the system, or force it with `?theme=light` / `?theme=dark`.
- `HANDOFF.md` — physics and implementation notes for the visualization.

## Local preview

```sh
python3 -m http.server
```

Then open http://localhost:8000/.
