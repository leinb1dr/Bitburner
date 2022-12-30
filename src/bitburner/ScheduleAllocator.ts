import { NS } from "NetScriptDefinitions";

interface WorkerPool {
    threads: number,
    worker: string
}

interface ValuedTargets {
    target: string,
    maxMoney: number
}

interface WorkerTargetAssignment {
    worker: string,
    target: string,
    money: number,
    threads: number,
    batches: number
}

function scriptRam(ns: NS) {
    const ram = Math.ceil(ns.getScriptRam("h.js"));
    return ram;
}

function maxRam(ns: NS, worker: string) {
    return ns.getServerMaxRam(worker);
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.enableLog("exec");
    let hackLevel = ns.getHackingLevel();

    while (true) {
        let portValue = "";
        while (portValue == "NULL PORT DATA" || portValue.length == 0) {
            await ns.sleep(1000);
            portValue = ns.peek(2) as string;
        }

        const { hwgw, global } = JSON.parse(portValue) as Configuration;

        const targets = findTargets(ns, hwgw);
        const workers = findWorkers(ns, hwgw);

        const workerPoolCapacity = determineServerPoolCapacity(ns, workers);
        const workerThreadsAllocated = initializeWorkersAllocated(ns, workers);
        const valuableTargets = valueTargets(ns, targets);

        //resetsort
        workerPoolCapacity.sort((a, b) => b.threads - a.threads);

        const workerTargetAssignment = await assignWorkers(ns, workerPoolCapacity, workerThreadsAllocated, valuableTargets, hwgw);

        const pids: Map<string, number> = new Map<string, number>();
        for (const target of targets) {
            pids[target] = 0;
        }
        ns.print(workers);

        ns.print(`Valued Target:\n\t${JSON.stringify(valuableTargets)}`);
        ns.print(`Capcity:\n\t${JSON.stringify(workerPoolCapacity)}`);
        ns.print(`Allocation:\n\t${JSON.stringify(workerThreadsAllocated)}`);
        ns.print(`Assignments:\n\t${JSON.stringify(workerTargetAssignment)}`);
        // let run = 1;
        while (!hwgw.dryRun && hackLevel + 100 >= ns.getHackingLevel()) {
            for (const { target, worker, money, batches } of workerTargetAssignment) {

                if (!ns.isRunning(pids[target])) {
                    ns.print(`Starting run for ${target} on server ${worker}`);

                    const needsFixing = levelSetTarget(ns, target);

                    let growMoney = money;
                    if (needsFixing.fixHack) {
                        growMoney = Math.max(needsFixing.money, money);
                    }

                    const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, money)),
                        hackTime = Math.ceil(ns.getHackTime(target)),
                        hackSecurityOffsetThreads = Math.ceil(((needsFixing.fixHack) ? needsFixing.security : (hackThreads * .002)) / 0.05) + 2,
                        growThreads = Math.ceil(ns.growthAnalyze(target, growMoney)),
                        growTime = Math.ceil(ns.getGrowTime(target)),
                        growSecurityOffsetThreads = Math.ceil((growThreads * .004) / 0.05) + 2,
                        weakenTime = Math.ceil(ns.getWeakenTime(target));

                    const hackSleep = weakenTime - hackTime + (hwgw.scriptDelay * 0);
                    const hackSecSleep = weakenTime - weakenTime + (hwgw.scriptDelay * 1);
                    const growSecSleep = weakenTime - weakenTime + (hwgw.scriptDelay * 3);
                    const growSleep = weakenTime - growTime + (hwgw.scriptDelay * 2);

                    let now = Date.now() + 100;
                    for (let i = 0; i < batches; i++) {
                        const hackSecStart = now + hackSecSleep;
                        const growSecStart = now + growSecSleep;
                        const growStart = now + growSleep;
                        const hackStart = now + hackSleep;

                        if (!needsFixing.fixHack) pids[target] = ns.exec("h.js", worker, hackThreads, target, hackStart);
                        ns.exec("w.js", worker, hackSecurityOffsetThreads, target, hackSecStart);
                        ns.exec("g.js", worker, growThreads, target, growStart);
                        pids[target] = ns.exec("w.js", worker, growSecurityOffsetThreads, target, growSecStart);

                        ns.print(`Starting run for ${target} on server ${worker} with pid ${pids[target]}`);
                        now += (hwgw.scriptDelay * 4);
                        if (needsFixing.fixHack) {
                            ns.toast(`Need to fix ${target} [${JSON.stringify(needsFixing)}]`, "warning");
                            break;
                        }
                    }
                }
            }

            await ns.sleep(hwgw["sleepTime"] || global["sleepTime"]);

        }

        hackLevel = ns.getHackingLevel();

        while (Object.values(pids).map(pid => ns.isRunning(pid)).reduce((p, c) => p || c)) {
            ns.print("Draining processes");
            await ns.sleep(hwgw["sleepTime"] || global["sleepTime"]);
        }
        //safty sleep
        await ns.sleep(100);
    }
}

function correctSecurity(ns: NS, target: string) {

    return Math.ceil(ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target));

}

function correctMoney(ns: NS, target: string) {
    return Math.ceil(ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target));

}

function getSupportedAmountToHack(ns: NS, target: string, worker: string, availableThreads: number, hwgw: HWGWConfig): WorkerTargetAssignment {

    const moneyToHack = ns.getServerMaxMoney(target);
    if (moneyToHack <= 0) return null;

    const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target, moneyToHack)),
        hackSecurityOffsetThreads = Math.ceil((hackThreads * .002) / 0.05) + 2,
        growThreads = Math.ceil(ns.growthAnalyze(target, moneyToHack)),
        growSecurityOffsetThreads = Math.ceil((growThreads * .004) / 0.05) + 2,
        weakenTime = Math.ceil(ns.getWeakenTime(target));

    const batchLength = weakenTime + (hwgw.scriptDelay * 3);
    const batches = Math.ceil(batchLength / (hwgw.scriptDelay * 4));

    const neededThreads = (hackThreads + hackSecurityOffsetThreads + growThreads + growSecurityOffsetThreads) * batches;
    ns.print(`Ram needed / Ram Available ${neededThreads}/${availableThreads}`);

    if (neededThreads < availableThreads) {
        return { target: target, worker: worker, money: moneyToHack, threads: neededThreads, batches: batches };
    }
    return null;
}

function determineServerPoolCapacity(ns: NS, workers: string[]): WorkerPool[] {
    return workers.map((worker) => {
        return { threads: maxRam(ns, worker) / scriptRam(ns), worker: worker };
    }).sort((a, b) => b.threads - a.threads);
}

function initializeWorkersAllocated(ns: NS, workers: string[]) {
    const workerAllocations = {};
    workers.forEach(worker => {
        workerAllocations[worker] = 0;
    });
    return workerAllocations;
}

async function assignWorkers(ns: NS, workerPool: WorkerPool[], threadAllocations: object, targets: ValuedTargets[], hwgw: HWGWConfig) {
    const assignments: WorkerTargetAssignment[] = [];

    for (const { target } of targets) {
        // if (checkForBaselined(ns, target)) {
        for (const worker of workerPool) {
            const allocated = threadAllocations[worker.worker];
            if (worker.threads - allocated > 0) {
                const assignment = getSupportedAmountToHack(ns, target, worker.worker, worker.threads - allocated, hwgw);
                if (assignment) {
                    threadAllocations[worker.worker] += assignment.threads;
                    assignments.push(assignment);
                    break;
                }
            }
            // }
        }
        workerPool.sort((a, b) => (b.threads - threadAllocations[b.worker]) - (a.threads - threadAllocations[a.worker]));
    }
    return assignments;
}

// function checkForBaselined(ns: NS, target: string) {
//     const secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
//     const moneyDiff = ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target);
//     return (secDiff === 0 && moneyDiff === 0);
// }

function levelSetTarget(ns: NS, target: string) {
    const fixSec = correctSecurity(ns, target);
    const fixMoney = correctMoney(ns, target);
    return { fixHack: fixSec != 0 || fixMoney != 0, fixMoney: fixMoney != 0, money: fixMoney, fixSecurity: fixSec != 0, security: fixSec };
}

function valueTargets(ns: NS, targets: string[]): ValuedTargets[] {
    return targets.map((target) => {
        return { maxMoney: ns.getServerMaxMoney(target), target: target };
    }).sort((a, b) => b.maxMoney - a.maxMoney);
}

function findWorkers(ns: NS, hwgw: HWGWConfig): string[] {
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
    // Remove self from managing
    for (const block in hwgw.blockList) {
        seen.delete(block);
    }

    const workers: string[] = [];
    for (const worker of seen) {
        if (worker != "home") {
            workers.push(worker);
            ns.scp(["w.js", "h.js", "g.js"], worker);
        }
    }

    return workers;
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