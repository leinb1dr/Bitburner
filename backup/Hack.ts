import { NS } from "NetScriptDefinitions";
import { doGrow, doHack, doWeaken } from "./AttackFunctions";

/** @param {NS} ns */
export async function main(ns: NS) {
	
	const threads = ns.args[0] as number;
	const idx = ns.args[1] as number;

	while (true) {

		const target = ns.peek(1) as string;
		const config = ns.peek(2) as string;
		if (config == "NULL PORT DATA" || config.length == 0 || target == "NULL PORT DATA" || target == "none" || target.length == 0) {
			await ns.sleep(1000);
		} else {
			const scriptTargets = JSON.parse(target);
			const globalConfig = JSON.parse(config)["global"];
			if (scriptTargets.Hack.length > 0 && scriptTargets.Hack.length * 2 >= idx) {
				await doHack(ns, globalConfig, scriptTargets, threads);
			} else if (scriptTargets.Grow.length > scriptTargets.Weaken.length) {
				await doGrow(ns, globalConfig, scriptTargets, threads);
			} else if (scriptTargets.Weaken.length > 0) {
				await doWeaken(ns, globalConfig, scriptTargets, threads);
			}
		}
		await ns.sleep(50);
	}
}
