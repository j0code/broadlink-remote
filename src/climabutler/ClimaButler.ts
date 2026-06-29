import { closeSocket, getDevice } from "../broadlink.js"
import { encodeState } from "./state.js"
import { MODES, type ModeName, type State } from "./types.js"
import { encode } from "./decode.js"

/**
 * @module
 * climabutler protocol abstraction
 */

/** default initial state */
const defaultInitialState: State = {
	power: false,
	offTimerState: false,
	offTimer: 0,
	onTimerState: false,
	onTimer: 0,
	swing: true,
	mode: MODES.cool_auto,
	temperature: 16
}

const device = await getDevice()
let closed = false

/**
 * ClimaButler class  
 * Connects to local broadlink rm mini device automatically  
 * Allows modifying climabutler AC state
 */
export default class ClimaButler {

	/** internal saved state */
	private state: State

	/**
	 * constructor, duh
	 * @param initialState initial state to apply
	 */
	constructor(initialState: State = defaultInitialState) {
		validateState(initialState)
		this.state = initialState
	}

	/** set entire state at once */
	setState(state: State) {
		validateState(state)
		this.state = state
	}

	/** get current saved state */
	getState(): State {
		return this.state
	}

	set power(power: boolean) {
		this.state.power = power
	}

	get power(): boolean {
		return this.state.power
	}

	set offTimer(hours: number) {
		if (hours < 0 || hours > 31) throw new RangeError("offTimer must be within 0..31")
		this.state.offTimerState = hours > 0
		this.state.offTimer = hours
	}

	get offTimer(): number {
		return this.state.offTimer
	}

	set onTimer(hours: number) {
		if (hours < 0 || hours > 31) throw new RangeError("onTimer must be within 0..31")
		this.state.onTimerState = hours > 0
		this.state.onTimer = hours
	}

	get onTimer(): number {
		return this.state.onTimer
	}

	set swing(swing: boolean) {
		this.state.swing = swing
	}

	get swing(): boolean {
		return this.state.swing
	}

	set mode(mode: ModeName | number) {
		if (typeof mode == "string") mode = MODES[mode]
		if (mode < 0 || mode > 31) throw new RangeError("mode must be within 0..31")
		this.mode = mode
	}

	get mode(): number {
		return this.state.mode
	}

	set temperature(temp: number) {
		if (temp < 16 || temp > 31) throw new RangeError("temperature must be within 16..31")
		this.state.temperature = temp
	}

	get temperature(): number {
		return this.state.onTimer
	}

	/** Send current state over Broadlink RM Mini / IR */
	send(): Promise<void> {
		if (closed) {
			throw new Error("Socket already closed.")
		}
		console.log("Sending state:", this.state)
		const packet = encodeState(this.state)
		return device.sendData(encode(packet).toString("hex"))
	}

	/**
	 * Closes the socket  
	 * Note: can not be reopened without stopping and restarting the process.
	 */
	close() {
		closed = true
		closeSocket(device)
	}

}

/**
 * Validate numeric parameters of state
 * @param state state to validate
 */
function validateState(state: State) {
	if (state.offTimer < 0     || state.offTimer > 31) throw new RangeError("offTimer must be within 0..31")
	if (state.onTimer < 0      || state.onTimer > 31)  throw new RangeError("onTimer must be within 0..31")
	if (state.mode < 0         || state.mode > 31)     throw new RangeError("mode must be within 0..31")
	if (state.temperature < 16 || state.offTimer > 31) throw new RangeError("temperature must be within 16..31")
}