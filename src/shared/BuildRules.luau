-- Compatibility checks, PC Power scoring and assembly time.
-- Used by the server (authoritative) and the client (live preview).
local Config = require(script.Parent.Config)
local PartCatalog = require(script.Parent.PartCatalog)

local BuildRules = {}

-- parts: { [partType] = Part }
export type Evaluation = {
	ok: boolean, -- can this build be started?
	errors: { string }, -- blocking problems
	warnings: { string }, -- allowed, but lowers the score
	bonuses: { string },
	power: number, -- final PC Power
	requiredWatts: number,
	assemblySeconds: number,
	buildTier: number, -- overall rarity of the build (for effects)
}

local STOCK_COOLER_RATING = 65

function BuildRules.requiredWatts(parts): number
	local cpu = parts.CPU
	local gpu = parts.GPU
	local cpuW = if cpu then cpu.watts or 0 else 0
	local gpuW = if gpu then gpu.watts or 0 else 0
	-- Real-world rule of thumb: (CPU + GPU + 80W for the rest) x 1.4 headroom.
	-- We use 1.2 so the game is a little more forgiving.
	return math.floor((cpuW + gpuW + 80) * 1.2)
end

function BuildRules.assemblySeconds(parts): number
	local seconds = Config.ASSEMBLY_BASE
	for _, part in parts do
		seconds += part.tier * Config.ASSEMBLY_PER_TIER
	end
	return math.min(seconds, Config.ASSEMBLY_MAX)
end

function BuildRules.evaluate(parts): Evaluation
	local errors, warnings, bonuses = {}, {}, {}

	for _, t in PartCatalog.Types do
		if PartCatalog.TypeInfo[t].required and not parts[t] then
			table.insert(errors, "Missing " .. PartCatalog.TypeInfo[t].label)
		end
	end

	local cpu, board, ram = parts.CPU, parts.Motherboard, parts.RAM
	local gpu, psu, cooler, case = parts.GPU, parts.PSU, parts.Cooler, parts.Case

	-- Compatibility (hard rules, like real PC building)
	if cpu and board and cpu.socket ~= board.socket then
		table.insert(errors, string.format("CPU socket %s does not fit board socket %s", cpu.socket, board.socket))
	end
	if ram and board and (ram.sticks or 0) > (board.ramSlots or 0) then
		table.insert(errors, string.format("RAM kit has %d sticks but the board only has %d slots", ram.sticks, board.ramSlots))
	end
	if case and board and (board.form or 3) > (case.maxForm or 3) then
		table.insert(errors, string.format("%s board does not fit in a %s case", PartCatalog.FormNames[board.form], PartCatalog.FormNames[case.maxForm]))
	end
	if case and gpu and (gpu.length or 0) > (case.clearance or 0) then
		table.insert(errors, string.format("GPU is %dmm long but the case only fits %dmm", gpu.length, case.clearance))
	end

	-- Base score: GPU, CPU, RAM and SSD give points
	local base = 0
	for _, t in { "GPU", "CPU", "RAM", "SSD" } do
		local p = parts[t]
		if p then
			base += p.score or 0
		end
	end

	local mult = 1

	-- Power: weak PSU = unstable PC
	local needed = BuildRules.requiredWatts(parts)
	if psu and (psu.watts or 0) < needed then
		mult *= 0.7
		table.insert(warnings, string.format("Underpowered: needs %dW, PSU gives %dW (-30%%)", needed, psu.watts))
	end

	-- Cooling: weak cooler = thermal throttling
	local coolRating = if cooler then cooler.rating or 0 else STOCK_COOLER_RATING
	if cpu and coolRating < (cpu.watts or 0) then
		mult *= 0.8
		table.insert(warnings, string.format("Thermal throttling: CPU makes %dW of heat, cooler handles %dW (-20%%)", cpu.watts, coolRating))
	end

	-- Bottleneck: GPU and CPU far apart in tier
	if cpu and gpu and math.abs(cpu.tier - gpu.tier) >= 3 then
		mult *= 0.9
		table.insert(warnings, "Bottleneck: CPU and GPU are badly mismatched (-10%)")
	end

	-- Bonuses
	if board and (board.quality or 1) > 1 then
		mult *= board.quality
		table.insert(bonuses, string.format("Motherboard quality +%d%%", math.floor((board.quality - 1) * 100 + 0.5)))
	end
	if case and (case.airflow or 0) > 0 then
		mult *= 1 + case.airflow
		table.insert(bonuses, string.format("Case airflow +%d%%", math.floor(case.airflow * 100 + 0.5)))
	end

	local count, tierSum, minTier = 0, 0, math.huge
	local sameBrand, firstBrand = true, nil
	for _, p in parts do
		count += 1
		tierSum += p.tier
		minTier = math.min(minTier, p.tier)
		firstBrand = firstBrand or p.brand
		if p.brand ~= firstBrand then
			sameBrand = false
		end
	end
	if count == #PartCatalog.Types and minTier >= 5 then
		mult *= 1.5
		table.insert(bonuses, "LEGENDARY BUILD: every part Legendary+ (+50%)")
	end
	if count >= 6 and minTier >= 3 then
		mult *= 1.1
		table.insert(bonuses, "Matched quality: every part Rare+ (+10%)")
	end
	if count >= 2 and sameBrand then
		mult *= 1.05
		table.insert(bonuses, "Brand loyalty (+5%)")
	end

	local buildTier = if count > 0 then math.clamp(math.floor(tierSum / count + 0.5), 1, 6) else 1
	if count == #PartCatalog.Types and minTier >= 5 then
		buildTier = math.max(buildTier, 5)
	end

	return {
		ok = #errors == 0,
		errors = errors,
		warnings = warnings,
		bonuses = bonuses,
		power = math.floor(base * mult),
		requiredWatts = needed,
		assemblySeconds = BuildRules.assemblySeconds(parts),
		buildTier = buildTier,
	}
end

-- Picks the best compatible build from an inventory (used by "Auto-Pick").
-- inventory: { [id] = Part }
function BuildRules.autoPick(inventory): { [string]: any }
	local byType = {}
	for _, t in PartCatalog.Types do
		byType[t] = {}
	end
	for _, part in inventory do
		if byType[part.type] then
			table.insert(byType[part.type], part)
		end
	end
	for _, list in byType do
		table.sort(list, function(a, b)
			return PartCatalog.sortValue(a) > PartCatalog.sortValue(b)
		end)
	end

	local best, bestPower = {}, -1
	-- Try the best few CPUs and boards, pick everything else greedily to fit.
	for ci = 1, math.min(#byType.CPU, 6) do
		for bi = 1, math.min(#byType.Motherboard, 12) do
			local cpu, board = byType.CPU[ci], byType.Motherboard[bi]
			if cpu.socket == board.socket then
				local parts: { [string]: any } = { CPU = cpu, Motherboard = board }
				for _, ram in byType.RAM do
					if ram.sticks <= board.ramSlots then
						parts.RAM = ram
						break
					end
				end
				parts.SSD = byType.SSD[1]
				parts.PSU = byType.PSU[1]
				parts.Cooler = byType.Cooler[1]
				-- Case must fit the board; GPU must fit the case
				for _, case in byType.Case do
					if (case.maxForm or 3) >= (board.form or 3) then
						parts.Case = case
						break
					end
				end
				for _, gpu in byType.GPU do
					if not parts.Case or gpu.length <= parts.Case.clearance then
						parts.GPU = gpu
						break
					end
				end
				local result = BuildRules.evaluate(parts)
				if result.ok and result.power > bestPower then
					best, bestPower = parts, result.power
				end
			end
		end
	end
	if bestPower < 0 then
		-- Nothing compatible yet: just show the best part of each type so the
		-- player can see what is missing or clashing.
		for _, t in PartCatalog.Types do
			best[t] = byType[t][1]
		end
	end
	return best
end

-- Builder level from total PCs built (every 10 builds = 1 level)
function BuildRules.level(totalBuilt: number): number
	return math.floor(totalBuilt / 10) + 1
end

function BuildRules.levelTitle(level: number): string
	if level >= 50 then
		return "PC Godfather"
	elseif level >= 31 then
		return "PC Artisan"
	elseif level >= 11 then
		return "Tech Enthusiast"
	end
	return "Basement Tinkerer"
end

return BuildRules
