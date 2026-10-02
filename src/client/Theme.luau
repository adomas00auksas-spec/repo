-- Colors and fonts for the whole UI (dark RGB "gaming setup" look).
local Theme = {}

Theme.Background = Color3.fromRGB(14, 16, 24)
Theme.Panel = Color3.fromRGB(22, 25, 38)
Theme.PanelLight = Color3.fromRGB(32, 36, 54)
Theme.Stroke = Color3.fromRGB(60, 70, 110)
Theme.Text = Color3.fromRGB(235, 240, 255)
Theme.SubText = Color3.fromRGB(150, 160, 190)

Theme.Accent = Color3.fromRGB(0, 200, 255) -- cyan RGB glow
Theme.Accent2 = Color3.fromRGB(170, 80, 255) -- purple RGB glow
Theme.Good = Color3.fromRGB(60, 220, 120)
Theme.Warn = Color3.fromRGB(255, 190, 60)
Theme.Bad = Color3.fromRGB(255, 80, 90)
Theme.Cash = Color3.fromRGB(110, 255, 140)

Theme.Font = Enum.Font.Gotham
Theme.FontBold = Enum.Font.GothamBold
Theme.FontHeavy = Enum.Font.GothamBlack

return Theme
