/**
 * @module
 * climabutler types and enums
 */

/**
 * Available modes
 */
export const MODES: {
	cool_auto:   0b000000,
	cool_high:   0b001000,
	cool_medium: 0b010001,
	cool_low:    0b100010,
	dry:         0b100100,
	fan:         0b100011
} = {
	cool_auto:   0b000000,
	cool_high:   0b001000,
	cool_medium: 0b010001,
	cool_low:    0b100010,
	dry:         0b100100,
	fan:         0b100011
} as const satisfies Record<string, number>

export type ModeName = keyof typeof MODES

/**
 * climabutler AC state
 */
export type State = {
	/** Power ON/OFF */
	power: boolean
	/** OFF Timer active */
	offTimerState: boolean
	/**
	 * OFF Timer hours  
	 * Has no effect if offTimerState is false (inactive) or if power is false (OFF).  
	 * If time runs out, AC turns off automatically.  
	 * Range: 0..31
	 */
	offTimer: number
	/** ON Timer active */
	onTimerState: boolean
	/**
	 * ON Timer hours  
	 * Has no effect if onTimerState is false (inactive) or if power is true (ON).  
	 * If time runs out, AC turns on automatically.
	 * Range: 0..31
	 */
	onTimer: number
	/** Swing (move airstream) */
	swing: boolean
	/**
	 * Mode and Fan speed  
	 * Range: 0..31
	 * In practice, there are only 6 states. Use MODES enum.
	 */
	mode: number
	/**
	 * Temperature  
	 * Range: 16..31
	 */
	temperature: number
}

/**
 * State + integrity bits
 */
export type StateWithIntegrity = State & {
	/** integrity bits (0000..1111) */
	integrity: number
}

/**
 * Get associated mode name for mode bitfield
 * @param mode mode as 5 bit nummber
 * @returns associated mode name or null if not recognized
 */
export function getModeName(mode: number): ModeName | null {
	for (const [name, value] of Object.entries(MODES) as [ModeName, number][]) {
		if (value === mode) {
			return name
		}
	}
	return null
}