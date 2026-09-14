# Tent Planner

A browser-based campsite layout and tent allocation tool. Plan sleeping and support tents on a map, assign people with gender and role rules, and print a two-page landscape plan.

No server, no build step. Open `index.html` in a modern browser.

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

## Quick start

1. Download or clone this repository.
2. Open `index.html` in Chrome, Firefox, Edge, or Safari.
3. Enter camp name, dates, and group name in the header.
4. Upload a site map if you have one, then rotate/scale it to match the field.
5. Place tents from the inventory, set capacity and notes, then assign people.

## CSV formats

### Campers

```text
name,gender,type
Eilidh MacKenzie,F,Scout
Finlay Robertson,M,Leader
```

- `name` is required
- `gender` is `M` or `F`
- `type` is `Scout`, `Young Leader`, or `Leader`

### Tents

```text
name,sleeps,qty,footprint
Eurohike Sendero 8XL,8,7,260×700
4.5m Event Shelter,0,3,450×450
```

- `footprint` is width×length in centimetres
- `sleeps` of `0` treats the item as a support structure

## Print

Use **Print** for a landscape document:

- Page 1 — campsite layout
- Page 2 — assignment table

## Data storage

Plans are saved in the browser (`localStorage`). Clearing site data will remove the saved plan. Export CSV if you need a backup outside the browser.

## GitHub Pages

In the repo: **Settings → Pages → Deploy from a branch → main / root**.
The live app will be at `https://jonbloor.github.io/tent-planner/`.

## Licence

MIT. See [LICENSE](LICENSE).
