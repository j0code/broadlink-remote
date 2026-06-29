import type { Bit } from "./climabutler/decode.js"

export function bitsToBytes(bits: readonly Bit[]): number[] {
	const bytes: number[] = []

	const rem = bits.length % 8
	
	for (let i = 0; i < bits.length - rem; i += 8) {
		bytes.push(bitsToNumber(bits.slice(i, i + 8)))
	}

	if (rem !== 0) {
		const byte = bitsToNumber(bits.slice(bits.length - rem, bits.length)) << rem
		bytes.push(byte)
	}

	return bytes
}

export function bitsToNumber(bits: readonly Bit[]): number {
	return parseInt(bits.join(""), 2)
}

export function bitsToNibbles(bits: readonly Bit[]): number[] {
	const nibbles: number[] = []

	const rem = bits.length % 4
	
	for (let i = 0; i < bits.length - rem; i += 4) {
		nibbles.push(bitsToNumber(bits.slice(i, i + 4)))
	}

	if (rem !== 0) {
		const byte = bitsToNumber(bits.slice(bits.length - rem, bits.length)) << rem
		nibbles.push(byte)
	}

	return nibbles
}

export function bitsToString(bits: readonly Bit[]): string {
	let nibbles: string[] = []

	const rem = bits.length % 4

	if (rem !== 0) {
		nibbles.push(bits.slice(0, rem).join("").padStart(4, "0"))
	}

	for (let i = 0; i < bits.length; i += 4) {
		const nibble = bits.slice(i, i + 4)
		nibbles.push(nibble.join(""))
	}

	return nibbles.join(" ")
}

export function bytesToString(bytes: readonly number[]): string {
	let out: string[] = []

	for (let i = 0; i < bytes.length; i++) {
		let s = bytes[i]!.toString(16)
		if (i > 0) {
			s = s.padStart(2, "0")
		}
		out.push(s)
	}

	return out.join(" ")
}

export function nibblesToString(nibbles: readonly number[]): string {
	let out: string[] = []

	for (let i = 0; i < nibbles.length; i++) {
		let s = nibbles[i]!.toString(16)
		out.push(s)
	}

	return out.join(" ")
}

export function bytesToBits(bytes: number[]): Bit[] {
	const bits: Bit[] = []
	for (const byte of bytes) {
		for (let i = 7; i >= 0; i--) {
			const bit = ((byte >> i) & 1) as Bit
			bits.push(bit)
		}
	}
	return bits
}

export function nibblesToBits(nibbles: number[]): Bit[] {
	const bits: Bit[] = []
	for (const nibble of nibbles) {
		for (let i = 3; i >= 0; i--) {
			const bit = ((nibble >> i) & 1) as Bit
			bits.push(bit)
		}
	}
	return bits
}