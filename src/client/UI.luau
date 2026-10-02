-- Small helpers for building UI in code.
local TweenService = game:GetService("TweenService")

local Theme = require(script.Parent.Theme)

local UI = {}

-- UI.new("Frame", { Size = ..., Parent = ... }, { children })
function UI.new(className: string, props: { [string]: any }?, children: { Instance }?): any
	local inst: any = Instance.new(className)
	local parent = nil
	local propList: { [string]: any } = props or {}
	for key, value in propList do
		if key == "Parent" then
			parent = value
		else
			inst[key] = value
		end
	end
	local childList: { Instance } = children or {}
	for _, child in childList do
		child.Parent = inst
	end
	if parent then
		inst.Parent = parent
	end
	return inst
end

function UI.corner(radius: number?): UICorner
	return UI.new("UICorner", { CornerRadius = UDim.new(0, radius or 10) })
end

function UI.stroke(color: Color3?, thickness: number?, transparency: number?): UIStroke
	return UI.new("UIStroke", {
		Color = color or Theme.Stroke,
		Thickness = thickness or 1.5,
		Transparency = transparency or 0,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

function UI.padding(px: number): UIPadding
	local u = UDim.new(0, px)
	return UI.new("UIPadding", { PaddingTop = u, PaddingBottom = u, PaddingLeft = u, PaddingRight = u })
end

function UI.list(direction: Enum.FillDirection?, padding: number?, hAlign: Enum.HorizontalAlignment?, vAlign: Enum.VerticalAlignment?): UIListLayout
	return UI.new("UIListLayout", {
		FillDirection = direction or Enum.FillDirection.Vertical,
		Padding = UDim.new(0, padding or 6),
		HorizontalAlignment = hAlign or Enum.HorizontalAlignment.Left,
		VerticalAlignment = vAlign or Enum.VerticalAlignment.Top,
		SortOrder = Enum.SortOrder.LayoutOrder,
	})
end

function UI.grid(cell: Vector2, padding: number?): UIGridLayout
	return UI.new("UIGridLayout", {
		CellSize = UDim2.fromOffset(cell.X, cell.Y),
		CellPadding = UDim2.fromOffset(padding or 8, padding or 8),
		SortOrder = Enum.SortOrder.LayoutOrder,
	})
end

function UI.label(props: { [string]: any }): TextLabel
	local defaults = {
		BackgroundTransparency = 1,
		Font = Theme.FontBold,
		TextColor3 = Theme.Text,
		TextSize = 16,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
		Size = UDim2.new(1, 0, 0, 20),
	}
	for k, v in props do
		defaults[k] = v
	end
	return UI.new("TextLabel", defaults)
end

function UI.panel(props: { [string]: any }): Frame
	local defaults = { BackgroundColor3 = Theme.Panel, BorderSizePixel = 0 }
	for k, v in props do
		defaults[k] = v
	end
	return UI.new("Frame", defaults, { UI.corner(12), UI.stroke(Theme.Stroke, 1.5, 0.3) })
end

function UI.tween(inst: Instance, seconds: number, goal: { [string]: any }, style: Enum.EasingStyle?, dir: Enum.EasingDirection?): Tween
	local t = TweenService:Create(inst, TweenInfo.new(seconds, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out), goal)
	t:Play()
	return t
end

-- A rounded button with hover + press animation.
function UI.button(text: string, color: Color3, onClick: () -> (), props: { [string]: any }?): TextButton
	local defaults = {
		Text = text,
		BackgroundColor3 = color,
		AutoButtonColor = false,
		Font = Theme.FontBold,
		TextColor3 = Theme.Text,
		TextSize = 16,
		Size = UDim2.fromOffset(140, 40),
		BorderSizePixel = 0,
	}
	local extra: { [string]: any } = props or {}
	for k, v in extra do
		defaults[k] = v
	end
	local button = UI.new("TextButton", defaults, {
		UI.corner(10),
		UI.new("UIGradient", {
			Rotation = 90,
			Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromRGB(190, 190, 200)),
		}),
	})
	local scale = UI.new("UIScale", { Parent = button })

	button.MouseEnter:Connect(function()
		UI.tween(scale, 0.12, { Scale = 1.05 })
	end)
	button.MouseLeave:Connect(function()
		UI.tween(scale, 0.12, { Scale = 1 })
	end)
	button.Activated:Connect(function()
		scale.Scale = 0.9
		UI.tween(scale, 0.25, { Scale = 1 }, Enum.EasingStyle.Back)
		onClick()
	end)
	return button
end

-- Modal window: dimmed background + panel + title + close button.
-- Only one modal is open at a time.
local openModal = nil

function UI.modal(parent: Instance, title: string, size: Vector2)
	local dim = UI.new("TextButton", {
		Name = title .. "Modal",
		Text = "",
		AutoButtonColor = false,
		BackgroundColor3 = Color3.new(0, 0, 0),
		BackgroundTransparency = 0.45,
		Size = UDim2.fromScale(1, 1),
		Visible = false,
		ZIndex = 50,
		Parent = parent,
	})
	local panel = UI.panel({
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.52),
		Size = UDim2.fromOffset(size.X, size.Y),
		ZIndex = 51,
		Parent = dim,
	})
	local scale = UI.new("UIScale", { Parent = panel })
	UI.label({
		Text = title,
		Font = Theme.FontHeavy,
		TextSize = 24,
		Position = UDim2.fromOffset(18, 12),
		Size = UDim2.new(1, -80, 0, 30),
		ZIndex = 52,
		Parent = panel,
	})
	local content = UI.new("Frame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(16, 52),
		Size = UDim2.new(1, -32, 1, -68),
		ZIndex = 52,
		Parent = panel,
	})

	local modal = { frame = dim, panel = panel, content = content, isOpen = false, onOpen = nil :: (() -> ())? }

	function modal.close()
		if not modal.isOpen then
			return
		end
		modal.isOpen = false
		if openModal == modal then
			openModal = nil
		end
		dim.Visible = false
	end

	function modal.open()
		if openModal and openModal ~= modal then
			openModal.close()
		end
		openModal = modal
		modal.isOpen = true
		dim.Visible = true
		scale.Scale = 0.85
		UI.tween(scale, 0.25, { Scale = 1 }, Enum.EasingStyle.Back)
		if modal.onOpen then
			modal.onOpen()
		end
	end

	UI.button("X", Theme.Bad, modal.close, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -12, 0, 12),
		Size = UDim2.fromOffset(34, 34),
		ZIndex = 53,
		Parent = panel,
	})

	return modal
end

-- Sets ZIndex on every GuiObject in a tree (modals must draw on top).
function UI.setZ(root: Instance, z: number)
	if root:IsA("GuiObject") then
		root.ZIndex = z
	end
	for _, d in root:GetDescendants() do
		if d:IsA("GuiObject") then
			d.ZIndex = z
		end
	end
end

function UI.clear(frame: Instance)
	for _, child in frame:GetChildren() do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
end

function UI.formatNumber(n: number): string
	n = math.floor(n)
	local s = tostring(math.abs(n))
	local out = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if out:sub(1, 1) == "," then
		out = out:sub(2)
	end
	return (if n < 0 then "-" else "") .. out
end

return UI
