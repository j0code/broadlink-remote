import * as broadlink from "node-broadlink"

type BroadlinkDevice = Awaited<ReturnType<typeof broadlink.discover>>[number]

export async function getDevice(): Promise<broadlink.Rmmini> {
	const [device] = await broadlink.discover()
	
	if (!device) {
		console.error("No Broadlink device found on the network.")
		process.exit(1)
	}
	
	console.log("Discovered device:", device.model)
	
	await device.auth()
	
	console.log("Device authenticated successfully.")
	
	return device as broadlink.Rmmini
}

export function closeSocket(device: BroadlinkDevice) {
	console.log("Connection closed.")
	const socket = (device as unknown as { socket?: { close?: () => void } }).socket
	if (socket?.close) {
		socket.close()
	}
}