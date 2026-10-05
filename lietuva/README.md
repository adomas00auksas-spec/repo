# Lietuva · Lietuvos gyvenimas

A Lithuania life simulator, built in the same style as *Ukiyo: a life in old Edo*:
a top-down illustrated open world, a big character creator, paper-card HUD, story
pop-ups and small minigames. One self-contained file: open `index.html` in a browser.

> **Fictional role-play.** Every gang, cartel, crew, club and character is invented.
> Real places appear only as scenery. The game opens with a "Just a game / Tik žaidimas"
> disclaimer that has to be accepted every time.

## What's in it

**Open world.** One continuous map in the real shape of Lithuania (border, Baltic coast,
Curonian Spit and lagoon, Nemunas and Neris rivers, eastern lakes). Eight towns connected
by real highway numbers (A1, A2, A8, A9, A11, A12, A13…):

| Town | Landmarks in game |
|---|---|
| Vilnius | Cathedral and bell tower, Gediminas Tower, **Baltasis tiltas** (White Bridge, Centras hangout), TV tower, Akropolis car park |
| Kaunas | Castle at the river confluence, Laisvės alėja, Žalgiris arena |
| Klaipėda | Theatre Square, sailing ship Meridianas, port cranes, container terminal, ferry to the spit |
| Šiauliai | Sundial square; Hill of Crosses in the fields north of town |
| Panevėžys | Miltinis Drama Theatre, Cido arena |
| Alytus | Parachute tower, a "farm" in the border forest |
| Palanga | The pier, Amber Museum |
| Nida | Parnidis dune and sundial, ferry pier |

Plus Trakai Island Castle on its lake between Vilnius and Kaunas.

**Character creator.** Name (Lithuanian surnames switch form by gender: Kazlauskas → Kazlauskaitė),
starting age (6, 13, 16, 24, 30), home town, family class (lower, middle, upper, wealthy),
parents' job (office, mechanic, army, gangster, police, market trader), your own occupation
(16+), and looks. Each choice changes money, home, first vehicle and perks.

**Ages.**
- **6:** collect bottles for the *taromatas* (10 ct each), ice cream, errands for mum, bike. Nobody fights a kid.
- **13:** school yard rivalries (two schools per town), the Centras crew at the White Bridge, bike.
- **16+:** cars, car clubs and street gangs. **18+:** cartels.
- Grow up any time at home ("Užaugti") to jump to the next stage.

**Factions.** Street league (gangs, two cartels, the Centras crew) fight over ~32 districts
with real neighbourhood names. Car clubs (Tokyo Drift style) run races, drift challenges and
night meets. School yard crews tag walls and win scuffles. Ranks run from *Pacanas* to
**Gangsteris** for gangs, *Naujokas* to *Klubo legenda* for clubs.

**Systems.** Day/night with street lights and headlights, weather, a real calendar starting on
Rugsėjo 1-oji, birthdays, police attention stars, busts and hospital, drift scoring, tuning
(engine chip, turbo, drift kit, neon), car theft, traffic in every city and on highways, bus
stations for fast travel, ferry to Nida, territory income and rival attacks, a Tamo e-diary
that tells your parents when you skip school, a glossary of Lithuanian words and slang,
goals, chronicle, saving in the browser.

## Interiors

Press **E** at any door to walk inside. Furniture and people with a prompt can be used:

| Place | What you can do inside |
|---|---|
| Home (layout depends on family class) | Sleep in the bed, eat from the fridge, watch TV, computer (games, jobs, grow up), wardrobe; talk to mum/dad, or your cat/dog when you live alone |
| Maksi shop | Checkout counter, taromatas bottle machine, security guard |
| Kebab shop, café, bar, garage | Order or tune at the counter; buy the place as a business from the certificate on the wall |
| Market (turgus) | Stalls run by grandmothers; sell fish and amber |
| School | Attend class at the board, shoot hoops in the sports hall, join the yard crew via the teacher. Rival school corridors can be stormed |
| Gym | Bench press and punch bags (fighting skill), treadmill (max health), basketball |
| Police, hospital, office, bus station | Pay fines, heal, work your desk, buy bus tickets |
| Gang and cartel HQs | Boss menu, jobs, hire crew. Rival HQs can be raided |
| Car club garages | Car on the lift, neon sign, boss |
| Landmarks | Cathedral (light a candle), Trakai and Kaunas castles and the Amber Museum (exhibits with real history), theatre, Žalgiris and Cido arenas (watch a game), Akropolis mall (clothes, cinema, food court) |
| Any panel block, church or mall | Stairwells with mailboxes, neighbours and bottles; churches; malls |

Hiding indoors makes the police lose interest faster (except inside the police station).

## More systems

- **Crew:** from rank Bachūras you can hire up to three crew members at your HQ. They follow you, fight rivals and ride along in your car.
- **Raids:** walk into a rival gang or cartel HQ and knock everyone out for the safe and one of their districts.
- **Story chapters:** after the first quest line, a chapter starts for your path: *Kelias į viršų* (street), *Šoninio karalius* (car clubs), *Mokyklos karalius* (school), *Kiemo vaikas* (kids), *Savas kelias* (no crew).
- **Races:** street races, highway races between towns (Drifteris+) and a boss race against your club leader.
- **Businesses:** buy a kebab shop, café, bar or garage for daily income.
- **Fishing:** buy a rod (meškerė) at a market, stand by water and press E. Real Baltic and freshwater fish (stinta, lydeka, unguris…).
- **Clothes:** sunglasses, gold chain, Žalgiris jersey at the mall.
- **Winter:** from December, snow, frozen lakes and icy roads.
- **Opening hours:** shops 7–23, cafés, bars, markets, schools and offices keep their hours. Kebab shops and petrol stations never close.
- **Road trips:** petrol stations on every A-highway (hot dogs, coffee, car wash). Police roadblocks at four stars.
- **Living city:** rival gangs brawl in the streets, car clubs hold neon night meets at their spots, city buses in traffic.
- **Family and pets:** brothers and sisters at home; adopt a puppy from the shelter at any market. Your dog follows you and barks bullies away.
- **Real estate:** buy a bigger home or move to another town through the agent in any business centre.
- Quiet folk background tune (menu to toggle), rain makes roads slippery.
- Mouse wheel or +/− to zoom.

## Editing the game

The playable file `index.html` is generated. Edit the parts in `src/` and run `./build.sh`.

## Controls

WASD / arrows move · Shift sprint (turbo in tuned cars) · **E** talk, enter, hold to tag ·
**F** get in/out of a vehicle · **J** or click punch · **Space** handbrake · H horn ·
M map · Q quests · T phone (jobs) · C character · I items · L dictionary · 1–6 hotbar.
On phones: joystick plus on-screen buttons.

## Ideas for next versions

- Basketball league at Žalgiris arena; Kaziuko mugė and Joninės festival days.
- Ice fishing on the frozen lagoon.
- Police chases with roadblocks; a lawyer you can pay.
- Family events: siblings, parents ageing, your own family at 24+.
- More towns: Marijampolė (the used-car market), Utena, Druskininkai, Trakai as a town.
- Sound effects and music from a real synth, voiced Lithuanian lines.
