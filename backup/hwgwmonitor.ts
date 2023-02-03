import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("ALL");
		
	const portHandle = ns.getPortHandle(8);

	while (true) {
		while(portHandle.empty()){
			await ns.sleep(100);
		}
		ns.print(portHandle.read());
	}

}