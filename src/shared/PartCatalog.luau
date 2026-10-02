-- Every PC part type, its parody brands and its stats per rarity tier.
-- Stats are loosely based on real 2026 hardware (see docs/RESEARCH.md).
-- All brand names are parodies on purpose (Roblox removes trademarks).
local Config = require(script.Parent.Config)

local PartCatalog = {}

export type Part = {
	id: string,
	type: string,
	tier: number,
	brand: string,
	name: string,
	mutant: boolean,
	-- type-specific stats (only some are set per type)
	score: number?,
	vram: number?,
	watts: number?,
	length: number?,
	fans: number?,
	cores: number?,
	socket: string?,
	speed: number?,
	capacity: number?,
	sticks: number?,
	read: number?,
	iface: string?,
	badge: string?,
	form: number?,
	ramSlots: number?,
	quality: number?,
	kind: string?,
	rating: number?,
	maxForm: number?,
	clearance: number?,
	airflow: number?,
}

-- Order matters: this is the order shown in the build screen and the
-- real-world build order (see docs/RESEARCH.md section 1).
PartCatalog.Types = { "CPU", "Motherboard", "RAM", "SSD", "Cooler", "PSU", "GPU", "Case" }

PartCatalog.TypeInfo = {
	CPU = { label = "CPU", icon = "CPU", required = true, spawnWeight = 14 },
	Motherboard = { label = "Motherboard", icon = "MB", required = true, spawnWeight = 12 },
	RAM = { label = "RAM", icon = "RAM", required = true, spawnWeight = 14 },
	SSD = { label = "SSD", icon = "SSD", required = true, spawnWeight = 14 },
	Cooler = { label = "Cooler", icon = "FAN", required = false, spawnWeight = 10 },
	PSU = { label = "Power Supply", icon = "PSU", required = true, spawnWeight = 12 },
	GPU = { label = "Graphics Card", icon = "GPU", required = true, spawnWeight = 14 },
	Case = { label = "Case", icon = "CASE", required = false, spawnWeight = 10 },
}

PartCatalog.Sockets = { "AX5", "LX-18" }
PartCatalog.FormNames = { "Mini-ITX", "Micro-ATX", "ATX" }

-- Per-tier stat tables (index = rarity tier 1..6)
local GPU = {
	score = { 1500, 2600, 4000, 6000, 10000, 20000 },
	vram = { 8, 12, 16, 16, 32, 64 },
	watts = { 150, 250, 300, 360, 575, 700 },
	length = { 240, 280, 300, 320, 340, 360 },
	fans = { 2, 2, 3, 3, 3, 3 },
	brands = {
		{ brand = "Nvidea", names = { "RTZ 5060", "RTZ 5070", "RTZ 5070 Ti", "RTZ 5080", "RTZ 5090", "RTZ TITAN Omega" } },
		{ brand = "Radeox", names = { "RX 9060", "RX 9060 XT", "RX 9070", "RX 9070 XT", "RX 9090 XTX", "RX Infinity X" } },
		{ brand = "Intol Arq", names = { "B570", "B580", "B770", "B970", "C990", "Celestial Prime" } },
	},
}

local CPU = {
	score = { 1100, 2000, 3000, 4500, 7500, 15000 },
	cores = { 6, 8, 12, 16, 24, 64 },
	watts = { 65, 105, 120, 170, 200, 250 },
	brands = {
		{ brand = "Ryzon", socket = "AX5", names = { "Ryzon 5 9600", "Ryzon 7 9700X", "Ryzon 7 9800X3D", "Ryzon 9 9950X", "Ryzon 9 9950X3D", "Ryzon Omega 64" } },
		{ brand = "Intol", socket = "LX-18", names = { "Core Ultra 5 245K", "Core Ultra 7 265K", "Core Ultra 7 365K", "Core Ultra 9 285K", "Core Ultra 9 385K", "Core Ultra Omega" } },
	},
}

local RAM = {
	score = { 450, 800, 1200, 1800, 3000, 6000 },
	speed = { 4800, 5600, 6000, 6400, 7200, 8800 },
	capacity = { 16, 32, 32, 64, 96, 192 },
	sticks = { 2, 2, 2, 2, 4, 4 },
	brands = {
		{ brand = "Corsaire", line = "Vengence" },
		{ brand = "G.Skull", line = "Tridentix" },
		{ brand = "Kingstone", line = "Furi" },
		{ brand = "Adato", line = "Lancer" },
	},
}

local SSD = {
	score = { 300, 550, 800, 1200, 2000, 4000 },
	read = { 560, 3500, 7000, 7450, 14900, 50000 },
	capacity = { 0.5, 1, 2, 2, 4, 8 },
	iface = { "SATA", "PCIe 3.0", "PCIe 4.0", "PCIe 4.0", "PCIe 5.0", "PCIe 9.0" },
	brands = {
		{ brand = "Samsong", line = "EVO" },
		{ brand = "Western Digitul", line = "Blak" },
		{ brand = "SK Hynex", line = "Platinum" },
		{ brand = "Crucible", line = "T-Series" },
	},
}

local PSU = {
	watts = { 550, 650, 850, 1000, 1200, 2000 },
	badge = { "80+ White", "80+ Bronze", "80+ Gold", "80+ Platinum", "80+ Titanium", "80+ Infinity" },
	brands = { "EVGO", "Corsaire", "Seasonik" },
}

local Motherboard = {
	quality = { 1.0, 1.03, 1.06, 1.1, 1.15, 1.25 },
	chipsets = {
		AX5 = { "A620", "B650", "B650E", "X670E", "X870E", "X999 Omega" },
		["LX-18"] = { "H810", "B860", "B860", "Z890", "Z890 Apex", "Z999 Omega" },
	},
	brands = { "ASOS", "MSY", "Gigabite", "ASRocc" },
}

local Cooler = {
	rating = { 95, 150, 200, 250, 300, 500 },
	kind = { "Stock", "Tower", "Tower RGB", "AIO 240", "AIO 360", "Custom Loop" },
	brands = { "Noctuo", "Be Quiot", "NZXY", "Cooler Mastr" },
}

local Case = {
	clearance = { 300, 330, 360, 380, 420, 500 },
	airflow = { 0, 0.02, 0.04, 0.06, 0.08, 0.12 },
	brands = {
		{ brand = "Lian Lee", line = "O11" },
		{ brand = "NZXY", line = "H-Series" },
		{ brand = "Fractul", line = "North" },
		{ brand = "Corsaire", line = "iCUE" },
	},
}

local function pick<T>(rng: Random, list: { T }): T
	return list[rng:NextInteger(1, #list)]
end

-- +/- 4% variance so two parts of the same tier are not identical
local function vary(rng: Random, value: number): number
	return math.floor(value * (0.96 + rng:NextNumber() * 0.08) + 0.5)
end

-- Form factor roll: 1 = Mini-ITX, 2 = Micro-ATX, 3 = ATX
local function rollForm(rng: Random): number
	local n = rng:NextNumber()
	if n < 0.2 then
		return 1
	elseif n < 0.55 then
		return 2
	end
	return 3
end

function PartCatalog.rollType(rng: Random): string
	local total = 0
	for _, t in PartCatalog.Types do
		total += PartCatalog.TypeInfo[t].spawnWeight
	end
	local n = rng:NextNumber() * total
	for _, t in PartCatalog.Types do
		n -= PartCatalog.TypeInfo[t].spawnWeight
		if n <= 0 then
			return t
		end
	end
	return "GPU"
end

-- Creates a new part. `id` is filled in by the server.
function PartCatalog.generate(partType: string, tier: number, rng: Random, mutant: boolean): Part
	local m = if mutant then Config.MUTATION_MULT else 1
	local part: any = { id = "", type = partType, tier = tier, mutant = mutant }

	if partType == "GPU" then
		local b = pick(rng, GPU.brands)
		part.brand = b.brand
		part.name = b.brand .. " " .. b.names[tier]
		part.score = vary(rng, GPU.score[tier] * m)
		part.vram = GPU.vram[tier]
		part.watts = GPU.watts[tier]
		part.length = GPU.length[tier]
		part.fans = GPU.fans[tier]
	elseif partType == "CPU" then
		local b = pick(rng, CPU.brands)
		part.brand = b.brand
		part.name = b.names[tier]
		part.socket = b.socket
		part.score = vary(rng, CPU.score[tier] * m)
		part.cores = CPU.cores[tier]
		part.watts = CPU.watts[tier]
	elseif partType == "RAM" then
		local b = pick(rng, RAM.brands)
		part.brand = b.brand
		part.speed = RAM.speed[tier]
		part.capacity = RAM.capacity[tier]
		part.sticks = RAM.sticks[tier]
		part.name = string.format("%s %s DDR5-%d %dGB", b.brand, b.line, part.speed, part.capacity)
		part.score = vary(rng, RAM.score[tier] * m)
	elseif partType == "SSD" then
		local b = pick(rng, SSD.brands)
		part.brand = b.brand
		part.read = SSD.read[tier]
		part.capacity = SSD.capacity[tier]
		part.iface = SSD.iface[tier]
		local size = if part.capacity < 1 then string.format("%dGB", part.capacity * 1000) else string.format("%dTB", part.capacity)
		part.name = string.format("%s %s %s", b.brand, b.line, size)
		part.score = vary(rng, SSD.score[tier] * m)
	elseif partType == "PSU" then
		part.brand = pick(rng, PSU.brands)
		part.watts = math.floor(PSU.watts[tier] * m)
		part.badge = PSU.badge[tier]
		part.name = string.format("%s %dW %s", part.brand, part.watts, part.badge)
	elseif partType == "Motherboard" then
		part.brand = pick(rng, Motherboard.brands)
		part.socket = pick(rng, PartCatalog.Sockets)
		part.form = rollForm(rng)
		part.ramSlots = if part.form == 1 then 2 else 4
		part.quality = Motherboard.quality[tier] * (if mutant then 1.05 else 1)
		part.name = string.format("%s %s %s", part.brand, Motherboard.chipsets[part.socket][tier], PartCatalog.FormNames[part.form])
	elseif partType == "Cooler" then
		part.brand = pick(rng, Cooler.brands)
		part.kind = Cooler.kind[tier]
		part.rating = math.floor(Cooler.rating[tier] * m)
		part.name = string.format("%s %s", part.brand, part.kind)
	elseif partType == "Case" then
		local b = pick(rng, Case.brands)
		part.brand = b.brand
		part.maxForm = if tier >= 3 then 3 else rollForm(rng)
		part.clearance = Case.clearance[tier]
		part.airflow = Case.airflow[tier] * (if mutant then 1.5 else 1)
		local size = ({ "Mini", "Compact", "Tower" })[part.maxForm]
		part.name = string.format("%s %s %s", b.brand, b.line, size)
	else
		error("Unknown part type " .. tostring(partType))
	end

	if mutant then
		part.name = "Mutant " .. part.name
	end
	return part
end

-- One short line of the most important stats, for cards and tooltips.
function PartCatalog.describe(part: Part): string
	local t = part.type
	if t == "GPU" then
		return string.format("%dGB VRAM  %dW  %dmm", part.vram or 0, part.watts or 0, part.length or 0)
	elseif t == "CPU" then
		return string.format("%d cores  %dW  %s", part.cores or 0, part.watts or 0, part.socket or "?")
	elseif t == "RAM" then
		return string.format("%d sticks  DDR5-%d", part.sticks or 0, part.speed or 0)
	elseif t == "SSD" then
		return string.format("%s  %d MB/s", part.iface or "?", part.read or 0)
	elseif t == "PSU" then
		return string.format("%dW  %s", part.watts or 0, part.badge or "")
	elseif t == "Motherboard" then
		return string.format("%s  %s  %d RAM slots", part.socket or "?", PartCatalog.FormNames[part.form or 3], part.ramSlots or 0)
	elseif t == "Cooler" then
		return string.format("%s  cools %dW", part.kind or "", part.rating or 0)
	elseif t == "Case" then
		return string.format("fits %s  GPU %dmm", PartCatalog.FormNames[part.maxForm or 3], part.clearance or 0)
	end
	return ""
end

-- Number used to sort parts "best first" inside one type.
function PartCatalog.sortValue(part: Part): number
	return part.tier * 100000 + (part.score or part.watts or part.rating or part.clearance or 0) + (if part.mutant then 50000 else 0)
end

return PartCatalog
