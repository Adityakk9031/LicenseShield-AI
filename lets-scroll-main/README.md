# lets-scroll

An agent skill — for Claude Code, Codex, and any `SKILL.md`-compatible agent — that
turns any brand, product, or industry into a **scroll-driven cinematic landing page**.
As the visitor scrolls, a pre-rendered camera travels through a series of AI-generated
scenes as **one unbroken shot**: down flies it forward, up plays it back. The scroll
position never triggers cuts or transitions — it simply moves time along a single
continuous camera path, so the seams between scenes have to be perfect. Making them
perfect (each clip is conditioned on its neighbour's actual rendered frames) is the
core of what this skill does.

You pick the flight's personality at the start — the skill implements it, it never
re-decides it:

- **Fly through the world** — the camera dives into each scene, pulls up and out, and
  hops across the miniature world to the next (the flagship diorama look).
- **One continuous walkthrough** — a single forward flight that glides through each
  scene straight into the next, never pulling back; the seamless choice for grounded,
  photoreal art directions.
- **Locked isometric glide** — one fixed camera angle for the whole film; the world
  slides past beneath the same view, no rotation, no reveals. The calmest and cheapest
  to re-roll.

## Install

Copy the skill folder into your agent's skills directory:

```bash
cp -R lets-scroll/skills/lets-scroll ~/.claude/skills/   # Claude Code
cp -R lets-scroll/skills/lets-scroll ~/.codex/skills/    # Codex
```

Then just ask for a scroll-through world landing page, or invoke `/lets-scroll`
(`$lets-scroll` in Codex).

## Requirements

- The [Monid CLI](https://monid.ai) with an API key and balance — the **default
  video-chain backend** (Seedance 2.0, billed per clip in USD; see below).
- The [Higgsfield CLI](https://higgsfield.ai), authenticated (`higgsfield auth login`),
  with credits — renders the scene stills, the `kling3_0` fallback, and the whole
  chain when Monid is absent.
- `ffmpeg` / `ffprobe` for frame extraction and encoding.
- Python 3 with Pillow (for the mobile portrait canvases; also the optional
  transparent-scene knockout).
- The [Codex CLI](https://github.com/openai/codex) (optional) — if present, the scene
  stills can be generated through Codex's built-in `image_gen` (the same GPT Image
  model), billed to a ChatGPT subscription instead of Higgsfield credits.
- About the Monid default: verified 2026-07-25 — first/last-frame conditioning
  frame-locks, so it renders the full seamless chain; frames travel via Monid's
  free workspace file system. Pay-per-use with no subscription or monthly expiry
  (a 6-scene 1080p chain ≈ $27). The skill re-checks the endpoint schema each
  build and keeps qualification probes in the pipeline for when the catalog
  changes; Higgsfield credits remain the fallback biller.
- **Manual asset path:** if you render the stills/clips yourself from the skill's
  prompt files, none of the AI CLIs above are needed — only `ffmpeg` (and Python
  for the optional knockout). The skill writes every prompt to a file plus a
  `HANDOFF.md` spec table per phase (prompt file, conditioning frame(s), the exact
  output filename, and a live status column), then **validates what comes back** —
  count, dimensions, aspect, duration, and that frame 0 of each clip matches the
  handed-over start frame — before anything is chained. Your video tool must accept
  a start frame (and, for fly-through connectors, an end frame) or the seams can't
  lock; the walkthrough architecture needs no end-frame support.

## What it does

Two pipelines, one page. The art pipeline renders every scene still with GPT Image 2
(via Higgsfield, or the Codex CLI on a ChatGPT subscription) under a shared style
preamble, so the whole world reads as one place; the default look is a soft isometric
clay diorama, with photoreal, papercraft, glossy-toy and neon-night as first-class
alternates. The motion pipeline renders the camera chain itself with frame-locking
video models — Seedance 2.0 via **Monid by default** (pay-per-clip USD), Seedance or
Kling on Higgsfield credits as fallback; any model that can't hold a seam is
disqualified. The page is a portable vanilla-JS scrub engine (blob-loaded, always
seekable video) that drops into plain HTML, Next.js, Vue, or a server-rendered page —
no stack assumptions.

When invoked, the skill:

1. **Interviews you** — the subject/industry + pitch, a brand kit (import from a URL, hand
   it over, or have it proposed), art direction, the **camera style** (fly-through /
   continuous walkthrough / locked isometric glide — this decides the clip architecture),
   the **journey size** (2 scenes = a teaser, 4 = a short journey, 6 = the full film)
   and the ordered scenes the camera visits,
   the **asset source** (the skill renders everything via Monid/Higgsfield, or hands you
   every prompt + conditioning frame so you can render in your own tools and drop the
   files back in), whether you want the **mobile version** (a second chain rendered
   natively in 9:16 portrait — composed for phones, not a crop of the landscape film),
   and the **budget** —
   render tiers and stills source shown with estimated credit costs, approved before
   anything generates.
2. **Generates the assets** — one still per scene, then the camera chain. Fly-through:
   one "dive-in" clip per scene plus the **connector** clips that join consecutive
   scenes. Walkthrough / locked-iso: one forward **leg** per scene, no connectors at
   all — each leg starts on the previous leg's actual last frame. Either way every seam
   is frame-identical, because connectors/legs are conditioned on the **actual rendered
   frames** of their neighbours, never on a fresh render of the same scene.
   Mobile opt-in renders a parallel portrait chain the same way, frame-locked against its
   own 9:16 renders.
3. **Wires it up** — a config-driven scroll engine that plays the whole chain as one
   flight, serving the portrait clips and posters automatically on phones.

## What's in the skill

```
skills/lets-scroll/
├── SKILL.md                    the procedure + the seam rule + gotchas
└── references/
    ├── prompts.md              intake checklist + every Higgsfield prompt template
    ├── pipeline.md             copy-paste batch scripts (generate → frames → connectors → encode)
    ├── scrub-engine.js         portable, config-driven scrub engine (blob-seek, lazy load, seam crossfade)
    ├── index-template.html     a minimal standalone page that mounts the engine
    └── knockout.py             background knockout for floating scenes
```

## Notes

- Asset generation costs money (~N image gens on Higgsfield credits + N to 2N−1 video
  gens — walkthrough chains render N forward legs; fly-through chains render N dives +
  N−1 connectors — billed per clip on Monid by default; the mobile chain doubles the
  video gens)
  and takes a while — the skill runs generations in the background and polls. Monid
  pricing is per-token and printed per run; Higgsfield pricing isn't exposed by its
  CLI, so the skill calibrates against your live balance. Either way the estimated
  total is stated before spending.
- Cheapest full pipeline test: a **2-scene teaser on the walkthrough architecture** —
  2 stills + 2 sequential legs, no connectors, no end-frame support needed. The right
  first run, and a good live-demo format.
- The generated `.mp4`/`.webp` assets are produced per project; they're not shipped here.

## License

MIT — see [LICENSE](LICENSE).
