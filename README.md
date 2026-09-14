# Tent Planner

A browser-based campsite layout and tent allocation tool for Scout groups and similar organisations. Place sleeping and support tents on a map, assign people with gender and role rules, and print a two-page landscape plan.

No server and no build step. Open `index.html` in a modern browser, or use the live demo after GitHub Pages is enabled.

**Live demo:** [https://jonbloor.github.io/tent-planner/](https://jonbloor.github.io/tent-planner/)

## Features

- Drag-and-drop tent placement with real-world footprints
- Adjustable scale (pixels per metre)
- Upload a site photo as a background
- Rotate and scale the background independently so tents stay upright
- Draw labelled zones (cooking, leaders, parking)
- Camper list with gender and type (Scout, Young Leader, Leader)
- CSV import for campers and tent stock
- Per-tent gender policy, allowed roles, custom capacity, and notes
- Support structures (gazebos, mess tents) can have notes but not sleepers
- Smart Assign respects capacity, gender, and role rules
- Friends / foes warnings when assigning
- Local save and load (browser storage)
- CSV export and landscape print (map + assignment table)

First visit loads a small demo list so you can try the layout. Replace it with your own campers and tents.

## Quick start

1. Clone or download this repository.
2. Open `index.html` in Chrome, Firefox, Edge, or Safari.
3. Enter camp name, dates, and group name in the header.
4. Upload a site map if you have one, then rotate or scale it to match the field.
5. Place tents from the inventory, set capacity and notes, then assign people.

```bash
git clone https://github.com/jonbloor/tent-planner.git
cd tent-planner
# then open index.html
```

## CSV formats

Example files are in [`examples/`](examples/).

### Campers

```text
name,gender,type
Alex Morgan,F,Scout
James Wright,M,Leader
```

- `name` is required
- `gender` is `M` or `F`
- `type` is `Scout`, `Young Leader`, or `Leader`

### Tents

```text
name,sleeps,qty,footprint
8-person tunnel,8,4,260×700
4.5m event shelter,0,2,450×450
```

- `footprint` is width×length in centimetres
- `sleeps` of `0` treats the item as a support structure

## Print

Use **Print** for a landscape document:

- Page 1 — campsite layout
- Page 2 — assignment table

## Data storage

Plans are saved in the browser (`localStorage` key `tentPlannerState`). Clearing site data removes the saved plan. Export CSV if you need a backup outside the browser.

Nothing is sent to a server.

## GitHub Pages

In the repo: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.

The live app will be at `https://jonbloor.github.io/tent-planner/`.

## Licence

MIT. See [LICENSE](LICENSE).
