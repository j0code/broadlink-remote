import { bitsToNibbles } from "../bits_and_bytes.js"

export type Bit = 0 | 1

export interface BroadlinkPacket {
	type: number
	encodedLength: number
	durations: number[]
}

export interface Packet {
	bits: Bit[]
	nibbles: number[]
}

export function decode(hex: string): Packet {
	/*console.log("broadlink hex:", hex)
	const last16b = Buffer.from(hex, "hex").slice(-16)
	console.log("last16b", last16b)*/
	const packet = decodeBroadlinkPacket(hex)
	/*console.log(packet.durations.length, packet.encodedLength)
	console.log("durations before:", packet.durations.slice(0, 40), packet.durations.slice(40))

	const reencoded = encodeBroadlinkPacket(packet.durations)
	console.log("reencoded:", reencoded.toString("hex"))

	const binPacket = decodeClimaButler(packet)
	console.log("after decode cb:", binPacket.bits.join(""))
	const reencodedDurations = encodeClimaButler(binPacket.bits)
	console.log("durations after:", reencodedDurations.slice(0, 40), reencodedDurations.slice(40))
	console.log("packet length:", binPacket.bits.length)
	console.log("encoded durations length:", reencodedDurations.length, "(x-4)/2:", (reencodedDurations.length-2)/2)
	const redecodedPacket = decodeClimaButler({ type: 9999, encodedLength: 9999, durations: reencodedDurations })
	console.log("after redecode cb:", redecodedPacket.bits.join(""))*/

	return decodeClimaButler(packet)
}

export function encode(packet: Packet) {
	const durations = encodeClimaButler(packet.bits)
	//console.log("durations:", durations.slice(0, 40), durations.slice(40))
	return encodeBroadlinkPacket(durations)
}

function decodeBroadlinkPacket(hex: string): BroadlinkPacket {
	const bytes = Uint8Array.from(
		hex.match(/.{2}/g)!.map(b => parseInt(b, 16))
	)

	if (bytes.length < 4)
		throw new Error("Packet too short.")

	const type = bytes[0]!

	if (type !== 0x26)
		throw new Error(`Unsupported packet type 0x${type.toString(16)}`)

	const encodedLength = bytes[2]! | (bytes[3]! << 8)

	const durations: number[] = []

	let i = 4

	while (i < bytes.length) {
		const b = bytes[i++]!

		// End marker
		if (b === 0x0d && i < bytes.length && bytes[i] === 0x05)
			break

		if (b === 0x00) {
			if (i + 1 >= bytes.length)
				throw new Error("Unexpected EOF after extended duration.")

			const value = (bytes[i]! << 8) | bytes[i + 1]!
			durations.push(value)

			i += 2
		} else {
			durations.push(b)
		}
	}

	return {
		type,
		encodedLength,
		durations,
	}
}

function decodeClimaButler(packet: BroadlinkPacket): Packet {
	const d = packet.durations

	// Clustering thresholds from your real data:
	const ZERO_SPACE_MAX = 30;   // ~15–20
	const ONE_SPACE_MAX = 80;    // ~50
	const FRAME_END_MIN = 200;   // ~110+ (stop marker cluster)

	const bits: Bit[] = []

	// skip header mark+space
	let i = 2

	while (i + 1 < d.length) {
		const mark = d[i]!
		const space = d[i + 1]!

		// END OF FRAME (this is the key fix)
		if (space > FRAME_END_MIN) break

		// decode bit from space length
		if (space < ZERO_SPACE_MAX) {
			bits.push(0)
		} else if (space < ONE_SPACE_MAX) {
			bits.push(1)
		} else {
			// safety: unknown mid-range → stop
			break
		}

		i += 2
	}

	return { bits, nibbles: bitsToNibbles(bits) }
}

const HDR_MARK = 15
const HDR_SPACE = 111

const BIT_MARK = 15
const ZERO_SPACE = 16
const ONE_SPACE = 50

const FOOTER_SPACE = 111
const GAP = 111; // see note below

export function encodeClimaButler(bits: Bit[]): number[] {
    const durations: number[] = []

    // Header
    durations.push(HDR_MARK, HDR_SPACE)

    for (const bit of bits) {
        durations.push(BIT_MARK)
        durations.push(bit ? ONE_SPACE : ZERO_SPACE)
    }

    // Footer (required for this protocol)
    durations.push(BIT_MARK, FOOTER_SPACE)

    return durations
}

const TICK_US = 32.84

/**
 * Encodes raw IR durations into a Broadlink IR packet.
 *
 * durations: alternating mark/space lengths in µs.
 */
export function encodeBroadlinkPacket(durations: number[]): Buffer {
    const payload: number[] = []

    for (const value of durations) {
        if (value < 0x100) {
            payload.push(value & 0xff)
        } else {
            payload.push(
                0x00,
                (value >> 8) & 0xff,
                value & 0xff,
            )
        }
    }

    //const terminator = [0x0d, 0x05]

    const packet: number[] = [
        0x26,
        0x00,
        payload.length & 0xff,
        (payload.length >> 8) & 0xff,
        ...payload,
        //...terminator,
    ]

    // IMPORTANT: padding must happen AFTER full construction
    /*while (packet.length % 16 !== 0) {
        packet.push(0x00)
    }*/

    return Buffer.from(packet)
}