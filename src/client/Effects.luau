-- Juice: sounds, screen tint, shake, floating text, flying parts, confetti,
-- loot beams and toasts. Lives on its own ScreenGui above everything.
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared").Config)
local Rarities = require(ReplicatedStorage:WaitForChild("Shared").Rarities)
local UI = require(script.Parent.UI)
local Theme = require(script.Parent.Theme)

local Effects = {}

local layer: ScreenGui
local tintFrame: Frame
local toastList: Frame
local shakeTarget: GuiObject? = nil
local shakeBase = UDim2.new()
local shakeStrength, shakeTime = 0, 0

function Effects.init(playerGui: PlayerGui, shakeRoot: GuiObject)
	layer = UI.new("ScreenGui", {
		Name = "Effects",
		IgnoreGuiInset = true,
		ResetOnSpawn = false,
		DisplayOrder = 20,
		Parent = playerGui,
	})
	tintFrame = UI.new("Frame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		Parent = layer,
	})
	toastList = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 80),
		Size = UDim2.fromOffset(520, 300),
		BackgroundTransparency = 1,
		Parent = layer,
	}, { UI.list(Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Center) })

	shakeTarget = shakeRoot
	shakeBase = shakeRoot.Position
	RunService.RenderStepped:Connect(function(dt)
		if shakeTime > 0 and shakeTarget then
			shakeTime -= dt
			local s = shakeStrength * math.max(shakeTime, 0) / 0.35
			shakeTarget.Position = shakeBase + UDim2.fromOffset(math.random(-100, 100) / 100 * s, math.random(-100, 100) / 100 * s)
			if shakeTime <= 0 then
				shakeTarget.Position = shakeBase
			end
		end
	end)
end

local soundCache: { [string]: Sound } = {}
function Effects.sound(name: string, pitch: number?)
	local id = Config.Sounds[name]
	if not id or id == "" then
		return
	end
	local sound = soundCache[name]
	if not sound then
		sound = Instance.new("Sound")
		sound.SoundId = id
		sound.Volume = 0.6
		sound.Parent = SoundService
		soundCache[name] = sound
	end
	sound.PlaybackSpeed = pitch or 1
	SoundService:PlayLocalSound(sound)
end

-- Plays the right sound for a rarity tier
function Effects.raritySound(tier: number)
	if tier >= 6 then
		Effects.sound("Mythic")
	elseif tier >= 5 then
		Effects.sound("Legendary")
	elseif tier >= 4 then
		Effects.sound("Epic")
	elseif tier >= 3 then
		Effects.sound("Rare")
	else
		Effects.sound("Collect", 0.95 + math.random() * 0.1)
	end
end

function Effects.tint(color: Color3, strength: number?)
	tintFrame.BackgroundColor3 = color
	tintFrame.BackgroundTransparency = 1 - (strength or 0.25)
	UI.tween(tintFrame, 0.5, { BackgroundTransparency = 1 })
end

function Effects.shake(strength: number)
	if strength <= 0 or not shakeTarget then
		return
	end
	if shakeTime <= 0 then
		shakeBase = shakeTarget.Position
	end
	shakeStrength = math.max(shakeStrength * (if shakeTime > 0 then 1 else 0), strength)
	shakeTime = 0.35
end

-- Floating "+1" style text at a screen position (pixels)
function Effects.floatText(text: string, color: Color3, at: Vector2, size: number?)
	local label = UI.label({
		Text = text,
		TextColor3 = color,
		Font = Theme.FontHeavy,
		TextSize = size or 26,
		TextXAlignment = Enum.TextXAlignment.Center,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(at.X, at.Y),
		Size = UDim2.fromOffset(300, 40),
		Parent = layer,
	})
	UI.new("UIStroke", { Thickness = 2, Color = Color3.new(0, 0, 0), Parent = label })
	UI.tween(label, 0.9, { Position = UDim2.fromOffset(at.X, at.Y - 70), TextTransparency = 1 })
	task.delay(0.95, function()
		label:Destroy()
	end)
end

local function center(gui: GuiObject): Vector2
	return gui.AbsolutePosition + gui.AbsoluteSize / 2
end

-- A glowing chip flies from one GUI to another (part -> inventory)
function Effects.fly(from: GuiObject, to: GuiObject, color: Color3)
	local a, b = center(from), center(to)
	local chip = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(a.X, a.Y),
		Size = UDim2.fromOffset(46, 46),
		BackgroundColor3 = color,
		Rotation = 0,
		Parent = layer,
	}, { UI.corner(10), UI.stroke(Color3.new(1, 1, 1), 2) })
	UI.tween(chip, 0.45, { Position = UDim2.fromOffset(b.X, b.Y), Size = UDim2.fromOffset(16, 16), Rotation = 200 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
	task.delay(0.45, function()
		chip:Destroy()
		-- particle burst at destination
		for _ = 1, 8 do
			local dot = UI.new("Frame", {
				AnchorPoint = Vector2.new(0.5, 0.5),
				Position = UDim2.fromOffset(b.X, b.Y),
				Size = UDim2.fromOffset(8, 8),
				BackgroundColor3 = color,
				Parent = layer,
			}, { UI.corner(4) })
			local dir = Vector2.new(math.random(-100, 100), math.random(-100, 100)).Unit * math.random(30, 60)
			UI.tween(dot, 0.4, { Position = UDim2.fromOffset(b.X + dir.X, b.Y + dir.Y), BackgroundTransparency = 1 })
			task.delay(0.45, function()
				dot:Destroy()
			end)
		end
	end)
end

function Effects.confetti(count: number, rainbow: boolean?, color: Color3?)
	local screen = layer.AbsoluteSize
	for _ = 1, count do
		local c = if rainbow then Color3.fromHSV(math.random(), 0.8, 1) else (color or Theme.Accent)
		local x = math.random(0, math.floor(screen.X))
		local piece = UI.new("Frame", {
			Position = UDim2.fromOffset(x, -20),
			Size = UDim2.fromOffset(math.random(6, 12), math.random(10, 18)),
			BackgroundColor3 = c,
			Rotation = math.random(0, 360),
			BorderSizePixel = 0,
			Parent = layer,
		})
		local time = 1.2 + math.random() * 1.2
		UI.tween(piece, time, {
			Position = UDim2.fromOffset(x + math.random(-120, 120), screen.Y + 30),
			Rotation = math.random(-720, 720),
		}, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		task.delay(time, function()
			piece:Destroy()
		end)
	end
end

-- Diablo-style vertical loot beam behind a card. Stops when the card is destroyed.
function Effects.beam(card: GuiObject, tier: number)
	local r = Rarities.get(tier)
	local beam = UI.new("Frame", {
		Name = "Beam",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, 0),
		Size = UDim2.new(0.55, 0, 2.6, 0),
		BackgroundColor3 = r.color,
		BorderSizePixel = 0,
		ZIndex = 0,
		Parent = card,
	}, {
		UI.new("UIGradient", {
			Rotation = 90,
			Transparency = NumberSequence.new({
				NumberSequenceKeypoint.new(0, 1),
				NumberSequenceKeypoint.new(0.6, 0.5),
				NumberSequenceKeypoint.new(1, 0.1),
			}),
		}),
	})
	task.spawn(function()
		while beam.Parent do
			local color = if tier >= 5 then Rarities.rainbow(os.clock(), 0.4) else r.color
			beam.BackgroundColor3 = color
			beam.Size = UDim2.new(0.45 + math.sin(os.clock() * 4) * 0.1, 0, 2.6, 0)
			task.wait(1 / 30)
		end
	end)
end

function Effects.toast(text: string, color: Color3?)
	local toast = UI.panel({
		Size = UDim2.fromOffset(500, 44),
		BackgroundColor3 = Theme.Panel,
		Parent = toastList,
	})
	UI.label({
		Text = text,
		TextColor3 = color or Theme.Text,
		TextXAlignment = Enum.TextXAlignment.Center,
		Size = UDim2.fromScale(1, 1),
		Parent = toast,
	})
	task.delay(2.8, function()
		toast:Destroy()
	end)
end

-- Full celebration for collecting/building something of this tier
function Effects.rarityBurst(tier: number, at: Vector2?)
	local r = Rarities.get(tier)
	Effects.raritySound(tier)
	if r.tint then
		Effects.tint(if tier >= 5 then Color3.new(1, 1, 1) else r.color, if tier >= 5 then 0.45 else 0.2)
	end
	Effects.shake(r.shake)
	if tier >= 5 then
		Effects.confetti(if tier >= 6 then 120 else 60, true)
	end
	if tier >= 6 then
		-- strobe
		task.spawn(function()
			for _ = 1, 3 do
				task.wait(0.15)
				Effects.tint(Rarities.rainbow(os.clock(), 2), 0.35)
			end
		end)
	end
	if at and tier >= 4 then
		Effects.floatText(string.upper(r.name) .. "!", r.color, at - Vector2.new(0, 40), 34)
	end
end

return Effects
