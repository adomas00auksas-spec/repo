> Also in this repo: **[Lietuva · Lietuvos gyvenimas](lietuva/README.md)**, a browser
> Lithuania life simulator (open `lietuva/index.html`).

# PC Builder Simulator (Roblox)

Collect randomly dropping PC parts, assemble them into gaming PCs and chase the
highest **PC Power**.

**Install:** see [INSTALL.md](INSTALL.md). **Design research:** [docs/RESEARCH.md](docs/RESEARCH.md).

## What's in this version (core loop)

- **Warehouse:** a new part every 3s (max 8 waiting), 6 rarities (Common 70% →
  Mythic 0.1%) + 0.5% Mutants. Tap to collect: the part flies to your inventory,
  with rarity effects (tint, shake, confetti, loot beams on Epic+).
- **8 part types** with parody brands and real-hardware-inspired stats:
  CPU, Motherboard, RAM, SSD, Cooler, PSU, GPU, Case. Spinning 3D models in
  the UI, built from Roblox parts (more fans, metal and RGB at higher rarity).
- **Real compatibility rules:** CPU socket ↔ board, RAM sticks ↔ slots, board
  size ↔ case, GPU length ↔ case. Soft penalties for a weak PSU (underpowered),
  weak cooler (thermal throttling) and CPU/GPU mismatch (bottleneck).
- **3 assembly stations:** timers (20s to 5min), tap to speed up (−2s per tap,
  rate limited on the server), claim → animated PC Power reveal + cash.
- **Inventory** (250 limit) with sell and "sell all of rarity", **Showcase**
  of built PCs, builder levels, **Drop Odds** screen, leaderstats.
- **Saving** via DataStore (autosave every 2 min, on leave and on shutdown).

## Not yet built (next steps)

Monetization (game passes / dev products), 3D showroom in the world, global
leaderboards, daily rewards, achievements, limited-time part lines, sounds
(ids go in `Config.Sounds`), real meshes for parts.

## Layout

```
src/shared   ReplicatedStorage.Shared   game data + rules (used by both sides)
src/server   ServerScriptService.Server spawning, saving, validating actions
src/client   StarterPlayerScripts.Client all UI and effects
```
