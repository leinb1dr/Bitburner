import { NetscriptPort, NS } from "NetScriptDefinitions";
import { Allocations } from "cycles/models";
import { NetscriptBase } from "NetScriptBase";
import { HackSupport } from "utility/HackSupport";
import { BatchCalculator } from "cycles/batchCalculator";

export class FleetScheduler extends NetscriptBase {

    hwgw: HWGWConfig;
    global: GlobalConfig;
    private portHandle: NetscriptPort
    private pids: Map<string, number>;
    private alloc: Allocations;
    private schedulerAllocations: Map<string, number>;
    private batchCalculator: BatchCalculator;

    constructor(ns: NS) {
        super(ns);
        this.pids = new Map<string, number>();
        this.portHandle = ns.getPortHandle(HackSupport.HWGW_PORT);
    }

    async schedule() {
        await this.init();
        for (const valuedTarget of this.alloc.valuableTargets) {
            // Skip target if script is still running
            if (this.ns.isRunning(this.pids[valuedTarget.target].pid)) continue;


            const wta = this.alloc.workerTargetAssignments.find(assign => assign.target === valuedTarget.target);
            const needsFixing = this.levelSetTarget(valuedTarget.target);

            if (wta) {
                const { target, worker, batchProperties } = wta;
                const { hackThreads, hackSecurityOffsetThreads, growThreads, growSecurityOffsetThreads, batchTiming } = batchProperties;
                const { hackSleep, hackSecSleep, growSecSleep, growSleep } = batchTiming;

                let now = Date.now() + 100;
                for (let i = 0; i < 1; i++) {

                    if (!needsFixing.fixHack) {
                        this.pids[target].pid = this.ns.exec("h.js", worker, hackThreads, target, now, hackSleep, false, 0);
                    }

                    this.ns.exec("w.js", worker, hackSecurityOffsetThreads, target, now, hackSecSleep, false, 0);
                    if (!needsFixing.fixHack || needsFixing.fixMoney) {
                        this.ns.exec("g.js", worker, growThreads, target, now, growSleep, false, 0);
                    }

                    this.pids[target].pid = this.ns.exec("w.js", worker, growSecurityOffsetThreads, target, now, growSecSleep, false, 0);

                    //this.ns.print(`Starting run for ${target} on server ${worker} with pid ${this.pids[target]}`);
                    now += (this.hwgw.scriptDelay * 4);
                    if (needsFixing.fixHack) {
                        this.ns.toast(`Need to fix ${target} [${JSON.stringify(needsFixing)}]`, "warning");
                        break;
                    }
                }
            } else {
                if (this.pids[valuedTarget.target].worker) {
                    this.schedulerAllocations[this.pids[valuedTarget.target].worker] -= this.pids[valuedTarget.target].threads;
                    this.pids[valuedTarget.target].worker = null;
                    this.pids[valuedTarget.target].threads = 0;
                }

                this.alloc.workerPoolCapacity.sort((a, b) => (b.threads - this.alloc.workerThreadsAllocated[b.worker] - this.schedulerAllocations[b.worker]) - (a.threads - this.alloc.workerThreadsAllocated[a.worker] - this.schedulerAllocations[a.worker]));
                //this.ns.print(JSON.stringify(this.alloc.workerPoolCapacity));
                const batchProperties = this.batchCalculator.getBatchProperties(valuedTarget.target, this.hwgw.allowBatching);

                if (needsFixing.fixSecurity) {
                    //this.ns.print(`Looking for weaken worker for ${valuedTarget.target} that has ${batchProperties.growSecurityOffsetThreads} threads`);
                    const pid = this.startWorker(valuedTarget.target, batchProperties.growSecurityOffsetThreads, "w.js");
                    if (pid) this.pids[valuedTarget.target] = pid;
                    else this.ns.print(`Could not find a weaken worker for ${valuedTarget.target}`);

                } else if (needsFixing.money) {
                    //this.ns.print(`Looking for grow worker for ${valuedTarget.target} that has ${batchProperties.growThreads} threads`);
                    const pid = this.startWorker(valuedTarget.target, batchProperties.growThreads, "g.js");
                    if (pid) this.pids[valuedTarget.target] = pid;
                    else this.ns.print(`Could not find a grow worker for ${valuedTarget.target}`);
                } else {
                    //this.ns.print(`Looking for hack worker for ${valuedTarget.target} that has ${batchProperties.growThreads} threads`);
                    const pid = this.startWorker(valuedTarget.target, batchProperties.hackThreads, "h.js");
                    if (pid) this.pids[valuedTarget.target] = pid;
                    else this.ns.print(`Could not find a hack worker for ${valuedTarget.target}`);
                }

            }
        }
    }

    private startWorker(target: string, threads: number, script: string) {
        const { workerPoolCapacity, workerThreadsAllocated } = this.alloc;
        let availableWorker = workerPoolCapacity.find(worker => threads <= worker.threads - workerThreadsAllocated[worker.worker] - this.schedulerAllocations[worker.worker]);
        if (!availableWorker) {
            const largestWorker = workerPoolCapacity.shift();
            const availableThreads = largestWorker.threads - workerThreadsAllocated[largestWorker.worker] - this.schedulerAllocations[largestWorker.worker];
            // ns.print(`No worker for all threads, trying largest available ${largestWorker.worker}:${availableThreads} for ${target}`);
            if (availableThreads > 0) {
                availableWorker = largestWorker;
                threads = availableThreads;
            }
        }
        if (availableWorker) {
            // ns.print(`assigning ${target} to ${availableWorker.worker}`);

            const pid = this.ns.exec(script, availableWorker.worker, threads, target, 0, 0, false, 0);

            if (pid > 0) {
                this.schedulerAllocations[availableWorker.worker] += threads;
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

    protected async init() {
        const configuration = await this.support.getConfiguration();
        this.hwgw = configuration.hwgw;
        this.global = configuration.global;
        this.batchCalculator = new BatchCalculator(this.ns, this.hwgw);

        const allocations = await this.getAllocations();
        this.alloc = allocations;
        for (const { target } of this.alloc.valuableTargets) {
            if (!this.pids[target])
                this.pids[target] = {
                    pid: 0,
                    threads: 0,
                    worker: null,
                };
        }
        if (!this.schedulerAllocations) {
            this.schedulerAllocations = new Map<string, number>();
            this.alloc.workerPoolCapacity.forEach(worker => {
                this.schedulerAllocations[worker.worker] = 0;
            });
        }

    }

    private correctSecurity(target: string): number {
        return Math.ceil(this.ns.getServerSecurityLevel(target) - this.ns.getServerMinSecurityLevel(target));
    }

    private correctMoney(target: string): number {
        return Math.ceil((this.ns.getServerMaxMoney(target) * this.hwgw.moneyPercentage) - this.ns.getServerMoneyAvailable(target));
    }

    private levelSetTarget(target: string) {
        const fixSec = this.correctSecurity(target);
        const fixMoney = this.correctMoney(target);
        return { fixHack: fixSec > 0 || fixMoney > 0, fixMoney: fixMoney > 0, money: fixMoney, fixSecurity: fixSec > 0, security: fixSec };
    }

    private async getAllocations(): Promise<Allocations> {
        while (this.portHandle.empty()) {
            await this.ns.sleep(100);
        }

        return JSON.parse(this.portHandle.peek() as string) as Allocations;
    }
}


/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.enableLog("exec");
    const scheduler = new FleetScheduler(ns);

    while (true) {
        await scheduler.schedule();
        //safty sleep
        await ns.sleep(scheduler.hwgw["sleepTime"] || scheduler.global["sleepTime"]);
    }
}