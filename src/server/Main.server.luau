-- Server entry point: spawns parts, handles collecting, selling and building.
-- The server is the source of truth; the client only asks.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Rarities = require(Shared.Rarities)
local PartCatalog = require(Shared.PartCatalog)
local BuildRules = require(Shared.BuildRules)
local PlayerData = require(script.Parent.PlayerData)

local rng = Random.new()

-- Remotes ---------------------------------------------------------------
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"

local UpdateEvent = Instance.new("RemoteEvent")
UpdateEvent.Name = "Update" -- server -> client pushes
UpdateEvent.Parent = remotes

local RequestFunction = Instance.new("RemoteFunction")
RequestFunction.Name = "Request" -- client -> server actions
RequestFunction.Parent = remotes

local TapEvent = Instance.new("UnreliableRemoteEvent")
TapEvent.Name = "Tap" -- client -> server assembly taps
TapEvent.Parent = remotes

remotes.Parent = ReplicatedStorage

-- Per-session state (not saved) ------------------------------------------
local pending: { [Player]: { [string]: any } } = {} -- uncollected warehouse parts
local ready: { [Player]: boolean } = {}
local tapTimes: { [Player]: { number } } = {}

local function now(): number
	return workspace:GetServerTimeNow()
end

-- Leaderboard shown in the Roblox player list
local function setupLeaderstats(player: Player, data)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local power = Instance.new("IntValue")
	power.Name = "PC Power"
	power.Value = data.bestPower
	power.Parent = stats
	local cash = Instance.new("IntValue")
	cash.Name = "Cash"
	cash.Value = data.cash
	cash.Parent = stats
	stats.Parent = player
end

local function refreshLeaderstats(player: Player)
	local data = PlayerData.get(player)
	local stats = player:FindFirstChild("leaderstats")
	if not (data and stats) then
		return
	end
	(stats:FindFirstChild("PC Power") :: IntValue).Value = data.bestPower;
	(stats:FindFirstChild("Cash") :: IntValue).Value = math.floor(data.cash)
end

local function countTable(t): number
	local n = 0
	for _ in t do
		n += 1
	end
	return n
end

local function spawnPart(player: Player)
	local tier = Rarities.roll(rng)
	local partType = PartCatalog.rollType(rng)
	local mutant = rng:NextNumber() < Config.MUTATION_CHANCE
	local part = PartCatalog.generate(partType, tier, rng, mutant)
	part.id = PlayerData.newId(player)
	pending[player][part.id] = part
	UpdateEvent:FireClient(player, "spawn", part)
end

-- Players ----------------------------------------------------------------
local function onPlayerAdded(player: Player)
	pending[player] = {}
	tapTimes[player] = {}
	local data, loaded = PlayerData.load(player)
	if not player.Parent then
		return -- left while loading
	end
	setupLeaderstats(player, data)
	ready[player] = true
	if not loaded then
		UpdateEvent:FireClient(player, "notice", "Saving is OFF (DataStores unavailable). Progress will not be kept.")
	end
end

local function onPlayerRemoving(player: Player)
	ready[player] = nil
	pending[player] = nil
	tapTimes[player] = nil
	PlayerData.release(player)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

game:BindToClose(function()
	local threads = {}
	for _, player in PlayerData.allPlayers() do
		table.insert(threads, task.spawn(PlayerData.save, player))
	end
	task.wait(3)
end)

-- Spawn loop: every SPAWN_INTERVAL seconds each player gets a new part
task.spawn(function()
	while true do
		task.wait(Config.SPAWN_INTERVAL)
		for player in ready do
			if countTable(pending[player]) < Config.WAREHOUSE_MAX then
				spawnPart(player)
			end
		end
	end
end)

-- Autosave loop
task.spawn(function()
	while true do
		task.wait(Config.AUTOSAVE_INTERVAL)
		for _, player in PlayerData.allPlayers() do
			task.spawn(PlayerData.save, player)
		end
	end
end)

-- Actions ----------------------------------------------------------------
local Actions = {}

function Actions.getState(player: Player)
	local data = PlayerData.get(player)
	return {
		cash = data.cash,
		inventory = data.inventory,
		builds = data.builds,
		collection = data.collection,
		bestPower = data.bestPower,
		totalBuilt = data.totalBuilt,
		pending = pending[player],
		serverTime = now(),
	}
end

function Actions.collect(player: Player, id)
	local data = PlayerData.get(player)
	local part = pending[player][id]
	if not part then
		return { ok = false, reason = "That part is gone" }
	end
	if PlayerData.inventoryCount(player) >= Config.INVENTORY_LIMIT then
		return { ok = false, reason = "Inventory full! Sell some parts." }
	end
	pending[player][id] = nil
	data.inventory[id] = part
	return { ok = true, part = part }
end

local function sellIds(player: Player, ids: { string })
	local data = PlayerData.get(player)
	local removed, earned = {}, 0
	for _, id in ids do
		local part = data.inventory[id]
		if part then
			earned += Rarities.get(part.tier).sellValue * (if part.mutant then 3 else 1)
			data.inventory[id] = nil
			table.insert(removed, id)
		end
	end
	data.cash += earned
	refreshLeaderstats(player)
	return { ok = true, removed = removed, earned = earned, cash = data.cash }
end

function Actions.sell(player: Player, ids)
	if typeof(ids) ~= "table" then
		return { ok = false }
	end
	local clean = {}
	for _, id in ids do
		if typeof(id) == "string" then
			table.insert(clean, id)
		end
	end
	return sellIds(player, clean)
end

-- Sells every non-mutant part of exactly this tier
function Actions.sellTier(player: Player, tier)
	if typeof(tier) ~= "number" then
		return { ok = false }
	end
	local data = PlayerData.get(player)
	local ids = {}
	for id, part in data.inventory do
		if part.tier == tier and not part.mutant then
			table.insert(ids, id)
		end
	end
	return sellIds(player, ids)
end

-- idsByType: { [partType] = partId }
function Actions.startBuild(player: Player, slot, idsByType)
	local data = PlayerData.get(player)
	if typeof(slot) ~= "number" or data.builds[slot] == nil then
		return { ok = false, reason = "Bad slot" }
	end
	if data.builds[slot] then
		return { ok = false, reason = "That station is busy" }
	end
	if typeof(idsByType) ~= "table" then
		return { ok = false, reason = "No parts" }
	end

	local parts = {}
	for _, partType in PartCatalog.Types do
		local id = idsByType[partType]
		if id ~= nil then
			local part = data.inventory[id]
			if not part or part.type ~= partType then
				return { ok = false, reason = "You don't own that " .. partType }
			end
			parts[partType] = part
		end
	end

	local result = BuildRules.evaluate(parts)
	if not result.ok then
		return { ok = false, reason = result.errors[1] }
	end

	for _, part in parts do
		data.inventory[part.id] = nil
	end
	local t = now()
	local build = {
		parts = parts,
		startAt = t,
		endAt = t + result.assemblySeconds,
		power = result.power,
		tier = result.buildTier,
	}
	data.builds[slot] = build
	return { ok = true, slot = slot, build = build }
end

function Actions.claim(player: Player, slot)
	local data = PlayerData.get(player)
	local build = if typeof(slot) == "number" then data.builds[slot] else nil
	if not build then
		return { ok = false, reason = "Nothing to claim" }
	end
	if now() < build.endAt - 0.5 then
		return { ok = false, reason = "Still assembling", endAt = build.endAt }
	end

	local summary = {}
	for partType, part in build.parts do
		summary[partType] = { name = part.name, tier = part.tier, mutant = part.mutant }
	end
	data.totalBuilt += 1
	local pc = {
		name = "PC #" .. data.totalBuilt,
		power = build.power,
		tier = build.tier,
		parts = summary,
		builtAt = os.time(),
	}
	table.insert(data.collection, pc)
	-- Keep only the strongest PCs if the showcase is full
	if #data.collection > Config.COLLECTION_LIMIT then
		table.sort(data.collection, function(a, b)
			return a.power > b.power
		end)
		table.remove(data.collection)
	end

	local earned = math.floor(build.power * Config.CASH_PER_POWER)
	data.cash += earned
	local newRecord = build.power > data.bestPower
	data.bestPower = math.max(data.bestPower, build.power)
	data.builds[slot] = false
	refreshLeaderstats(player)

	return {
		ok = true,
		slot = slot,
		pc = pc,
		earned = earned,
		cash = data.cash,
		bestPower = data.bestPower,
		totalBuilt = data.totalBuilt,
		newRecord = newRecord,
	}
end

RequestFunction.OnServerInvoke = function(player: Player, action, ...)
	-- Wait for the profile on first join
	local waited = 0
	while not ready[player] and waited < 15 and player.Parent do
		waited += task.wait(0.2)
	end
	if not ready[player] then
		return { ok = false, reason = "Still loading" }
	end
	local handler = typeof(action) == "string" and Actions[action]
	if not handler then
		return { ok = false, reason = "Unknown action" }
	end
	local ok, result = pcall(handler, player, ...)
	if not ok then
		warn("[Server] Action", action, "failed:", result)
		return { ok = false, reason = "Server error" }
	end
	return result
end

-- Taps speed up an assembling PC (rate limited against autoclickers)
TapEvent.OnServerEvent:Connect(function(player: Player, slot)
	local data = PlayerData.get(player)
	if not (data and ready[player]) or typeof(slot) ~= "number" then
		return
	end
	local build = data.builds[slot]
	if not build then
		return
	end

	local t = now()
	local times = tapTimes[player]
	while #times > 0 and t - times[1] > 1 do
		table.remove(times, 1)
	end
	if #times >= Config.MAX_TAPS_PER_SECOND then
		return
	end
	table.insert(times, t)

	build.endAt = math.max(t, build.endAt - Config.TAP_SECONDS)
	UpdateEvent:FireClient(player, "buildTime", slot, build.endAt)
end)
