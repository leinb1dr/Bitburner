import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("ALL");

    const update = ns.args[0] === "update";
    ns.print(`argument = ${ns.args[0]} parsed as ${update}`);

    let firstRun = true;

    while (true) {

        const target = ns.peek(2) as string;
        if (target == "NULL PORT DATA" || target.length == 0) {
            await ns.sleep(1000);
        } else {
            const config = JSON.parse(target) as Configuration;
            const wdConfig = config.fleetWatchdog;
            const globalConfig = config.global;
            // server crawl stack
            const servers = ["home"];

            // no backtrack set
            const seen = new Set<string>();
            seen.add("home");

            // Continue while we have servers to look at
            while (servers.length > 0) {
                const cur = servers.shift();
                // All adjacent servers
                const newServers = ns.scan(cur);
                for (const server of newServers) {
                    // Determine if we have seen the server, before adding it to the queue
                    if (!seen.has(server) && (ns.hasRootAccess(server))) {
                        seen.add(server);
                        servers.push(server);
                    }
                }
            }

            const fleet: Targets = {
                hack:[],
                grow:[],
                weaken:[]
            };
            // Remove self from managing
            seen.delete("home");
            let x = 0;
            // Go through bot net nodes
            for (const server of seen) {
                x++;
                // default script
                let script = `${wdConfig["defaultScript"]}.js`;

                let serverType=wdConfig["defaultScript"];
                // determine current script
                for (let i = 0; i < wdConfig["scripts"].length; i++) {
                    if (x % wdConfig["ratios"][i] == 0) {
                        script = `${wdConfig["scripts"][i]}.js`;
                        serverType = wdConfig["scripts"][i];
                    }
                }
                fleet[serverType].push(server);

                // If forcing an update, kill all scripts
                if (update) ns.killall(server);

                const running = ns.scriptRunning(script, server);
                if (!running) {
                    // If it is not ensure that all scripts are killed
                    ns.killall(server);
                    // Copy the correct script + dependencies
                    ns.scp([...wdConfig["dependencies"], script], server);

                    // Calculate threads
                    const totalRam = ns.getServerMaxRam(server);
                    const hackRam = ns.getScriptRam(script);
                    const t = Math.round(totalRam / hackRam);

                    if (t > 0) {
                        // Run the worker script
                        const result = ns.exec(script, server, t, t, fleet[serverType].length) != 0;
                        if (!result) {
                            ns.print(`${server} is now running`);
                        } else {
                            ns.print(`!!!${server} failed to start up`);
                        }
                    } else {
                        if (firstRun) {
                            // Report if the server cannot run the provided script
                            ns.toast(`${server} cannot run script ${script}`);
                            firstRun = false;
                        }
                    }
                }
            }

            ns.print("\nworkers:");
			ns.print(`\thack(${fleet.hack.length}): ${fleet.hack}`);
			ns.print(`\tgrow(${fleet.grow.length}): ${fleet.grow}`);
			ns.print(`\tweaken(${fleet.weaken.length}): ${fleet.weaken}`);

            // Don't loop on forced update
            if (update) return;

            await ns.sleep(wdConfig["sleepTime"] || globalConfig["sleepTime"]);
        }
    }

}