import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
	// ns.disableLog('ALL')
	let hackable = true;
	let x = 100;
	while (true) {
		const level = ns.getHackingLevel();

		x++;
		if (x > 20) {
			ns.exec("ConfigUpdater.js", "home");
			x = 0;
		}
		const target = ns.peek(2) as string;
		if (target === "NULL PORT DATA" || target.length == 0) {
			await ns.sleep(1000);
		} else {
			const config = JSON.parse(target) as Configuration;
			const driverConfig = config.driver;
			const globalConfig = config.global;

			if (hackable) {
				hackable = false;


				// server crawl stack
				const servers = ["home"];

				// no backtrack set
				const seen = new Set<string>();

				// Continue while we have servers to look at
				while (servers.length > 0) {
					const cur = servers.shift();

					if (!ns.hasRootAccess(cur)) {
						hackable = true;
						doNuke(ns, cur, level, driverConfig.portScripts);
					}

					// All adjacent servers
					const newServers = ns.scan(cur);
					for (const server of newServers) {
						// Determine if we have seen the server, before adding it to the queue
						if (!seen.has(server)) {
							seen.add(server);
							servers.push(server);
						}
					}
				}
			}

			ns.print(`Finished run ${x}`);
			await ns.sleep(driverConfig["sleepTime"] || globalConfig["sleepTime"]);
		}
	}
}

function doNuke(ns: NS, server: string, level: number, portScripts: number) {

	ns.print("Attempting to nuke: " + server);
	// Determine hacking requirements
	const portsRequired = ns.getServerNumPortsRequired(server);
	const requiredLevel = ns.getServerRequiredHackingLevel(server);

	// Determine if I meet hacking requirements
	if (requiredLevel <= level && portsRequired <= portScripts) {
		// Open ports based on available programs
		if (portsRequired > 0) ns.brutessh(server);
		if (portsRequired > 1) ns.ftpcrack(server);
		if (portsRequired > 2) ns.relaysmtp(server);
		if (portsRequired > 3) ns.httpworm(server);
		if (portsRequired > 4) ns.sqlinject(server);

		// Attempt to nuke server
		ns.nuke(server);
		const hasRoot = ns.hasRootAccess(server);
		ns.printf("[%s] hacking successful: %s", server, hasRoot);
		ns.toast("Hacked new server: " + server);
	} else {
		ns.print("Unable to nuke: " + server);
	}

}