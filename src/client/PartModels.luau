-- Builds stylized 3D models of each part out of Roblox Parts and shows them
-- spinning inside ViewportFrames. Higher rarity = more fans, metal, RGB glow.
-- Swap these for real meshes later by returning a cloned Model instead.
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Rarities = require(ReplicatedStorage:WaitForChild("Shared").Rarities)

local PartModels = {}

local GOLD = Color3.fromRGB(235, 185, 60)
local SILVER = Color3.fromRGB(200, 204, 212)
local DARK = Color3.fromRGB(28, 30, 36)
local PCB_COLORS = {
	Color3.fromRGB(30, 110, 50), -- green
	Color3.fromRGB(30, 80, 160), -- blue
	Color3.fromRGB(25, 25, 30), -- black
	Color3.fromRGB(20, 20, 24),
	Color3.fromRGB(16, 16, 20),
	Color3.fromRGB(10, 10, 14),
}

-- Parts tagged with this attribute cycle through rainbow colors (Legendary+)
local CYCLE_ATTR = "RgbCycle"

local function add(model: Model, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material?, shape: Enum.PartType?, transparency: number?): BasePart
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CastShadow = false
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.Shape = shape or Enum.PartType.Block
	p.Transparency = transparency or 0
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	return p
end

-- Glowing accent: rainbow on Legendary/Mythic, rarity color otherwise
local function accent(model: Model, size: Vector3, cf: CFrame, tier: number, shape: Enum.PartType?): BasePart
	local p = add(model, size, cf, Rarities.get(tier).color, if tier >= 3 then Enum.Material.Neon else Enum.Material.SmoothPlastic, shape)
	if tier >= 5 then
		p:SetAttribute(CYCLE_ATTR, true)
	end
	return p
end

-- Fan facing +Z (toward the camera)
local function fanZ(model: Model, pos: Vector3, diameter: number, tier: number)
	local face = CFrame.new(pos) * CFrame.Angles(0, math.rad(90), 0)
	add(model, Vector3.new(0.1, diameter, diameter), face, Color3.fromRGB(45, 48, 56), Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
	-- blades suggested by a darker inner disc
	add(model, Vector3.new(0.12, diameter * 0.8, diameter * 0.8), face * CFrame.new(0.01, 0, 0), Color3.fromRGB(20, 20, 24), Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
	-- RGB ring on Rare+
	if tier >= 3 then
		accent(model, Vector3.new(0.13, diameter * 0.92, diameter * 0.92), face * CFrame.new(-0.01, 0, 0), tier, Enum.PartType.Cylinder)
		add(model, Vector3.new(0.14, diameter * 0.8, diameter * 0.8), face * CFrame.new(0.02, 0, 0), Color3.fromRGB(20, 20, 24), Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
	end
	-- hub
	accent(model, Vector3.new(0.16, diameter * 0.28, diameter * 0.28), face * CFrame.new(0.03, 0, 0), tier, Enum.PartType.Cylinder)
end

local Builders = {}

function Builders.GPU(model: Model, part)
	local tier = part.tier
	local metal = tier >= 4
	local shroud = if metal then SILVER else DARK
	local fans = part.fans or (if tier >= 3 then 3 else 2)
	local length = if fans == 3 then 6.4 else 5
	add(model, Vector3.new(length, 2.2, 1), CFrame.new(), shroud, if metal then Enum.Material.Metal else Enum.Material.SmoothPlastic)
	add(model, Vector3.new(length, 2.2, 0.1), CFrame.new(0, 0, -0.55), DARK, Enum.Material.Metal) -- backplate
	add(model, Vector3.new(0.12, 2.6, 1), CFrame.new(-length / 2 - 0.06, 0.1, 0), SILVER, Enum.Material.Metal) -- IO bracket
	add(model, Vector3.new(2.2, 0.25, 0.5), CFrame.new(-length / 2 + 1.6, -1.2, 0), GOLD, Enum.Material.Metal) -- PCIe contacts
	local spacing = length / fans
	for i = 1, fans do
		local x = -length / 2 + spacing * (i - 0.5)
		fanZ(model, Vector3.new(x, 0, 0.52), math.min(1.75, spacing - 0.15), tier)
	end
	if tier >= 3 then
		accent(model, Vector3.new(length - 0.4, 0.12, 0.06), CFrame.new(0, 1.04, 0.52), tier) -- RGB strip
	end
end

function Builders.CPU(model: Model, part)
	local tier = part.tier
	local tilt = CFrame.Angles(math.rad(55), 0, 0) -- face the camera
	add(model, Vector3.new(2.4, 0.15, 2.4), tilt, PCB_COLORS[math.min(tier, 3)])
	add(model, Vector3.new(2.2, 0.02, 2.2), tilt * CFrame.new(0, -0.09, 0), GOLD, Enum.Material.Metal) -- pins
	local lidColor = if tier >= 5 then Color3.fromRGB(230, 230, 240) else SILVER
	add(model, Vector3.new(1.8, 0.22, 1.8), tilt * CFrame.new(0, 0.18, 0), lidColor, if tier >= 4 then Enum.Material.Foil else Enum.Material.Metal)
	if tier >= 4 then
		add(model, Vector3.new(1.3, 0.24, 1.3), tilt * CFrame.new(0, 0.2, 0), lidColor, Enum.Material.Metal) -- stepped lid
	end
	accent(model, Vector3.new(1.2, 0.04, 0.16), tilt * CFrame.new(0, 0.33, 0.55), tier)
end

function Builders.RAM(model: Model, part)
	local tier = part.tier
	local sticks = part.sticks or 2
	for i = 1, sticks do
		local z = (i - (sticks + 1) / 2) * 0.45
		local base = CFrame.new(0, 0, z)
		add(model, Vector3.new(5, 1.3, 0.1), base, PCB_COLORS[1])
		add(model, Vector3.new(4.8, 0.15, 0.11), base * CFrame.new(0, -0.72, 0), GOLD, Enum.Material.Metal)
		if tier == 1 then
			for c = 1, 8 do
				add(model, Vector3.new(0.45, 0.55, 0.05), base * CFrame.new(-2.1 + (c - 1) * 0.6, 0.1, 0.07), Color3.fromRGB(15, 15, 18))
			end
		else
			local spreader = if tier >= 4 then Color3.fromRGB(40, 42, 50) else DARK
			add(model, Vector3.new(5, 1.4, 0.24), base * CFrame.new(0, 0.05, 0), spreader, Enum.Material.Metal)
			if tier >= 3 then
				accent(model, Vector3.new(5, 0.28, 0.22), base * CFrame.new(0, 0.86, 0), tier) -- light bar
			end
		end
	end
end

function Builders.SSD(model: Model, part)
	local tier = part.tier
	local tilt = CFrame.Angles(math.rad(50), 0, 0)
	add(model, Vector3.new(3.4, 0.08, 0.9), tilt, PCB_COLORS[math.min(tier, 3)])
	add(model, Vector3.new(0.25, 0.09, 0.8), tilt * CFrame.new(-1.6, 0, 0), GOLD, Enum.Material.Metal)
	add(model, Vector3.new(2.6, 0.02, 0.8), tilt * CFrame.new(0.2, 0.05, 0), Color3.fromRGB(15, 15, 18))
	if tier >= 4 then
		add(model, Vector3.new(2.8, 0.25, 0.85), tilt * CFrame.new(0.2, 0.17, 0), SILVER, Enum.Material.Metal) -- heatsink
	end
	accent(model, Vector3.new(2.4, 0.04, 0.12), tilt * CFrame.new(0.2, if tier >= 4 then 0.31 else 0.07, 0.3), tier)
end

function Builders.PSU(model: Model, part)
	local tier = part.tier
	add(model, Vector3.new(3, 2, 3), CFrame.new(), DARK, Enum.Material.Metal)
	-- fan on the front face
	fanZ(model, Vector3.new(0, 0, 1.52), 1.7, tier)
	-- efficiency badge (color = rarity)
	accent(model, Vector3.new(0.6, 0.35, 0.04), CFrame.new(1.05, -0.7, 1.53), math.max(tier, 3))
	-- cables
	for i = 1, 3 do
		add(model, Vector3.new(0.18, 0.18, 1), CFrame.new(-0.8 + i * 0.4, -0.6, -1.9), Color3.fromRGB(15, 15, 18))
	end
end

function Builders.Motherboard(model: Model, part)
	local tier = part.tier
	local form = part.form or 3
	local size = ({ Vector2.new(3, 3), Vector2.new(4, 4), Vector2.new(4, 5) })[form]
	add(model, Vector3.new(size.X, size.Y, 0.1), CFrame.new(), PCB_COLORS[tier])
	add(model, Vector3.new(1.1, 1.1, 0.12), CFrame.new(-0.3, size.Y / 2 - 1.2, 0.08), SILVER, Enum.Material.Metal) -- socket
	for i = 1, part.ramSlots or 4 do
		add(model, Vector3.new(0.12, 2, 0.14), CFrame.new(0.6 + i * 0.22, size.Y / 2 - 1.4, 0.08), Color3.fromRGB(60, 60, 70)) -- RAM slots
	end
	add(model, Vector3.new(size.X - 0.8, 0.16, 0.14), CFrame.new(0, -size.Y / 2 + 1.2, 0.08), Color3.fromRGB(60, 60, 70)) -- PCIe slot
	local armor = if tier >= 3 then Color3.fromRGB(70, 72, 80) else SILVER
	add(model, Vector3.new(1.6, 0.4, 0.3), CFrame.new(-0.4, size.Y / 2 - 0.3, 0.15), armor, Enum.Material.Metal) -- VRM heatsink
	add(model, Vector3.new(0.4, 1.6, 0.3), CFrame.new(-size.X / 2 + 0.3, size.Y / 2 - 1.2, 0.15), armor, Enum.Material.Metal)
	if tier >= 4 then
		accent(model, Vector3.new(0.08, size.Y - 0.4, 0.16), CFrame.new(size.X / 2 - 0.08, 0, 0.1), tier) -- RGB edge
	end
	if tier >= 6 then
		accent(model, Vector3.new(size.X - 0.6, 0.06, 0.12), CFrame.new(0, 0.2, 0.08), tier) -- glowing traces
		accent(model, Vector3.new(0.06, size.Y - 1, 0.12), CFrame.new(0.2, 0, 0.08), tier)
	end
end

function Builders.Cooler(model: Model, part)
	local tier = part.tier
	if tier <= 3 then
		-- Tower air cooler
		add(model, Vector3.new(2, 2.4, 1.2), CFrame.new(), SILVER, Enum.Material.Metal)
		for i = 1, 5 do
			add(model, Vector3.new(2.02, 0.05, 1.22), CFrame.new(0, -1.2 + i * 0.4, 0), Color3.fromRGB(150, 155, 165), Enum.Material.Metal)
		end
		fanZ(model, Vector3.new(0, 0, 0.66), 2, tier)
	else
		-- AIO liquid cooler: radiator + fans + pump
		local fans = if tier >= 5 then 3 else 2
		local width = fans * 1.9
		add(model, Vector3.new(width, 2, 0.5), CFrame.new(0, 0.6, 0), DARK, Enum.Material.Metal)
		for i = 1, fans do
			fanZ(model, Vector3.new(-width / 2 + 1.9 * (i - 0.5), 0.6, 0.3), 1.8, tier)
		end
		local pump = CFrame.new(0, -1.5, 0.5) * CFrame.Angles(0, math.rad(90), 0)
		add(model, Vector3.new(0.5, 1.3, 1.3), pump, DARK, Enum.Material.Metal, Enum.PartType.Cylinder)
		accent(model, Vector3.new(0.52, 1.05, 1.05), pump * CFrame.new(-0.02, 0, 0), tier, Enum.PartType.Cylinder)
		-- tubes (glowing coolant on Mythic custom loops)
		for _, x in { -0.35, 0.35 } do
			local tube = add(model, Vector3.new(0.18, 1.1, 0.18), CFrame.new(x, -0.7, 0.3), Color3.fromRGB(20, 20, 24))
			if tier >= 6 then
				tube.Material = Enum.Material.Neon
				tube.Transparency = 0.2
				tube:SetAttribute(CYCLE_ATTR, true)
			end
		end
	end
end

function Builders.Case(model: Model, part)
	local tier = part.tier
	local form = part.maxForm or 3
	local height = ({ 2.6, 3.4, 4.4 })[form]
	local depth = ({ 2.8, 3.6, 4.4 })[form]
	local w = 2.2
	local frame = if tier >= 4 then Color3.fromRGB(12, 12, 16) else Color3.fromRGB(40, 42, 50)
	add(model, Vector3.new(w, 0.2, depth), CFrame.new(0, -height / 2, 0), frame, Enum.Material.Metal) -- bottom
	add(model, Vector3.new(w, 0.2, depth), CFrame.new(0, height / 2, 0), frame, Enum.Material.Metal) -- top
	add(model, Vector3.new(0.1, height, depth), CFrame.new(-w / 2, 0, 0), frame, Enum.Material.Metal) -- back side
	add(model, Vector3.new(w, height, 0.1), CFrame.new(0, 0, -depth / 2), frame, Enum.Material.Metal) -- rear
	-- glass side + front (high tiers get the "aquarium" look)
	add(model, Vector3.new(0.05, height, depth), CFrame.new(w / 2, 0, 0), Color3.fromRGB(150, 180, 220), Enum.Material.Glass, nil, 0.75)
	add(model, Vector3.new(w, height, 0.05), CFrame.new(0, 0, depth / 2), Color3.fromRGB(150, 180, 220), Enum.Material.Glass, nil, if tier >= 3 then 0.8 else 0.1)
	-- RGB fans inside the front
	local fanCount = form
	for i = 1, fanCount do
		local y = -height / 2 + height * (i - 0.5) / fanCount
		fanZ(model, Vector3.new(0, y, depth / 2 - 0.2), math.min(1.3, height / fanCount - 0.15), math.max(tier, 2))
	end
	if tier >= 4 then
		accent(model, Vector3.new(w, 0.08, 0.08), CFrame.new(0, -height / 2 + 0.12, depth / 2), tier) -- underglow
	end
end

-- Builds a model centered on the origin.
function PartModels.build(part): Model
	local model = Instance.new("Model")
	model.Name = part.type
	local builder = Builders[part.type]
	if builder then
		builder(model, part)
	end
	if part.mutant then
		-- Mutants get a glitchy, slightly twisted look
		for _, p in model:GetDescendants() do
			if p:IsA("BasePart") and math.random() < 0.3 then
				p.Color = Color3.fromHSV(math.random(), 0.9, 1)
				p.CFrame *= CFrame.Angles(0, 0, math.rad(math.random(-8, 8)))
			end
		end
	end
	model.WorldPivot = CFrame.new()
	return model
end

-- Active spinning viewports
local spinners: { [ViewportFrame]: { model: Model, speed: number } } = {}

-- Returns a ViewportFrame showing the part. spin = rotate it slowly.
function PartModels.viewport(part, spin: boolean?): ViewportFrame
	local vp = Instance.new("ViewportFrame")
	vp.BackgroundTransparency = 1
	vp.Ambient = Color3.fromRGB(150, 150, 165)
	vp.LightColor = Color3.new(1, 1, 1)
	vp.LightDirection = Vector3.new(-1, -1, -1.5)

	local model = PartModels.build(part)
	model.Parent = vp

	local extents = model:GetExtentsSize()
	local d = math.max(extents.X, extents.Y, extents.Z)
	local camera = Instance.new("Camera")
	camera.FieldOfView = 40
	camera.CFrame = CFrame.lookAt(Vector3.new(d * 0.35, d * 0.35, d * 1.45), Vector3.zero)
	camera.Parent = vp
	vp.CurrentCamera = camera

	if spin then
		spinners[vp] = { model = model, speed = 0.6 + part.tier * 0.15 }
		vp.Destroying:Connect(function()
			spinners[vp] = nil
		end)
	end
	return vp
end

local angle = 0
RunService.RenderStepped:Connect(function(dt)
	angle += dt
	local rainbow = Rarities.rainbow(os.clock(), 0.3)
	for vp, info in spinners do
		if vp.Parent then
			info.model:PivotTo(CFrame.Angles(0, math.sin(angle * info.speed) * 0.9, 0))
			for _, p in info.model:GetChildren() do
				if p:IsA("BasePart") and p:GetAttribute(CYCLE_ATTR) then
					p.Color = rainbow
				end
			end
		end
	end
end)

return PartModels
