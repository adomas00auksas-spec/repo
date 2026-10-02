-- Rarity tiers, drop odds and visuals.
-- Weights must add up to 100 (they are shown to players as % odds).
local Rarities = {}

export type Rarity = {
	tier: number,
	name: string,
	weight: number,
	color: Color3,
	sellValue: number,
	beam: boolean, -- vertical loot beam when it spawns
	shake: number, -- screen shake strength when collected (0 = none)
	tint: boolean, -- screen tint flash when collected
}

Rarities.List = {
	{ tier = 1, name = "Common", weight = 70, color = Color3.fromRGB(170, 176, 186), sellValue = 5, beam = false, shake = 0, tint = false },
	{ tier = 2, name = "Uncommon", weight = 18, color = Color3.fromRGB(70, 150, 255), sellValue = 15, beam = false, shake = 0, tint = false },
	{ tier = 3, name = "Rare", weight = 10, color = Color3.fromRGB(170, 85, 255), sellValue = 50, beam = false, shake = 0, tint = true },
	{ tier = 4, name = "Epic", weight = 1.5, color = Color3.fromRGB(255, 190, 40), sellValue = 250, beam = true, shake = 4, tint = true },
	{ tier = 5, name = "Legendary", weight = 0.4, color = Color3.fromRGB(255, 80, 120), sellValue = 1200, beam = true, shake = 8, tint = true },
	{ tier = 6, name = "Mythic", weight = 0.1, color = Color3.fromRGB(0, 255, 210), sellValue = 6000, beam = true, shake = 14, tint = true },
} :: { Rarity }

Rarities.MAX_TIER = #Rarities.List

function Rarities.get(tier: number): Rarity
	return Rarities.List[math.clamp(tier, 1, Rarities.MAX_TIER)]
end

function Rarities.totalWeight(): number
	local total = 0
	for _, r in Rarities.List do
		total += r.weight
	end
	return total
end

-- rng: a Random object (or anything with :NextNumber())
function Rarities.roll(rng: Random): number
	local pick = rng:NextNumber() * Rarities.totalWeight()
	for _, r in Rarities.List do
		pick -= r.weight
		if pick <= 0 then
			return r.tier
		end
	end
	return 1
end

-- Rainbow color for Legendary/Mythic animated effects. t = time in seconds.
function Rarities.rainbow(t: number, speed: number?): Color3
	return Color3.fromHSV((t * (speed or 0.25)) % 1, 0.85, 1)
end

return Rarities
