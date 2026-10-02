-- Pop-up windows: Inventory, Build editor, Showcase, Odds and the
-- "PC assembled" result reveal.
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
local PartModels = require(script.Parent.PartModels)

local Panels = {}

local root: Frame

local function sortedParts(filterType: string?)
	local list = {}
	for _, part in State.inventory do
		if not filterType or part.type == filterType then
			table.insert(list, part)
		end
	end
	table.sort(list, function(a, b)
		return PartCatalog.sortValue(a) > PartCatalog.sortValue(b)
	end)
	return list
end

local function scroller(parent: Instance, props: { [string]: any }): ScrollingFrame
	local defaults = {
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 6,
		ScrollBarImageColor3 = Theme.Stroke,
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		CanvasSize = UDim2.new(),
		ScrollingDirection = Enum.ScrollingDirection.Y,
		Parent = parent,
	}
	for k, v in props do
		defaults[k] = v
	end
	return UI.new("ScrollingFrame", defaults)
end

-- Inventory -----------------------------------------------------------------
local inventory
local inventoryFilter: string? = nil
local inventoryGrid: ScrollingFrame
local inventoryHeader: TextLabel

local function refreshInventory()
	if not (inventory and inventory.isOpen) then
		return
	end
	UI.clear(inventoryGrid)
	inventoryHeader.Text = string.format("%d / %d parts", State.inventoryCount(), Config.INVENTORY_LIMIT)
	for i, part in sortedParts(inventoryFilter) do
		local sell = Rarities.get(part.tier).sellValue * (if part.mutant then 3 else 1)
		local card = Cards.new(part, {
			size = Vector2.new(120, 140),
			footer = "Tap to sell $" .. sell,
			onClick = function()
				local result = State.request("sell", { part.id })
				if result.ok then
					for _, id in result.removed do
						State.inventory[id] = nil
					end
					State.cash = result.cash
					Effects.sound("Collect", 0.7)
					State.emit("inventory")
					State.emit("cash")
				end
			end,
		})
		card.LayoutOrder = i
		card.Parent = inventoryGrid
	end
end

local function buildInventory()
	inventory = UI.modal(root, "INVENTORY", Vector2.new(860, 580))
	local content = inventory.content

	inventoryHeader = UI.label({ Text = "", TextColor3 = Theme.SubText, Size = UDim2.new(0, 200, 0, 30), Parent = content })

	local sellRow = UI.new("Frame", {
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -40, 0, 0),
		Size = UDim2.fromOffset(500, 30),
		Parent = content,
	}, { UI.list(Enum.FillDirection.Horizontal, 6, Enum.HorizontalAlignment.Right) })
	for tier = 1, 3 do
		local r = Rarities.get(tier)
		UI.button("Sell all " .. r.name, r.color:Lerp(Theme.Panel, 0.4), function()
			local result = State.request("sellTier", tier)
			if result.ok and #result.removed > 0 then
				for _, id in result.removed do
					State.inventory[id] = nil
				end
				State.cash = result.cash
				Effects.toast(string.format("Sold %d %s parts for $%s", #result.removed, r.name, UI.formatNumber(result.earned)), Theme.Cash)
				State.emit("inventory")
				State.emit("cash")
			end
		end, { Size = UDim2.fromOffset(150, 30), TextSize = 13, LayoutOrder = tier, Parent = sellRow })
	end

	local tabs = UI.new("Frame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(0, 38),
		Size = UDim2.new(1, 0, 0, 30),
		Parent = content,
	}, { UI.list(Enum.FillDirection.Horizontal, 6) })
	local tabButtons = {}
	local function addTab(label: string, filter: string?, order: number)
		local b = UI.button(label, Theme.PanelLight, function()
			inventoryFilter = filter
			for f, btn in tabButtons do
				btn.BackgroundColor3 = if f == (filter or "All") then Theme.Accent2 else Theme.PanelLight
			end
			refreshInventory()
		end, { Size = UDim2.fromOffset(88, 30), TextSize = 13, LayoutOrder = order, Parent = tabs })
		tabButtons[filter or "All"] = b
	end
	addTab("All", nil, 0)
	tabButtons.All.BackgroundColor3 = Theme.Accent2
	for i, t in PartCatalog.Types do
		addTab(PartCatalog.TypeInfo[t].icon, t, i)
	end

	inventoryGrid = scroller(content, {
		Position = UDim2.fromOffset(0, 78),
		Size = UDim2.new(1, 0, 1, -78),
	})
	UI.grid(Vector2.new(120, 140), 8).Parent = inventoryGrid
	UI.padding(4).Parent = inventoryGrid

	inventory.onOpen = refreshInventory
	State.on("inventory", refreshInventory)
end

function Panels.openInventory()
	inventory.open()
end

-- Build editor --------------------------------------------------------------
local editor
local editorSlot = 1
local selected: { [string]: any } = {}
local activeType = "CPU"
local typeRows: { [string]: { button: TextButton, name: TextLabel } } = {}
local picker: ScrollingFrame
local pickerTitle: TextLabel
local previewHolder: Frame
local summaryPower: TextLabel
local summaryTime: TextLabel
local summaryList: ScrollingFrame
local startButton: TextButton

local refreshEditor

local function evaluation()
	return BuildRules.evaluate(selected)
end

local function addSummaryLine(text: string, color: Color3, order: number)
	UI.label({
		Text = text,
		TextColor3 = color,
		TextSize = 13,
		Font = Theme.Font,
		TextWrapped = true,
		TextTruncate = Enum.TextTruncate.None,
		AutomaticSize = Enum.AutomaticSize.Y,
		Size = UDim2.new(1, -8, 0, 16),
		LayoutOrder = order,
		Parent = summaryList,
	})
end

local function refreshPicker()
	UI.clear(picker)
	local info = PartCatalog.TypeInfo[activeType]
	pickerTitle.Text = "Choose " .. info.label .. (if info.required then "" else " (optional)")

	local order = 0
	if not info.required then
		order += 1
		UI.button("None", Theme.PanelLight, function()
			selected[activeType] = nil
			refreshEditor()
		end, { Size = UDim2.fromOffset(120, 140), LayoutOrder = order, Parent = picker })
	end

	local parts = sortedParts(activeType)
	if #parts == 0 then
		UI.label({
			Text = "You have no " .. info.label .. " yet. Collect some in the warehouse!",
			TextColor3 = Theme.SubText,
			TextWrapped = true,
			Size = UDim2.fromOffset(380, 60),
			LayoutOrder = 999,
			Parent = picker,
		})
	end
	-- Fit check: does this part add a compatibility error vs. leaving the slot empty?
	local without = table.clone(selected)
	without[activeType] = nil
	local allowedErrors = #BuildRules.evaluate(without).errors - (if info.required then 1 else 0)
	for _, part in parts do
		order += 1
		local trial = table.clone(without)
		trial[activeType] = part
		local fits = #BuildRules.evaluate(trial).errors <= allowedErrors
		local isSelected = selected[activeType] and selected[activeType].id == part.id
		local card = Cards.new(part, {
			size = Vector2.new(120, 140),
			footer = if isSelected then "SELECTED" elseif fits then PartCatalog.describe(part) else "Doesn't fit!",
			onClick = function()
				selected[activeType] = part
				Effects.sound("Snap")
				refreshEditor()
			end,
		})
		card.LayoutOrder = order
		if isSelected then
			card.BackgroundColor3 = Theme.Accent:Lerp(Theme.PanelLight, 0.6)
		elseif not fits then
			card.BackgroundTransparency = 0.5
		end
		card.Parent = picker
	end
end

function refreshEditor()
	for _, t in PartCatalog.Types do
		local row = typeRows[t]
		local part = selected[t]
		if part then
			local r = Rarities.get(part.tier)
			row.name.Text = part.name
			row.name.TextColor3 = r.color
		else
			row.name.Text = if PartCatalog.TypeInfo[t].required then "- required -" else "- optional -"
			row.name.TextColor3 = Theme.SubText
		end
		row.button.BackgroundColor3 = if t == activeType then Theme.Accent2:Lerp(Theme.PanelLight, 0.5) else Theme.PanelLight
	end

	-- 3D preview of the active part
	UI.clear(previewHolder)
	local activePart = selected[activeType]
	if activePart then
		local vp = PartModels.viewport(activePart, true)
		vp.Size = UDim2.fromScale(1, 1)
		vp.Parent = previewHolder
	end

	local result = evaluation()
	local tierColor = Rarities.get(result.buildTier).color
	summaryPower.Text = "PC POWER " .. UI.formatNumber(result.power)
	summaryPower.TextColor3 = tierColor
	summaryTime.Text = string.format("Assembly %ds  |  needs %dW", result.assemblySeconds, result.requiredWatts)

	UI.clear(summaryList)
	local order = 0
	for _, e in result.errors do
		order += 1
		addSummaryLine("X " .. e, Theme.Bad, order)
	end
	for _, w in result.warnings do
		order += 1
		addSummaryLine("! " .. w, Theme.Warn, order)
	end
	for _, b in result.bonuses do
		order += 1
		addSummaryLine("+ " .. b, Theme.Good, order)
	end
	if order == 0 then
		addSummaryLine("Pick parts to see your PC Power.", Theme.SubText, 1)
	end

	startButton.BackgroundColor3 = if result.ok then Theme.Good else Theme.PanelLight
	startButton.Text = if result.ok then "START BUILD" else "CAN'T BUILD YET"
	refreshPicker()
end

local function buildEditor()
	editor = UI.modal(root, "BUILD A PC", Vector2.new(980, 600))
	local content = editor.content

	-- Left: component list in real build order
	local left = UI.new("Frame", {
		BackgroundTransparency = 1,
		Size = UDim2.new(0, 290, 1, 0),
		Parent = content,
	}, { UI.list(Enum.FillDirection.Vertical, 6) })
	for i, t in PartCatalog.Types do
		local button = UI.button("", Theme.PanelLight, function()
			activeType = t
			refreshEditor()
		end, { Size = UDim2.new(1, 0, 0, 50), LayoutOrder = i, Parent = left })
		button.TextXAlignment = Enum.TextXAlignment.Left
		UI.label({
			Text = string.format("%d. %s", i, PartCatalog.TypeInfo[t].label),
			TextSize = 13,
			TextColor3 = Theme.SubText,
			Position = UDim2.fromOffset(12, 6),
			Size = UDim2.new(1, -24, 0, 16),
			Parent = button,
		})
		local name = UI.label({
			Text = "",
			TextSize = 14,
			Position = UDim2.fromOffset(12, 24),
			Size = UDim2.new(1, -24, 0, 18),
			Parent = button,
		})
		typeRows[t] = { button = button, name = name }
	end

	-- Middle: picker for the active component
	pickerTitle = UI.label({
		Text = "",
		TextSize = 16,
		Position = UDim2.fromOffset(306, 0),
		Size = UDim2.fromOffset(400, 22),
		Parent = content,
	})
	picker = scroller(content, {
		Position = UDim2.fromOffset(306, 28),
		Size = UDim2.new(0, 400, 1, -28),
	})
	UI.grid(Vector2.new(120, 140), 8).Parent = picker
	UI.padding(4).Parent = picker

	-- Right: preview + score summary + actions
	local right = UI.new("Frame", {
		BackgroundTransparency = 1,
		Position = UDim2.new(1, -230, 0, 0),
		Size = UDim2.new(0, 230, 1, 0),
		Parent = content,
	})
	previewHolder = UI.new("Frame", {
		BackgroundColor3 = Theme.Background,
		Size = UDim2.new(1, 0, 0, 130),
		Parent = right,
	}, { UI.corner(10) })
	summaryPower = UI.label({ Text = "", Font = Theme.FontHeavy, TextSize = 20, Position = UDim2.fromOffset(0, 138), Size = UDim2.new(1, 0, 0, 26), Parent = right })
	summaryTime = UI.label({ Text = "", Font = Theme.Font, TextSize = 12, TextColor3 = Theme.SubText, Position = UDim2.fromOffset(0, 164), Size = UDim2.new(1, 0, 0, 16), Parent = right })
	summaryList = scroller(right, {
		Position = UDim2.fromOffset(0, 186),
		Size = UDim2.new(1, 0, 1, -186 - 128),
	})
	UI.list(Enum.FillDirection.Vertical, 4).Parent = summaryList

	UI.button("AUTO-PICK BEST", Theme.Accent, function()
		selected = BuildRules.autoPick(State.inventory)
		refreshEditor()
	end, { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, -84), Size = UDim2.new(0.5, -4, 0, 38), TextSize = 13, Parent = right })
	UI.button("CLEAR", Theme.PanelLight, function()
		selected = {}
		refreshEditor()
	end, { AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, 0, 1, -84), Size = UDim2.new(0.5, -4, 0, 38), TextSize = 13, Parent = right })

	startButton = UI.button("START BUILD", Theme.Good, function()
		local result = evaluation()
		if not result.ok then
			Effects.toast(result.errors[1] or "Build is not valid", Theme.Bad)
			return
		end
		local ids = {}
		for t, part in selected do
			ids[t] = part.id
		end
		local response = State.request("startBuild", editorSlot, ids)
		if not response.ok then
			Effects.toast(response.reason or "Could not start build", Theme.Bad)
			return
		end
		for _, part in selected do
			State.inventory[part.id] = nil
		end
		State.builds[response.slot] = response.build
		selected = {}
		editor.close()
		Effects.sound("Snap")
		Effects.toast("Assembly started! Tap the station to speed it up.", Theme.Accent)
		State.emit("inventory")
		State.emit("builds")
	end, { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 0), Size = UDim2.new(1, 0, 0, 72), TextSize = 20, Parent = right })

	-- Parts may have been sold elsewhere; drop stale selections
	State.on("inventory", function()
		if not editor.isOpen then
			return
		end
		for t, part in selected do
			if not State.inventory[part.id] then
				selected[t] = nil
			end
		end
		refreshEditor()
	end)
end

function Panels.openBuild(slot: number)
	editorSlot = slot
	selected = {}
	activeType = "CPU"
	editor.open()
	refreshEditor()
end

-- Showcase ----------------------------------------------------------------
local showcase
local showcaseList: ScrollingFrame
local showcaseHeader: TextLabel

local function refreshShowcase()
	if not (showcase and showcase.isOpen) then
		return
	end
	UI.clear(showcaseList)
	local level = BuildRules.level(State.totalBuilt)
	showcaseHeader.Text = string.format("%d PCs built  |  Level %d %s  |  Best %s", State.totalBuilt, level, BuildRules.levelTitle(level), UI.formatNumber(State.bestPower))

	local pcs = table.clone(State.collection)
	table.sort(pcs, function(a, b)
		return a.power > b.power
	end)
	if #pcs == 0 then
		UI.label({ Text = "No PCs yet - build one at an assembly station!", TextColor3 = Theme.SubText, Size = UDim2.new(1, 0, 0, 30), Parent = showcaseList })
	end
	for i, pc in pcs do
		local r = Rarities.get(pc.tier)
		local row = UI.new("Frame", {
			Size = UDim2.new(1, -8, 0, 64),
			BackgroundColor3 = Theme.PanelLight,
			LayoutOrder = i,
			Parent = showcaseList,
		}, { UI.corner(10), UI.stroke(r.color, 2) })
		UI.label({ Text = string.format("#%d  %s", i, pc.name), TextSize = 15, Position = UDim2.fromOffset(14, 8), Size = UDim2.new(0.5, 0, 0, 20), Parent = row })
		local gpu = pc.parts.GPU and pc.parts.GPU.name or "?"
		local cpu = pc.parts.CPU and pc.parts.CPU.name or "?"
		UI.label({
			Text = gpu .. "  +  " .. cpu,
			Font = Theme.Font,
			TextSize = 12,
			TextColor3 = Theme.SubText,
			Position = UDim2.fromOffset(14, 34),
			Size = UDim2.new(0.65, 0, 0, 18),
			Parent = row,
		})
		UI.label({
			Text = UI.formatNumber(pc.power),
			Font = Theme.FontHeavy,
			TextSize = 26,
			TextColor3 = r.color,
			TextXAlignment = Enum.TextXAlignment.Right,
			Position = UDim2.new(0.5, 0, 0, 6),
			Size = UDim2.new(0.5, -16, 0, 30),
			Parent = row,
		})
		UI.label({
			Text = string.upper(r.name) .. " BUILD",
			TextSize = 11,
			TextColor3 = r.color,
			TextXAlignment = Enum.TextXAlignment.Right,
			Position = UDim2.new(0.5, 0, 0, 38),
			Size = UDim2.new(0.5, -16, 0, 16),
			Parent = row,
		})
	end
end

local function buildShowcase()
	showcase = UI.modal(root, "SHOWCASE", Vector2.new(720, 560))
	showcaseHeader = UI.label({ Text = "", TextColor3 = Theme.SubText, TextSize = 14, Size = UDim2.new(1, -40, 0, 24), Parent = showcase.content })
	showcaseList = scroller(showcase.content, { Position = UDim2.fromOffset(0, 32), Size = UDim2.new(1, 0, 1, -32) })
	UI.list(Enum.FillDirection.Vertical, 8).Parent = showcaseList
	showcase.onOpen = refreshShowcase
	State.on("collection", refreshShowcase)
end

function Panels.openShowcase()
	showcase.open()
end

-- Odds (required by Roblox for anything random that is ever sold) ----------
local odds

local function buildOdds()
	odds = UI.modal(root, "DROP ODDS", Vector2.new(460, 440))
	local list = UI.new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = odds.content }, { UI.list(Enum.FillDirection.Vertical, 6) })
	local total = Rarities.totalWeight()
	for _, r in Rarities.List do
		local row = UI.new("Frame", { Size = UDim2.new(1, 0, 0, 40), BackgroundColor3 = Theme.PanelLight, LayoutOrder = r.tier, Parent = list }, { UI.corner(8), UI.stroke(r.color, 2) })
		UI.label({ Text = r.name, TextColor3 = r.color, Position = UDim2.fromOffset(14, 0), Size = UDim2.new(0.6, 0, 1, 0), Parent = row })
		UI.label({
			Text = string.format("%.1f%%", r.weight / total * 100),
			TextXAlignment = Enum.TextXAlignment.Right,
			Position = UDim2.new(0.4, 0, 0, 0),
			Size = UDim2.new(0.6, -14, 1, 0),
			Parent = row,
		})
	end
	UI.label({
		Text = string.format("Any part has an extra %.1f%% chance to be a MUTANT (+%d%% stats).", Config.MUTATION_CHANCE * 100, math.floor((Config.MUTATION_MULT - 1) * 100 + 0.5)),
		Font = Theme.Font,
		TextSize = 13,
		TextColor3 = Theme.SubText,
		TextWrapped = true,
		Size = UDim2.new(1, 0, 0, 40),
		LayoutOrder = 100,
		Parent = list,
	})
end

function Panels.openOdds()
	odds.open()
end

-- Result reveal -------------------------------------------------------------
local result
local resultTitle: TextLabel
local resultPower: TextLabel
local resultInfo: TextLabel
local resultRecord: TextLabel

local function buildResult()
	result = UI.modal(root, "PC ASSEMBLED!", Vector2.new(520, 360))
	local c = result.content
	resultTitle = UI.label({ Text = "", TextSize = 18, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.new(1, 0, 0, 24), Parent = c })
	resultPower = UI.label({ Text = "", Font = Theme.FontHeavy, TextSize = 64, TextXAlignment = Enum.TextXAlignment.Center, Position = UDim2.fromOffset(0, 40), Size = UDim2.new(1, 0, 0, 80), Parent = c })
	UI.new("UIStroke", { Thickness = 3, Color = Color3.new(0, 0, 0), Parent = resultPower })
	resultRecord = UI.label({ Text = "NEW RECORD!", Font = Theme.FontHeavy, TextSize = 22, TextColor3 = Theme.Warn, TextXAlignment = Enum.TextXAlignment.Center, Position = UDim2.fromOffset(0, 124), Size = UDim2.new(1, 0, 0, 28), Parent = c })
	resultInfo = UI.label({ Text = "", TextSize = 16, TextColor3 = Theme.Cash, TextXAlignment = Enum.TextXAlignment.Center, Position = UDim2.fromOffset(0, 160), Size = UDim2.new(1, 0, 0, 24), Parent = c })
	UI.button("AWESOME!", Theme.Good, function()
		result.close()
	end, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, 0), Size = UDim2.fromOffset(220, 50), TextSize = 20, Parent = c })
end

function Panels.showResult(response)
	local pc = response.pc
	local r = Rarities.get(pc.tier)
	resultTitle.Text = string.format("%s  -  %s BUILD", pc.name, string.upper(r.name))
	resultTitle.TextColor3 = r.color
	resultPower.TextColor3 = r.color
	resultPower.TextSize = 40 + pc.tier * 6
	resultRecord.Visible = response.newRecord
	resultInfo.Text = "+$" .. UI.formatNumber(response.earned) .. " cash"
	result.open()

	-- count-up animation
	task.spawn(function()
		local duration = 0.6 + pc.tier * 0.2
		local start = os.clock()
		while os.clock() - start < duration and result.isOpen do
			local p = (os.clock() - start) / duration
			resultPower.Text = UI.formatNumber(pc.power * (1 - (1 - p) ^ 3))
			if pc.tier >= 5 then
				resultPower.TextColor3 = Rarities.rainbow(os.clock(), 1)
			end
			task.wait()
		end
		resultPower.Text = UI.formatNumber(pc.power) .. " POWER"
		Effects.rarityBurst(pc.tier)
		if response.newRecord then
			Effects.confetti(40, true)
		end
	end)
end

function Panels.init(screenRoot: Frame)
	root = screenRoot
	buildInventory()
	buildEditor()
	buildShowcase()
	buildOdds()
	buildResult()
end

return Panels
