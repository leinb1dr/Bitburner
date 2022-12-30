import { NS } from "NetScriptDefinitions";
import { BatchProperties, BatchTiming } from "./models";

export class BatchCalculator {
    ns: NS;
    scriptDelay: number
    constructor(ns: NS, hwgw: HWGWConfig) {
        this.ns = ns;
        this.scriptDelay = hwgw.scriptDelay;
    }

    getBatchProperties(target): BatchProperties {
        const money = this.ns.getServerMaxMoney(target);
        if (money <= 0) return null;

        const hackThreads = Math.max(Math.ceil(this.ns.hackAnalyzeThreads(target, money)), 1),
            hackTime = Math.ceil(this.ns.getHackTime(target)),
            hackSecurityOffsetThreads = Math.max(Math.ceil((hackThreads * .002) / 0.05), 1) + 2,
            growThreads = Math.max(Math.ceil(this.ns.growthAnalyze(target, money)), 1),
            growTime = Math.ceil(this.ns.getGrowTime(target)),
            growSecurityOffsetThreads = Math.max(Math.ceil((growThreads * .004) / 0.05), 1) + 2,
            weakenTime = Math.ceil(this.ns.getWeakenTime(target));

        const batchTiming = this.batchSleepTimes({ weakenTime, hackTime, growTime });

        const batches = 1;

        const neededThreads = (hackThreads + hackSecurityOffsetThreads + growThreads + growSecurityOffsetThreads) * batches;

        return {
            money,
            target,
            hackThreads,
            hackTime,
            hackSecurityOffsetThreads,
            growThreads,
            growTime,
            growSecurityOffsetThreads,
            weakenTime,
            batches,
            neededThreads,
            batchTiming
        };
    }

    batchSleepTimes(properties: { weakenTime: number, hackTime: number, growTime: number }): BatchTiming {

        const hackPadding = properties.weakenTime - properties.hackTime;
        const growPadding = properties.weakenTime - properties.growTime;
        const delay = hackPadding + this.scriptDelay;

        const hackSleep = 0;
        const hackSecSleep = delay - hackPadding;
        const growSleep = (delay * 2) - (growPadding - hackPadding);
        const growSecSleep = (delay * 3) - hackPadding;

        const results = {
            hackSleep,
            hackSecSleep,
            growSleep,
            growSecSleep,
            batchLength: growSecSleep + properties.weakenTime
        };

        this.ns.print("----------------------------------------");
        this.ns.print(JSON.stringify(properties));
        this.ns.print(JSON.stringify(results));
        this.ns.print(hackPadding);
        this.ns.print(growPadding);
        this.ns.print("----------------------------------------");
        return results;
    }
}