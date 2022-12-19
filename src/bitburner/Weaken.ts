import { NS } from "NetScriptDefinitions";
import { doGrow, doHack, doWeaken } from "./AttackFunctions";

/** @param {NS} ns */
export async function main(ns: NS) {
	const threads = ns.args[0] as number;

	while (true) {

		const target = ns.peek(1) as string;
		const config = ns.peek(2) as string;
		if (config == "NULL PORT DATA" || config.length == 0 || target == "NULL PORT DATA" || target == "none" || target.length == 0) {
			await ns.sleep(1000);
		} else {
			const scriptTargets = JSON.parse(target);
			const globalConfig = JSON.parse(config)["global"];
			if (scriptTargets["weaken"].length > 0) {
				await doWeaken(ns, globalConfig, scriptTargets, threads);
			} else if (scriptTargets["hack"].length > scriptTargets["grow"].length) {
				await doHack(ns, globalConfig, scriptTargets, threads);
			} else if (scriptTargets["grow"].length > 0) {
				await doGrow(ns, globalConfig, scriptTargets, threads);
			}
		}
		await ns.sleep(50);
	}
}

