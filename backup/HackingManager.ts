import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns:NS) {
	ns.disableLog("ALL");

	while (true) {
		const target = ns.peek(2) as string;
		if (target == "NULL PORT DATA" || target.length == 0) {
			await ns.sleep(1000);
		} else {
			const config = JSON.parse(target) as Configuration;
			const fcConfig = config.fleetController;
			const globalConfig = config.global;

			// initialize servers
			const targets: Targets = {
				Hack: [],
				Grow: [],
				Weaken: []
			};

			// server crawl stack
			const servers = ["home"];

			// no backtrack set
			const seen = new Set<string>();
			seen.add("home");
			fcConfig.personalPrefixes.forEach((x) => {
				for (let i = 0; i < 10; i++) {
					seen.add(`${x}-${i}`);
				}
			});
			fcConfig.unhackable.forEach((x) => {
				seen.add(x);
			});
			

			// Continue while we have servers to look at
			while (servers.length > 0) {
				const cur = servers.shift();
				if (ns.hasRootAccess(cur)) {
					if (cur != "home") {
						categorize(ns, cur, targets, fcConfig);
					}
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

			// Update ports
			updatePorts(ns, JSON.stringify(targets), fcConfig["port"] || globalConfig["port"]);
			ns.print("\ntargets:");
			ns.print(`\thack(${targets.Hack.length}): ${targets.Hack}`);
			ns.print(`\tgrow(${targets.Grow.length}): ${targets.Grow}`);
			ns.print(`\tweaken(${targets.Weaken.length}): ${targets.Weaken}`);
			await ns.sleep(fcConfig["sleepTime"] || globalConfig["sleepTime"]);
		}
	}
}

function updatePorts(ns, targets, port) {
	ns.clearPort(port);
	ns.writePort(port, targets);

}

function categorize(ns: NS, cur: string, targets: Targets, config: FleetControllerConfig) {

	if (ns.hasRootAccess(cur)) {
		const _minServerSecurity = ns.getServerMinSecurityLevel(cur);
		const _maxServerMoney = ns.getServerMaxMoney(cur);

		const minMoney = _maxServerMoney * config.minMoneyPercentage;
		const maxMoney = _maxServerMoney * config.maxMoneyPercentage;
		const minSecurity = _minServerSecurity + config.minSecurityOffset;
		const maxSecurity = _minServerSecurity + config.maxSecurityOffset;

		const curSecurity = ns.getServerSecurityLevel(cur);
		const curMoney = ns.getServerMoneyAvailable(cur);

		ns.print(`${cur}::${minMoney}/${curMoney}/${maxMoney}::${minSecurity}/${curSecurity}/${maxSecurity}`);

		if (maxMoney > 0) {
			if (curMoney > minMoney && curSecurity < maxSecurity) {
				targets.Hack.push(cur);
			}

			if (curMoney < maxMoney && curSecurity < maxSecurity) {
				targets.Grow.push(cur);
			}

			if (curSecurity > minSecurity) {
				targets.Weaken.push(cur);

			}
		}
	}
}