import * as broadlink from "node-broadlink"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { decode, type Packet } from "./decode.js"
import { decodeState, encodeState } from "./state.js"
import { bitsToString, nibblesToString } from "../bits_and_bytes.js"
import { getModeName, type State, type StateWithIntegrity } from "./types.js"

const STORAGE_PATH = "./storage"
const CODE_STORAGE = path.join(STORAGE_PATH, "codes.txt")

function formatData(packet: Packet): string {
	let state: StateWithIntegrity | null = null
	
	try {
		state = decodeState(packet)
	} catch (err) {}

	const reencodedPacket = state ? encodeState(state) : null

	let match = true
	if (reencodedPacket) {
		if (reencodedPacket.nibbles.length !== packet.nibbles.length) {
			match = false
		} else {
			for (let i = 0; i < reencodedPacket.nibbles.length; i++) {
				if (reencodedPacket.nibbles[i] !== packet.nibbles[i]) {
					match = false
					break
				}
			}
		}
	}

	const lines = []
	lines.push(`${bitsToString(packet.bits)}`)
	lines.push(`${nibblesToString(packet.nibbles)}`)

	if (state) {
		lines.push(`temp: ${state.temperature} °C`)
		lines.push(`power: ${state.power}`)
		lines.push(`offTimer: ${state.offTimer} (${state.offTimerState})`)
		lines.push(`onTimer: ${state.onTimer} (${state.onTimerState})`)
		lines.push(`swing: ${state.swing}`)
		lines.push(`mode: ${state.mode.toString(2).padStart(6, "0")} (${getModeName(state.mode)})`)
		lines.push(`checksum: ${state.integrity.toString(2).padStart(4, "0")}`)
		lines.push(`reencoded: ${nibblesToString(reencodedPacket!.nibbles)}`)
		lines.push(`match: ${match ? "matches" : "does not match"}`)
	} else {
		lines.push("(decoding error)")
	}

	return lines.join("\n    ")
}

function preAnalyze(packets: Packet[]): { differingBits: number[]; identicalBits: number[] } {
	const differingBits: number[] = []
	const identicalBits: number[] = []

	const referenceBits = packets[0]?.bits ?? []

	for (let i = 0; true; i++) {		
		const referenceBit = referenceBits[i]
		if (referenceBit === undefined) {
			break
		}

		let allIdentical = true
		for (let packetIndex = 1; packetIndex < packets.length; packetIndex++) {
			const packetBits = packets[packetIndex]?.bits
			if (!packetBits || packetBits[i] === undefined) {
				allIdentical = false
				break
			}
			if (packetBits[i] !== referenceBit) {
				allIdentical = false
				break
			}
		}

		if (allIdentical) {
			identicalBits.push(i)
		} else {
			differingBits.push(i)
		}
	}

	return { differingBits, identicalBits }
}

async function waitForData(device: broadlink.Rmmini, timeoutMs = 5000): Promise<Packet | undefined> {
	const startedAt = Date.now()

	while (Date.now() - startedAt < timeoutMs) {
		const remainingMs = timeoutMs - (Date.now() - startedAt)
		if (remainingMs <= 0) {
			break
		}

		try {
			const data = await Promise.race<Packet | undefined>([
				device.checkData().then((value) => (value && value.length > 0 ? decode(value.toString("hex")) : undefined)),
				new Promise<undefined>((_, reject) => {
					setTimeout(() => reject(new Error("timeout")), Math.min(1000, remainingMs))
				}),
			])
			if (data) {
				return data
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			if (message !== "65531" && message !== "timeout") {
				throw err
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 250))
	}

	return undefined
}

async function learnCode(device: broadlink.Rmmini): Promise<Packet | undefined> {
	console.log("Entering learning mode...")
	await device.enterLearning()

	try {
		return await waitForData(device)
	} finally {
		await device.cancelLearning().catch(() => undefined)
	}
}

async function learningLoop(device: broadlink.Rmmini): Promise<Packet[]> {
	const receivedCodes: Packet[] = []

	while (true) {
		const data = await learnCode(device)
		if (data) {
			console.log("Received data:", formatData(data))
			if (data.bits.length != 52) {
				console.warn("Received data has unexpected length:", data.bits.length)
			} else {
				receivedCodes.push(data)
			}
		} else {
			console.log("No data received during this learning pass. Stopping learning loop.")
			break
		}
	}

	if (receivedCodes.length === 0) {
		throw new Error("No IR/RF data received before timeout.")
	}

	const analysis = preAnalyze(receivedCodes)
	const formatIndex = (index: number): string => index.toString(16).padStart(2, "0")
	const analysisText = [
		"",
		`differingBits: ${analysis.differingBits.map(formatIndex).join(", ")}`,
		`identicalBits: ${analysis.identicalBits.map(formatIndex).join(", ")}`,
	].join("\n")

	const codesHex = receivedCodes.map((packet, index) => {
		return `${formatIndex(index)}: ${formatData(packet)}`
	}).join("\n")

	await mkdir(STORAGE_PATH, { recursive: true })
	await writeFile(CODE_STORAGE, `${codesHex}\n\n${analysisText}`, "utf8")
	console.log("Saved codes to", CODE_STORAGE)

	return receivedCodes
}

const [device] = await broadlink.discover()

if (!device) {
	console.error("No Broadlink device found on the network.")
	process.exit(1)
}

console.log("Discovered device:", device.model)

await device.auth()

console.log("Device authenticated successfully.")

const rmminiDevice = device as broadlink.Rmmini

try {
	const receivedCodes = await learningLoop(rmminiDevice)
	console.log("Captured", receivedCodes.length, "codes.")
} catch (err) {
	console.error("Error checking data:", err)
	process.exitCode = 1
} finally {
	await rmminiDevice.cancelLearning().catch(() => undefined)

	const socket = (rmminiDevice as unknown as { socket?: { close?: () => void } }).socket
	if (socket?.close) {
		socket.close()
	}
}
