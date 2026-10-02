-- Client entry point: builds the UI, loads state from the server and
-- listens for pushes (new parts, tap corrections, notices).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui") :: PlayerGui

local UI = require(script.Parent.UI)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local Effects = require(script.Parent.Effects)
local HUD = require(script.Parent.HUD)
local Panels = require(script.Parent.Panels)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local UpdateEvent = Remotes:WaitForChild("Update") :: RemoteEvent

-- Hide the default backpack; this game is UI-driven
pcall(function()
	StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false)
end)

-- Screen + scaling (designed at 1440x820, scales down to phones)
local screen = UI.new("ScreenGui", {
	Name = "PCBuilder",
	IgnoreGuiInset = true,
	ResetOnSpawn = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	Parent = playerGui,
})
local root = UI.new("Frame", {
	Name = "Root",
	BackgroundTransparency = 1,
	Size = UDim2.fromScale(1, 1),
	Parent = screen,
})
local scale = UI.new("UIScale", { Parent = root })

local function rescale()
	local size = screen.AbsoluteSize
	if size.Y <= 0 then
		return
	end
	local s = math.clamp(math.min(size.Y / 820, size.X / 1440), 0.45, 1.25)
	scale.Scale = s
	-- UIScale shrinks around the top-left, so stretch the root to keep
	-- right/bottom anchored panels at the screen edges.
	root.Size = UDim2.fromOffset(size.X / s, size.Y / s)
end
screen:GetPropertyChangedSignal("AbsoluteSize"):Connect(rescale)
rescale()

Effects.init(playerGui, root)

local function claim(slot: number)
	local response = State.request("claim", slot)
	if not response.ok then
		-- Our timer ran ahead of the server's; resync and keep assembling
		if response.endAt and State.builds[slot] then
			State.builds[slot].endAt = response.endAt
			HUD.refreshStations()
		end
		Effects.toast(response.reason or "Could not claim", Theme.Bad)
		return
	end
	State.builds[slot] = false
	State.cash = response.cash
	State.bestPower = response.bestPower
	State.totalBuilt = response.totalBuilt
	table.insert(State.collection, response.pc)
	State.emit("builds")
	State.emit("cash")
	State.emit("collection")
	Panels.showResult(response)
end

HUD.init(root, {
	openInventory = Panels.openInventory,
	openShowcase = Panels.openShowcase,
	openOdds = Panels.openOdds,
	openBuild = Panels.openBuild,
	claim = claim,
})
Panels.init(root)

State.on("inventory", HUD.refreshTopBar)
State.on("cash", HUD.refreshTopBar)
State.on("collection", HUD.refreshTopBar)
State.on("builds", HUD.refreshStations)

-- Server pushes
UpdateEvent.OnClientEvent:Connect(function(kind: string, a, b)
	if kind == "spawn" then
		State.pending[a.id] = a
		HUD.addPending(a)
	elseif kind == "buildTime" then
		local build = State.builds[a]
		if build then
			build.endAt = b
		end
	elseif kind == "notice" then
		Effects.toast(a, Theme.Warn)
	end
end)

-- Initial state
local function load()
	for attempt = 1, 5 do
		local data = State.request("getState")
		if data and data.inventory then
			State.cash = data.cash
			State.inventory = data.inventory
			State.builds = data.builds
			State.collection = data.collection
			State.bestPower = data.bestPower
			State.totalBuilt = data.totalBuilt
			for id, part in data.pending do
				State.pending[id] = part
				HUD.addPending(part)
			end
			HUD.refreshTopBar()
			HUD.refreshStations()
			return
		end
		task.wait(attempt)
	end
	Effects.toast("Could not load your data. Try rejoining.", Theme.Bad)
end
load()
