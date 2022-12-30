import { NS } from "NetScriptDefinitions";

function scriptRam(ns: NS) {
    const ram = Math.ceil(ns.getScriptRam("h.js"));
    return ram;
}

function ramAvailable(ns: NS, worker: string) {
    return ns.getServerMaxRam(worker) - ns.getServerUsedRam(worker);
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    while (true) {
        let portValue = "";
        while (portValue == "NULL PORT DATA" || portValue.length == 0) {
            await ns.sleep(1000);
            portValue = ns.peek(2) as string;
        }

        const { hwgw, global } = JSON.parse(portValue) as Configuration;

        const targets = findTargets(ns, hwgw);
        for (const target of targets) {
            await levelSetTarget(ns, target, "home");
        }
        await ns.sleep(global["sleepTime"]);
    }
}

async function correctSecurity(ns: NS, target: string, worker: string) {

    let secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
    while (secDiff > 0) {
        let threads = Math.ceil(secDiff / 0.05);

        while (threads * scriptRam(ns) > ramAvailable(ns, worker)) {
            threads--;
        }

        ns.print(`Security is off for next run fixing on ${target}`);
        const correctSecPid = ns.exec("w.js", worker, threads, target, 0);
        while (ns.isRunning(correctSecPid)) {
            await ns.sleep(100);
        }
        secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
        await ns.sleep(100);

    }
}

async function correctMoney(ns: NS, target: string, worker: string) {
    let moneyDiff = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target);
    while (moneyDiff > 0) {
        let threads = Math.ceil(ns.growthAnalyze(target, moneyDiff));

        while (threads * scriptRam(ns) > ramAvailable(ns, worker)) {
            threads--;
        }

        ns.print(`Money is off for next run fixing on ${target}`);
        const fixMoneyPid = ns.exec("g.js", worker, threads, target, 0);
        while (ns.isRunning(fixMoneyPid)) {
            await ns.sleep(100);
        }
        moneyDiff = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target);
        await ns.sleep(100);
    }
}


async function levelSetTarget(ns: NS, target: string, worker: string) {
    await correctSecurity(ns, target, worker);
    await correctMoney(ns, target, worker);
    await correctSecurity(ns, target, worker);
}


function findTargets(ns: NS, hwgw: HWGWConfig): string[] {
    // server crawl stack
    const servers = ["home"];

    // no backtrack set
    const seen = new Set<string>();
    seen.add("home");
    for (let i = 0; i < 25; i++) {
        seen.add(`${hwgw.personalPrefixes}-${i}`);
    }

    const targets: string[] = [];
    // Continue while we have servers to look at
    while (servers.length > 0) {
        const cur = servers.shift();
        if (ns.hasRootAccess(cur) && !cur.startsWith(hwgw.personalPrefixes)) {
            targets.push(cur);
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
    return targets;
}