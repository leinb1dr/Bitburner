import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
	const name = ns.args[0] as string;
	const startTime = ns.args[1] as number;

	const time = Date.now();
	if (startTime > 0) {
		ns.print("sleeping for " + (startTime - time));

		await ns.sleep(startTime - time);
	}
	await ns.grow(name);
	
}