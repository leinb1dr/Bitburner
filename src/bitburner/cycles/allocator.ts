import { NetscriptPort, NS } from "NetScriptDefinitions";
import { BatchCalculator } from "cycles/batchCalculator";
import { Discovery } from "cycles/discovery";
import { Allocations, ValuedTargets, WorkerPool, WorkerTargetAssignment } from "./models";
import { NetscriptBase } from "NetScriptBase";
import { HackSupport } from "utility/HackSupport";

export class Allocator extends NetscriptBase {
    private discovery: Discovery;
    private portHandle: NetscriptPort;
    private hwgw: HWGWConfig = {} as HWGWConfig;
    global: GlobalConfig = {} as GlobalConfig;

    constructor(ns: NS) {
        super(ns);
        this.discovery = new Discovery(ns);
        this.portHandle = ns.getPortHandle(HackSupport.HWGW_PORT);
    }

    async allocate() {
        await this.init();
        const { targets, workers } = this.getServerPools();

        const workerPoolCapacity = this.determineServerPoolCapacity(workers);
        const workerThreadsAllocated = this.initializeWorkersAllocated(workerPoolCapacity);
        const valuableTargets = this.valueTargets(targets);
        const workerTargetAssignments = this.assignWorkers(workerPoolCapacity, workerThreadsAllocated, valuableTargets);
        this.initWorkers(workerPoolCapacity);

        // ns.print(`Valued Target:\n\t${JSON.stringify(valuableTargets)}`);
        // ns.print(`Capcity:\n\t${JSON.stringify(workerPoolCapacity)}`);
        // ns.print(`Allocation:\n\t${JSON.stringify(workerThreadsAllocated)}`);
        // ns.print(`Assignments:\n\t${JSON.stringify(workerTargetAssignments)}`);

        this.portHandle.clear();
        this.portHandle.write(JSON.stringify({ valuableTargets, workerPoolCapacity, workerThreadsAllocated, workerTargetAssignments } as Allocations));

    }

    protected async init() {
        const configuration = await this.support.getConfiguration();
        this.hwgw = configuration.hwgw;
        this.global = configuration.global;
    }

    private getServerPools() {
        const { root } = this.discovery.findAll();

        return {
            targets: root.filter(val => !val.startsWith(this.hwgw.personalPrefixes)),
            workers: root.filter(val => val != "home")
        };
    }

    private determineServerPoolCapacity(workers: string[]): WorkerPool[] {
        const workerPool = workers.map((worker) => {
            return { threads: this.maxRam(worker) / this.scriptRam(), worker: worker };
        });
        workerPool.push({ threads: Math.floor(this.availableRam("home") / this.scriptRam()), worker: "home" });
        return workerPool.sort((a, b) => b.threads - a.threads);
    }

    private initializeWorkersAllocated(workers: WorkerPool[]): Map<string, number> {
        const workerAllocations = new Map<string, number>;
        workers.forEach(worker => {
            workerAllocations[worker.worker] = 0;
        });
        return workerAllocations;
    }

    private assignWorkers(workerPool: WorkerPool[], threadAllocations: object, targets: ValuedTargets[]): WorkerTargetAssignment[] {
        const assignments: WorkerTargetAssignment[] = [];
        const batchCalculator = new BatchCalculator(this.ns, this.hwgw);

        for (const { target } of targets) {
            //this.ns.print(`assigning ${target} to worker`);
            const batchProperties = batchCalculator.getBatchProperties(target, this.hwgw.allowBatching);

            if (batchProperties) {
                const availableWorker = workerPool.find(worker => batchProperties.neededThreads <= worker.threads - threadAllocations[worker.worker]);
                if (availableWorker) {
                    //this.ns.print(`assigning ${target} to ${availableWorker.worker}`);

                    threadAllocations[availableWorker.worker] += batchProperties.neededThreads;
                    assignments.push({
                        target,
                        worker: availableWorker.worker,
                        batchProperties
                    });
                } else {
                    //this.ns.print(`No worker for ${target} with ${batchProperties.neededThreads}`);
                }
            }
            // Sort worker with most threads available back to top
            workerPool.sort((a, b) => (b.threads - threadAllocations[b.worker]) - (a.threads - threadAllocations[a.worker]));
        }
        return assignments;
    }

    private valueTargets(targets: string[]): ValuedTargets[] {
        return targets.map((target) => {
            return { maxMoney: this.ns.getServerMaxMoney(target), target: target };
        })
            .filter(element => element.maxMoney > 0)
            .sort((a, b) => b.maxMoney - a.maxMoney);
    }

    private initWorkers(workers: WorkerPool[]) {
        for (const { worker } of workers) {
            this.ns.scp(["w.js", "h.js", "g.js"], worker);
        }
    }


    private scriptRam() {
        const ram = Math.ceil(this.ns.getScriptRam("h.js"));
        return ram;
    }

    private maxRam(worker: string) {
        return this.ns.getServerMaxRam(worker);
    }

    private availableRam(worker: string) {
        return (this.ns.getServerMaxRam(worker) - this.ns.getServerUsedRam(worker)) * ((worker === "home" ? 0.1 : 1));
    }

}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    const allocator = new Allocator(ns);
    while (true) {
        allocator.allocate();
        await ns.sleep(allocator.global["sleepTime"]);
    }
}
