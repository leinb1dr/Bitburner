import { NS } from "NetScriptDefinitions";
import { BatchCalculator } from "cycles/batchCalculator";
import { Discovery } from "cycles/discovery";
import { Allocations, ValuedTargets, WorkerPool, WorkerTargetAssignment } from "./models";

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
    ns.enableLog("scp");
    const discover = new Discovery(ns);


    while (true) {
        let portValue = "";
        while (portValue == "NULL PORT DATA" || portValue.length == 0) {
            await ns.sleep(1000);
            portValue = ns.peek(2) as string;
        }

        const { hwgw, global } = JSON.parse(portValue) as Configuration;

        const { targets, workers } = getServerPools(discover, hwgw);

        const workerPoolCapacity = determineServerPoolCapacity(ns, workers);
        const workerThreadsAllocated = initializeWorkersAllocated(ns, workers);
        const valuableTargets = valueTargets(ns, targets);
        const workerTargetAssignments = assignWorkers(ns, workerPoolCapacity, workerThreadsAllocated, valuableTargets, hwgw);
        initWorkers(ns, workerPoolCapacity);

        ns.print(`Valued Target:\n\t${JSON.stringify(valuableTargets)}`);
        ns.print(`Capcity:\n\t${JSON.stringify(workerPoolCapacity)}`);
        ns.print(`Allocation:\n\t${JSON.stringify(workerThreadsAllocated)}`);
        ns.print(`Assignments:\n\t${JSON.stringify(workerTargetAssignments)}`);

        ns.clearPort(hwgw.port);
        ns.writePort(hwgw.port, JSON.stringify({ valuableTargets, workerPoolCapacity, workerThreadsAllocated, workerTargetAssignments } as Allocations));

        //safty sleep
        await ns.sleep(global["sleepTime"]);
    }
}

function getServerPools(discover: Discovery, hwgw: HWGWConfig) {
    const { root } = discover.findAll();

    return {
        targets: root.filter(val => !val.startsWith(hwgw.personalPrefixes)),
        workers: root.filter(val => val != "home")
    };
}

function determineServerPoolCapacity(ns: NS, workers: string[]): WorkerPool[] {
    return workers.map((worker) => {
        return { threads: maxRam(ns, worker) / scriptRam(ns), worker: worker };
    }).sort((a, b) => b.threads - a.threads);
}

function initializeWorkersAllocated(ns: NS, workers: string[]): Map<string, number> {
    const workerAllocations = new Map<string, number>;
    workers.forEach(worker => {
        workerAllocations[worker] = 0;
    });
    return workerAllocations;
}

function assignWorkers(ns: NS, workerPool: WorkerPool[], threadAllocations: object, targets: ValuedTargets[], hwgw: HWGWConfig): WorkerTargetAssignment[] {
    const assignments: WorkerTargetAssignment[] = [];
    const batchCalculator = new BatchCalculator(ns, hwgw);

    for (const { target } of targets) {
        ns.print(`assigning ${target} to worker`);
        const batchProperties = batchCalculator.getBatchProperties(target);

        if (batchProperties) {
            const availableWorker = workerPool.find(worker => batchProperties.neededThreads <= worker.threads - threadAllocations[worker.worker]);
            if (availableWorker) {
                ns.print(`assigning ${target} to ${availableWorker.worker}`);

                threadAllocations[availableWorker.worker] += batchProperties.neededThreads;
                assignments.push({
                    target,
                    worker: availableWorker.worker,
                    batchProperties
                });
            } else {
                ns.print(`No worker for ${target} with ${batchProperties.neededThreads}`);
            }
        }
        // Sort worker with most threads available back to top
        workerPool.sort((a, b) => (b.threads - threadAllocations[b.worker]) - (a.threads - threadAllocations[a.worker]));
    }
    return assignments;
}

function valueTargets(ns: NS, targets: string[]): ValuedTargets[] {
    return targets.map((target) => {
        return { maxMoney: ns.getServerMaxMoney(target), target: target };
    })
        .filter(element => element.maxMoney > 0)
        .sort((a, b) => b.maxMoney - a.maxMoney);
}

function initWorkers(ns: NS, workers: WorkerPool[]) {
    for (const { worker } of workers) {
        ns.scp(["w.js", "h.js", "g.js"], worker);
    }
}