import { NS } from "NetScriptDefinitions";
import { NetscriptBase } from "./NetScriptBase";

export class Nuker extends NetscriptBase {

	driverConfig: DriverConfig;
	globalConfig: GlobalConfig;

	constructor(ns: NS) {
		super(ns);
	}

	public async nuke() {
		await this.init();

		const level = this.ns.getHackingLevel();

		// server crawl stack
		const servers = ["home"];

		// no backtrack set
		const seen = new Set<string>();

		// Continue while we have servers to look at
		while (servers.length > 0) {
			const cur = servers.shift();

			if (!this.ns.hasRootAccess(cur)) {
				this.doNuke(cur, level);
			}

			// All adjacent servers
			const newServers = this.ns.scan(cur);
			for (const server of newServers) {
				// Determine if we have seen the server, before adding it to the queue
				if (!seen.has(server)) {
					seen.add(server);
					servers.push(server);
				}
			}

		}
		//this.ns.print("Finished nuking");
	}

	private doNuke(server: string, level: number) {

		//this.ns.print("Attempting to nuke: " + server);
		// Determine hacking requirements
		const portsRequired = this.ns.getServerNumPortsRequired(server);
		const requiredLevel = this.ns.getServerRequiredHackingLevel(server);

		// Determine if I meet hacking requirements
		if (requiredLevel <= level && portsRequired <= this.driverConfig.portScripts) {
			// Open ports based on available programs
			if (portsRequired > 0) this.ns.brutessh(server);
			if (portsRequired > 1) this.ns.ftpcrack(server);
			if (portsRequired > 2) this.ns.relaysmtp(server);
			if (portsRequired > 3) this.ns.httpworm(server);
			if (portsRequired > 4) this.ns.sqlinject(server);

			// Attempt to nuke server
			this.ns.nuke(server);
			const hasRoot = this.ns.hasRootAccess(server);
			this.logger.info(`${server} hacking successful: ${hasRoot}`);
			this.ns.toast("Hacked new server: " + server);
		} else {
			this.logger.info(`Unable to nuke: ${server}`);
		}

	}

	protected async init() {
		const config = await this.support.getConfiguration();

		this.driverConfig = config.driver;
		this.globalConfig = config.global;
	}
}

/** @param {NS} ns */
export async function main(ns: NS) {

	let x = 100;
	const nuker = new Nuker(ns);

	while (true) {
		x++;
		if (x > 10) {
			ns.exec("ConfigUpdater.js", "home");
			x = 0;
		}
		await nuker.nuke();
		await ns.sleep(nuker.driverConfig["sleepTime"] || nuker.globalConfig["sleepTime"]);
	}

}
