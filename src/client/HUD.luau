-- Always-visible screen: top bar, warehouse (spawning parts) and the
-- assembly stations.
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared").Config)
local Rarities = require(ReplicatedStorage:WaitForChild("Shared").Rarities)
local PartCatalog = require(ReplicatedStorage:WaitForChild("Shared").PartCatalog)
local BuildRules = require(ReplicatedStorage:WaitForChild("Shared").BuildRules)
local UI = require(script.Parent.UI)
local Theme = require(script.Parent.Theme)
local Cards = require(script.Parent.Cards)
local Effects = require(script.Parent.Effects)
local State = require(script.Parent.State)

local HUD = {}

export type Handlers = {
	openInventory: () -> (),
	openShowcase: () -> (),
	openOdds: () -> (),
	openBuild: (slot: number) -> (),
	claim: (slot: number) -> (),
}

local root: Frame
local handlers: Handlers
local inventoryButton: TextButton

-- Top bar ------------------------------------------------------------------
local pills: { [string]: TextLabel } = {}

local function pill(parent: Instance, key: string, color: Color3, order: number)
	local frame = UI.panel({ Size = UDim2.fromOffset(150, 40), LayoutOrder = order, Parent = parent })
	pills[key] = UI.label({
		Text = "",
		TextColor3 = color,
		TextSize = 15,
		TextXAlignment = Enum.TextXAlignment.Center,
		Size = UDim2.fromScale(1, 1),
		Parent = frame,
	})
end

local function buildTopBar()
	local bar = UI.new("Frame", {
		Name = "TopBar",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 10),
		Size = UDim2.fromOffset(1000, 44),
		BackgroundTransparency = 1,
		Parent = root,
	}, { UI.list(Enum.FillDirection.Horizontal, 8, Enum.HorizontalAlignment.Center) })

	pill(bar, "cash", Theme.Cash, 1)
	pill(bar, "inventory", Theme.Text, 2)
	pill(bar, "power", Theme.Accent, 3)
	pill(bar, "level", Theme.Warn, 4)

	inventoryButton = UI.button("INVENTORY", Theme.Accent2, function()
		handlers.openInventory()
	end, { Size = UDim2.fromOffset(120, 40), LayoutOrder = 5, Parent = bar })
	UI.button("SHOWCASE", Color3.fromRGB(40, 120, 200), function()
		handlers.openShowcase()
	end, { Size = UDim2.fromOffset(110, 40), LayoutOrder = 6, Parent = bar })
	UI.button("ODDS", Theme.PanelLight, function()
		handlers.openOdds()
	end, { Size = UDim2.fromOffset(70, 40), LayoutOrder = 7, Parent = bar })
end

function HUD.refreshTopBar()
	pills.cash.Text = "$ " .. UI.formatNumber(State.cash)
	local count = State.inventoryCount()
	pills.inventory.Text = string.format("Parts %d/%d", count, Config.INVENTORY_LIMIT)
	pills.inventory.TextColor3 = if count >= Config.INVENTORY_LIMIT then Theme.Bad else Theme.Text
	pills.power.Text = "Best " .. UI.formatNumber(State.bestPower)
	local level = BuildRules.level(State.totalBuilt)
	pills.level.Text = string.format("Lv %d %s", level, BuildRules.levelTitle(level))
	pills.level.TextSize = 13
end

-- Warehouse ----------------------------------------------------------------
local warehouseGrid: Frame
local emptyLabel: TextLabel
local warehouseCards: { [string]: { holder: Frame, card: TextButton } } = {}
local collecting: { [string]: boolean } = {}

local function updateEmpty()
	emptyLabel.Visible = next(warehouseCards) == nil
end

local function removeCard(id: string)
	local entry = warehouseCards[id]
	if not entry then
		return
	end
	warehouseCards[id] = nil
	local scale = entry.holder:FindFirstChildOfClass("UIScale")
	if scale then
		UI.tween(scale, 0.15, { Scale = 0 })
	end
	task.delay(0.16, function()
		entry.holder:Destroy()
	end)
	updateEmpty()
end

local function collect(id: string)
	if collecting[id] then
		return
	end
	local entry = warehouseCards[id]
	local part = State.pending[id]
	if not (entry and part) then
		return
	end
	collecting[id] = true
	local result = State.request("collect", id)
	collecting[id] = nil
	if not result.ok then
		Effects.toast(result.reason or "Could not collect", Theme.Bad)
		if result.reason == "That part is gone" then
			State.pending[id] = nil
			removeCard(id)
		end
		return
	end

	local r = Rarities.get(part.tier)
	State.pending[id] = nil
	State.inventory[id] = result.part
	State.emit("inventory")

	local at = entry.card.AbsolutePosition + entry.card.AbsoluteSize / 2
	Effects.fly(entry.card, inventoryButton, r.color)
	Effects.floatText("+1 " .. PartCatalog.TypeInfo[part.type].icon, r.color, at)
	Effects.rarityBurst(part.tier, at)
	removeCard(id)
end

function HUD.addPending(part)
	if warehouseCards[part.id] then
		return
	end
	local holder = UI.new("Frame", {
		Name = part.id,
		BackgroundTransparency = 1,
		LayoutOrder = tonumber(string.sub(part.id, 2)) or 0,
		Parent = warehouseGrid,
	})
	local scale = UI.new("UIScale", { Scale = 0, Parent = holder })
	if part.tier >= 4 then
		Effects.beam(holder, part.tier)
	end
	local card = Cards.new(part, {
		viewport = true,
		spin = true,
		onClick = function()
			collect(part.id)
		end,
	})
	card.Size = UDim2.fromScale(1, 1)
	card.Parent = holder
	warehouseCards[part.id] = { holder = holder, card = card }
	updateEmpty()

	UI.tween(scale, 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
	if part.tier >= 4 then
		local r = Rarities.get(part.tier)
		Effects.raritySound(part.tier)
		task.defer(function()
			local at = holder.AbsolutePosition + holder.AbsoluteSize / 2
			Effects.floatText(string.upper(r.name) .. " DROP!", r.color, at - Vector2.new(0, 60), 28)
		end)
	end
end

local function buildWarehouse()
	local panel = UI.panel({
		Name = "Warehouse",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -16),
		Size = UDim2.fromOffset(580, 372),
		Parent = root,
	})
	UI.label({
		Text = "WAREHOUSE",
		Font = Theme.FontHeavy,
		TextSize = 20,
		TextColor3 = Theme.Accent,
		Position = UDim2.fromOffset(16, 10),
		Size = UDim2.new(1, -32, 0, 24),
		Parent = panel,
	})
	UI.label({
		Text = string.format("New part every %ds - tap to collect", Config.SPAWN_INTERVAL),
		Font = Theme.Font,
		TextSize = 13,
		TextColor3 = Theme.SubText,
		TextXAlignment = Enum.TextXAlignment.Right,
		Position = UDim2.fromOffset(16, 12),
		Size = UDim2.new(1, -32, 0, 24),
		Parent = panel,
	})
	warehouseGrid = UI.new("Frame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(16, 44),
		Size = UDim2.new(1, -32, 1, -56),
		Parent = panel,
	}, { UI.grid(Vector2.new(128, 150), 8) })
	emptyLabel = UI.label({
		Text = "Waiting for parts...",
		Font = Theme.Font,
		TextColor3 = Theme.SubText,
		TextXAlignment = Enum.TextXAlignment.Center,
		Position = UDim2.fromOffset(0, 140),
		Size = UDim2.new(1, 0, 0, 24),
		Parent = panel,
	})
end

-- Assembly stations --------------------------------------------------------
type Station = {
	title: TextLabel,
	status: TextLabel,
	barBack: Frame,
	barFill: Frame,
	timeLabel: TextLabel,
	button: TextButton,
	mode: string,
}
local stations: { Station } = {}

local function formatTime(seconds: number): string
	seconds = math.max(0, math.ceil(seconds))
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

local function setMode(slot: number)
	local s = stations[slot]
	local build = State.builds[slot]
	local mode = if not build then "empty" elseif State.now() >= build.endAt then "done" else "building"
	s.mode = mode

	if mode == "empty" then
		s.title.Text = "STATION " .. slot
		s.status.Text = "Empty - start a new PC"
		s.status.TextColor3 = Theme.SubText
		s.barBack.Visible = false
		s.timeLabel.Text = ""
		s.button.Text = "NEW BUILD"
		s.button.BackgroundColor3 = Theme.Accent
	elseif mode == "building" then
		local r = Rarities.get(build.tier)
		s.title.Text = "STATION " .. slot .. " - ASSEMBLING"
		s.status.Text = "PC Power " .. UI.formatNumber(build.power)
		s.status.TextColor3 = r.color
		s.barBack.Visible = true
		s.barFill.BackgroundColor3 = r.color
		s.button.Text = "TAP TO SPEED UP!"
		s.button.BackgroundColor3 = Theme.Accent2
	else
		local r = Rarities.get(build.tier)
		s.title.Text = "STATION " .. slot .. " - READY!"
		s.status.Text = "PC Power " .. UI.formatNumber(build.power)
		s.status.TextColor3 = r.color
		s.barBack.Visible = true
		s.barFill.Size = UDim2.fromScale(1, 1)
		s.barFill.BackgroundColor3 = Theme.Good
		s.timeLabel.Text = "DONE"
		s.button.Text = "CLAIM PC"
		s.button.BackgroundColor3 = Theme.Good
	end
end

function HUD.refreshStations()
	for slot = 1, #stations do
		setMode(slot)
	end
end

local tapTimes: { number } = {}

local function onStationButton(slot: number)
	local s = stations[slot]
	local build = State.builds[slot]
	if s.mode == "empty" then
		handlers.openBuild(slot)
	elseif s.mode == "building" and build then
		-- Same rate limit as the server so our countdown prediction stays right
		local t = os.clock()
		while #tapTimes > 0 and t - tapTimes[1] > 1 do
			table.remove(tapTimes, 1)
		end
		if #tapTimes >= Config.MAX_TAPS_PER_SECOND then
			return
		end
		table.insert(tapTimes, t)
		State.tap(slot)
		-- predict locally; the server sends the real end time back
		build.endAt = math.max(State.now(), build.endAt - Config.TAP_SECONDS)
		local at = s.button.AbsolutePosition + s.button.AbsoluteSize / 2
		Effects.floatText("-" .. Config.TAP_SECONDS .. "s", Theme.Accent, at + Vector2.new(math.random(-40, 40), -10), 22)
		Effects.sound("Click", 0.9 + math.random() * 0.3)
		Effects.shake(1.5)
	elseif s.mode == "done" then
		handlers.claim(slot)
	end
end

local function buildStations()
	local panel = UI.panel({
		Name = "Stations",
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -16, 1, -16),
		Size = UDim2.fromOffset(380, 44 + Config.BUILD_SLOTS * 118),
		Parent = root,
	})
	UI.label({
		Text = "ASSEMBLY STATIONS",
		Font = Theme.FontHeavy,
		TextSize = 20,
		TextColor3 = Theme.Accent2,
		Position = UDim2.fromOffset(16, 10),
		Size = UDim2.new(1, -32, 0, 24),
		Parent = panel,
	})
	local list = UI.new("Frame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(12, 42),
		Size = UDim2.new(1, -24, 1, -50),
		Parent = panel,
	}, { UI.list(Enum.FillDirection.Vertical, 8) })

	for slot = 1, Config.BUILD_SLOTS do
		local box = UI.new("Frame", {
			Size = UDim2.new(1, 0, 0, 110),
			BackgroundColor3 = Theme.PanelLight,
			LayoutOrder = slot,
			Parent = list,
		}, { UI.corner(10) })
		local title = UI.label({ Text = "", TextSize = 14, Position = UDim2.fromOffset(12, 8), Size = UDim2.new(1, -24, 0, 18), Parent = box })
		local status = UI.label({ Text = "", TextSize = 16, Font = Theme.FontHeavy, Position = UDim2.fromOffset(12, 28), Size = UDim2.new(1, -24, 0, 20), Parent = box })
		local barBack = UI.new("Frame", {
			BackgroundColor3 = Theme.Background,
			Position = UDim2.fromOffset(12, 54),
			Size = UDim2.new(1, -84, 0, 10),
			Parent = box,
		}, { UI.corner(5) })
		local barFill = UI.new("Frame", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = Theme.Accent, Parent = barBack }, { UI.corner(5) })
		local timeLabel = UI.label({
			Text = "",
			TextSize = 14,
			TextXAlignment = Enum.TextXAlignment.Right,
			Position = UDim2.new(1, -66, 0, 49),
			Size = UDim2.fromOffset(54, 20),
			Parent = box,
		})
		local button = UI.button("", Theme.Accent, function()
			onStationButton(slot)
		end, { Position = UDim2.fromOffset(12, 70), Size = UDim2.new(1, -24, 0, 32), Parent = box })

		stations[slot] = { title = title, status = status, barBack = barBack, barFill = barFill, timeLabel = timeLabel, button = button, mode = "" }
	end

	-- Progress bars + switching to "ready" when the timer runs out
	RunService.Heartbeat:Connect(function()
		local t = State.now()
		for slot, s in stations do
			local build = State.builds[slot]
			if s.mode == "building" and build then
				if t >= build.endAt then
					setMode(slot)
					Effects.sound("BuildComplete")
					Effects.toast("Station " .. slot .. ": PC ready to claim!", Theme.Good)
				else
					local total = math.max(build.endAt - build.startAt, 0.01)
					local done = math.clamp((t - build.startAt) / total, 0, 1)
					s.barFill.Size = UDim2.fromScale(done, 1)
					s.timeLabel.Text = formatTime(build.endAt - t)
				end
			end
		end
	end)
end

function HUD.init(screenRoot: Frame, h: Handlers)
	root = screenRoot
	handlers = h
	buildTopBar()
	buildWarehouse()
	buildStations()
end

function HUD.getInventoryButton(): GuiObject
	return inventoryButton
end

return HUD
