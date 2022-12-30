import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
	const name: string = ns.args[0] as string;
	let startTime: number = ns.args[1] as number;
	const sleepTime: number = ns.args[2] as number;
	const batchMode: boolean = ns.args[3] as boolean;
	const batchLength: number = ns.args[4] as number;

	let x = 0;
	while (true) {
		const nextBatch = (startTime + sleepTime) - Date.now();
		
		await ns.sleep(nextBatch);
		await ns.grow(name);
		ns.print(`finished batch ${x++}`);
		startTime += batchLength;
		if (!batchMode) {
			break;
		}
	}

}