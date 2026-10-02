-- Part card widget used in the warehouse, inventory and build screen.
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Rarities = require(ReplicatedStorage:WaitForChild("Shared").Rarities)
local PartCatalog = require(ReplicatedStorage:WaitForChild("Shared").PartCatalog)
local UI = require(script.Parent.UI)
local Theme = require(script.Parent.Theme)
local PartModels = require(script.Parent.PartModels)

local Cards = {}

local rainbowStrokes: { [UIStroke]: boolean } = setmetatable({}, { __mode = "k" }) :: any

RunService.RenderStepped:Connect(function()
	local c = Rarities.rainbow(os.clock(), 0.35)
	for stroke in rainbowStrokes do
		if stroke.Parent then
			stroke.Color = c
		end
	end
end)

export type CardOptions = {
	size: Vector2?,
	viewport: boolean?, -- show 3D model (costly; use for small lists)
	spin: boolean?,
	onClick: (() -> ())?,
	footer: string?, -- extra small line at the bottom
}

function Cards.new(part, opts: CardOptions?): TextButton
	local o: CardOptions = opts or {}
	local size = o.size or Vector2.new(128, 150)
	local r = Rarities.get(part.tier)

	local card = UI.new("TextButton", {
		Name = part.id ~= "" and part.id or "Card",
		Text = "",
		AutoButtonColor = false,
		Size = UDim2.fromOffset(size.X, size.Y),
		BackgroundColor3 = Theme.PanelLight,
		BorderSizePixel = 0,
		ZIndex = 1,
	}, {
		UI.corner(10),
		UI.new("UIGradient", {
			Rotation = 90,
			Color = ColorSequence.new(r.color:Lerp(Theme.PanelLight, 0.55), Theme.PanelLight),
		}),
	})
	local stroke = UI.stroke(r.color, if part.tier >= 4 then 3 else 2)
	stroke.Parent = card
	if part.tier >= 5 then
		rainbowStrokes[stroke] = true
	end

	local artHeight = size.Y - 62
	if o.viewport then
		local vp = PartModels.viewport(part, o.spin)
		vp.Size = UDim2.new(1, -8, 0, artHeight)
		vp.Position = UDim2.fromOffset(4, 4)
		vp.Parent = card
	else
		UI.label({
			Text = PartCatalog.TypeInfo[part.type].icon,
			Font = Theme.FontHeavy,
			TextSize = 26,
			TextColor3 = r.color,
			TextXAlignment = Enum.TextXAlignment.Center,
			Size = UDim2.new(1, 0, 0, artHeight),
			Position = UDim2.fromOffset(0, 2),
			Parent = card,
		})
	end

	UI.label({
		Text = part.name,
		TextSize = 12,
		TextWrapped = true,
		TextTruncate = Enum.TextTruncate.None,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextYAlignment = Enum.TextYAlignment.Top,
		Position = UDim2.fromOffset(4, artHeight + 2),
		Size = UDim2.new(1, -8, 0, 28),
		Parent = card,
	})
	UI.label({
		Text = string.upper(r.name),
		Font = Theme.FontHeavy,
		TextSize = 11,
		TextColor3 = r.color,
		TextXAlignment = Enum.TextXAlignment.Center,
		Position = UDim2.fromOffset(4, artHeight + 30),
		Size = UDim2.new(1, -8, 0, 14),
		Parent = card,
	})
	UI.label({
		Text = o.footer or PartCatalog.describe(part),
		Font = Theme.Font,
		TextSize = 10,
		TextColor3 = Theme.SubText,
		TextXAlignment = Enum.TextXAlignment.Center,
		Position = UDim2.fromOffset(4, artHeight + 44),
		Size = UDim2.new(1, -8, 0, 14),
		Parent = card,
	})

	if part.mutant then
		local badge = UI.label({
			Text = "MUTANT",
			Font = Theme.FontHeavy,
			TextSize = 10,
			TextColor3 = Color3.new(0, 0, 0),
			BackgroundTransparency = 0,
			BackgroundColor3 = Color3.fromRGB(140, 255, 60),
			TextXAlignment = Enum.TextXAlignment.Center,
			Position = UDim2.fromOffset(6, 6),
			Size = UDim2.fromOffset(52, 16),
			Parent = card,
		})
		UI.corner(6).Parent = badge
	end

	if o.onClick then
		local scale = UI.new("UIScale", { Parent = card })
		local onClick = o.onClick
		card.MouseEnter:Connect(function()
			UI.tween(scale, 0.12, { Scale = 1.06 })
		end)
		card.MouseLeave:Connect(function()
			UI.tween(scale, 0.12, { Scale = 1 })
		end)
		card.Activated:Connect(onClick)
	end

	return card
end

return Cards
