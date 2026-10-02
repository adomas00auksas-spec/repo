# PC Builder Simulator — Research Notes

Reference material gathered before building. Real hardware facts (as of Oct 2026) and how each one maps to a game mechanic. All in-game brands/models will be **parody names** (Roblox removes trademarked content).

---

## 1. Real PC build order (→ assembly sequence)

Real builders assemble in this order. The game's assembly screen follows the same order so it *feels* real.

| # | Real step | Game step |
|---|-----------|-----------|
| 1 | Lift socket lever, drop CPU in (align triangle), close lever | Drag CPU → socket glows → *clunk* |
| 2 | M.2 SSD into slot at ~30°, press flat, screw down | Drag SSD → M.2 slot |
| 3 | RAM: open clips, align notch, press until *click* (slots A2/B2 first for 2 sticks) | Drag RAM → slots, *click* sound |
| 4 | Thermal paste (pea-sized) + mount cooler, plug CPU_FAN | Drag cooler → paste-squish effect |
| 5 | Mount motherboard on standoffs in case, align I/O shield | Board slides into case |
| 6 | PSU in bottom-rear | Drag PSU → bottom bay |
| 7 | GPU into top PCIe x16 slot, connect 12V-2×6 power | Drag GPU → PCIe slot, power cable snaps |
| 8 | Cable management | Cosmetic "tidy" bonus (optional mini-tap) |
| 9 | First boot / **POST** (power-on self-test), enable EXPO/XMP in BIOS | Boot animation → fans spin up → RGB on → score reveal |

Assembly **must enforce mandatory parts** (CPU, board, RAM, GPU, SSD, PSU). Cooler and case can be optional with penalties/bonuses.

---

## 2. Compatibility rules (→ build validation)

The six checks real builders make. These give the game depth beyond "highest rarity wins".

| Rule | Real-world | Game rule |
|------|-----------|-----------|
| **CPU socket ↔ board socket** | AMD AM5 / Intel LGA1851 — must match | Two fictional sockets (e.g. "AX5" vs "LG-18"). Mismatch = can't install |
| **RAM type ↔ board** | Current boards are DDR5 only | Keep DDR5 only (simple) — or add retro DDR4 boards as Common |
| **Form factor ↔ case** | ATX / Micro-ATX / Mini-ITX; small cases only fit small boards | Board size tag; Mini-ITX = 2 RAM slots, ATX = 4 |
| **GPU length ↔ case clearance** | Flagship cards 300–340 mm; mid-towers allow 330–400 mm | Long (Legendary) GPUs need big cases |
| **PSU wattage** | (CPU TDP + GPU TDP + 80 W) × 1.4 | Under-powered = boot fails or score penalty |
| **Cooler ↔ CPU TDP** | Cooler rating should exceed CPU TDP, else **thermal throttling** | Weak cooler = score × throttle penalty |

---

## 3. Current hardware (→ stat tables & tier ladders)

### GPUs
| Real card | VRAM | Power | Game tier |
|-----------|------|-------|-----------|
| Intel Arc B570 / B580 | 10–12 GB | ~150–190 W | Common |
| RTX 5060-class / RX 9060-class | 8–16 GB | ~150 W | Common–Uncommon |
| RTX 5070 | 12 GB GDDR7 | 250 W | Uncommon |
| RX 9070 XT-class | 16 GB | ~300 W | Rare |
| RTX 5070 Ti | 16 GB GDDR7 | 300 W | Rare |
| RTX 5080 | 16 GB GDDR7 | 360 W | Epic |
| RTX 5090 | 32 GB GDDR7 | 575 W | Legendary |
| — (fictional) | 64 GB+ | "∞ W" | Mythic |

GPU is the biggest factor in gaming performance → keep the 40% score weight.

### CPUs
- **AMD:** Ryzen 7000/9000 on **AM5** (B650/X670/X870 chipsets). Zen 6 confirmed to stay on AM5, up to 24 cores, 65–170 W TDP (desktop launch reported late 2026–2027).
- **Intel:** Core Ultra on **LGA1851** (B860/Z890). Nova Lake desktop expected H2 2026.
- Ladder: 6-core (Common) → 8 → 12 → 16 → 24-core (Legendary) → fictional 64-core (Mythic). "X3D"-style big-cache variant = Epic+ gaming specialist.

### RAM (DDR5)
- Sweet spot: **DDR5-6000 CL30**, 32 GB (2×16 GB) is the gaming standard; 64 GB for creators.
- Always buy **matched kits** → dual-channel. Must enable **EXPO (AMD) / XMP (Intel)** or RAM runs at slow default.
- Game: matched-kit bonus; "EXPO toggle" as a small BIOS mini-moment after first boot.
- Ladder: 4800 → 5600 → 6000 → 6400 → 7200 → 8000+ (Mythic).

### Storage
| Type | Seq. read | Tier |
|------|-----------|------|
| SATA SSD | ~560 MB/s | Common |
| PCIe 3.0 NVMe | ~3,500 MB/s | Uncommon |
| PCIe 4.0 NVMe | ~7,000–7,450 MB/s | Rare/Epic |
| PCIe 5.0 NVMe | 12,000–14,900 MB/s | Legendary |
| fictional "PCIe 9.0" | 50,000+ MB/s | Mythic |

Fun fact for tooltips: real-world game load difference PCIe 5.0 vs SATA is usually < 3 seconds.

### PSU
- ATX 3.1 units have the **12V-2×6** connector (up to 600 W to one GPU).
- 80 Plus efficiency tiers map perfectly to rarity:

| Badge | Efficiency | Game tier |
|-------|-----------|-----------|
| 80+ White | ≥80% | Common |
| 80+ Bronze | 82–85% | Uncommon |
| 80+ Gold | 87–92% | Rare |
| 80+ Platinum | 90–94% | Epic |
| 80+ Titanium | 90–96% | Legendary |
| "80+ Infinity" (fictional) | 100% | Mythic |

### Cooling
Stock cooler → tower air → tower + RGB fan → 240 mm AIO → 360 mm AIO w/ infinity-mirror pump → custom loop with glowing coolant (Mythic). Fan sizes 80/92/120/140/200 mm scale with tier.

### Motherboards
Green bare PCB → blue w/ heatsinks → black armored → RGB edges → full armor + lit I/O cover → transparent board with pulsing traces (Mythic). Better boards = more RAM slots, higher RAM speed, overclock headroom.

---

## 4. Scoring model (draft)

```
base     = GPU*0.40 + CPU*0.30 + RAM*0.15 + SSD*0.15
power    = PSU watts >= required ? 1.0 : 0.0 (won't boot)  — or 0.5 soft penalty
thermal  = cooler rating >= CPU TDP ? 1.0 : 0.75 (throttling)
balance  = 1 - small penalty if GPU tier and CPU tier differ by 3+ (bottleneck)
bonuses  = matched RAM kit, same-brand set, RGB sync, mutation multipliers
PC Power = base * power * thermal * balance * (1 + bonuses)
```

This rewards understanding builds, not just rarity.

---

## 5. Visual / UI references (from user's photos)

- **Rarity colors:** Genshin-style tier colors (gray / blue / purple / gold / rainbow / neon).
- **Drop effects:** Diablo 3 loot beams — vertical light pillar in rarity color on Epic+ drops.
- **Art style:** Roblox cartoon, bright and chunky (simulator/tycoon games). Parts are stylized, not photoreal — matches what Roblox does well.
- **Feedback:** big "+1" popups, cash stacks, satisfying counters (simulator screenshots).
- **Endgame workspace:** cyberpunk desk with purple/pink neon and skyline monitors.
- **Cases:** dual-glass "aquarium" cases with ring-RGB fans for high tiers; mid-towers for low.
- **Menu backgrounds:** dark circuit-trace pattern with glowing lines.

---

## 6. Roblox platform rules that affect the design

- **Paid random items** (crates, luck boosts, pity systems) bought with Robux or Robux-bought currency **must display every outcome and its exact % odds** (summing to 100%) before purchase, with a labeled "Info/Odds" button. Applies to the Lucky Box, the legendary-chance multiplier and any guarantees.
- **No trademarks:** parody brand names only (e.g. "Nvidea", "Ryzon", "Intol", "Corsaire").
- **No currency betting** between players (removed the Section 8.3 wager idea).
- DevEx payout is a small fraction of Robux spent — revenue projections in the original doc are not realistic.

---

## Sources
- [Evetech – Pre-Build Compatibility Checklist (2026)](https://www.evetech.co.za/how-to-check-part-compatibility-pc-build/e/3653)
- [MaxMyBuild – PC Build Compatibility Guide](https://www.maxmybuild.com/guides/understanding-pc-parts/pc-build-compatibility-complete-guide)
- [Tom's Hardware – How to Build a PC](https://www.tomshardware.com/how-to/build-a-pc)
- [AORUS – How to build a PC](https://global.aorus.com/explore/how-to-build-a-pc)
- [Tom's Hardware – Best GPUs](https://www.tomshardware.com/reviews/best-gpus,4380.html)
- [MVKTech – GPU Specs Database 2026](https://www.mvktech.net/gpu-database/)
- [TechPowerUp – Zen 6 stays on AM5](https://www.techpowerup.com/328673/amd-zen-6-to-retain-socket-am5-for-desktops-2026-27-product-launches)
- [Wikipedia – Zen 6](https://en.wikipedia.org/wiki/Zen_6)
- [NoobFeed – 2026 CPU Roadmap](https://www.noobfeed.com/articles/2026-cpu-amd-zen-6-intel-core-ultra-400-nvidia-n1x)
- [Tech Insider – NVMe vs SATA 2026](https://tech-insider.org/nvme-vs-sata-ssd-2026/)
- [Jisaku – PCIe 5 NVMe guide 2026](https://jisaku.com/posts/pcie5-nvme-ssd-guide-2026)
- [Evetech – 80 Plus ratings](https://www.evetech.co.za/80-plus-ratings-bronze-gold-platinum/e/3732)
- [Evetech – What is TDP](https://www.evetech.co.za/what-is-tdp-thermal-design-power/e/4054)
- [Newegg Insider – DDR5 guide](https://www.newegg.com/insider/?p=93666)
- [Roblox Creator Docs – Paid random items policy](https://create.roblox.com/docs/production/monetization/paid-random-items)
