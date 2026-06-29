import { closeSocket, getDevice } from "../broadlink.js"
import { encodeState } from "./state.js"
import { MODES, type ModeName, type State } from "./types.js"
import { encode } from "./decode.js"

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

export default class ClimaButler {

	private state: State

	constructor(initialState: State = defaultInitialState) {
		validateState(initialState)
		this.state = initialState
	}

	setState(state: State) {
		validateState(state)
		this.state = state
	}

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

	send(): Promise<void> {
		if (closed) {
			throw new Error("Socket already closed.")
		}
		console.log("Sending state:", this.state)
		const packet = encodeState(this.state)
		return device.sendData(encode(packet).toString("hex"))
	}

	close() {
		closed = true
		closeSocket(device)
	}

}

function validateState(state: State) {
	if (state.offTimer < 0     || state.offTimer > 31) throw new RangeError("offTimer must be within 0..31")
	if (state.onTimer < 0      || state.onTimer > 31)  throw new RangeError("onTimer must be within 0..31")
	if (state.mode < 0         || state.mode > 31)     throw new RangeError("mode must be within 0..31")
	if (state.temperature < 16 || state.offTimer > 31) throw new RangeError("temperature must be within 16..31")
}