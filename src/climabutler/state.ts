import { nibblesToBits } from "../bits_and_bytes.js"
import type { Packet } from "./decode.js"
import { MODES, type State, type StateWithIntegrity } from "./types.js"

/*
	nibble 0: unknown (fixed to 1000)
	nibble 1: 0000 (OFF) or 0011 (ON)
	nibble 2: off timer state (1 bit) + off timer value high bits (3 bits)
	nibble 3: off timer value low bits (2 bits) + unknown (2 bits, fixed to 00)
	nibble 4: unknown (4 bits, fixed to 0000)
	nibble 5: on timer state (1 bit) + on timer value high bits (3 bits)
	nibble 6: on timer value low bits (2 bits) + unknown (2 bits, fixed to 00)
	nibble 7: unknown (4 bits, fixed to 0000)
	nibble 8: unknown (2 bits, fixed 01) + swing (1 bit) + unknown (1 bit, fixed 1)
	nibble 9: unknown (2 bits, fixed 10) + mode (2 bits)
	nibble a: mode (4 bits)
	nibble b: temperature (4 bits); 1111 is impossible to reach with the remote
	nibble c: integrity bits (4 bits)

	timer > 23 impossible with remote
*/

export function decodeState(packet: Packet): StateWithIntegrity {
	if (packet.nibbles.length != 13) {
		throw new Error(`Unexpected packet length: ${packet.nibbles.length}`)
	}

	const nibs = packet.nibbles as [number, number, number, number, number, number, number, number, number, number, number, number, number]

	const power = Boolean(nibs[1] & 0x03)

	const offTimerState = Boolean(nibs[2] & 0b1000)
	const offTimer = (nibs[2] & 0b0111) << 2 | (nibs[3] & 0b1100) >> 2

	const onTimerState = Boolean(nibs[5] & 0b1000)
	const onTimer = (nibs[5] & 0b0111) << 2 | (nibs[6] & 0b1100) >> 2

	const flags = nibs[8]
	const swing = !Boolean(flags & 0b0010)

	const mode = (nibs[9] & 0b0011) << 4 | nibs[10]

	const temperature = 16 + nibs[11]
	const integrity = nibs[12]

	return { power, offTimerState, offTimer, onTimerState, onTimer, swing, mode, temperature, integrity }
}

export function encodeState(state: State): Packet {
	const nibbles: number[] = []
	nibbles[0] = 0b1000
	nibbles[1] = state.power ? 0b0011 : 0b0000
	nibbles[2] = (state.offTimerState ? 0b1000 : 0) | ((state.offTimer >> 2) & 0b0111)
	nibbles[3] = ((state.offTimer & 0b11) << 2) | 0b00
	nibbles[4] = 0
	nibbles[5] = (state.onTimerState ? 0b1000 : 0) | ((state.onTimer >> 2) & 0b0111)
	nibbles[6] = ((state.onTimer & 0b11) << 2) | 0b00
	nibbles[7] = 0
	nibbles[8] = 0b0101 | (state.swing ? 0 : 0b0010)
	nibbles[9] = 0b1000 | ((state.mode >> 4) & 0b0011)
	nibbles[10] = state.mode & 0b1111
	nibbles[11] = state.temperature - 16
	nibbles[12] = calculateChecksum(nibbles)

	return { nibbles, bits: nibblesToBits(nibbles) }
}

function calculateChecksum(nibbles: number[]): number {
	let sum = 0
	for (const nibble of nibbles) {
		sum += nibble
	}
	return ~(sum % 16) & 0xf
}