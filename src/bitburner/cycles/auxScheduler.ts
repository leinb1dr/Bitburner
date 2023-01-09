import { NS } from "NetScriptDefinitions";
import { Allocations, WorkerPool } from "cycles/models";
import { BatchCalculator } from "cycles/batchCalculator";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    // ns.enableLog("exec");
    const pids: Map<string, object> = new Map<string, object>();
    let schedulerAllocations = null;

    while (true) {
        const { hwgw, global, allocations } = await getPortData(ns);
        const batchCalculator = new BatchCalculator(ns, hwgw);

        const skipTargets = allocations.workerTargetAssignments.map(element => element.target);

        const { workerPoolCapacity, workerThreadsAllocated } = allocations;

        if (!schedulerAllocations) {
            schedulerAllocations = initializeWorkersAllocated(ns, workerPoolCapacity);
        }

        for (const { target } of allocations.valuableTargets) {
            if (!pids[target])
                pids[target] = {
                    pid: 0,
                    threads: 0,
                    worker: null,
                };
        }

        for (const valuedTarget of allocations.valuableTargets) {
            if (skipTargets.indexOf(valuedTarget.target) >= 0) continue;
            if (!ns.isRunning(pids[valuedTarget.target].pid)) {
                ns.print(`Attacking ${valuedTarget.target}`);
                if (pids[valuedTarget.target].worker) {
                    schedulerAllocations[pids[valuedTarget.target].worker] -= pids[valuedTarget.target].threads;
                    pids[valuedTarget.target].worker = null;
                    pids[valuedTarget.target].threads = 0;
                }

                workerPoolCapacity.sort((a, b) => (b.threads - workerThreadsAllocated[b.worker] - schedulerAllocations[b.worker]) - (a.threads - workerThreadsAllocated[a.worker] - schedulerAllocations[a.worker]));
                ns.print(JSON.stringify(workerPoolCapacity));
                const batchProperties = batchCalculator.getBatchProperties(valuedTarget.target, hwgw.allowBatching);
                const fix = levelSetTarget(ns, valuedTarget.target, hwgw);

                if (fix.fixSecurity) {
                    ns.print(`Looking for weaken worker for ${valuedTarget.target} that has ${batchProperties.growSecurityOffsetThreads} threads`);
                    const pid = startWorker(ns, valuedTarget.target, batchProperties.growSecurityOffsetThreads, "w.js", allocations, schedulerAllocations);
                    if (pid) pids[valuedTarget.target] = pid;
                    else ns.print(`Could not find a weaken worker for ${valuedTarget.target}`);

                } else if (fix.money) {
                    ns.print(`Looking for grow worker for ${valuedTarget.target} that has ${batchProperties.growThreads} threads`);
                    const pid = startWorker(ns, valuedTarget.target, batchProperties.growThreads, "g.js", allocations, schedulerAllocations);
                    if (pid) pids[valuedTarget.target] = pid;
                    else ns.print(`Could not find a grow worker for ${valuedTarget.target}`);
                } else {
                    ns.print(`Looking for hack worker for ${valuedTarget.target} that has ${batchProperties.growThreads} threads`);
                    const pid = startWorker(ns, valuedTarget.target, batchProperties.hackThreads, "h.js", allocations, schedulerAllocations);
                    if (pid) pids[valuedTarget.target] = pid;
                    else ns.print(`Could not find a hack worker for ${valuedTarget.target}`);
                }
            }

        }

        //safty sleep
        await ns.sleep(hwgw["sleepTime"] || global["sleepTime"]);
    }
}
function initializeWorkersAllocated(ns: NS, workers: WorkerPool[]): Map<string, number> {
    const workerAllocations = new Map<string, number>();
    workers.forEach(worker => {
        workerAllocations[worker.worker] = 0;
    });
    return workerAllocations;
}
function startWorker(ns: NS, target: string, threads: number, script: string, allocations: Allocations, schedulerAllocations: Map<string, number>) {
    const { workerPoolCapacity, workerThreadsAllocated } = allocations;
    let availableWorker = workerPoolCapacity.find(worker => threads <= worker.threads - workerThreadsAllocated[worker.worker] - schedulerAllocations[worker.worker]);
    if (!availableWorker) {
        const largestWorker = workerPoolCapacity.shift();
        const availableThreads = largestWorker.threads - workerThreadsAllocated[largestWorker.worker] - schedulerAllocations[largestWorker.worker];
        // ns.print(`No worker for all threads, trying largest available ${largestWorker.worker}:${availableThreads} for ${target}`);
        if (availableThreads > 0) {
            availableWorker = largestWorker;
            threads = availableThreads;
        }
    }
    if (availableWorker) {
        // ns.print(`assigning ${target} to ${availableWorker.worker}`);

        const pid = ns.exec(script, availableWorker.worker, threads, target, 0, 0, false, 0);

        if (pid > 0) {
            schedulerAllocations[availableWorker.worker] += threads;
            return {
                pid,
                threads: threads,
                worker: availableWorker.worker
            };
        }
        return null;
    } else {
        return null;
    }
}

async function getPortData(ns: NS) {
    let configPortValue = "";
    while (configPortValue == "NULL PORT DATA" || configPortValue.length == 0) {
        await ns.sleep(1000);
        configPortValue = ns.peek(2) as string;
    }

    const { hwgw, global } = JSON.parse(configPortValue) as Configuration;

    let assignmentPortValue = "";
    while (assignmentPortValue == "NULL PORT DATA" || assignmentPortValue.length == 0) {
        await ns.sleep(1000);
        assignmentPortValue = ns.peek(hwgw.port) as string;
    }

    const allocations = JSON.parse(assignmentPortValue) as Allocations;
    return {
        hwgw,
        global,
        allocations
    };
}

function correctSecurity(ns: NS, target: string) {
    return Math.ceil(ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target));
}

function correctMoney(ns: NS, target: string, hwgw: HWGWConfig) {
    return Math.ceil((ns.getServerMaxMoney(target) * hwgw.moneyPercentage) - ns.getServerMoneyAvailable(target));
}

function levelSetTarget(ns: NS, target: string, hwgw: HWGWConfig) {
    const fixSec = correctSecurity(ns, target);
    const fixMoney = correctMoney(ns, target, hwgw);
    return { fixHack: fixSec > 0 || fixMoney > 0, fixMoney: fixMoney > 0, money: fixMoney, fixSecurity: fixSec > 0, security: fixSec };
}
