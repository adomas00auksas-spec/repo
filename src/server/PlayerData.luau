-- Loads, holds and saves each player's profile in a DataStore.
-- If DataStores are unavailable (e.g. Studio without API access) the game
-- still works, it just doesn't save.
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local PlayerData = {}

local profiles: { [Player]: any } = {}
local canSave: { [Player]: boolean } = {}

local store: DataStore? = nil
do
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(Config.DATASTORE_NAME)
	end)
	if ok then
		store = result
	else
		warn("[PlayerData] DataStore unavailable, progress will not save:", result)
	end
end

local function newProfile()
	local builds = {}
	for i = 1, Config.BUILD_SLOTS do
		builds[i] = false
	end
	return {
		version = 1,
		cash = Config.STARTING_CASH,
		nextId = 1,
		inventory = {}, -- [id] = Part
		builds = builds, -- [slot] = Build | false
		collection = {}, -- array of built PC records
		bestPower = 0,
		totalBuilt = 0,
	}
end

-- Fill in fields added in later versions so old saves keep working.
local function reconcile(data)
	local template = newProfile()
	for key, value in template do
		if data[key] == nil then
			data[key] = value
		end
	end
	for i = 1, Config.BUILD_SLOTS do
		if data.builds[i] == nil then
			data.builds[i] = false
		end
	end
	return data
end

local function key(player: Player): string
	return "player_" .. player.UserId
end

function PlayerData.load(player: Player)
	local data = nil
	local loaded = false
	if store then
		for attempt = 1, 3 do
			local ok, result = pcall(function()
				return store:GetAsync(key(player))
			end)
			if ok then
				data = result
				loaded = true
				break
			end
			warn(string.format("[PlayerData] Load attempt %d failed for %s: %s", attempt, player.Name, tostring(result)))
			task.wait(attempt)
		end
	end

	profiles[player] = reconcile(data or newProfile())
	-- Never save over real data we failed to read.
	canSave[player] = loaded
	return profiles[player], loaded
end

function PlayerData.get(player: Player)
	return profiles[player]
end

function PlayerData.save(player: Player)
	local data = profiles[player]
	if not (store and data and canSave[player]) then
		return
	end
	local ok, err = pcall(function()
		store:UpdateAsync(key(player), function()
			return data
		end)
	end)
	if not ok then
		warn("[PlayerData] Save failed for", player.Name, err)
	end
end

function PlayerData.release(player: Player)
	PlayerData.save(player)
	profiles[player] = nil
	canSave[player] = nil
end

function PlayerData.allPlayers(): { Player }
	local list = {}
	for player in profiles do
		table.insert(list, player)
	end
	return list
end

function PlayerData.newId(player: Player): string
	local data = profiles[player]
	local id = "p" .. data.nextId
	data.nextId += 1
	return id
end

function PlayerData.inventoryCount(player: Player): number
	local n = 0
	for _ in profiles[player].inventory do
		n += 1
	end
	return n
end

return PlayerData
