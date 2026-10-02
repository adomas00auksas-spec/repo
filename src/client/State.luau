-- Client copy of the player's data + a tiny change signal + server calls.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Request = Remotes:WaitForChild("Request") :: RemoteFunction
local Tap = Remotes:WaitForChild("Tap") :: UnreliableRemoteEvent

local State = {
	cash = 0,
	inventory = {} :: { [string]: any },
	builds = {} :: { any },
	collection = {} :: { any },
	bestPower = 0,
	totalBuilt = 0,
	pending = {} :: { [string]: any },
}

-- Listeners: State.on("inventory", fn) ; State.emit("inventory")
local listeners: { [string]: { (...any) -> () } } = {}

function State.on(kind: string, fn: (...any) -> ())
	listeners[kind] = listeners[kind] or {}
	table.insert(listeners[kind], fn)
end

function State.emit(kind: string, ...)
	local list = listeners[kind]
	if list then
		for _, fn in list do
			task.spawn(fn, ...)
		end
	end
end

function State.request(action: string, ...): any
	local ok, result = pcall(Request.InvokeServer, Request, action, ...)
	if not ok then
		warn("[State] Request failed:", action, result)
		return { ok = false, reason = "Connection problem" }
	end
	return result or { ok = false }
end

function State.tap(slot: number)
	Tap:FireServer(slot)
end

function State.inventoryCount(): number
	local n = 0
	for _ in State.inventory do
		n += 1
	end
	return n
end

function State.now(): number
	return workspace:GetServerTimeNow()
end

return State
