# Installing into your Roblox place

Every file in `src/` becomes one script in Studio. The **file name** says the
script type:

| File ending | Studio type |
|---|---|
| `Name.server.luau` | **Script** named `Name` |
| `Name.client.luau` | **LocalScript** named `Name` |
| `Name.luau` | **ModuleScript** named `Name` |

## Where each script goes

```
ReplicatedStorage
└── Shared                (Folder)
    ├── Config            (ModuleScript)  ← src/shared/Config.luau
    ├── Rarities          (ModuleScript)  ← src/shared/Rarities.luau
    ├── PartCatalog       (ModuleScript)  ← src/shared/PartCatalog.luau
    └── BuildRules        (ModuleScript)  ← src/shared/BuildRules.luau

ServerScriptService
└── Server                (Folder)
    ├── Main              (Script)        ← src/server/Main.server.luau
    └── PlayerData        (ModuleScript)  ← src/server/PlayerData.luau

StarterPlayer
└── StarterPlayerScripts
    └── Client            (Folder)
        ├── Main          (LocalScript)   ← src/client/Main.client.luau
        ├── Theme         (ModuleScript)  ← src/client/Theme.luau
        ├── UI            (ModuleScript)  ← src/client/UI.luau
        ├── State         (ModuleScript)  ← src/client/State.luau
        ├── Effects       (ModuleScript)  ← src/client/Effects.luau
        ├── PartModels    (ModuleScript)  ← src/client/PartModels.luau
        ├── Cards         (ModuleScript)  ← src/client/Cards.luau
        ├── HUD           (ModuleScript)  ← src/client/HUD.luau
        └── Panels        (ModuleScript)  ← src/client/Panels.luau
```

Names must match exactly (scripts find each other by name). The `Remotes`
folder is created automatically by the server at runtime, so don't make it.

## Option 1: paste this prompt into your local Claude Code (Roblox Studio MCP)

> Clone https://github.com/adomas00auksas-spec/repo (branch `claude/cool-cori-0xasl4`).
> Read `INSTALL.md`, then recreate every file from `src/` inside my open Roblox
> Studio place exactly as the "Where each script goes" tree shows: correct
> service, folder, instance name and script type (Script / LocalScript /
> ModuleScript), with the file's full contents as the Source. Don't edit the
> code. Then turn on Game Settings → Security → "Enable Studio Access to API
> Services" so saving works, and playtest once to check the Output window for
> errors.

## Option 2: Rojo

Install the Rojo Studio plugin, then from this folder run `rojo serve` and
click **Connect** in the plugin. `default.project.json` maps everything.

## After installing

1. **Game Settings → Security → Enable Studio Access to API Services** (or
   saving is off in Studio and you'll see a yellow notice; the game still runs).
2. Press **Play**. Parts appear in the Warehouse every 3 seconds.
3. Optional: add sound ids in `Shared/Config` → `Config.Sounds`
   (e.g. `"rbxassetid://123456"`). Empty = silent.
