-- Global tuning values. Change numbers here to rebalance the game.
local Config = {}

Config.DATASTORE_NAME = "PCBuilder_v1"
Config.AUTOSAVE_INTERVAL = 120 -- seconds

-- Warehouse (part spawning)
Config.SPAWN_INTERVAL = 3 -- seconds between new parts
Config.WAREHOUSE_MAX = 8 -- max uncollected parts waiting at once
Config.MUTATION_CHANCE = 0.005 -- 0.5% of parts are mutants
Config.MUTATION_MULT = 1.2 -- mutant stats are 20% higher

-- Inventory / building
Config.INVENTORY_LIMIT = 250
Config.BUILD_SLOTS = 3
Config.COLLECTION_LIMIT = 100 -- built PCs kept in the showcase

-- Assembly timing
Config.ASSEMBLY_BASE = 20 -- seconds for any build
Config.ASSEMBLY_PER_TIER = 4 -- extra seconds per part per rarity tier
Config.ASSEMBLY_MAX = 300 -- 5 minutes cap
Config.TAP_SECONDS = 2 -- each tap removes this many seconds
Config.MAX_TAPS_PER_SECOND = 8 -- server-side anti autoclicker cap

-- Economy
Config.CASH_PER_POWER = 0.1 -- cash earned = PC Power * this
Config.STARTING_CASH = 0

-- Sounds: paste Roblox audio ids here (e.g. "rbxassetid://123456").
-- Empty string = no sound.
Config.Sounds = {
	Collect = "",
	Rare = "",
	Epic = "",
	Legendary = "",
	Mythic = "",
	Click = "",
	Snap = "",
	BuildComplete = "",
}

return Config
